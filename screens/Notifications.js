import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Dimensions, Alert } from 'react-native';
import { Block, Text, Button } from 'galio-framework';
import { Ionicons } from '@expo/vector-icons';
import { argonTheme } from '../constants';
import Header from '../components/Header';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../config/firebaseConfig';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

const { width } = Dimensions.get('screen');

const Notifications = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const notificationsRef = collection(db, 'notifications');
      const q = query(notificationsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);

      const fetchedNotifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to fetch notifications. Please try again.');
    }
  };

  const clearNotifications = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const notificationsRef = collection(db, 'notifications');
      const q = query(notificationsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);

      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      setNotifications([]);
      Alert.alert('Success', 'All notifications have been cleared.');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      Alert.alert('Error', 'Failed to clear notifications. Please try again.');
    }
  };

  return (
    <Block flex style={styles.container}>
      <Header
        title="Notifications"
        navigation={navigation}
        back
        black
        iconColor={argonTheme.COLORS.ICON}
      />

      <ScrollView contentContainerStyle={styles.scrollView}>
        {notifications.length === 0 ? (
          <View style={styles.noNotificationsContainer}>
            <Ionicons name="notifications-off-outline" size={50} color={argonTheme.COLORS.MUTED} />
            <Text style={styles.noNotificationsText}>No Notifications</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <View key={notification.id} style={styles.notificationCard}>
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationTimestamp}>{new Date(notification.timestamp.toDate()).toLocaleString()}</Text>
              </View>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {notifications.length > 0 && (
        <Button
          color={argonTheme.COLORS.ERROR}
          style={styles.clearButton}
          onPress={clearNotifications}
        >
          Clear All Notifications
        </Button>
      )}
    </Block>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: argonTheme.COLORS.BACKGROUND,
  },
  scrollView: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  noNotificationsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  noNotificationsText: {
    marginTop: 10,
    fontSize: 18,
    color: argonTheme.COLORS.MUTED,
  },
  notificationCard: {
    backgroundColor: argonTheme.COLORS.WHITE,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: argonTheme.COLORS.PRIMARY,
  },
  notificationTimestamp: {
    fontSize: 12,
    color: argonTheme.COLORS.MUTED,
  },
  notificationMessage: {
    fontSize: 14,
    color: argonTheme.COLORS.TEXT,
  },
  clearButton: {
    margin: 16,
  },
});

export default Notifications;
