import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  View,
} from "react-native";
import { Block, Text } from "galio-framework";
import * as Notifications from "expo-notifications";
import { Button } from "../components";
import { Images, argonTheme } from "../constants";
import * as ImagePicker from "expo-image-picker";
import { auth, db } from "../config/firebaseConfig";
import { updateProfile, updateEmail, updatePassword } from "firebase/auth";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import { useNavigation } from "@react-navigation/native";
import { scheduleNotifications } from "../services/notificationService";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("screen");

const defaultProfilePic = require("../assets/imgs/defaultProfilePic.jpg");

const Profile = () => {
  const navigation = useNavigation();
  const [profilePic, setProfilePic] = useState(null);
  const [username, setUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [wateringInterval, setWateringInterval] = useState("2");
  const [fertilizingInterval, setFertilizingInterval] = useState("7");
  const [isEditing, setIsEditing] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const user = auth.currentUser;
    if (user) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUsername(userData.displayName || user.email.split("@")[0]);
        setProfilePic(userData.photoURL || null);
        setNotificationsEnabled(userData.notificationsEnabled || false);
        setWateringInterval(userData.wateringInterval || "2");
        setFertilizingInterval(userData.fertilizingInterval || "7");
      } else {
        const defaultUsername = user.email.split("@")[0];
        await setDoc(doc(db, "users", user.uid), {
          displayName: defaultUsername,
          photoURL: null,
          notificationsEnabled: false,
          wateringInterval: "2",
          fertilizingInterval: "7",
        });
        setUsername(defaultUsername);
      }
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userRef = doc(db, "users", currentUser.uid);

      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          displayName: username,
          photoURL: profilePic,
          notificationsEnabled: notificationsEnabled,
        });
      } else {
        await updateDoc(userRef, {
          displayName: username,
          photoURL: profilePic,
          notificationsEnabled: notificationsEnabled,
        });
      }

      await updateProfile(currentUser, {
        displayName: username,
        photoURL: profilePic,
      });

      await scheduleNotifications();

      Alert.alert("Success", "Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  const handleChangeEmail = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      await updateEmail(currentUser, newEmail);

      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        email: newEmail,
      });

      Alert.alert("Success", "Email updated successfully!");
      setNewEmail("");
      setShowChangeEmail(false);
    } catch (error) {
      console.error("Error updating email:", error);
      Alert.alert("Error", "Failed to update email. Please try again.");
    }
  };

  const handleChangePassword = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      await updatePassword(currentUser, newPassword);

      Alert.alert("Success", "Password updated successfully!");
      setNewPassword("");
      setShowChangePassword(false);
    } catch (error) {
      console.error("Error updating password:", error);
      Alert.alert("Error", "Failed to update password. Please try again.");
    }
  };

  return (
    <ImageBackground
      source={Images.ProfileBackground}
      style={styles.profileContainer}
      imageStyle={styles.profileBackground}
    >
      <LinearGradient
        colors={["rgba(0, 0, 0, 0.5)", "rgba(0, 0, 0, 0.5)"]}
        style={styles.gradient}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          <Block flex style={styles.profileCard}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={pickImage}
            >
              <Image
                source={profilePic ? { uri: profilePic } : defaultProfilePic}
                style={styles.avatar}
              />
              <Block style={styles.editIconContainer}>
                <Ionicons
                  name="camera"
                  size={20}
                  color={argonTheme.COLORS.WHITE}
                />
              </Block>
            </TouchableOpacity>

            <Block flex style={styles.contentContainer}>
              <Block middle style={styles.nameInfo}>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Username"
                    placeholderTextColor={argonTheme.COLORS.TEXT_DARK}
                    value={username}
                    onChangeText={setUsername}
                  />
                ) : (
                  <Text bold size={28} color={argonTheme.COLORS.TEXT_DARK}>
                    {username || "User Name"}
                  </Text>
                )}
              </Block>

              {isEditing && (
                <Block middle style={styles.buttonContainer}>
                  <Button
                    color={argonTheme.COLORS.PRIMARY}
                    style={styles.button}
                    onPress={handleUpdateProfile}
                  >
                    <Text style={{ color: argonTheme.COLORS.SECONDARY }}>
                      Save Changes
                    </Text>
                  </Button>
                </Block>
              )}

              <Block style={styles.section}>
                <TouchableOpacity
                  onPress={() => setShowChangeEmail(!showChangeEmail)}
                >
                  <Text bold size={16} color={argonTheme.COLORS.PRIMARY}>
                    {showChangeEmail ? "Cancel Email Change" : "Change Email"}
                  </Text>
                </TouchableOpacity>
                {showChangeEmail && (
                  <Block style={styles.inputBlock}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter New Email"
                      placeholderTextColor={argonTheme.COLORS.TEXT_DARK}
                      value={newEmail}
                      onChangeText={setNewEmail}
                    />
                    <Button
                      color={argonTheme.COLORS.SECONDARY}
                      style={styles.button}
                      onPress={handleChangeEmail}
                    >
                      <Text style={{ color: argonTheme.COLORS.SECONDARY }}>
                        Update Email
                      </Text>
                    </Button>
                  </Block>
                )}
              </Block>

              <Block style={styles.section}>
                <TouchableOpacity
                  onPress={() => setShowChangePassword(!showChangePassword)}
                >
                  <Text bold size={16} color={argonTheme.COLORS.PRIMARY}>
                    {showChangePassword
                      ? "Cancel Password Change"
                      : "Change Password"}
                  </Text>
                </TouchableOpacity>
                {showChangePassword && (
                  <Block style={styles.inputBlock}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter New Password"
                      placeholderTextColor={argonTheme.COLORS.TEXT_DARK}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                    />
                    <Button
                      color={argonTheme.COLORS.SECONDARY}
                      style={styles.button}
                      onPress={handleChangePassword}
                    >
                      <Text style={{ color: argonTheme.COLORS.SECONDARY }}>
                        Update Password
                      </Text>
                    </Button>
                  </Block>
                )}
              </Block>

              <Block style={styles.section}>
                <Text bold size={16} color={argonTheme.COLORS.TEXT_DARK}>
                  Notifications
                </Text>
                <Block row middle space="between" style={styles.preferenceRow}>
                  <Text size={14} color={argonTheme.COLORS.TEXT_DARK}>
                    Enable Notifications
                  </Text>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={(value) => {
                      setNotificationsEnabled(value);
                      if (!value) {
                        Notifications.cancelAllScheduledNotificationsAsync();
                      }
                    }}
                    trackColor={{
                      false: argonTheme.COLORS.SWITCH_OFF,
                      true: argonTheme.COLORS.PRIMARY,
                    }}
                    thumbColor={
                      notificationsEnabled
                        ? argonTheme.COLORS.SECONDARY
                        : argonTheme.COLORS.SWITCH_OFF
                    }
                  />
                </Block>
                <Block style={styles.inputBlock}>
                  <Text size={14} color={argonTheme.COLORS.TEXT_DARK}>
                    Watering Interval (days)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      !notificationsEnabled && styles.disabledInput,
                    ]}
                    placeholder="Watering Interval"
                    value={wateringInterval}
                    onChangeText={setWateringInterval}
                    editable={notificationsEnabled}
                  />
                </Block>
                <Block style={styles.inputBlock}>
                  <Text size={14} color={argonTheme.COLORS.TEXT_DARK}>
                    Fertilizing Interval (days)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      !notificationsEnabled && styles.disabledInput,
                    ]}
                    placeholder="Fertilizing Interval"
                    value={fertilizingInterval}
                    onChangeText={setFertilizingInterval}
                    editable={notificationsEnabled}
                  />
                </Block>
              </Block>

              <Block middle style={styles.buttonContainer}>
                <Button
                  color="transparent"
                  textStyle={{ color: argonTheme.COLORS.PRIMARY }}
                  onPress={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
              </Block>
              <Block middle style={styles.buttonContainer}>
                <Button
                  color={argonTheme.COLORS.INFO}
                  style={styles.button}
                  onPress={() =>
                    Alert.alert(
                      "Coming Soon",
                      "Data export feature is coming soon!"
                    )
                  }
                >
                  <Text style={{ color: argonTheme.COLORS.SECONDARY }}>
                    Export Data
                  </Text>
                </Button>
              </Block>
            </Block>
          </Block>
        </ScrollView>
      </LinearGradient>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  profileContainer: {
    width: width,
    height: height,
    padding: 0,
    zIndex: 1,
  },
  profileBackground: {
    width: width,
    height: height,
  },
  gradient: {
    flex: 1,
    padding: 20,
  },
  scrollView: {
    width: width,
    marginTop: "5%",
  },
  profileCard: {
    width: "90%", // Adjust width to 90% of the screen for centering
    alignSelf: "center", // Center the container on the screen
    padding: 20,
    marginTop: 40,
    borderRadius: 15, // Ensure all edges are rounded
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    shadowColor: argonTheme.COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    shadowOpacity: 0.3,
    zIndex: 2,
  },
  avatarContainer: {
    position: "relative",
    marginTop: -60,
    alignSelf: "center",
    backgroundColor: argonTheme.COLORS.BACKGROUND,
    borderRadius: 80,
    padding: 5,
    shadowColor: argonTheme.COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    shadowOpacity: 0.2,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: argonTheme.COLORS.WHITE,
  },
  editIconContainer: {
    position: "absolute",
    right: 5,
    bottom: 5,
    backgroundColor: argonTheme.COLORS.PRIMARY,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  nameInfo: {
    marginTop: 25,
    marginBottom: 10,
  },
  section: {
    marginVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: argonTheme.COLORS.BACKGROUND,
    padding: 10,
    shadowColor: argonTheme.COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    shadowOpacity: 0.2,
  },
  inputBlock: {
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: argonTheme.COLORS.BORDER,
    borderRadius: 8,
    backgroundColor: argonTheme.COLORS.WHITE,
    height: 44,
    paddingHorizontal: 15,
    marginVertical: 10,
  },
  preferenceRow: {
    marginTop: 10,
  },
  buttonContainer: {
    marginVertical: 10,
  },
  button: {
    width: "100%",
    height: 44,
    borderRadius: 8,
  },
  disabledInput: {
    backgroundColor: "#f0f0f0",
    color: "#ccc",
  },
});

export default Profile;
