import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { notificationsService } from '../api/notifications.service';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register the device for push notifications and save the token to the backend.
 * Call this once after a successful login.
 */
export const registerPushToken = async () => {
  try {
    // Push notifications only work on physical devices
    if (!Device.isDevice) {
      console.log('[Push] Skipped — running on simulator/emulator');
      return;
    }

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Permission denied by user');
      return;
    }

    // Android requires a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'ChantierPro',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Save token to backend
    await notificationsService.savePushToken(token);

    console.log('[Push] Token registered:', token);
    return token;
  } catch (error) {
    // Never block login flow for push token errors
    console.error('[Push] Failed to register token:', error.message);
  }
};