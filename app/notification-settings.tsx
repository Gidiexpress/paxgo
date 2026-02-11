/**
 * Notification Preferences Screen
 * Allows users to customize their notification settings
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { useNotifications } from '@/hooks/useNotifications';
import { useDreamProgress } from '@/hooks/useStorage';

type FrequencyOption = 'daily' | 'weekdays' | 'weekends' | 'random';

interface SettingToggleProps {
  icon: string;
  title: string;
  description: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
}

function SettingToggle({
  icon,
  title,
  description,
  value,
  onToggle,
  disabled,
}: SettingToggleProps) {
  const handleToggle = useCallback(async (newValue: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(newValue);
  }, [onToggle]);

  return (
    <View style={[styles.settingRow, disabled && styles.settingRowDisabled]}>
      <View style={styles.settingIconContainer}>
        <Text style={styles.settingIcon}>{icon}</Text>
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, disabled && styles.settingTitleDisabled]}>
          {title}
        </Text>
        <Text style={[styles.settingDescription, disabled && styles.settingDescriptionDisabled]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={handleToggle}
        disabled={disabled}
        trackColor={{
          false: colors.gray300,
          true: colors.champagneGold,
        }}
        thumbColor={value ? colors.white : colors.gray100}
        ios_backgroundColor={colors.gray300}
      />
    </View>
  );
}

interface TimePickerRowProps {
  icon: string;
  title: string;
  description: string;
  time: string;
  onTimeChange: (time: string) => void;
  disabled?: boolean;
}

function TimePickerRow({
  icon,
  title,
  description,
  time,
  onTimeChange,
  disabled,
}: TimePickerRowProps) {
  const [showPicker, setShowPicker] = useState(false);

  // Parse time string to Date
  const [hours, minutes] = time.split(':').map(Number);
  const timeDate = new Date();
  timeDate.setHours(hours, minutes, 0, 0);

  const handleTimeChange = useCallback(
    (event: unknown, selectedDate?: Date) => {
      setShowPicker(Platform.OS === 'ios');
      if (selectedDate) {
        const newTime = `${String(selectedDate.getHours()).padStart(2, '0')}:${String(
          selectedDate.getMinutes()
        ).padStart(2, '0')}`;
        onTimeChange(newTime);
      }
    },
    [onTimeChange]
  );

  const formatDisplayTime = (timeStr: string): string => {
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${String(m).padStart(2, '0')} ${period}`;
  };

  return (
    <View style={[styles.settingRow, disabled && styles.settingRowDisabled]}>
      <View style={styles.settingIconContainer}>
        <Text style={styles.settingIcon}>{icon}</Text>
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, disabled && styles.settingTitleDisabled]}>
          {title}
        </Text>
        <Text style={[styles.settingDescription, disabled && styles.settingDescriptionDisabled]}>
          {description}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => !disabled && setShowPicker(true)}
        style={[styles.timeButton, disabled && styles.timeButtonDisabled]}
        disabled={disabled}
      >
        <Text style={[styles.timeButtonText, disabled && styles.timeButtonTextDisabled]}>
          {formatDisplayTime(time)}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={timeDate}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
}

interface FrequencyPickerProps {
  value: FrequencyOption;
  onChange: (value: FrequencyOption) => void;
  disabled?: boolean;
}

function FrequencyPicker({ value, onChange, disabled }: FrequencyPickerProps) {
  const options: { value: FrequencyOption; label: string; description: string }[] = [
    { value: 'daily', label: 'Every Day', description: 'Morning inspiration daily' },
    { value: 'weekdays', label: 'Weekdays', description: 'Mon-Fri only' },
    { value: 'weekends', label: 'Weekends', description: 'Sat-Sun only' },
    { value: 'random', label: 'Surprise Me', description: '2-3 times per week' },
  ];

  return (
    <View style={[styles.frequencyContainer, disabled && styles.frequencyContainerDisabled]}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.frequencyOption,
            value === option.value && styles.frequencyOptionSelected,
            disabled && styles.frequencyOptionDisabled,
          ]}
          onPress={() => {
            if (!disabled) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(option.value);
            }
          }}
          disabled={disabled}
        >
          <Text
            style={[
              styles.frequencyLabel,
              value === option.value && styles.frequencyLabelSelected,
              disabled && styles.frequencyLabelDisabled,
            ]}
          >
            {option.label}
          </Text>
          {value === option.value && (
            <Text style={styles.frequencyCheck}>✓</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { progress } = useDreamProgress();

  const {
    preferences,
    isLoading,
    isDeviceSupported,
    requestPermission,
    toggleMasterSwitch,
    setDailyNudgeEnabled,
    setDailyNudgeTime,
    setMorningReframeEnabled,
    setMorningReframeFrequency,
    setHypeSquadEnabled,
    setStreakSaviorEnabled,
    setStreakSaviorTime,
  } = useNotifications(progress?.currentStreak || 0);

  const permissionGranted = preferences.permissionStatus === 'granted';
  const masterEnabled = preferences.enabled && permissionGranted;

  const handleRequestPermission = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert(
        'Notifications Disabled',
        'To receive helpful reminders, please enable notifications in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          },
        ]
      );
    }
  }, [requestPermission]);

  const handleOpenSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.parchmentWhite, colors.warmCream]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission Status Banner */}
        {!permissionGranted && (
          <Animated.View entering={FadeIn} style={styles.permissionBanner}>
            <LinearGradient
              colors={[colors.midnightNavy, '#0A2540']}
              style={styles.permissionBannerGradient}
            >
              <Text style={styles.permissionBannerIcon}>🔔</Text>
              <View style={styles.permissionBannerContent}>
                <Text style={styles.permissionBannerTitle}>
                  {preferences.permissionStatus === 'denied'
                    ? 'Notifications Disabled'
                    : 'Enable Notifications'}
                </Text>
                <Text style={styles.permissionBannerText}>
                  {preferences.permissionStatus === 'denied'
                    ? 'Turn on notifications to get helpful reminders'
                    : 'Stay connected to your dreams with gentle reminders'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={
                  preferences.permissionStatus === 'denied'
                    ? handleOpenSettings
                    : handleRequestPermission
                }
                style={styles.permissionBannerButton}
              >
                <LinearGradient
                  colors={[colors.champagneGold, colors.goldDark]}
                  style={styles.permissionBannerButtonGradient}
                >
                  <Text style={styles.permissionBannerButtonText}>
                    {preferences.permissionStatus === 'denied' ? 'Settings' : 'Enable'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Master Toggle */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
          <View style={styles.masterToggleContainer}>
            <LinearGradient
              colors={
                masterEnabled
                  ? [colors.champagneGold + '20', colors.goldLight + '10']
                  : [colors.gray100, colors.gray200]
              }
              style={styles.masterToggleGradient}
            >
              <View style={styles.masterToggleContent}>
                <Text style={styles.masterToggleIcon}>
                  {masterEnabled ? '🌟' : '😴'}
                </Text>
                <View style={styles.masterToggleText}>
                  <Text style={styles.masterToggleTitle}>
                    All Notifications
                  </Text>
                  <Text style={styles.masterToggleDescription}>
                    {masterEnabled
                      ? 'Receiving helpful reminders'
                      : 'All notifications paused'}
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.enabled}
                onValueChange={toggleMasterSwitch}
                disabled={!permissionGranted}
                trackColor={{
                  false: colors.gray300,
                  true: colors.champagneGold,
                }}
                thumbColor={preferences.enabled ? colors.white : colors.gray100}
                ios_backgroundColor={colors.gray300}
              />
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Daily Nudge */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Nudge</Text>
          <Text style={styles.sectionDescription}>
            Your daily reminder for the next 5-minute micro-action
          </Text>

          <View style={styles.card}>
            <SettingToggle
              icon="🎯"
              title="Enable Daily Nudge"
              description="Get reminded to take action"
              value={preferences.dailyNudge.enabled}
              onToggle={setDailyNudgeEnabled}
              disabled={!masterEnabled}
            />

            <View style={styles.divider} />

            <TimePickerRow
              icon="⏰"
              title="Daily Nudge Time"
              description="Time for your daily nudge"
              time={preferences.dailyNudge.time}
              onTimeChange={setDailyNudgeTime}
              disabled={!masterEnabled || !preferences.dailyNudge.enabled}
            />
          </View>
        </Animated.View>

        {/* Morning Reframe */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>PaxGo Morning Reframe</Text>
          <Text style={styles.sectionDescription}>
            Mindset shifts and motivational thoughts to start your day
          </Text>

          <View style={styles.card}>
            <SettingToggle
              icon="✨"
              title="Enable Morning Reframes"
              description="Receive mindset boosts"
              value={preferences.morningReframe.enabled}
              onToggle={setMorningReframeEnabled}
              disabled={!masterEnabled}
            />

            <View style={styles.divider} />

            <View style={styles.frequencySection}>
              <Text style={[
                styles.frequencyTitle,
                (!masterEnabled || !preferences.morningReframe.enabled) && styles.frequencyTitleDisabled
              ]}>
                How often?
              </Text>
              <FrequencyPicker
                value={preferences.morningReframe.frequency}
                onChange={setMorningReframeFrequency}
                disabled={!masterEnabled || !preferences.morningReframe.enabled}
              />
            </View>
          </View>
        </Animated.View>

        {/* Hype Squad */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Hype Squad Alerts</Text>
          <Text style={styles.sectionDescription}>
            Stay connected with your support community
          </Text>

          <View style={styles.card}>
            <SettingToggle
              icon="🎉"
              title="Cheers & Reactions"
              description="When someone cheers your wins"
              value={preferences.hypeSquad.enabled && preferences.hypeSquad.cheers}
              onToggle={(value) => setHypeSquadEnabled(value)}
              disabled={!masterEnabled}
            />
          </View>
        </Animated.View>

        {/* Streak Savior */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Streak Savior</Text>
          <Text style={styles.sectionDescription}>
            A late-day reminder to protect your boldness streak
          </Text>

          <View style={styles.card}>
            <SettingToggle
              icon="🔥"
              title="Enable Streak Savior"
              description="Don&apos;t lose your momentum"
              value={preferences.streakSavior.enabled}
              onToggle={setStreakSaviorEnabled}
              disabled={!masterEnabled}
            />

            <View style={styles.divider} />

            <TimePickerRow
              icon="🌙"
              title="Evening Reminder"
              description="Last chance to save your streak"
              time={preferences.streakSavior.reminderTime}
              onTimeChange={setStreakSaviorTime}
              disabled={!masterEnabled || !preferences.streakSavior.enabled}
            />
          </View>
        </Animated.View>

        {/* Footer Note */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.footer}>
          <Text style={styles.footerIcon}>💛</Text>
          <Text style={styles.footerText}>
            We respect your time. These notifications are designed to feel like gentle nudges from a supportive friend, not spam.
          </Text>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.parchmentWhite,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray500,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  backIcon: {
    fontSize: 20,
    color: colors.midnightNavy,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
  },
  permissionBanner: {
    marginBottom: spacing.xl,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    ...shadows.md,
  },
  permissionBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  permissionBannerIcon: {
    fontSize: 28,
  },
  permissionBannerContent: {
    flex: 1,
  },
  permissionBannerTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
    marginBottom: 2,
  },
  permissionBannerText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.white + 'CC',
  },
  permissionBannerButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  permissionBannerButtonGradient: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  permissionBannerButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.white,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  settingRowDisabled: {
    opacity: 0.5,
  },
  settingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.warmCream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingIcon: {
    fontSize: 22,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    marginBottom: 2,
  },
  settingTitleDisabled: {
    color: colors.gray400,
  },
  settingDescription: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  settingDescriptionDisabled: {
    color: colors.gray400,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray200,
    marginLeft: spacing.lg + 44 + spacing.md,
  },
  timeButton: {
    backgroundColor: colors.warmCream,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  timeButtonDisabled: {
    backgroundColor: colors.gray100,
  },
  timeButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.champagneGold,
  },
  timeButtonTextDisabled: {
    color: colors.gray400,
  },
  masterToggleContainer: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    ...shadows.sm,
  },
  masterToggleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.champagneGold + '30',
    borderRadius: borderRadius['2xl'],
  },
  masterToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  masterToggleIcon: {
    fontSize: 32,
  },
  masterToggleText: {
    flex: 1,
  },
  masterToggleTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    marginBottom: 2,
  },
  masterToggleDescription: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
  },
  frequencySection: {
    padding: spacing.lg,
  },
  frequencyTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.midnightNavy,
    marginBottom: spacing.md,
  },
  frequencyTitleDisabled: {
    color: colors.gray400,
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  frequencyContainerDisabled: {
    opacity: 0.5,
  },
  frequencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  frequencyOptionSelected: {
    backgroundColor: colors.champagneGold + '20',
    borderWidth: 1,
    borderColor: colors.champagneGold,
  },
  frequencyOptionDisabled: {
    backgroundColor: colors.gray100,
  },
  frequencyLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  frequencyLabelSelected: {
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.goldDark,
  },
  frequencyLabelDisabled: {
    color: colors.gray400,
  },
  frequencyCheck: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: 12,
    color: colors.goldDark,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warmCream,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
  },
  footerIcon: {
    fontSize: 20,
  },
  footerText: {
    flex: 1,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    lineHeight: 20,
  },
});
