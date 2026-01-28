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
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PermissionSlip } from '@/components/PermissionSlip';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { ChatActionCard } from '@/components/ChatActionCard';
import { DeepDiveModal } from '@/components/DeepDiveModal';
import { useUser, useActions, useChatActionsSync } from '@/hooks/useStorage';
import { useInstantReframe, usePermissionSlip, useMicroActions, useChatActionSuggestion } from '@/hooks/useAI';
import { useSubscription } from '@/hooks/useSubscription';
import { MicroAction } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const { user } = useUser();
  const { addAction } = useActions();
  const { savePendingActions } = useChatActionsSync();
  const { isPremium, canUseAI, remainingAIUses, incrementAIUsage } = useSubscription();
  const { messages, isLoading, sendMessage } = useInstantReframe();
  const { slip, isLoading: slipLoading, generateSlip } = usePermissionSlip();
  const { actions, isLoading: actionsLoading, generateActionsFromChat } = useMicroActions();
  const { suggestion, isLoading: suggestionLoading, generateSuggestion, clearSuggestion } = useChatActionSuggestion();

  const [inputText, setInputText] = useState('');
  const [showDeepDiveModal, setShowDeepDiveModal] = useState(false);
  const [deepDiveAction, setDeepDiveAction] = useState<MicroAction | null>(null);
  const [savedActionId, setSavedActionId] = useState<string | null>(null);

  // Auto-generate action suggestion after a meaningful exchange (3+ messages with fears/goals)
  useEffect(() => {
    const userMessages = messages.filter(m => m.role === 'user');
    // Only trigger after sufficient conversation and if no current suggestion
    if (userMessages.length >= 2 && !suggestion && !suggestionLoading && !isLoading) {
      const lastUserMessage = userMessages[userMessages.length - 1]?.content;
      // Check if user shared something meaningful (not just a greeting)
      const hasFearOrGoal = /\b(afraid|scared|want|need|trying|stuck|wish|dream|goal|hope)\b/i.test(lastUserMessage);
      if (hasFearOrGoal) {
        // Generate an inline action suggestion
        generateSuggestion(lastUserMessage, user?.stuckPoint);
      }
    }
  }, [messages]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || isLoading) return;

    if (!canUseAI) {
      router.push('/paywall');
      return;
    }

    // Clear any existing suggestion when user sends new message
    clearSuggestion();
    setSavedActionId(null);

    setInputText('');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await sendMessage(textToSend);
    await incrementAIUsage();

    // Scroll to bottom
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleVoiceTranscription = async (transcribedText: string) => {
    // Send the transcribed text directly to Gabby
    await handleSendMessage(transcribedText);
  };

  const handleGenerateMicroAction = async () => {
    if (messages.length === 0) return;

    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (lastUserMessage) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await generateSlip(lastUserMessage.content);
      // Use contextual generation based on full conversation
      await generateActionsFromChat(
        messages.map(m => ({ role: m.role, content: m.content })),
        user?.stuckPoint
      );
    }
  };

  // Save generated actions for sync when they're created
  useEffect(() => {
    if (actions.length > 0) {
      const actionsForSync = actions.map(action => ({
        title: action.title,
        description: action.description,
        duration: action.duration,
        category: action.category,
        isPremium: action.category === 'connection' || action.category === 'action',
        isCompleted: false,
        dreamId: user?.dream || 'chat',
      }));
      savePendingActions(actionsForSync);
    }
  }, [actions, user?.dream, savePendingActions]);

  // Handle starting an action from chat (opens Deep Dive modal)
  const handleStartChatAction = useCallback(async () => {
    if (!suggestion) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Create a MicroAction object for the Deep Dive modal
    const actionForDeepDive: MicroAction = {
      id: suggestion.id,
      title: suggestion.title,
      description: suggestion.description,
      duration: suggestion.duration,
      category: suggestion.category,
      isPremium: false,
      isCompleted: false,
      dreamId: user?.dream || 'chat',
    };

    setDeepDiveAction(actionForDeepDive);
    setShowDeepDiveModal(true);
  }, [suggestion, user?.dream]);

  // Handle saving chat action to Action tab
  const handleSaveChatAction = useCallback(async () => {
    if (!suggestion) return;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Save the action to storage
    const savedAction = await addAction({
      title: suggestion.title,
      description: suggestion.description,
      duration: suggestion.duration,
      isPremium: false,
      isCompleted: false,
      category: suggestion.category as MicroAction['category'],
      dreamId: user?.dream || 'chat',
    });

    setSavedActionId(savedAction.id);
  }, [suggestion, addAction, user?.dream]);

  // Handle Deep Dive completion
  const handleDeepDiveComplete = async () => {
    if (deepDiveAction) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // If this was a suggestion, mark it as done
      if (deepDiveAction.id === suggestion?.id) {
        clearSuggestion();
      }
      setShowDeepDiveModal(false);
      setDeepDiveAction(null);
    }
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paxgo – Mindset Coach</Text>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[colors.boldTerracotta, colors.terracottaDark]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>G</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Chat Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome message */}
          {messages.length === 0 && (
            <Animated.View entering={FadeIn} style={styles.welcomeContainer}>
              <Card style={styles.welcomeCard}>
                <View style={styles.gabbyHeader}>
                  <View style={styles.gabbyAvatar}>
                    <Text style={styles.gabbyAvatarText}>G</Text>
                  </View>
                  <Text style={styles.gabbyName}>Gabby</Text>
                </View>
                <Text style={styles.welcomeText}>
                  Hey {user?.name || 'there'}! 👋 I&apos;m Gabby, your mindset coach. Share what&apos;s on your mind – a fear, a doubt, or something holding you back. Let&apos;s turn it into your next bold move! ✨
                </Text>
              </Card>
            </Animated.View>
          )}

          {/* Messages */}
          {messages.map((message, index) => (
            <Animated.View
              key={message.id}
              entering={FadeInDown.delay(index * 50)}
              style={[
                styles.messageContainer,
                message.role === 'user' ? styles.userMessage : styles.assistantMessage,
              ]}
            >
              {message.role === 'assistant' && (
                <View style={styles.gabbyHeader}>
                  <View style={styles.gabbyAvatarSmall}>
                    <Text style={styles.gabbyAvatarTextSmall}>G</Text>
                  </View>
                  <Text style={styles.gabbyNameSmall}>Gabby</Text>
                </View>
              )}
              <Card
                style={{
                  ...styles.messageBubble,
                  ...(message.role === 'user' ? styles.userBubble : styles.assistantBubble),
                }}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.role === 'user' && styles.userMessageText,
                  ]}
                >
                  {message.content}
                </Text>
              </Card>
            </Animated.View>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <Animated.View entering={FadeIn} style={styles.loadingContainer}>
              <View style={styles.typingIndicator}>
                <Text style={styles.typingDot}>●</Text>
                <Text style={styles.typingDot}>●</Text>
                <Text style={styles.typingDot}>●</Text>
              </View>
            </Animated.View>
          )}

          {/* Inline Chat Action Suggestion */}
          {suggestion && !savedActionId && !isLoading && (
            <ChatActionCard
              action={suggestion}
              onStartNow={handleStartChatAction}
              onSaveForLater={handleSaveChatAction}
            />
          )}

          {/* Saved action confirmation */}
          {savedActionId && (
            <Animated.View entering={FadeIn} style={styles.savedConfirmation}>
              <View style={styles.savedContent}>
                <Text style={styles.savedIcon}>✓</Text>
                <Text style={styles.savedText}>Added to your Actions</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/action')}
                style={styles.viewActionsLink}
              >
                <Text style={styles.viewActionsLinkText}>View →</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Generate Micro-Action Button */}
          {messages.length > 0 && !isLoading && !suggestion && !savedActionId && (
            <Animated.View entering={FadeIn} style={styles.actionPromptContainer}>
              <Button
                title="Generate Micro-Actions ↗"
                onPress={handleGenerateMicroAction}
                variant="primary"
                size="md"
                loading={actionsLoading || slipLoading}
                style={styles.microActionButton}
              />
            </Animated.View>
          )}

          {/* Permission Slip */}
          {slip && (
            <Animated.View entering={FadeInUp.springify().damping(15).delay(200)}>
              <PermissionSlip
                slip={{
                  id: Date.now().toString(),
                  title: slip.title,
                  permission: slip.permission,
                  signedBy: slip.signedBy,
                  createdAt: new Date().toISOString(),
                  fear: messages.find(m => m.role === 'user')?.content || '',
                }}
              />
            </Animated.View>
          )}

          {/* Generated Actions Preview - Smooth transition from Permission Slip */}
          {actions.length > 0 && (
            <Animated.View entering={SlideInRight.springify().damping(18).delay(slip ? 600 : 200)} style={styles.actionsPreview}>
              <Text style={styles.actionsPreviewTitle}>Your Micro-Actions</Text>
              {actions.slice(0, 2).map((action, index) => (
                <Animated.View key={index} entering={FadeInDown.delay(index * 150 + 300)}>
                  <Card style={styles.actionPreviewCard}>
                    <Text style={styles.actionPreviewCardTitle}>{action.title}</Text>
                    <Text style={styles.actionPreviewDuration}>⏱️ {action.duration} min</Text>
                  </Card>
                </Animated.View>
              ))}
              <Animated.View entering={FadeIn.delay(800)}>
                <Button
                  title="View All Actions →"
                  onPress={() => router.push('/(tabs)/action')}
                  variant="primary"
                  size="md"
                  style={styles.viewActionsButton}
                />
              </Animated.View>
            </Animated.View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + spacing.sm }]}>
          {!isPremium && (
            <Text style={styles.usageHint}>
              {remainingAIUses} AI reframes left today
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
              placeholder="Type or hold mic to speak..."
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

      {/* Deep Dive Modal for chat actions */}
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: colors.midnightNavy,
    fontWeight: '300',
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
  },
  avatarContainer: {
    width: 32,
    height: 32,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: 16,
    color: colors.white,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  welcomeContainer: {
    marginBottom: spacing.lg,
  },
  welcomeCard: {
    backgroundColor: colors.white,
  },
  gabbyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  gabbyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.warmCream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  gabbyAvatarText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: 18,
    color: colors.midnightNavy,
  },
  gabbyName: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
  },
  welcomeText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray700,
    lineHeight: 24,
  },
  messageContainer: {
    marginBottom: spacing.md,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  gabbyAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.warmCream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  gabbyAvatarTextSmall: {
    fontFamily: typography.fontFamily.heading,
    fontSize: 14,
    color: colors.midnightNavy,
  },
  gabbyNameSmall: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
  },
  messageBubble: {
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: colors.midnightNavy,
  },
  assistantBubble: {
    backgroundColor: colors.white,
  },
  messageText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray700,
    lineHeight: 22,
  },
  userMessageText: {
    color: colors.white,
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
    color: colors.gray400,
    fontSize: 12,
  },
  actionPromptContainer: {
    marginTop: spacing.md,
    alignItems: 'flex-start',
  },
  microActionButton: {
    backgroundColor: colors.boldTerracotta,
  },
  actionsPreview: {
    marginTop: spacing.xl,
  },
  actionsPreviewTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    marginBottom: spacing.md,
  },
  actionPreviewCard: {
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionPreviewCardTitle: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    flex: 1,
  },
  actionPreviewDuration: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  viewActionsButton: {
    marginTop: spacing.sm,
  },
  savedConfirmation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.tealLight,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginVertical: spacing.md,
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
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    backgroundColor: colors.parchmentWhite,
  },
  usageHint: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    maxHeight: 100,
    ...shadows.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.boldTerracotta,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  sendIcon: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
});
