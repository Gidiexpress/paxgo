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
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@fastshot/auth';
import { useGroq } from '@/hooks/useGroq';
import { supabase } from '@/lib/supabase';
import { Audio } from 'expo-av';
import { useSnackbar } from '@/contexts/SnackbarContext';
import {
  colors,
  typography,
  borderRadius,
  spacing,
  shadows,
} from '@/constants/theme';
import { FiveWhysResponse } from '@/types/database';
import {
  generateFiveWhysQuestion,
  saveFiveWhysResponse,
  completeFiveWhysSession,
  generateRootMotivation,
} from '@/services/fiveWhysService';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  whyNumber?: number;
  isInitialGreeting?: boolean;
}

interface OnboardingData {
  name: string;
  stuckPoint: string;
  stuckPointTitle: string;
  dream: string;
}

// Color palette for ambient glow based on progress
const PROGRESS_COLORS = {
  1: { primary: colors.vibrantTeal, secondary: '#1A8A82' }, // Deep teal
  2: { primary: '#2EB5A8', secondary: '#228B7E' },
  3: { primary: '#48C9B0', secondary: colors.champagneGold },
  4: { primary: '#7DD3C4', secondary: '#C4A747' },
  5: { primary: colors.champagneGold, secondary: '#B8952D' }, // Golden
};

