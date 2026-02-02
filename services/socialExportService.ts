import { Share, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { PermissionSlip } from '@/types/database';

export interface ShareOptions {
  imageUri?: string;
  message: string;
  title?: string;
}

// Generate a text-based share message for permission slips
export function generatePermissionSlipShareMessage(
  statement: string,
  signedDate: string,
  userName?: string
): string {
  const dateStr = new Date(signedDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return `My Permission Slip

"${statement}"

Signed: ${userName || 'Bold Dreamer'}
Date: ${dateStr}

#TheBoldMove #PermissionGranted #SelfCompassion`;
}

// Share content (text or image)
export async function shareContent(options: ShareOptions): Promise<boolean> {
  try {
    if (options.imageUri && Platform.OS === 'ios') {
      // iOS: Use expo-sharing for image
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(options.imageUri, {
          mimeType: 'image/png',
          dialogTitle: options.title || 'Share',
          UTI: 'public.png',
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return true;
      }
    }

    // Fallback to native share (text-based)
    const result = await Share.share({
      message: options.message,
      title: options.title,
    });

    if (result.action === Share.sharedAction) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to share:', error);
    return false;
  }
}

// Save image to device gallery
export async function saveToGallery(imageUri: string): Promise<boolean> {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission to access media library was denied');
    }

    await MediaLibrary.saveToLibraryAsync(imageUri);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return true;
  } catch (error) {
    console.error('Failed to save to gallery:', error);
    return false;
  }
}

// Generate premium-styled share caption for social media
export function generateSocialCaption(
  type: 'permission_slip' | 'milestone' | 'proof',
  content: {
    statement?: string;
    milestone?: string;
    note?: string;
    hashtags?: string[];
  }
): string {
  const baseHashtags = ['#TheBoldMove', '#BoldMoves'];

  switch (type) {
    case 'permission_slip':
      return `I gave myself permission today.

"${content.statement}"

Sometimes the most powerful step is simply saying YES to yourself.

${[...baseHashtags, '#PermissionGranted', '#SelfCompassion'].join(' ')}`;

    case 'milestone':
      return `Milestone unlocked: ${content.milestone}

Every step forward is a victory. Celebrating progress, not perfection.

${[...baseHashtags, '#Progress', '#CelebratingWins'].join(' ')}`;

    case 'proof':
      return `${content.note || 'Another bold move completed!'}

${content.hashtags?.map((t) => `#${t}`).join(' ') || ''}

${baseHashtags.join(' ')}`;

    default:
      return `Taking bold action, one step at a time.\n\n${baseHashtags.join(' ')}`;
  }
}

// Share permission slip specifically
export async function sharePermissionSlip(
  slip: PermissionSlip,
  imageUri?: string,
  userName?: string
): Promise<boolean> {
  const message = generatePermissionSlipShareMessage(
    slip.permission_statement,
    slip.signed_at || new Date().toISOString(),
    userName
  );

  return shareContent({
    imageUri,
    message,
    title: 'My Permission Slip',
  });
}

// Check if sharing is available
export async function isSharingAvailable(): Promise<boolean> {
  return Sharing.isAvailableAsync();
}

// Copy text to clipboard (requires expo-clipboard)
export function generateCopyableText(
  type: 'permission_slip' | 'quote',
  content: string
): string {
  switch (type) {
    case 'permission_slip':
      return `"${content}"\n\n— Signed on ${new Date().toLocaleDateString()}`;
    case 'quote':
      return `"${content}"\n\n— The Bold Move`;
    default:
      return content;
  }
}
