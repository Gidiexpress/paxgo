import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTextGeneration } from '@fastshot/ai';
import {
  colors,
  typography,
  borderRadius,
  spacing,
  shadows,
} from '@/constants/theme';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  whyNumber?: number;
}

const FIVE_WHYS_KEY = '@boldmove_five_whys';
const CORE_MOTIVATION_KEY = '@boldmove_core_motivation';

export default function FirstDialogueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentWhyNumber, setCurrentWhyNumber] = useState(0);
  const [stuckPoint, setStuckPoint] = useState<string>('');
  const [dream, setDream] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const { generateText, isLoading } = useTextGeneration();

  // Typing indicator animation
  const dotScale1 = useSharedValue(1);
  const dotScale2 = useSharedValue(1);
  const dotScale3 = useSharedValue(1);

  useEffect(() => {
    if (isLoading) {
      dotScale1.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 300 }),
          withTiming(1, { duration: 300 })
        ),
        -1,
        false
      );
      setTimeout(() => {
        dotScale2.value = withRepeat(
          withSequence(
            withTiming(1.3, { duration: 300 }),
            withTiming(1, { duration: 300 })
          ),
          -1,
          false
        );
      }, 150);
      setTimeout(() => {
        dotScale3.value = withRepeat(
          withSequence(
            withTiming(1.3, { duration: 300 }),
            withTiming(1, { duration: 300 })
          ),
          -1,
          false
        );
      }, 300);
    }
  }, [isLoading]);

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale1.value }],
  }));
  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale2.value }],
  }));
  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale3.value }],
  }));

  // Load stored data and initialize conversation
  useEffect(() => {
    const initializeDialogue = async () => {
      try {
        const [storedStuckPoint, storedDream] = await Promise.all([
          AsyncStorage.getItem('@boldmove_stuck_point'),
          AsyncStorage.getItem('@boldmove_dream'),
        ]);

        const stuckPointData = storedStuckPoint ? JSON.parse(storedStuckPoint) : null;
        const dreamData = storedDream || '';

        setStuckPoint(stuckPointData?.title || 'your goals');
        setDream(dreamData);

        // Generate initial greeting
        const initialPrompt = `You are Gabby, a warm and insightful life coach helping someone explore their deepest motivations using the "Five Whys" technique.

The user wants to achieve: "${dreamData || 'their dream'}"
Their focus area is: "${stuckPointData?.title || 'personal growth'}"

Start with a warm, encouraging greeting (2-3 sentences max). Acknowledge their dream and then ask them the FIRST "Why" question: Why is this dream important to them?

Be conversational, warm, and use their dream specifically. Don't be generic. End with just the question, don't number it.`;

        const response = await generateText(initialPrompt);

        if (response) {
          setMessages([
            {
              id: '1',
              role: 'assistant',
              content: response,
              whyNumber: 1,
            },
          ]);
          setCurrentWhyNumber(1);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize dialogue:', error);
        // Fallback greeting
        setMessages([
          {
            id: '1',
            role: 'assistant',
            content: "Hi there! I'm Gabby, your personal guide on this journey of self-discovery. 🌟\n\nI'm so excited to help you dig deeper into what truly drives you. Let's explore your dream together using the \"Five Whys\" technique.\n\nSo tell me - why is this dream important to you?",
            whyNumber: 1,
          },
        ]);
        setCurrentWhyNumber(1);
        setIsInitialized(true);
      }
    };

    initializeDialogue();
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    scrollToBottom();

    // Determine next step
    const nextWhyNumber = currentWhyNumber + 1;

    try {
      let prompt: string;

      if (nextWhyNumber <= 5) {
        prompt = `You are Gabby, a warm and insightful life coach conducting a "Five Whys" session.

Context:
- User's dream: "${dream}"
- Focus area: "${stuckPoint}"
- This is Why #${currentWhyNumber} of 5
- User's response to Why #${currentWhyNumber}: "${userMessage.content}"

Previous conversation:
${messages.map((m) => `${m.role === 'assistant' ? 'Gabby' : 'User'}: ${m.content}`).join('\n')}

Instructions:
1. First, briefly acknowledge their answer with empathy and insight (1 sentence)
2. Then dig deeper by asking Why #${nextWhyNumber}
3. Make the question specific to what they just shared
4. Be warm, encouraging, and genuinely curious
5. Keep response to 2-3 sentences max
6. Don't number the question or mention "Why #X"`;

        const response = await generateText(prompt);

        if (response) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: response,
              whyNumber: nextWhyNumber,
            },
          ]);
          setCurrentWhyNumber(nextWhyNumber);
        }
      } else {
        // Final synthesis after 5 whys
        prompt = `You are Gabby, a warm and insightful life coach completing a "Five Whys" session.

Context:
- User's dream: "${dream}"
- Focus area: "${stuckPoint}"

The complete Five Whys conversation:
${messages.map((m) => `${m.role === 'assistant' ? 'Gabby' : 'User'}: ${m.content}`).join('\n')}
User's final answer: "${userMessage.content}"

Instructions:
1. Synthesize their core motivation in a powerful, affirming way
2. Reflect back the deeper "why" you've uncovered together
3. Frame this as their personal truth that will fuel their journey
4. Be celebratory but not over-the-top
5. End with encouragement about taking their first bold step
6. Keep to 3-4 sentences max
7. Include a ✨ emoji somewhere`;

        const response = await generateText(prompt);

        if (response) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: response,
            },
          ]);

          // Store the conversation and core motivation
          await AsyncStorage.setItem(
            FIVE_WHYS_KEY,
            JSON.stringify(messages.concat([userMessage]))
          );
          await AsyncStorage.setItem(CORE_MOTIVATION_KEY, userMessage.content);

          setIsComplete(true);
        }
      }
    } catch (error) {
      console.error('Failed to generate response:', error);
      // Fallback response
      if (nextWhyNumber <= 5) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: `That's really insightful! I can see this matters deeply to you. Let me ask you this - why is that important to you?`,
            whyNumber: nextWhyNumber,
          },
        ]);
        setCurrentWhyNumber(nextWhyNumber);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: `✨ Wow, what a journey we've taken together! Your core motivation is beautifully clear now - this isn't just about achieving a goal, it's about becoming who you're meant to be. I'm so proud of you for doing this deep work. Now let's take your first bold step!`,
          },
        ]);
        setIsComplete(true);
      }
    }

    scrollToBottom();
  };

  const handleContinue = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/journey/permission-slip');
  };

  const renderMessage = (message: Message, index: number) => {
    const isAssistant = message.role === 'assistant';
    const animationDelay = index * 100;

    return (
      <Animated.View
        key={message.id}
        entering={isAssistant ? FadeInLeft.delay(animationDelay) : FadeInRight.delay(animationDelay)}
        style={[
          styles.messageContainer,
          isAssistant ? styles.assistantMessage : styles.userMessage,
        ]}
      >
        {isAssistant && (
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[colors.champagneGold, colors.goldDark]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>G</Text>
            </LinearGradient>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isAssistant ? styles.assistantBubble : styles.userBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isAssistant ? styles.assistantText : styles.userText,
            ]}
          >
            {message.content}
          </Text>
          {message.whyNumber && (
            <View style={styles.whyBadge}>
              <Text style={styles.whyBadgeText}>Why #{message.whyNumber}</Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderTypingIndicator = () => (
    <Animated.View
      entering={FadeInLeft}
      style={[styles.messageContainer, styles.assistantMessage]}
    >
      <View style={styles.avatarContainer}>
        <LinearGradient
          colors={[colors.champagneGold, colors.goldDark]}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>G</Text>
        </LinearGradient>
      </View>
      <View style={[styles.messageBubble, styles.assistantBubble, styles.typingBubble]}>
        <View style={styles.typingDots}>
          <Animated.View style={[styles.typingDot, dot1Style]} />
          <Animated.View style={[styles.typingDot, dot2Style]} />
          <Animated.View style={[styles.typingDot, dot3Style]} />
        </View>
      </View>
    </Animated.View>
  );

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        {[1, 2, 3, 4, 5].map((num) => (
          <View
            key={num}
            style={[
              styles.progressSegment,
              num <= currentWhyNumber && styles.progressSegmentActive,
              num === currentWhyNumber && styles.progressSegmentCurrent,
            ]}
          />
        ))}
      </View>
      <Text style={styles.progressText}>
        {isComplete ? 'Complete! ✨' : `Why ${currentWhyNumber} of 5`}
      </Text>
    </View>
  );

  if (!isInitialized) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.boldTerracotta} />
        <Text style={styles.loadingText}>Gabby is getting ready...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown} style={styles.header}>
        <Text style={styles.headerTitle}>Discover Your Why</Text>
        <Text style={styles.headerSubtitle}>
          The Five Whys with Gabby
        </Text>
        {renderProgressBar()}
      </Animated.View>

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={insets.top + 60}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
        >
          {messages.map((message, index) => renderMessage(message, index))}
          {isLoading && renderTypingIndicator()}
        </ScrollView>

        {/* Input or Continue */}
        {isComplete ? (
          <Animated.View entering={SlideInUp} style={styles.continueContainer}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <LinearGradient
                colors={[colors.boldTerracotta, colors.terracottaDark]}
                style={styles.continueGradient}
              >
                <Text style={styles.continueText}>Create My Permission Slip →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <TextInput
              style={styles.input}
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
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
            >
              <LinearGradient
                colors={
                  inputText.trim() && !isLoading
                    ? [colors.vibrantTeal, colors.tealDark]
                    : [colors.gray300, colors.gray400]
                }
                style={styles.sendGradient}
              >
                <Text style={styles.sendText}>↑</Text>
              </LinearGradient>
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
    backgroundColor: colors.parchmentWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray500,
    marginTop: spacing.lg,
  },
  header: {
    padding: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.midnightNavy,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  progressContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  progressSegment: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray300,
  },
  progressSegmentActive: {
    backgroundColor: colors.champagneGold,
  },
  progressSegmentCurrent: {
    backgroundColor: colors.boldTerracotta,
  },
  progressText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    alignItems: 'flex-end',
  },
  assistantMessage: {
    justifyContent: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginRight: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  avatarText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  assistantBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: borderRadius.sm,
  },
  userBubble: {
    backgroundColor: colors.midnightNavy,
    borderBottomRightRadius: borderRadius.sm,
  },
  typingBubble: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  messageText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    lineHeight: 24,
  },
  assistantText: {
    color: colors.midnightNavy,
  },
  userText: {
    color: colors.white,
  },
  whyBadge: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  whyBadgeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
    color: colors.champagneGold,
  },
  typingDots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray400,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    backgroundColor: colors.parchmentWhite,
    gap: spacing.sm,
  },
  input: {
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
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendGradient: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    fontSize: 20,
    color: colors.white,
    fontWeight: 'bold',
  },
  continueContainer: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  continueButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  continueGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  continueText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
  },
});
