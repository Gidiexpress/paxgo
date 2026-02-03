import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { supabase } from '@/lib/supabase';
import {
  colors,
  typography,
  borderRadius,
  spacing,
  shadows,
} from '@/constants/theme';

type AuthMode = 'social' | 'email-signin' | 'email-signup' | 'forgot-password';

export default function CreateAccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ error?: string }>();
  const { showSuccess, showError, showInfo } = useSnackbar();

  const {
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    isLoading,
    error,
    clearError,
    pendingPasswordReset,
    isAuthenticated,
  } = useAuth();

  const [authMode, setAuthMode] = useState<AuthMode>('social');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [showManualContinue, setShowManualContinue] = useState(false);

  // Handle navigation after successful authentication
  const handleAuthSuccess = useCallback(() => {
    if (isNavigating) return;

    console.log('🎉 Authentication successful, navigating directly to coaching...');
    setIsNavigating(true);

    showSuccess('Welcome aboard! Your journey begins now', {
      icon: '✨',
      duration: 2000,
    });

    // Delay to ensure:
    // 1. The database trigger has created the user profile
    // 2. Auth state is fully settled
    setTimeout(() => {
      console.log('✅ Navigating to /journey/five-whys-chat');
      router.replace('/journey/five-whys-chat');
    }, 800); // Allow time for trigger to complete
  }, [isNavigating, router, showSuccess]);

  // Watch for authentication state changes
  useEffect(() => {
    console.log('Auth state:', { isAuthenticated, isLoading, isNavigating });

    if (isAuthenticated && !isLoading && !isNavigating) {
      console.log('Triggering handleAuthSuccess...');
      handleAuthSuccess();
    }
  }, [isAuthenticated, isLoading, isNavigating, handleAuthSuccess]);

  // Safety net: Show manual continue button if authenticated but not navigating
  useEffect(() => {
    if (isAuthenticated && !isLoading && !isNavigating) {
      const timer = setTimeout(() => {
        console.log('Manual continue button shown as fallback');
        setShowManualContinue(true);
      }, 3000); // Show after 3 seconds if automatic navigation didn't work

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, isNavigating]);

  // Show error from URL params (from OAuth callback)
  useEffect(() => {
    if (params.error) {
      showError(params.error);
    }
  }, [params.error, showError]);

  // Handle error types with luxury-style messaging
  useEffect(() => {
    if (!error) return;

    // Don't show alert for browser dismissed - user just cancelled
    if (error.type === 'BROWSER_DISMISSED') {
      clearError();
      return;
    }

    // Handle specific error cases with sophisticated, user-friendly messages
    if (error.message?.includes('Invalid login credentials')) {
      // Only show this error if we're in sign-in mode
      if (authMode === 'email-signin') {
        showError('We couldn\'t find a match for those credentials', {
          icon: '🔐',
          action: {
            label: 'Reset Password',
            onPress: () => {
              clearError();
              setAuthMode('forgot-password');
            },
          },
          duration: 6000,
        });
      } else {
        clearError(); // Clear error for sign-up, handled in submit function
      }
    } else if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
      showInfo('Welcome back! This account already exists', {
        icon: '✨',
        action: {
          label: 'Sign In',
          onPress: () => {
            clearError();
            setAuthMode('email-signin');
          },
        },
        duration: 6000,
      });
    } else if (error.message?.includes('Email not confirmed')) {
      showInfo('Please verify your email to continue', {
        icon: '📧',
        duration: 8000,
      });
    } else if (error.message?.includes('Email address') && error.message?.includes('invalid')) {
      showError('Please provide a valid email address', {
        icon: '📧',
      });
    } else if (error.message?.includes('rate limit')) {
      showInfo('Please take a moment before trying again', {
        icon: '⏱',
        duration: 6000,
      });
    } else if (error.message?.includes('Password should be at least')) {
      showError('Your password needs to be stronger', {
        icon: '🔐',
        duration: 5000,
      });
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      showError('Connection interrupted. Please check your network', {
        icon: '📡',
        duration: 6000,
      });
    } else if (error.message) {
      // Generic fallback - avoid showing technical errors
      showError('Something unexpected occurred. Please try again', {
        icon: '⚠️',
        duration: 6000,
      });
      console.error('Unhandled auth error:', error.message);
    }
  }, [error, authMode, clearError, showError, showInfo]);

  const handleGoogleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showInfo('Connecting with Google...', {
      icon: '✨',
      duration: 2000,
    });
    try {
      clearError();
      console.log('🔐 Starting Google sign-in...');
      await signInWithGoogle();
      console.log('✅ Google sign-in completed');

      // Wait for database trigger and check session
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('✅ Session created successfully');
      } else {
        console.log('⚠️ No session found after Google sign-in');
        showError('Sign in was cancelled or failed. Please try again', {
          icon: '⚠️',
          duration: 4000,
        });
      }
      // Navigation will be handled by the auth state listener
    } catch (err) {
      console.error('❌ Google sign in error:', err);
      // Error handling done by error effect
    }
  };

  const handleAppleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showInfo('Connecting with Apple...', {
      icon: '✨',
      duration: 2000,
    });
    try {
      clearError();
      console.log('🔐 Starting Apple sign-in...');
      await signInWithApple();
      console.log('✅ Apple sign-in completed');

      // Wait for database trigger and check session
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('✅ Session created successfully');
      } else {
        console.log('⚠️ No session found after Apple sign-in');
        showError('Sign in was cancelled or failed. Please try again', {
          icon: '⚠️',
          duration: 4000,
        });
      }
      // Navigation will be handled by the auth state listener
    } catch (err) {
      console.error('❌ Apple sign in error:', err);
      // Error handling done by error effect
    }
  };

  const handleEmailSubmit = async () => {
    // Immediate haptic feedback on button press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Validation with sophisticated error messages
    if (!email.trim()) {
      showError('Please provide your email address', {
        icon: '📧',
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showError('This email format doesn\'t look quite right', {
        icon: '📧',
      });
      return;
    }

    if (!password.trim() || password.length < 6) {
      showError('Your password should be at least 6 characters', {
        icon: '🔐',
      });
      return;
    }

    if (authMode === 'email-signup' && password !== confirmPassword) {
      showError('Your passwords don\'t match', {
        icon: '🔐',
      });
      return;
    }

    try {
      clearError();
      if (authMode === 'email-signup') {
        console.log('📝 Starting email sign-up for:', email);
        showInfo('Creating your account...', {
          icon: '✨',
          duration: 3000,
        });

        try {
          console.log('🔐 Calling signUpWithEmail...');
          const signUpResult = await signUpWithEmail(email, password);
          console.log('✅ Sign-up API call completed:', signUpResult);

          // Wait for database trigger to complete and check auth state
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Check if we're actually authenticated now
          // If not, this was likely a "repeated signup" - try signing in instead
          const { data: { session } } = await supabase.auth.getSession();

          if (!session) {
            console.log('⚠️ Sign-up succeeded but no session created. Attempting sign-in instead...');
            showInfo('Signing you in...', { duration: 2000 });

            try {
              console.log('🔐 Attempting sign-in...');
              await signInWithEmail(email, password);
              console.log('✅ Sign-in successful');
              // Navigation will be handled by auth state listener
            } catch (signinError: any) {
              console.error('❌ Sign-in error:', signinError);

              // If sign-in fails, the account might not exist or wrong password
              if (signinError?.message?.includes('Invalid login credentials')) {
                showError(
                  'We couldn\'t sign you in. Please check your password or try again',
                  {
                    icon: '🔐',
                    duration: 6000,
                  }
                );
              } else {
                throw signinError;
              }
            }
          }
          // If session exists, navigation will be handled by auth state listener
        } catch (signupError: any) {
          console.error('❌ Sign up error:', signupError);

          // If sign-up fails with "Invalid login credentials", it might mean
          // the account was created but auto-sign-in failed. Try manual sign-in.
          if (signupError?.message?.includes('Invalid login credentials')) {
            console.log('⚠️ Auto-sign-in failed, attempting manual sign-in...');
            showInfo('Signing you in...', { duration: 2000 });

            // Wait a moment for the account to be fully created and trigger to fire
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
              console.log('🔐 Attempting manual sign-in...');
              await signInWithEmail(email, password);
              console.log('✅ Manual sign-in successful');
              // Navigation will be handled by auth state listener
            } catch (signinError: any) {
              console.error('❌ Manual sign-in error:', signinError);

              // If sign-in also fails, the account might not exist yet
              if (signinError?.message?.includes('Invalid login credentials')) {
                showInfo(
                  'Your account is ready. Please sign in to continue',
                  {
                    icon: '✨',
                    duration: 6000,
                  }
                );
                // Switch to sign-in mode
                setTimeout(() => setAuthMode('email-signin'), 1500);
              } else {
                throw signinError;
              }
            }
          } else {
            throw signupError;
          }
        }
      } else {
        console.log('🔐 Starting email sign-in for:', email);
        showInfo('Signing you in...', {
          icon: '✨',
          duration: 2000,
        });
        await signInWithEmail(email, password);
        console.log('✅ Sign-in completed successfully');
        // Navigation will be handled by the auth state listener
      }
    } catch (err: any) {
      console.error('💥 Email auth error:', err);
      // Error handling is done by the error effect above
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      showError('Please provide your email address', {
        icon: '📧',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showError('This email format doesn\'t look quite right', {
        icon: '📧',
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      clearError();
      await resetPassword(email);
      showSuccess('Password reset instructions sent', {
        icon: '✉️',
        duration: 4000,
      });
    } catch (err) {
      console.error('Password reset error:', err);
      showError('We couldn\'t send the reset email. Please try again', {
        icon: '📧',
        duration: 5000,
      });
    }
  };

  const switchToEmailMode = (mode: 'email-signin' | 'email-signup' | 'forgot-password') => {
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
        autoFocus={authMode !== 'social'}
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

      {/* Forgot Password Link - only shown on sign in */}
      {authMode === 'email-signin' && (
        <TouchableOpacity
          style={styles.forgotPasswordButton}
          onPress={() => switchToEmailMode('forgot-password')}
        >
          <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
        </TouchableOpacity>
      )}

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

  const renderForgotPasswordForm = () => {
    // Show success state if password reset email was sent
    if (pendingPasswordReset) {
      return (
        <Animated.View entering={FadeInDown.delay(200)} style={styles.authSection}>
          <View style={styles.successContainer}>
            <View style={styles.successIconContainer}>
              <LinearGradient
                colors={[colors.vibrantTeal, colors.tealDark]}
                style={styles.successIconGradient}
              >
                <Text style={styles.successIcon}>✉️</Text>
              </LinearGradient>
            </View>
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successText}>
              We&apos;ve sent password reset instructions to{'\n'}
              <Text style={styles.successEmail}>{email}</Text>
            </Text>
            <Text style={styles.successHint}>
              Don&apos;t see the email? Check your spam folder.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => {
              clearError();
              setAuthMode('email-signin');
            }}
          >
            <LinearGradient
              colors={[colors.midnightNavy, '#0A2540']}
              style={styles.submitGradient}
            >
              <Text style={styles.submitText}>Back to Sign In</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    return (
      <Animated.View entering={FadeInDown.delay(200)} style={styles.authSection}>
        <View style={styles.forgotPasswordHeader}>
          <Text style={styles.forgotPasswordHeaderIcon}>🔑</Text>
          <Text style={styles.forgotPasswordHeaderText}>
            Enter your email address and we&apos;ll send you a link to reset your password.
          </Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor={colors.gray400}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleForgotPassword}
          disabled={isLoading || !email.trim()}
        >
          <LinearGradient
            colors={
              email.trim()
                ? [colors.champagneGold, colors.goldDark]
                : [colors.gray300, colors.gray400]
            }
            style={styles.submitGradient}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitText}>Send Reset Link</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.textButton}
          onPress={() => switchToEmailMode('email-signin')}
        >
          <Text style={styles.textButtonText}>← Back to Sign In</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Show loading state during navigation
  if (isNavigating) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.boldTerracotta} />
        <Text style={styles.loadingText}>Welcome aboard! 🎉</Text>
      </View>
    );
  }

  // Show manual continue option if authenticated but navigation hasn't triggered
  if (showManualContinue && isAuthenticated) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[colors.champagneGold, colors.goldDark]}
            style={styles.iconGradient}
          >
            <Text style={styles.icon}>✓</Text>
          </LinearGradient>
        </View>
        <Text style={styles.manualContinueTitle}>You&apos;re all set!</Text>
        <Text style={styles.manualContinueText}>Let&apos;s continue to your journey</Text>
        <TouchableOpacity
          style={styles.manualContinueButton}
          onPress={() => {
            setIsNavigating(true);
            router.replace('/journey/five-whys-chat');
          }}
        >
          <LinearGradient
            colors={[colors.boldTerracotta, colors.terracottaDark]}
            style={styles.submitGradient}
          >
            <Text style={styles.submitText}>Continue →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

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
                colors={
                  authMode === 'forgot-password'
                    ? [colors.champagneGold, colors.goldDark]
                    : [colors.champagneGold, colors.goldDark]
                }
                style={styles.iconGradient}
              >
                <Text style={styles.icon}>
                  {authMode === 'forgot-password' ? '🔑' : '🔐'}
                </Text>
              </LinearGradient>
            </View>

            <Text style={styles.title}>
              {authMode === 'social'
                ? 'Save Your Journey'
                : authMode === 'email-signup'
                ? 'Create Your Account'
                : authMode === 'forgot-password'
                ? 'Reset Password'
                : 'Welcome Back'}
            </Text>
            <Text style={styles.subtitle}>
              {authMode === 'social'
                ? 'Create an account to save your progress and unlock personalized coaching'
                : authMode === 'email-signup'
                ? 'Start your transformation journey today'
                : authMode === 'forgot-password'
                ? 'No worries, we\'ll help you get back in'
                : 'Sign in to continue your journey'}
            </Text>
          </Animated.View>

          {/* Auth Section */}
          {authMode === 'social' && renderSocialAuth()}
          {(authMode === 'email-signin' || authMode === 'email-signup') && renderEmailForm()}
          {authMode === 'forgot-password' && renderForgotPasswordForm()}

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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
    marginTop: spacing.xl,
  },
  manualContinueTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'],
    color: colors.midnightNavy,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  manualContinueText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    marginBottom: spacing['2xl'],
    textAlign: 'center',
  },
  manualContinueButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    width: '80%',
    ...shadows.md,
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
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  forgotPasswordText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.champagneGold,
  },
  forgotPasswordHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    backgroundColor: colors.warmCream,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  forgotPasswordHeaderIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  forgotPasswordHeaderText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 20,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successIconContainer: {
    marginBottom: spacing.lg,
  },
  successIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  successIcon: {
    fontSize: 36,
  },
  successTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
    marginBottom: spacing.md,
  },
  successText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  successEmail: {
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.midnightNavy,
  },
  successHint: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: spacing.md,
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
