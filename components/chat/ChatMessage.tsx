import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { ChatToken, ActionToken } from '@/services/socraticCoachService';
import { ChatButtonOptions } from './ChatButtonOptions';
import { CoreActionCard } from './CoreActionCard';

// Type for the action data
type ActionData = ActionToken['action'];

interface ChatMessageProps {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tokens: ChatToken[];
  dialogueStep: number;
  index: number;
  onSelectOption?: (option: string) => void;
  onStartAction?: (action: ActionData) => void;
  onSaveAction?: (action: ActionData) => void;
  isLatest?: boolean;
  disabled?: boolean;
}

export function ChatMessage({
  id,
  role,
  content,
  tokens,
  dialogueStep,
  index,
  onSelectOption,
  onStartAction,
  onSaveAction,
  isLatest,
  disabled,
}: ChatMessageProps) {
  const isUser = role === 'user';

  // Get step indicator for assistant messages
  const getStepIndicator = () => {
    if (isUser) return null;
    const indicators: Record<number, { label: string; color: string }> = {
      1: { label: 'Validating', color: colors.vibrantTeal },
      2: { label: 'Exploring', color: colors.champagneGold },
      3: { label: 'Reframing', color: colors.boldTerracotta },
      4: { label: 'Acting', color: colors.tealDark },
    };
    return indicators[dialogueStep];
  };

  const stepIndicator = getStepIndicator();

  // Render individual token
  const renderToken = (token: ChatToken, tokenIndex: number) => {
    switch (token.type) {
      case 'text':
        return (
          <Text key={tokenIndex} style={styles.messageText}>
            {token.content}
          </Text>
        );

      case 'buttons':
        return (
          <ChatButtonOptions
            key={tokenIndex}
            options={token.options}
            onSelect={onSelectOption || (() => {})}
            disabled={disabled || !isLatest}
          />
        );

      case 'action':
        return (
          <CoreActionCard
            key={tokenIndex}
            action={token.action}
            onStartNow={() => onStartAction?.(token.action)}
            onSaveForLater={() => onSaveAction?.(token.action)}
            disabled={disabled}
          />
        );

      default:
        return null;
    }
  };

  if (isUser) {
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 30)}
        style={[styles.messageContainer, styles.userMessageContainer]}
      >
        <View style={[styles.messageBubble, styles.userBubble]}>
          <Text style={[styles.messageText, styles.userMessageText]}>{content}</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 30)}
      style={[styles.messageContainer, styles.assistantMessageContainer]}
    >
      {/* AI Coach Header */}
      <View style={styles.coachHeader}>
        <LinearGradient
          colors={[colors.champagneGold, colors.goldDark]}
          style={styles.coachAvatar}
        >
          <Text style={styles.coachAvatarText}>✦</Text>
        </LinearGradient>
        <View style={styles.coachInfo}>
          {stepIndicator && (
            <View style={[styles.stepBadge, { backgroundColor: stepIndicator.color + '20' }]}>
              <View style={[styles.stepDot, { backgroundColor: stepIndicator.color }]} />
              <Text style={[styles.stepText, { color: stepIndicator.color }]}>
                {stepIndicator.label}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Message Content with Tokens */}
      <View style={[styles.messageBubble, styles.assistantBubble]}>
        {tokens.map((token, tokenIndex) => renderToken(token, tokenIndex))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: spacing.lg,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  assistantMessageContainer: {
    alignItems: 'flex-start',
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  coachAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    ...shadows.glow,
  },
  coachAvatarText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: 16,
    color: colors.midnightNavy,
  },
  coachInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stepText: {
    fontFamily: typography.fontFamily.body,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageBubble: {
    maxWidth: '90%',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  userBubble: {
    backgroundColor: colors.midnightNavy,
    borderBottomRightRadius: borderRadius.sm,
  },
  assistantBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: borderRadius.sm,
    ...shadows.sm,
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
});
