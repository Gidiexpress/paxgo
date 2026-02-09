import React from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
// import { useRouter } from 'expo-router'; // Unused in this simplified version
// import { LinearGradient } from 'expo-linear-gradient'; // Removed as we rely on child screen background, or re-add if needed
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import FiveWhysChatScreen from '../journey/five-whys-chat';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();

  // We are delegating the entire home screen to the Five Whys / Core Chat flow
  // The "Socratic" chat and "Mindset Coach" header are removed as requested.
  return (
    <View style={styles.container}>
      {/* Keyboard behavior is handled inside or wrapped here if strictly needed. 
           Since FiveWhysChatScreen has its own internal structure (and we removed its internal KAV to rely on parent, or we re-add it here).
           
           PREVIOUSLY: index.tsx had KAV. 
           CURRENTLY: We keep the KAV here to wrap the child screen.
       */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0} // Adjusted as header is gone
      >
        <FiveWhysChatScreen />
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
});
