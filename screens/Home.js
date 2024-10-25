import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Dimensions,
  FlatList,
  View,
  ImageBackground,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Block, Text, theme } from "galio-framework";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import Header from "../components/Header";
import ActivityItem from "../components/ActivityItem";
import { argonTheme } from "../constants";
import { db, auth } from "../config/firebaseConfig";
import * as Notifications from "expo-notifications";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("screen");

const Home = () => {
  const navigation = useNavigation();
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasUnseenNotifications, setHasUnseenNotifications] = useState(false);

  const fetchActivities = async () => {
    console.log("Fetching activities...");
    if (!auth.currentUser) {
      console.log("User is not authenticated!");
      return;
    }

    try {
      const q = query(
        collection(db, "activities"),
        where("userId", "==", auth.currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const fetchedActivities = [];

      for (const activityDoc of querySnapshot.docs) {
        const activityData = activityDoc.data();
        const growRef = doc(db, "grows", activityData.growId);
        const growSnap = await getDoc(growRef);

        if (growSnap.exists()) {
          fetchedActivities.push({ id: activityDoc.id, ...activityData });
        }
      }

      fetchedActivities.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      setActivities(fetchedActivities);
      setFilteredActivities(fetchedActivities);
      setLoading(false);
      console.log("Fetched activities: ", fetchedActivities);
    } catch (error) {
      console.error("Error fetching activities:", error.code, error.message);
      setLoading(false);
    }
  };

  const fetchUnseenNotifications = async () => {
    try {
      // Example logic to check for unseen notifications, replace with your actual logic
      const notificationsQuery = query(
        collection(db, "notifications"),
        where("userId", "==", auth.currentUser.uid),
        where("seen", "==", false)
      );

      const querySnapshot = await getDocs(notificationsQuery);
      setHasUnseenNotifications(!querySnapshot.empty);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const registerForNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === "granted") {
      console.log("Notification permissions granted.");
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchActivities();
      fetchUnseenNotifications(); // Fetch unseen notifications on focus
      registerForNotifications();
    }, [])
  );

  useEffect(() => {
    setFilteredActivities(activities);
  }, [activities]);

  const handleSearch = (keyword) => {
    if (!keyword.trim()) {
      setFilteredActivities(activities);
      return;
    }

    const lowercasedKeyword = keyword.toLowerCase().trim();
    const filtered = activities.filter(
      (activity) =>
        activity.growName.toLowerCase().includes(lowercasedKeyword) ||
        activity.type.toLowerCase().includes(lowercasedKeyword) ||
        (activity.eventName &&
          activity.eventName.toLowerCase().includes(lowercasedKeyword))
    );
    setFilteredActivities(filtered);
  };

  const handleActivityPress = (activity) => {
    navigation.navigate("GrowItem", {
      growId: activity.growId,
      growName: activity.growName,
    });
  };

  const handleBellPress = () => {
    // Navigate to the Notifications screen and reset the unseen notifications
    navigation.navigate("Notifications");
    setHasUnseenNotifications(false); // Reset unseen notifications state
  };

  const renderActivity = ({ item }) => (
    <ActivityItem activity={item} onPress={handleActivityPress} />
  );

  return (
    <ImageBackground
      source={require("../assets/imgs/minimal-BG.jpg")}
      style={styles.backgroundImage}
    >
      <Block style={styles.container}>
        <Block style={styles.headerContainer}>
          <Header
            title="Home"
            navigation={navigation}
            options
            search
            onSearch={handleSearch}
          />
        </Block>

        {/* Bell Icon */}
        <TouchableOpacity
          style={styles.bellIconContainer}
          onPress={handleBellPress}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={argonTheme.COLORS.ICON}
          />
          {hasUnseenNotifications && <View style={styles.notificationDot} />}
        </TouchableOpacity>

        <View style={styles.spacer} />

        {loading ? (
          <Block flex center style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={argonTheme.COLORS.NEUTRAL} />
            <Text style={styles.loadingText}>Loading Activities...</Text>
          </Block>
        ) : filteredActivities.length === 0 ? (
          <Block flex center style={styles.noActivitiesContainer}>
            <Text style={styles.noActivitiesText}>
              No matching activities found
            </Text>
          </Block>
        ) : (
          <FlatList
            data={filteredActivities}
            renderItem={renderActivity}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.activityList}
          />
        )}
      </Block>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  container: {
    flex: 1,
    width: "100%",
  },
  headerContainer: {
    width: "100%",
    zIndex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 20,
  },
  home: {
    width: width,
    backgroundColor: argonTheme.COLORS.BACKGROUND,
  },
  spacer: {
    height: theme.SIZES.BASE * 2,
  },
  activityList: {
    paddingHorizontal: theme.SIZES.BASE,
    paddingBottom: theme.SIZES.BASE,
  },
  noActivitiesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noActivitiesText: {
    fontSize: 18,
    color: argonTheme.COLORS.MUTED,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: theme.SIZES.BASE,
    fontSize: 16,
    color: argonTheme.COLORS.NEUTRAL,
  },
  bellIconContainer: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 2,
  },
  notificationDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "red",
  },
});

export default Home;
