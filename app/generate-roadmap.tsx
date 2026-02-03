import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WeavingAnimation } from '@/components/roadmap/WeavingAnimation';
import { useRoadmap } from '@/hooks/useRoadmap';
import { useSnackbar } from '@/contexts/SnackbarContext';

export default function GenerateRoadmapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dream?: string; rootMotivation?: string }>();
  const { createRoadmap } = useRoadmap();
  const { showError } = useSnackbar();
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    // Only run once
    if (hasStarted) return;

    const generateAndNavigate = async () => {
      try {
        const dream = params.dream;
        const rootMotivation = params.rootMotivation;

        if (!dream) {
          throw new Error('No dream provided');
        }

        setHasStarted(true);

        // Generate the roadmap
        const roadmap = await createRoadmap(dream, rootMotivation);

        if (!roadmap) {
          throw new Error('Failed to generate roadmap');
        }

        // Success! Navigate to roadmap screen
        // Small delay to let the user appreciate the animation
        setTimeout(() => {
          router.replace('/roadmap');
        }, 1500);
      } catch (error) {
        console.error('Roadmap generation failed:', error);
        showError('Unable to create your roadmap. Please try again.', {
          duration: 4000,
        });

        // Navigate to home after error
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 2000);
      }
    };

    generateAndNavigate();
  }, [hasStarted, params.dream, params.rootMotivation, createRoadmap, router, showError]);

  return (
    <View style={styles.container}>
      <WeavingAnimation
        message="Crafting your Golden Path..."
        submessage="Weaving your personalized roadmap"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
