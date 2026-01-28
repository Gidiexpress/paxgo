import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@fastshot/auth';
import {
  colors,
  typography,
  borderRadius,
  spacing,
  shadows,
} from '@/constants/theme';

type AuthMode = 'social' | 'email-signin' | 'email-signup';

export default function CreateAccountScreen() {
  const insets = useSafeAreaInsets();
  const {
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    isLoading,
    error,
    clearError,
  } = useAuth();

  const [authMode, setAuthMode] = useState<AuthMode>('social');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleGoogleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signInWithGoogle();
      // Navigation is handled automatically by AuthProvider
    } catch (err) {
      console.error('Google sign in error:', err);
    }
  };

  const handleAppleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signInWithApple();
      // Navigation is handled automatically by AuthProvider
    } catch (err) {
      console.error('Apple sign in error:', err);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!password.trim() || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (authMode === 'email-signup' && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (authMode === 'email-signup') {
        const result = await signUpWithEmail(email, password);
        if (result.emailConfirmationRequired) {
          Alert.alert(
            'Check Your Email',
            `We've sent a verification link to ${email}. Please verify your email to continue.`,
            [{ text: 'OK', onPress: () => setAuthMode('email-signin') }]
          );
        }
      } else {
        await signInWithEmail(email, password);
        // Navigation is handled automatically by AuthProvider
      }
    } catch (err) {
      console.error('Email auth error:', err);
    }
  };

  const switchToEmailMode = (mode: 'email-signin' | 'email-signup') => {
    clearError();
    setAuthMode(mode);
    setPassword('');
    setConfirmPassword('');
  };

  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressDots}>
        {[1, 2, 3].map((step) => (
          <View
            key={step}
            style={[
              styles.progressDot,
              step <= 3 && styles.progressDotActive,
              step === 3 && styles.progressDotCurrent,
            ]}
          />
        ))}
      </View>
      <Text style={styles.progressText}>Step 3 of 3</Text>
    </View>
  );

  const renderSocialAuth = () => (
    <Animated.View entering={FadeInDown.delay(200)} style={styles.authSection}>
      {/* Google Sign In */}
      <TouchableOpacity
        style={styles.socialButton}
        onPress={handleGoogleSignIn}
        disabled={isLoading}
      >
        <View style={styles.socialIconContainer}>
          <Text style={styles.socialIcon}>G</Text>
        </View>
        <Text style={styles.socialButtonText}>Continue with Google</Text>
      </TouchableOpacity>

      {/* Apple Sign In - iOS only */}
      {Platform.OS === 'ios' && (
        <TouchableOpacity
          style={[styles.socialButton, styles.appleButton]}
          onPress={handleAppleSignIn}
          disabled={isLoading}
        >
          <View style={styles.socialIconContainer}>
            <Text style={[styles.socialIcon, styles.appleIcon]}></Text>
          </View>
          <Text style={[styles.socialButtonText, styles.appleButtonText]}>
            Continue with Apple
          </Text>
        </TouchableOpacity>
      )}

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Email options */}
      <TouchableOpacity
        style={styles.emailOptionButton}
        onPress={() => switchToEmailMode('email-signup')}
      >
        <LinearGradient
          colors={[colors.vibrantTeal, colors.tealDark]}
          style={styles.emailOptionGradient}
        >
          <Text style={styles.emailOptionText}>Sign up with Email</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.textButton}
        onPress={() => switchToEmailMode('email-signin')}
      >
        <Text style={styles.textButtonText}>
          Already have an account? <Text style={styles.textButtonLink}>Sign In</Text>
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderEmailForm = () => (
    <Animated.View entering={FadeInDown.delay(200)} style={styles.authSection}>
      <TextInput
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor={colors.gray400}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.gray400}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {authMode === 'email-signup' && (
        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          placeholderTextColor={colors.gray400}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      )}

      {error && (
        <Text style={styles.errorText}>{error.message}</Text>
      )}

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleEmailSubmit}
        disabled={isLoading}
      >
        <LinearGradient
          colors={[colors.boldTerracotta, colors.terracottaDark]}
          style={styles.submitGradient}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitText}>
              {authMode === 'email-signup' ? 'Create Account' : 'Sign In'}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.textButton}
        onPress={() => {
          clearError();
          setAuthMode('social');
        }}
      >
        <Text style={styles.textButtonText}>← Back to sign in options</Text>
      </TouchableOpacity>

      {authMode === 'email-signin' && (
        <TouchableOpacity
          style={styles.textButton}
          onPress={() => switchToEmailMode('email-signup')}
        >
          <Text style={styles.textButtonText}>
            Don&apos;t have an account? <Text style={styles.textButtonLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      )}

      {authMode === 'email-signup' && (
        <TouchableOpacity
          style={styles.textButton}
          onPress={() => switchToEmailMode('email-signin')}
        >
          <Text style={styles.textButtonText}>
            Already have an account? <Text style={styles.textButtonLink}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress indicator */}
          {renderProgressIndicator()}

          {/* Header */}
          <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[colors.champagneGold, colors.goldDark]}
                style={styles.iconGradient}
              >
                <Text style={styles.icon}>🔐</Text>
              </LinearGradient>
            </View>

            <Text style={styles.title}>
              {authMode === 'social'
                ? 'Save Your Journey'
                : authMode === 'email-signup'
                ? 'Create Your Account'
                : 'Welcome Back'}
            </Text>
            <Text style={styles.subtitle}>
              {authMode === 'social'
                ? 'Create an account to save your progress and unlock personalized coaching'
                : authMode === 'email-signup'
                ? 'Start your transformation journey today'
                : 'Sign in to continue your journey'}
            </Text>
          </Animated.View>

          {/* Auth Section */}
          {authMode === 'social' ? renderSocialAuth() : renderEmailForm()}

          {/* Trust indicators */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.trustSection}>
            <View style={styles.trustItem}>
              <Text style={styles.trustIcon}>🔒</Text>
              <Text style={styles.trustText}>Your data is encrypted</Text>
            </View>
            <View style={styles.trustItem}>
              <Text style={styles.trustIcon}>🚫</Text>
              <Text style={styles.trustText}>No spam, ever</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  progressDots: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  progressDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray300,
  },
  progressDotActive: {
    backgroundColor: colors.champagneGold,
  },
  progressDotCurrent: {
    backgroundColor: colors.boldTerracotta,
  },
  progressText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['3xl'],
    color: colors.midnightNavy,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
  authSection: {
    marginBottom: spacing['2xl'],
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  appleButton: {
    backgroundColor: colors.midnightNavy,
    borderColor: colors.midnightNavy,
  },
  socialIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  socialIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.midnightNavy,
  },
  appleIcon: {
    color: colors.white,
  },
  socialButtonText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    flex: 1,
    textAlign: 'center',
    marginRight: 36, // Offset for icon
  },
  appleButtonText: {
    color: colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray300,
  },
  dividerText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    paddingHorizontal: spacing.lg,
  },
  emailOptionButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  emailOptionGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emailOptionText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
  },
  textButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  textButtonText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  textButtonLink: {
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.boldTerracotta,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  errorText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.boldTerracotta,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  submitButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  submitGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  submitText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.white,
  },
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing['2xl'],
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  trustIcon: {
    fontSize: 14,
  },
  trustText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
});
