import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { useDreams } from '@/hooks/useDreams';
import { useTextGeneration } from '@fastshot/ai';
import { DREAM_CATEGORIES } from '@/types/dreams';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function NewDreamDialogueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dreamId } = useLocalSearchParams<{ dreamId: string }>();
  const scrollRef = useRef<ScrollView>(null);

  const { dreams, updateDream, addDreamChatMessage } = useDreams();
  const { generateText, isLoading } = useTextGeneration();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [whyCount, setWhyCount] = useState(0);
  const [coreMotivation, setCoreMotivation] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const dream = dreams.find((d) => d.id === dreamId);
  const category = dream ? DREAM_CATEGORIES[dream.category] : null;

  // Typing indicator animation
  const dotScale1 = useSharedValue(1);
  const dotScale2 = useSharedValue(1);
  const dotScale3 = useSharedValue(1);

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale1.value }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale2.value }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale3.value }],
  }));

  useEffect(() => {
    if (isLoading) {
      dotScale1.value = withRepeat(
        withSequence(withTiming(1.3, { duration: 300 }), withTiming(1, { duration: 300 })),
        -1
      );
      dotScale2.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 150 }),
          withTiming(1.3, { duration: 300 }),
          withTiming(1, { duration: 300 })
        ),
        -1
      );
      dotScale3.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(1.3, { duration: 300 }),
          withTiming(1, { duration: 300 })
        ),
        -1
      );
    }
  }, [isLoading, dotScale1, dotScale2, dotScale3]);

  // Initialize with first message
  useEffect(() => {
    if (dream && messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        role: 'assistant',
        content: `Hey there! 🌟 I&apos;m so excited to dive into your ${category?.title.toLowerCase()} dream with you.\n\nYou said: "${dream.title}"\n\nLet&apos;s uncover your deepest motivation using the Five Whys technique. I&apos;ll ask "why" five times to help you discover what truly drives this dream.\n\n**Why is this dream important to you?**`,
      };
      setMessages([welcomeMessage]);
    }
  }, [dream, messages.length, category?.title]);

  // Scroll to bottom on new messages
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || isLoading || !dream) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Save to dream chat history
    await addDreamChatMessage(dream.id, {
      role: 'user',
      content: inputText.trim(),
    });

    const newWhyCount = whyCount + 1;
    setWhyCount(newWhyCount);

    // Generate AI response
    const prompt =
      newWhyCount < 5
        ? `You are Gabby, a warm and insightful mindset coach helping someone discover their core motivation through the Five Whys technique.

Current dream: "${dream.title}" (${category?.title})
We are on Why #${newWhyCount} of 5.

The user just answered: "${inputText.trim()}"

Respond with:
1. A brief, empathetic acknowledgment of their answer (1 sentence)
2. Then ask "Why is that important to you?" in a warm, curious way

Keep your response under 80 words. Be encouraging but dig deeper. Use 1-2 relevant emojis.`
        : `You are Gabby, completing the Five Whys technique.

Dream: "${dream.title}" (${category?.title})
Final answer (Why #5): "${inputText.trim()}"

Based on this journey, synthesize their CORE MOTIVATION in a powerful, personal statement.

Respond with:
1. A warm acknowledgment that you've reached the heart of their motivation
2. Their core motivation as a clear, inspiring statement (in quotes)
3. A brief explanation of how understanding this will fuel their journey
4. End with excitement about starting their first action

Format the core motivation clearly. Keep total response under 120 words. Use emojis sparingly.`;

    try {
      const response = await generateText(prompt);

      if (response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Save to dream chat history
        await addDreamChatMessage(dream.id, {
          role: 'assistant',
          content: response,
        });

        if (newWhyCount >= 5) {
          // Extract core motivation and complete
          const motivationMatch = response.match(/"([^"]+)"/);
          const extractedMotivation = motivationMatch
            ? motivationMatch[1]
            : inputText.trim();

          setCoreMotivation(extractedMotivation);
          setIsComplete(true);

          // Update dream with core motivation and mark Five Whys as complete
          await updateDream(dream.id, {
            coreMotivation: extractedMotivation,
            fiveWhysCompleted: true,
          });
        }
      }
    } catch (error) {
      console.error('Error generating response:', error);
    }
  }, [
    inputText,
    isLoading,
    dream,
    whyCount,
    category?.title,
    generateText,
    addDreamChatMessage,
    updateDream,
  ]);

  const handleComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  }, [router]);

  if (!dream) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.champagneGold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.parchmentWhite, colors.warmCream]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={20}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.headerContent}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryIcon}>{category?.icon}</Text>
              <Text style={styles.categoryText}>{category?.title}</Text>
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {dream.title}
            </Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressDots}>
            {[1, 2, 3, 4, 5].map((num) => (
              <View
                key={num}
                style={[
                  styles.progressDot,
                  num <= whyCount && styles.progressDotCompleted,
                  num === whyCount + 1 && !isComplete && styles.progressDotActive,
                ]}
              >
                {num <= whyCount && <Text style={styles.progressCheck}>✓</Text>}
              </View>
            ))}
          </View>
          <Text style={styles.progressLabel}>
            {isComplete
              ? '✨ Core motivation discovered!'
              : `Why ${Math.min(whyCount + 1, 5)} of 5`}
          </Text>
        </View>

        {/* Chat Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message, index) => (
            <Animated.View
              key={message.id}
              entering={FadeInUp.delay(index === messages.length - 1 ? 100 : 0)}
              style={[
                styles.messageContainer,
                message.role === 'user' && styles.userMessageContainer,
              ]}
            >
              {message.role === 'assistant' && (
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={[colors.boldTerracotta, colors.terracottaDark]}
                    style={styles.avatar}
                  >
                    <Text style={styles.avatarText}>G</Text>
                  </LinearGradient>
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  message.role === 'user' && styles.userMessageBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.role === 'user' && styles.userMessageText,
                  ]}
                >
                  {message.content.replace(/&apos;/g, "'")}
                </Text>
              </View>
            </Animated.View>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <Animated.View entering={FadeIn} style={styles.typingContainer}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={[colors.boldTerracotta, colors.terracottaDark]}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>G</Text>
                </LinearGradient>
              </View>
              <View style={styles.typingBubble}>
                <Animated.Text style={[styles.typingDot, dot1Style]}>
                  ●
                </Animated.Text>
                <Animated.Text style={[styles.typingDot, dot2Style]}>
                  ●
                </Animated.Text>
                <Animated.Text style={[styles.typingDot, dot3Style]}>
                  ●
                </Animated.Text>
              </View>
            </Animated.View>
          )}

          {/* Completion card */}
          {isComplete && (
            <Animated.View entering={FadeInDown.delay(500)} style={styles.completionCard}>
              <LinearGradient
                colors={[colors.champagneGold + '20', colors.goldLight + '10']}
                style={styles.completionGradient}
              >
                <Text style={styles.completionIcon}>🌟</Text>
                <Text style={styles.completionTitle}>Core Motivation</Text>
                <Text style={styles.completionMotivation}>
                  &quot;{coreMotivation}&quot;
                </Text>
                <TouchableOpacity
                  onPress={handleComplete}
                  style={styles.startButton}
                >
                  <LinearGradient
                    colors={[colors.champagneGold, colors.goldDark]}
                    style={styles.startButtonGradient}
                  >
                    <Text style={styles.startButtonText}>
                      ✨ Start Taking Action
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          )}
        </ScrollView>

        {/* Input */}
        {!isComplete && (
          <View style={[styles.inputContainer, { paddingBottom: insets.bottom + spacing.md }]}>
            <TextInput
              style={styles.textInput}
              placeholder="Share your thoughts..."
              placeholderTextColor={colors.gray400}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.sendIcon}>↑</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.parchmentWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.parchmentWhite,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  headerContent: {
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.champagneGold + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xs,
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  categoryText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.goldDark,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  progressDots: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    backgroundColor: colors.champagneGold,
  },
  progressDotCompleted: {
    backgroundColor: colors.vibrantTeal,
  },
  progressCheck: {
    fontSize: 12,
    color: colors.white,
    fontWeight: 'bold',
  },
  progressLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginRight: spacing.sm,
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
  messageBubble: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderTopLeftRadius: borderRadius.sm,
    padding: spacing.lg,
    maxWidth: '80%',
    ...shadows.sm,
  },
  userMessageBubble: {
    backgroundColor: colors.midnightNavy,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.sm,
  },
  messageText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray700,
    lineHeight: 24,
  },
  userMessageText: {
    color: colors.white,
  },
  typingContainer: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderTopLeftRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    ...shadows.sm,
  },
  typingDot: {
    color: colors.boldTerracotta,
    fontSize: 12,
  },
  completionCard: {
    marginTop: spacing.xl,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.champagneGold + '40',
  },
  completionGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  completionIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  completionTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.goldDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  completionMotivation: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: spacing.xl,
  },
  startButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.glow,
  },
  startButtonGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['3xl'],
  },
  startButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray200,
    backgroundColor: colors.parchmentWhite,
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
    backgroundColor: colors.champagneGold,
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
