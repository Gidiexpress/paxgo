import { AuthCallbackPage } from '@fastshot/auth';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

export default function Callback() {
  const router = useRouter();

  const handleSuccess = async () => {
    console.log('🎉 OAuth callback successful');

    // Small delay to ensure database trigger has completed
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('✅ Navigating to processing-path');
    router.replace('/journey/processing-path');
  };

  return (
    <AuthCallbackPage
      supabaseClient={supabase}
      onSuccess={handleSuccess}
      onError={(error) => {
        console.error('❌ OAuth callback error:', error);
        router.replace(
          `/journey/create-account?error=${encodeURIComponent(error.message)}`
        );
      }}
      loadingText="Completing sign in..."
    />
  );
}
