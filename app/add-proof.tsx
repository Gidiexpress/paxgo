import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { colors, typography, borderRadius, spacing, shadows } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useProofs } from '@/hooks/useStorage';

// Journal filter styles
const FILTER_STYLES = [
  { id: 'warm', name: 'Warm Journal', tint: colors.champagneGold + '25' },
  { id: 'vintage', name: 'Vintage', tint: '#F5DEB3' + '30' },
  { id: 'golden', name: 'Golden Hour', tint: '#FFD700' + '20' },
  { id: 'none', name: 'Original', tint: 'transparent' },
];

export default function AddProofScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ actionId?: string; actionTitle?: string }>();
  const { addProof } = useProofs();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('warm');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll access to add photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera access to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSubmit = async () => {
    if (!note.trim() && !imageUri) {
      Alert.alert('Add content', 'Please add a photo or note to capture your win.');
      return;
    }

    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const hashtagList = hashtags
        .split(/[,\s#]+/)
        .filter((tag) => tag.trim().length > 0);

      await addProof({
        actionId: params.actionId || '',
        imageUri: imageUri || undefined,
        note: note.trim() || params.actionTitle || 'Completed an action!',
        hashtags: hashtagList,
        reactions: ['💚', '💛'],
        filter: selectedFilter,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save proof. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentFilterTint = () => {
    return FILTER_STYLES.find((f) => f.id === selectedFilter)?.tint || 'transparent';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.parchmentWhite, colors.warmCream]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Capture Your Win</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Journal Header - Date stamp style */}
          <Animated.View entering={FadeIn} style={styles.journalHeader}>
            <View style={styles.dateStamp}>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.journalDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerIcon}>✦</Text>
              <View style={styles.dividerLine} />
            </View>
          </Animated.View>

          {/* Action Context */}
          {params.actionTitle && (
            <Animated.View entering={FadeInDown.delay(100)}>
              <Card style={styles.contextCard}>
                <Text style={styles.contextLabel}>Bold move completed:</Text>
                <Text style={styles.contextTitle}>{params.actionTitle}</Text>
              </Card>
            </Animated.View>
          )}

          {/* Image Section */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.imageSection}>
            <Text style={styles.sectionTitle}>📸 Add a Photo</Text>
            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                {/* Image with filter overlay */}
                <TouchableOpacity onPress={pickImage} activeOpacity={0.9}>
                  <View style={styles.polaroidFrame}>
                    <View style={styles.imageWrapper}>
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.imagePreview}
                        contentFit="cover"
                      />
                      {/* Filter overlay */}
                      <View
                        style={[
                          styles.filterOverlay,
                          { backgroundColor: getCurrentFilterTint() },
                        ]}
                      />
                      {/* Vignette effect */}
                      <LinearGradient
                        colors={['transparent', 'transparent', 'rgba(0,0,0,0.2)']}
                        locations={[0, 0.6, 1]}
                        style={styles.vignette}
                      />
                    </View>
                    {/* Polaroid caption area */}
                    <View style={styles.polaroidCaption}>
                      <Text style={styles.tapToChange}>Tap to change</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Filter selection */}
                <View style={styles.filterContainer}>
                  <Text style={styles.filterLabel}>Choose a filter:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScroll}
                  >
                    {FILTER_STYLES.map((filter) => (
                      <TouchableOpacity
                        key={filter.id}
                        style={[
                          styles.filterOption,
                          selectedFilter === filter.id && styles.filterOptionSelected,
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedFilter(filter.id);
                        }}
                      >
                        <View
                          style={[
                            styles.filterPreview,
                            { backgroundColor: filter.tint === 'transparent' ? colors.gray200 : filter.tint },
                          ]}
                        />
                        <Text
                          style={[
                            styles.filterName,
                            selectedFilter === filter.id && styles.filterNameSelected,
                          ]}
                        >
                          {filter.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            ) : (
              <View style={styles.imageButtons}>
                <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                  <Text style={styles.imageButtonIcon}>📷</Text>
                  <Text style={styles.imageButtonText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                  <Text style={styles.imageButtonIcon}>🖼️</Text>
                  <Text style={styles.imageButtonText}>Choose Photo</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          {/* Note Section - Journal style */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.noteSection}>
            <Text style={styles.sectionTitle}>✍️ Journal Entry</Text>
            <View style={styles.journalPaper}>
              <TextInput
                style={styles.noteInput}
                placeholder="Dear journal, today I took a bold step..."
                placeholderTextColor={colors.gray400}
                value={note}
                onChangeText={setNote}
                multiline
                maxLength={280}
              />
              <View style={styles.journalLines}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <View key={i} style={styles.journalLine} />
                ))}
              </View>
            </View>
            <Text style={styles.characterCount}>{note.length}/280</Text>
          </Animated.View>

          {/* Hashtags Section */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.hashtagSection}>
            <Text style={styles.sectionTitle}># Add Tags (optional)</Text>
            <TextInput
              style={styles.hashtagInput}
              placeholder="e.g., #JapanSolo #FirstStep #BoldMove"
              placeholderTextColor={colors.gray400}
              value={hashtags}
              onChangeText={setHashtags}
            />
          </Animated.View>

          {/* Submit Button */}
          <Animated.View entering={FadeInDown.delay(500)}>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isLoading}>
              <LinearGradient
                colors={[colors.boldTerracotta, colors.terracottaDark]}
                style={styles.submitGradient}
              >
                {isLoading ? (
                  <Text style={styles.submitText}>Saving...</Text>
                ) : (
                  <Text style={styles.submitText}>Save to Proof Gallery</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Motivation quote */}
          <Animated.View entering={FadeInDown.delay(600)} style={styles.quoteContainer}>
            <Text style={styles.quote}>
              &quot;Every photo is proof that you showed up for yourself.&quot;
            </Text>
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
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize.lg,
    color: colors.midnightNavy,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  journalHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dateStamp: {
    backgroundColor: colors.champagneGold + '20',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  dateText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.champagneGold,
    fontStyle: 'italic',
  },
  journalDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '60%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray300,
  },
  dividerIcon: {
    fontSize: 12,
    color: colors.champagneGold,
    marginHorizontal: spacing.md,
  },
  contextCard: {
    marginBottom: spacing.xl,
    backgroundColor: colors.warmCream,
    borderLeftWidth: 4,
    borderLeftColor: colors.vibrantTeal,
  },
  contextLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.xs,
  },
  contextTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
  },
  imageSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bodySemiBold,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    marginBottom: spacing.md,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  imageButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
  },
  imageButtonIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  imageButtonText: {
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  polaroidFrame: {
    backgroundColor: colors.white,
    padding: spacing.md,
    paddingBottom: spacing.xl,
    borderRadius: borderRadius.md,
    ...shadows.lg,
    transform: [{ rotate: '-1deg' }],
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  imagePreview: {
    width: 280,
    height: 210,
  },
  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
    mixBlendMode: 'overlay',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
  },
  polaroidCaption: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  tapToChange: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray400,
    fontStyle: 'italic',
  },
  filterContainer: {
    marginTop: spacing.xl,
    width: '100%',
  },
  filterLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.sm,
  },
  filterScroll: {
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  filterOption: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterOptionSelected: {
    borderColor: colors.champagneGold,
    backgroundColor: colors.champagneGold + '10',
  },
  filterPreview: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  filterName: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray600,
  },
  filterNameSelected: {
    fontFamily: typography.fontFamily.bodySemiBold,
    color: colors.champagneGold,
  },
  noteSection: {
    marginBottom: spacing.xl,
  },
  journalPaper: {
    position: 'relative',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
    overflow: 'hidden',
  },
  noteInput: {
    padding: spacing.lg,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    minHeight: 140,
    textAlignVertical: 'top',
    lineHeight: 28,
  },
  journalLines: {
    position: 'absolute',
    top: 44,
    left: spacing.lg,
    right: spacing.lg,
    pointerEvents: 'none',
  },
  journalLine: {
    height: 1,
    backgroundColor: colors.gray200,
    marginBottom: 27,
  },
  characterCount: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  hashtagSection: {
    marginBottom: spacing.xl,
  },
  hashtagInput: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    color: colors.midnightNavy,
    ...shadows.sm,
  },
  submitButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginTop: spacing.md,
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
  quoteContainer: {
    marginTop: spacing['2xl'],
    alignItems: 'center',
  },
  quote: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.gray400,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
