import { AuthCallbackPage } from '@fastshot/auth';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

export default function Callback() {
  const router = useRouter();
  return (
    <AuthCallbackPage
      supabaseClient={supabase}
      onSuccess={() => router.replace('/journey/processing-path')}
      onError={(error) =>
        router.replace(
          `/journey/create-account?error=${encodeURIComponent(error.message)}`
        )
      }
      loadingText="Completing sign in..."
    />
  );
}
