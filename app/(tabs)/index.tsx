import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { DeepDiveModal } from '@/components/DeepDiveModal';
import { useSocraticChat } from '@/hooks/useSocraticChat';
import { useUser, useActions } from '@/hooks/useStorage';
import { useSubscription } from '@/hooks/useSubscription';
import { useDreams } from '@/hooks/useDreams';
import { ActionToken } from '@/services/socraticCoachService';
import { MicroAction } from '@/types';
import { DREAM_CATEGORIES } from '@/types/dreams';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const { user } = useUser();
  const { addAction } = useActions();
  const { isPremium, canUseAI, remainingAIUses, incrementAIUsage } = useSubscription();
  const { activeDream } = useDreams();

  // Get category info for active dream
  const activeDreamCategory = activeDream ? DREAM_CATEGORIES[activeDream.category] : null;

  const {
    messages,
    dialogueState,
    isLoading,
    error,
    isRestored,
    isFreshConversation,
    sendMessage,
    selectOption,
    clearChat,
    getStepDescription,
  } = useSocraticChat(user?.stuckPoint);

  const [inputText, setInputText] = useState('');
  const [showDeepDiveModal, setShowDeepDiveModal] = useState(false);
  const [deepDiveAction, setDeepDiveAction] = useState<MicroAction | null>(null);
  const [savedActionId, setSavedActionId] = useState<string | null>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || isLoading) return;

    if (!canUseAI) {
      router.push('/paywall');
      return;
    }

    setInputText('');
    setSavedActionId(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await sendMessage(textToSend);
    await incrementAIUsage();
  };

  const handleVoiceTranscription = async (transcribedText: string) => {
    await handleSendMessage(transcribedText);
  };

  const handleSelectOption = async (option: string) => {
    if (!canUseAI) {
      router.push('/paywall');
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await selectOption(option);
    await incrementAIUsage();
  };

  // Handle starting an action from chat
  const handleStartAction = useCallback(async (action: ActionToken['action']) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const actionForDeepDive: MicroAction = {
      id: action.id,
      title: action.title,
      description: action.description,
      duration: action.duration,
      category: action.category,
      isPremium: false,
      isCompleted: false,
      dreamId: user?.dream || 'chat',
    };

    setDeepDiveAction(actionForDeepDive);
    setShowDeepDiveModal(true);
  }, [user?.dream]);

  // Handle saving action for later
  const handleSaveAction = useCallback(async (action: ActionToken['action']) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const savedAction = await addAction({
      title: action.title,
      description: action.description,
      duration: action.duration,
      isPremium: false,
      isCompleted: false,
      category: action.category as MicroAction['category'],
      dreamId: user?.dream || 'chat',
    });

    setSavedActionId(savedAction.id);
  }, [addAction, user?.dream]);

  // Handle Deep Dive completion
  const handleDeepDiveComplete = async () => {
    if (deepDiveAction) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowDeepDiveModal(false);
      setDeepDiveAction(null);
      // Navigate to add proof after completing action
      router.push({
        pathname: '/add-proof',
        params: { actionId: deepDiveAction.id, actionTitle: deepDiveAction.title },
      });
    }
  };

  // Handle new chat
  const handleNewChat = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await clearChat();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.parchmentWhite, colors.warmCream]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={100}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>The Bold Move</Text>
            {activeDream ? (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/profile')}
                style={styles.activeDreamChip}
              >
                <View
                  style={[
                    styles.dreamChipIcon,
                    { backgroundColor: activeDreamCategory?.gradient[0] + '30' },
                  ]}
                >
                  <Text style={styles.dreamChipIconText}>
                    {activeDreamCategory?.icon || '🎯'}
                  </Text>
                </View>
                <Text style={styles.dreamChipTitle} numberOfLines={1}>
                  {activeDream.title}
                </Text>
                <Text style={styles.dreamChipArrow}>›</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.headerSubtitle}>Mindset Coach</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            {!isFreshConversation && (
              <TouchableOpacity onPress={handleNewChat} style={styles.newChatButton}>
                <Text style={styles.newChatText}>New Chat</Text>
              </TouchableOpacity>
            )}
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[colors.champagneGold, colors.goldDark]}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>✦</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Dialogue Step Indicator */}
        {!isFreshConversation && (
          <Animated.View entering={FadeIn} style={styles.stepIndicator}>
            <View style={styles.stepDots}>
              {[1, 2, 3, 4].map((step) => (
                <View
                  key={step}
                  style={[
                    styles.stepDot,
                    step === dialogueState.step && styles.stepDotActive,
                    step < dialogueState.step && styles.stepDotCompleted,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.stepLabel}>{getStepDescription()}</Text>
          </Animated.View>
        )}

        {/* Chat Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome message */}
          {isFreshConversation && isRestored && (
            <Animated.View entering={FadeIn} style={styles.welcomeContainer}>
              <Card style={styles.welcomeCard}>
                <View style={styles.coachHeader}>
                  <LinearGradient
                    colors={[colors.champagneGold, colors.goldDark]}
                    style={styles.coachAvatar}
                  >
                    <Text style={styles.coachAvatarText}>✦</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.welcomeText}>
                  Welcome, {user?.name || 'Bold Explorer'}. ✨
                  {'\n\n'}
                  Share what&apos;s on your mind—a challenge, a doubt, or a dream you&apos;re pursuing.
                  Together, we&apos;ll uncover the deeper insights and transform them into your next bold move.
                  {'\n\n'}
                  <Text style={styles.welcomeHint}>
                    Take your time. This is a space for deep reflection.
                  </Text>
                </Text>
              </Card>
            </Animated.View>
          )}

          {/* Messages */}
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              id={message.id}
              role={message.role}
              content={message.content}
              tokens={message.tokens}
              dialogueStep={message.dialogueStep}
              index={index}
              onSelectOption={handleSelectOption}
              onStartAction={handleStartAction}
              onSaveAction={handleSaveAction}
              isLatest={index === messages.length - 1}
              disabled={isLoading}
            />
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <Animated.View entering={FadeIn} style={styles.loadingContainer}>
              <View style={styles.typingIndicator}>
                <Text style={styles.typingDot}>●</Text>
                <Text style={[styles.typingDot, styles.typingDot2]}>●</Text>
                <Text style={[styles.typingDot, styles.typingDot3]}>●</Text>
              </View>
              <Text style={styles.loadingText}>{getStepDescription()}...</Text>
            </Animated.View>
          )}

          {/* Error message */}
          {error && (
            <Animated.View entering={FadeIn} style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => handleSendMessage(inputText)}>
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Saved action confirmation */}
          {savedActionId && (
            <Animated.View entering={FadeInUp} style={styles.savedConfirmation}>
              <View style={styles.savedContent}>
                <Text style={styles.savedIcon}>✓</Text>
                <Text style={styles.savedText}>Saved to your Actions</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/action')}
                style={styles.viewActionsLink}
              >
                <Text style={styles.viewActionsLinkText}>View →</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + spacing.sm }]}>
          {!isPremium && (
            <Text style={styles.usageHint}>
              {remainingAIUses === Infinity ? '∞' : remainingAIUses} AI conversations left today
            </Text>
          )}
          <View style={styles.inputRow}>
            {/* Voice Recorder */}
            <VoiceRecorder
              onTranscriptionComplete={handleVoiceTranscription}
              disabled={isLoading || !canUseAI}
            />

            <TextInput
              style={styles.textInput}
              placeholder={isFreshConversation ? "What's on your mind?" : "Continue sharing..."}
              placeholderTextColor={colors.gray400}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
              onPress={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.sendIcon}>↑</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Deep Dive Modal */}
      <DeepDiveModal
        visible={showDeepDiveModal}
        action={deepDiveAction}
        onClose={() => {
          setShowDeepDiveModal(false);
          setDeepDiveAction(null);
        }}
        onComplete={handleDeepDiveComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.parchmentWhite,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.parchmentWhite,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    marginTop: 2,
  },
  activeDreamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
    paddingLeft: 4,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
    ...shadows.sm,
    maxWidth: 200,
  },
  dreamChipIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  dreamChipIconText: {
    fontSize: 12,
  },
  dreamChipTitle: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
    flex: 1,
  },
  dreamChipArrow: {
    fontFamily: typography.fontFamily.body,
    fontSize: 16,
    color: colors.gray400,
    marginLeft: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  newChatButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray100,
  },
  newChatText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  avatarContainer: {
    width: 36,
    height: 36,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: 18,
    color: colors.white,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.warmCream,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
    gap: spacing.md,
  },
  stepDots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray300,
  },
  stepDotActive: {
    backgroundColor: colors.boldTerracotta,
    width: 20,
  },
  stepDotCompleted: {
    backgroundColor: colors.vibrantTeal,
  },
  stepLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  welcomeContainer: {
    marginBottom: spacing.xl,
  },
  welcomeCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  coachAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  coachAvatarText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: 20,
    color: colors.midnightNavy,
  },
  welcomeText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray700,
    lineHeight: 24,
  },
  welcomeHint: {
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.boldTerracotta,
  },
  loadingContainer: {
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  typingIndicator: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    gap: 4,
    ...shadows.sm,
  },
  typingDot: {
    color: colors.boldTerracotta,
    fontSize: 12,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 0.4,
  },
  loadingText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  errorContainer: {
    backgroundColor: colors.terracottaLight + '20',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginVertical: spacing.sm,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.terracottaDark,
    marginBottom: spacing.xs,
  },
  retryText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.boldTerracotta,
  },
  savedConfirmation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.tealLight + '20',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.vibrantTeal + '40',
  },
  savedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  savedIcon: {
    fontSize: 16,
    color: colors.tealDark,
    fontWeight: 'bold',
  },
  savedText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.tealDark,
  },
  viewActionsLink: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  viewActionsLinkText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.tealDark,
  },
  inputContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray200,
    backgroundColor: colors.parchmentWhite,
  },
  usageHint: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    maxHeight: 100,
    minHeight: 48,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.boldTerracotta,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray300,
    shadowOpacity: 0,
  },
  sendIcon: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
});
