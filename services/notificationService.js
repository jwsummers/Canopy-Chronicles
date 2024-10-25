import * as Notifications from 'expo-notifications';
import { auth, db } from '../config/firebaseConfig';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';

export const scheduleNotifications = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) return;

  const userData = userDoc.data();
  const { notificationsEnabled, wateringInterval, fertilizingInterval } = userData;

  if (!notificationsEnabled) return;

  // Cancel all existing notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Schedule watering notification
  const wateringNotificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Watering Reminder',
      body: 'It\'s time to water your plants!',
    },
    trigger: {
      seconds: parseInt(wateringInterval) * 24 * 60 * 60, // Convert days to seconds
      repeats: true,
    },
  });

  // Schedule fertilizing notification
  const fertilizingNotificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Fertilizing Reminder',
      body: 'It\'s time to fertilize your plants!',
    },
    trigger: {
      seconds: parseInt(fertilizingInterval) * 24 * 60 * 60, // Convert days to seconds
      repeats: true,
    },
  });

  // Save notification IDs to user document
  await setDoc(doc(db, 'users', user.uid), {
    ...userData,
    wateringNotificationId,
    fertilizingNotificationId,
  }, { merge: true });
};

export const createNotification = async (title, message) => {
  const user = auth.currentUser;
  if (!user) return;

  await setDoc(doc(collection(db, 'notifications')), {
    userId: user.uid,
    title,
    message,
    timestamp: new Date(),
  });
};