export default function FiveWhysChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const { generateText, transcribeAudio, isLoading } = useGroq();
  // Map consolidated isLoading to separate flags for compatibility or use single flag
  const isAILoading = isLoading;
  const isTranscribing = isLoading;

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentWhyNumber, setCurrentWhyNumber] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [responses, setResponses] = useState<FiveWhysResponse[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [rootMotivation, setRootMotivation] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  // Animation values
  const ambientGlowProgress = useSharedValue(0);
  const orbPulse = useSharedValue(1);
  const progressGlow = useSharedValue(0);
  const dotScale1 = useSharedValue(1);
  const dotScale2 = useSharedValue(1);
  const dotScale3 = useSharedValue(1);

  // Start ambient animations
  useEffect(() => {
    orbPulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    progressGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  // Update ambient glow based on progress
  useEffect(() => {
    ambientGlowProgress.value = withSpring(currentWhyNumber / 5, {
      damping: 15,
      stiffness: 80,
    });
  }, [currentWhyNumber]);

  // Typing indicator animation
  useEffect(() => {
    if (isSending || isAILoading) {
      dotScale1.value = withRepeat(
        withSequence(
          withTiming(1.4, { duration: 300 }),
          withTiming(1, { duration: 300 })
        ),
        -1,
        false
      );
      setTimeout(() => {
        dotScale2.value = withRepeat(
          withSequence(
            withTiming(1.4, { duration: 300 }),
            withTiming(1, { duration: 300 })
          ),
          -1,
          false
        );
      }, 150);
      setTimeout(() => {
        dotScale3.value = withRepeat(
          withSequence(
            withTiming(1.4, { duration: 300 }),
            withTiming(1, { duration: 300 })
          ),
          -1,
          false
        );
      }, 300);
    }
  }, [isSending, isAILoading]);

  // Load onboarding data and initialize
  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // 1. Try to fetch from Supabase first
      let dbUserData: any = null;
      if (user?.id) {
        const { data } = await supabase
          .from('users')
          .select('dream, stuck_point, name')
          .eq('id', user.id)
          .single();
        dbUserData = data;
      }

      // 2. Load onboarding data from AsyncStorage
      const [stuckPointStr, dreamStr, userDataStr, storedSessionId] = await Promise.all([
        AsyncStorage.getItem('@boldmove_stuck_point'),
        AsyncStorage.getItem('@boldmove_dream'),
        AsyncStorage.getItem('@boldmove_user'),
        AsyncStorage.getItem('@boldmove_current_session'),
      ]);

      // Parse stuck point - prioritize AsyncStorage (freshest selection) over database
      let stuckPoint = null;
      if (stuckPointStr) {
        try {
          stuckPoint = JSON.parse(stuckPointStr);
        } catch {
          stuckPoint = { id: stuckPointStr };
        }
      } else if (dbUserData?.stuck_point) {
        try {
          stuckPoint = JSON.parse(dbUserData.stuck_point);
        } catch {
          stuckPoint = { id: dbUserData.stuck_point };
        }
      }

      // Prioritize AsyncStorage dream (freshest selection) over database value
      // User may have started a new onboarding journey with a different dream
      const dream = dreamStr || dbUserData?.dream || '';
      const name = dbUserData?.name || (userDataStr ? JSON.parse(userDataStr).name : null) || user?.email?.split('@')[0] || 'Bold Explorer';

      // Map category ID to a readable title
      const categoryTitleMap: Record<string, string> = {
        'career': 'career growth',
        'travel': 'travel & adventure',
        'finance': 'financial freedom',
        'creative': 'creative pursuits',
        'wellness': 'wellness & habits',
      };

      const categoryId = stuckPoint?.id || 'personal-freedom';
      const categoryTitle = stuckPoint?.title || categoryTitleMap[categoryId] || 'personal growth';

      const onboarding: OnboardingData = {
        name,
        stuckPoint: categoryId,
        stuckPointTitle: categoryTitle,
        dream: dream || 'achieving your dream',
      };

      setOnboardingData(onboarding);

      // Transfer onboarding data to database
      await transferOnboardingData(onboarding);

      // Use stored session or create new one
      let activeSessionId = storedSessionId;
      if (!activeSessionId) {
        // Create new session
        const { data: session, error } = await supabase
          .from('five_whys_sessions')
          .insert({
            user_id: user.id,
            status: 'in_progress',
            current_why_number: 0,
          })
          .select()
          .single();

        if (session) {
          activeSessionId = session.id;
          await AsyncStorage.setItem('@boldmove_current_session', session.id);
        }
      }

      setSessionId(activeSessionId);

      // Generate personalized greeting
      await generatePersonalizedGreeting(onboarding);
    } catch (error) {
      console.error('Failed to initialize chat:', error);

      // Show error notification to user
      showError('Having trouble loading your data. Starting with defaults...', {
        duration: 4000,
      });

      // Fallback initialization
      setOnboardingData({
        name: 'Bold Explorer',
        stuckPoint: 'personal-freedom',
        stuckPointTitle: 'personal growth',
        dream: 'your dream',
      });
      generateFallbackGreeting();
    }
  };

  const transferOnboardingData = async (onboarding: OnboardingData) => {
    if (!user?.id) return;

    try {
      console.log('🔄 Transferring onboarding data to database...');

      // Wait for user profile to exist (with retry logic)
      let userProfileExists = false;
      let retryCount = 0;
      const maxRetries = 5;

      while (!userProfileExists && retryCount < maxRetries) {
        // Ensure Supabase client has the session
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          console.warn('⚠️ No active Supabase session found in transferOnboardingData');
          const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
          if (!refreshedSession?.user) {
            throw new Error('No authenticated session available');
          }
        }

        // Check for existing profile (using maybeSingle to avoid 406 errors)
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (existingUser) {
          userProfileExists = true;
        } else {
          // Is user ID matching?
          if (session?.user.id !== user.id) {
            console.warn('⚠️ User ID mismatch:', { authUser: user.id, sessionUser: session?.user.id });
            // We must use the session ID for RLS to work
          }

          const targetUserId = session?.user.id || user.id;

          // Use upsert to handle potential race conditions or existing-but-invisible rows
          const { error: insertError } = await supabase
            .from('users')
            .upsert({
              id: targetUserId,
              name: onboarding.name,
              onboarding_completed: false,
            }, { onConflict: 'id' });

          if (!insertError) {
            userProfileExists = true;
          } else {
            console.error('Insert/Upsert error attempt', retryCount, insertError);
            // Check specifically for RLS policy violation code 42501
            if (insertError.code === '42501') {
              console.error('⛔ RLS Violation. Creating profile failed. Check Policies.');
              // Break loop to avoid spamming
              retryCount = maxRetries;
            } else {
              retryCount++;
              if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }
        }
      }

      if (!userProfileExists) {
        throw new Error('Failed to create user profile');
      }

      // Update user profile with onboarding data
      await supabase
        .from('users')
        .update({
          name: onboarding.name,
          stuck_point: onboarding.stuckPoint,
          dream: onboarding.dream,
          onboarding_completed: false,
        })
        .eq('id', user.id);

      // Create or get active dream
      const { data: existingDream } = await supabase
        .from('dreams')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!existingDream && onboarding.dream) {
        await supabase
          .from('dreams')
          .insert({
            user_id: user.id,
            title: onboarding.dream,
            category: onboarding.stuckPoint || 'personal-growth',
            is_active: true,
          });
      }

      console.log('✅ Onboarding data transferred successfully');
    } catch (error) {
      console.error('❌ Failed to transfer onboarding data:', error);
      // Continue anyway - the chat can still function
    }
  };

  const generatePersonalizedGreeting = async (onboarding: OnboardingData) => {
    try {
      const prompt = `You are a sophisticated, neutral AI mindset coach. You're starting a deep conversation with ${onboarding.name} to help them discover their true motivation.

IMPORTANT CONTEXT - The user has already shared:
- Their name: ${onboarding.name}
- Their area of focus: ${onboarding.stuckPointTitle}
- Their dream: "${onboarding.dream}"

Generate a warm, natural opening message that:
1. Greets them warmly
2. Acknowledges their specific dream with genuine appreciation
3. Shows you remember their focus area
4. Begins the journey by asking: Why does this dream matter to them?

CRITICAL: Do NOT mention "Five Whys" or any technique. Do NOT say how many questions you'll ask. Do NOT mention your name. Just start the conversation naturally.

TONE: Sophisticated yet warm, neutral and professional. NOT clinical or structured.
LENGTH: 2-3 sentences. End with the question.

DO NOT ask them to share their dream - you already know it!`;

      const response = await generateText(prompt);

      if (response) {
        setMessages([
          {
            id: '1',
            role: 'assistant',
            content: response,
            whyNumber: 1,
            isInitialGreeting: true,
          },
        ]);
        setCurrentWhyNumber(1);
      } else {
        generateFallbackGreeting();
      }
    } catch (error) {
      console.error('Failed to generate greeting:', error);
      generateFallbackGreeting();
    } finally {
      setIsInitializing(false);
    }
  };

  const generateFallbackGreeting = () => {
    const name = onboardingData?.name || 'there';
    const dream = onboardingData?.dream || 'your dream';

    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `Welcome, ${name}. I can see you're working toward "${dream}" - that's beautiful.\n\nLet's explore what this dream really means to you. Tell me - why does this dream matter to you?`,
        whyNumber: 1,
        isInitialGreeting: true,
      },
    ]);
    setCurrentWhyNumber(1);
    setIsInitializing(false);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = async () => {
    if (!inputText.trim() || isSending || isAILoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsSending(true);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Add user message
    const userMsgId = Date.now().toString();
    const newUserMessage: Message = {
      id: userMsgId,
      role: 'user',
      content: userMessage,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    scrollToBottom();

    try {
      // Save response to database
      if (sessionId && user?.id) {
        const lastAssistantMsg = messages.filter(m => m.role === 'assistant').pop();
        const question = lastAssistantMsg?.content || '';
        const gabbyReflection = '';

        const savedResponse = await saveFiveWhysResponse(
          sessionId,
          currentWhyNumber,
          question,
          userMessage,
          gabbyReflection
        );

        if (savedResponse) {
          setResponses((prev) => [...prev, savedResponse]);
        }
      }

      const nextWhyNumber = currentWhyNumber + 1;

      if (nextWhyNumber <= 5) {
        // Generate next question
        const allResponses = [...responses, {
          id: userMsgId,
          session_id: sessionId || '',
          why_number: currentWhyNumber,
          question: messages.filter(m => m.role === 'assistant').pop()?.content || '',
          user_response: userMessage,
          gabby_reflection: null,
          created_at: new Date().toISOString(),
        }];

        const result = await generateFiveWhysQuestion(
          onboardingData?.dream || 'their dream',
          nextWhyNumber,
          allResponses as FiveWhysResponse[],
          onboardingData?.name
        );

        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: result.gabbyReflection ? `${result.gabbyReflection}\n\n${result.question}` : result.question,
          whyNumber: nextWhyNumber,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setCurrentWhyNumber(nextWhyNumber);
      } else {
        // Five Whys complete - generate root motivation
        await handleFiveWhysComplete(userMessage);
      }
    } catch (error) {
      console.error('Failed to process message:', error);
      showError('Something went wrong. Please try again.');
    } finally {
      setIsSending(false);
      scrollToBottom();
    }
  };

  const handleFiveWhysComplete = async (finalResponse: string) => {
    try {
      // Generate root motivation
      const allResponses = [...responses, {
        id: Date.now().toString(),
        session_id: sessionId || '',
        why_number: 5,
        question: messages.filter(m => m.role === 'assistant').pop()?.content || '',
        user_response: finalResponse,
        gabby_reflection: null,
        created_at: new Date().toISOString(),
      }];

      const motivation = await generateRootMotivation(
        onboardingData?.dream || 'their dream',
        allResponses as FiveWhysResponse[]
      );

      setRootMotivation(motivation);

      // Save session completion
      if (sessionId) {
        await completeFiveWhysSession(sessionId, motivation);
      }

      // Update user's onboarding status
      if (user?.id) {
        await supabase
          .from('users')
          .update({ onboarding_completed: true })
          .eq('id', user.id);

        // Update dream with core motivation
        await supabase
          .from('dreams')
          .update({
            core_motivation: motivation,
            five_whys_completed: true,
          })
          .eq('user_id', user.id)
          .eq('is_active', true);
      }

      // Generate synthesis message
      const synthesisPrompt = `You are a sophisticated AI mindset coach. You've just had a profound conversation with ${onboardingData?.name || 'someone'} about what truly drives them.

Their dream: "${onboardingData?.dream || 'their dream'}"
Their deepest motivation: "${motivation}"

Write a powerful, celebratory message (2-3 sentences) that:
1. Celebrates this breakthrough moment
2. Reflects back their motivation in an affirming way
3. Makes them feel truly seen and understood
4. Creates excitement for turning this insight into action

CRITICAL: Do NOT mention "Five Whys" or reference the process. Do NOT say "we've completed" or "journey we've taken". Do NOT mention your name. Just speak to their insight naturally.

Include a ✨ emoji. Be warm, sophisticated, neutral and professional.`;

      const synthesis = await generateText(synthesisPrompt);

      const synthesisMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: synthesis || `✨ ${onboardingData?.name || 'Friend'}, what you've just uncovered is beautiful.\n\n"${motivation}"\n\nThis is your truth - the fire beneath your dream. Let's turn this insight into your path forward.`,
      };

      setMessages((prev) => [...prev, synthesisMessage]);
      setIsComplete(true);

      // Haptic celebration
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Premium success snackbar
      showSuccess('Core insight unlocked ✨', {
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to complete Five Whys:', error);
      setIsComplete(true);
      setRootMotivation('Your dream connects to something deep within you.');
    }
  };

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Store data for reference
      await AsyncStorage.setItem('@boldmove_root_motivation', rootMotivation || '');
      await AsyncStorage.setItem('@boldmove_onboarding_complete', 'true');

      // Navigate to generation screen - it will show loading animation and generate roadmap
      router.replace({
        pathname: '/generate-roadmap',
        params: {
          dream: onboardingData?.dream || 'your dream',
          rootMotivation: rootMotivation || '',
        },
      });
    } catch (error) {
      console.error('Failed to navigate to generation:', error);
      router.replace('/(tabs)');
    }
  };

  const handleStartRecording = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        showError('Microphone permission is required for voice input');
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      showError('Could not start recording');
    }
  };

  const handleStopRecording = async () => {
    if (!recording) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      setIsRecording(false);
      await recording.stopAndUnloadAsync();

      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        // Transcribe the audio
        const transcription = await transcribeAudio(uri);

        if (transcription) {
          setInputText(transcription);
          showSuccess('Voice transcribed!', { icon: '🎤', duration: 2000 });
        }
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      showError('Could not transcribe audio');
    }
  };

  // Animated styles
  const ambientGlowStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      ambientGlowProgress.value,
      [0, 0.5, 1],
      [colors.vibrantTeal, '#48C9B0', colors.champagneGold]
    );

    return {
      backgroundColor,
      opacity: 0.15,
    };
  });

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbPulse.value }],
  }));

  const progressGlowStyle = useAnimatedStyle(() => ({
    opacity: progressGlow.value,
  }));

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale1.value }],
  }));
  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale2.value }],
  }));
  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale3.value }],
  }));

  // Get current progress color
  const getCurrentColor = () => {
    const colorKey = Math.min(currentWhyNumber, 5) as keyof typeof PROGRESS_COLORS;
    return PROGRESS_COLORS[colorKey] || PROGRESS_COLORS[1];
  };

  const renderProgressIndicator = () => {
    const currentColor = getCurrentColor();

    return (
      <Animated.View entering={FadeInDown.delay(100)} style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <View style={styles.progressInfo}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[colors.champagneGold, colors.goldDark]}
                style={styles.logoGradient}
              >
                <Text style={styles.logoIcon}>✦</Text>
              </LinearGradient>
            </View>
            <Text style={styles.progressSubtitle}>
              {isComplete ? 'Journey Complete ✨' : 'Deep Dive Conversation'}
            </Text>
          </View>

          {/* Mini orb indicator */}
          <Animated.View style={[styles.miniOrb, orbStyle]}>
            <LinearGradient
              colors={[currentColor.primary, currentColor.secondary]}
              style={styles.miniOrbGradient}
            />
          </Animated.View>
        </View>

        {/* Subtle progress bar without numbers */}
        <View style={styles.progressBar}>
          {[1, 2, 3, 4, 5].map((num) => (
            <View key={num} style={styles.progressSegmentContainer}>
              <View
                style={[
                  styles.progressSegment,
                  num <= currentWhyNumber && {
                    backgroundColor: getCurrentColor().primary,
                  },
                ]}
              />
            </View>
          ))}
        </View>
      </Animated.View>
    );
  };

  const renderMessage = (message: Message, index: number) => {
    const isAssistant = message.role === 'assistant';

    return (
      <Animated.View
        key={message.id}
        entering={isAssistant ? FadeInLeft.delay(100) : FadeInRight.delay(100)}
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
              <Text style={styles.avatarText}>✦</Text>
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

  if (isInitializing) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[colors.parchmentWhite, colors.warmCream]}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={colors.vibrantTeal} />
        <Text style={styles.loadingText}>Preparing your coaching session...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Ambient glow background */}
      <Animated.View style={[styles.ambientGlow, ambientGlowStyle]} />

      {/* Base background */}
      <LinearGradient
        colors={[colors.parchmentWhite, colors.warmCream]}
        style={[StyleSheet.absoluteFill, { opacity: 0.9 }]}
      />

      {/* Progress indicator */}
      {renderProgressIndicator()}

      {/* Chat area */}
      {/* Chat area */}
      <View style={styles.chatContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
        >
          {messages.map((message, index) => renderMessage(message, index))}
          {(isSending || isAILoading) && renderTypingIndicator()}
        </ScrollView>

        {/* Input or Continue */}
        {isComplete ? (
          <Animated.View
            entering={SlideInUp}
            style={[styles.completeContainer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
          >
            <View style={styles.insightCard}>
              <Text style={styles.insightLabel}>Your Core Insight</Text>
              <Text style={styles.insightText}>{rootMotivation}</Text>
            </View>

            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <LinearGradient
                colors={[colors.champagneGold, colors.goldDark]}
                style={styles.continueGradient}
              >
                <Text style={styles.continueText}>Yes, show me my first steps!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, spacing.xl) + spacing.md }]}>
            {/* Microphone button */}
            <TouchableOpacity
              style={[
                styles.micButton,
                isRecording && styles.micButtonActive,
              ]}
              onPress={isRecording ? handleStopRecording : handleStartRecording}
              disabled={isSending || isAILoading || isTranscribing}
            >
              <LinearGradient
                colors={
                  isRecording
                    ? [colors.boldTerracotta, colors.terracottaDark]
                    : [colors.champagneGold, colors.goldDark]
                }
                style={styles.micGradient}
              >
                <Text style={styles.micIcon}>{isRecording ? '⏹' : '🎤'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Share your thoughts..."
              placeholderTextColor={colors.gray400}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isSending && !isAILoading && !isRecording}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isSending || isAILoading) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isSending || isAILoading}
            >
              <LinearGradient
                colors={
                  inputText.trim() && !isSending && !isAILoading
                    ? [getCurrentColor().primary, getCurrentColor().secondary]
                    : [colors.gray300, colors.gray400]
                }
                style={styles.sendGradient}
              >
                <Text style={styles.sendText}>↑</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
  ambientGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
  },
  progressSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  progressInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logoContainer: {
    marginBottom: 0,
  },
  logoGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 16,
    color: colors.midnightNavy,
  },
  progressTitle: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.xl,
    color: colors.midnightNavy,
  },
  progressSubtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    marginTop: 2,
  },
  miniOrb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    ...shadows.glow,
  },
  miniOrbGradient: {
    width: '100%',
    height: '100%',
  },
  progressBar: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  progressSegmentContainer: {
    flex: 1,
    position: 'relative',
  },
  progressSegment: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray300,
  },
  progressSegmentActive: {
    transform: [{ scaleY: 1.2 }],
  },
  progressSegmentGlow: {
    position: 'absolute',
    top: -2,
    left: 0,
    right: 0,
    height: 8,
    borderRadius: 4,
    opacity: 0.4,
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
    maxWidth: '78%',
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  whyBadgeText: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.xs,
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
    // borderTopWidth: 1, // Removed to blend with chat
    // borderTopColor: colors.gray200, // Removed to blend with chat
    // backgroundColor: colors.parchmentWhite, // Removed to let gradient show through
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
  micButton: {
    marginRight: spacing.sm,
    ...shadows.sm, // Apply shadow to container
  },
  micButtonActive: {
    transform: [{ scale: 1.1 }],
  },
  micGradient: {
    width: 48, // Increase to matching size
    height: 48,
    borderRadius: 24, // Apply radius here
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIcon: {
    fontSize: 20,
  },
  sendButton: {
    ...shadows.sm, // Apply shadow to container
  },
  sendButtonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0,
  },
  sendGradient: {
    width: 48, // Increase to matching size
    height: 48,
    borderRadius: 24, // Apply radius here
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    fontSize: 20,
    color: colors.white,
    fontWeight: 'bold',
  },
  completeContainer: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    backgroundColor: colors.warmCream,
  },
  insightCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.md,
    borderWidth: 1,
    borderColor: `${colors.champagneGold}40`,
  },
  insightLabel: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.sm,
    color: colors.champagneGold,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  insightText: {
    fontFamily: typography.fontFamily.headingItalic,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    lineHeight: 28,
  },
  continueButton: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    ...shadows.lg,
    shadowColor: colors.champagneGold,
    shadowOpacity: 0.4,
  },
  continueGradient: {
    flexDirection: 'row',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  continueText: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
    letterSpacing: 0.5,
  },
  continueArrow: {
    fontSize: 18,
    color: colors.midnightNavy,
    fontWeight: 'bold',
  },
});
