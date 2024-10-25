import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { Block, Text, theme } from "galio-framework";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import Header from "../components/Header";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { argonTheme } from "../constants";
import { storage, db, auth } from "../config/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { addDoc, collection, getDoc, doc } from "firebase/firestore";
import * as Notifications from "expo-notifications";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("screen");

const defaultImage = require("../assets/imgs/Default-Grow.png");

const AddGrow = () => {
  const navigation = useNavigation();
  const [strainName, setStrainName] = useState("");
  const [growStage, setGrowStage] = useState("Germinating");
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isIndoor, setIsIndoor] = useState(true);
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!auth.currentUser) {
      console.log("User is not authenticated!");
      return null;
    }

    if (image) {
      const imageName = `${strainName}_${Date.now()}`;
      const userId = auth.currentUser.uid;
      const storageRef = ref(storage, `growImages/${userId}/${imageName}`);
      const img = await fetch(image);
      const bytes = await img.blob();

      setUploading(true);
      try {
        await uploadBytes(storageRef, bytes);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
      } catch (error) {
        console.log("Image upload failed:", error);
        return null;
      } finally {
        setUploading(false);
      }
    }
    return null;
  };

  const scheduleNotifications = async (growId) => {
    const user = auth.currentUser;
    if (!user) return;

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();

    const wateringInterval = parseInt(userData.wateringInterval) || 2;
    const fertilizingInterval = parseInt(userData.fertilizingInterval) || 7;

    Notifications.scheduleNotificationAsync({
      content: {
        title: "Watering Reminder",
        body: `It's time to water your grow: ${strainName}`,
        data: { growId },
      },
      trigger: { seconds: wateringInterval * 24 * 60 * 60, repeats: true },
    });

    Notifications.scheduleNotificationAsync({
      content: {
        title: "Fertilizing Reminder",
        body: `It's time to fertilize your grow: ${strainName}`,
        data: { growId },
      },
      trigger: { seconds: fertilizingInterval * 24 * 60 * 60, repeats: true },
    });
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) {
      console.log("User is not authenticated!");
      return;
    }

    let imageUrl = image
      ? await uploadImage()
      : Image.resolveAssetSource(defaultImage).uri;

    const newGrow = {
      strainName,
      growStage,
      startDate: startDate.toISOString(),
      isIndoor,
      imageUrl,
      status: "Active",
      userId: auth.currentUser.uid,
    };

    try {
      const growRef = await addDoc(collection(db, "grows"), newGrow);
      console.log("New grow saved to Firestore:", growRef.id, newGrow);

      const activity = {
        type: "add_grow",
        growId: growRef.id,
        growName: strainName,
        userId: auth.currentUser.uid,
        timestamp: new Date().toISOString(),
      };

      await addDoc(collection(db, "activities"), activity);
      console.log("Activity logged to Firestore:", activity);

      await scheduleNotifications(growRef.id);
      navigation.navigate("Home");
    } catch (error) {
      console.error(
        "Error saving grow or logging activity to Firestore:",
        error.code,
        error.message
      );
    }
  };

  return (
    <LinearGradient
      colors={[argonTheme.COLORS.PRIMARY, argonTheme.COLORS.SECONDARY]}
      style={styles.gradient}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Header
          title="Back"
          navigation={navigation}
          back
          black
          iconColor={argonTheme.COLORS.TEXT_DARK}
        />
        <Block flex style={styles.formContainer}>
          <Block style={styles.inputBlock}>
            <Text style={styles.label}>Strain Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter strain name"
              placeholderTextColor={argonTheme.COLORS.TEXT_DARK}
              value={strainName}
              onChangeText={setStrainName}
            />
          </Block>

          <Block style={styles.inputBlock}>
            <Text style={styles.label}>Grow Stage</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowStageModal(!showStageModal)}
            >
              <Text style={styles.dropdownButtonText}>{growStage}</Text>
              <Ionicons
                name="chevron-down"
                size={24}
                color={argonTheme.COLORS.TEXT_DARK}
              />
            </TouchableOpacity>
            {showStageModal && (
              <Picker
                selectedValue={growStage}
                onValueChange={(itemValue) => {
                  setGrowStage(itemValue);
                  setShowStageModal(false);
                }}
              >
                <Picker.Item label="Germinating" value="Germinating" />
                <Picker.Item label="Seedling" value="Seedling" />
                <Picker.Item label="Vegetative" value="Vegetative" />
                <Picker.Item label="Pre-flowering" value="Pre-flowering" />
                <Picker.Item label="Flowering" value="Flowering" />
                <Picker.Item label="Harvesting" value="Harvesting" />
              </Picker>
            )}
          </Block>

          <Block style={styles.inputBlock}>
            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
            >
              <Text style={styles.dateText}>{startDate.toDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  const currentDate = selectedDate || startDate;
                  setStartDate(currentDate);
                  setShowDatePicker(false);
                }}
              />
            )}
          </Block>

          <Block style={styles.inputBlock}>
            <Text style={styles.label}>Grow Type</Text>
            <View style={styles.growTypeContainer}>
              <TouchableOpacity
                onPress={() => setIsIndoor(true)}
                style={[
                  styles.growTypeButton,
                  isIndoor && styles.selectedGrowType,
                ]}
              >
                <Text
                  style={[
                    styles.growTypeText,
                    isIndoor && styles.selectedGrowTypeText,
                  ]}
                >
                  Indoor
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsIndoor(false)}
                style={[
                  styles.growTypeButton,
                  !isIndoor && styles.selectedGrowType,
                ]}
              >
                <Text
                  style={[
                    styles.growTypeText,
                    !isIndoor && styles.selectedGrowTypeText,
                  ]}
                >
                  Outdoor
                </Text>
              </TouchableOpacity>
            </View>
          </Block>

          <Block style={styles.inputBlock}>
            <Text style={styles.label}>Starting Picture (optional)</Text>
            <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
              <Text style={styles.imageButtonText}>Pick an Image</Text>
            </TouchableOpacity>
            {image && (
              <Image source={{ uri: image }} style={styles.imagePreview} />
            )}
          </Block>

          <TouchableOpacity onPress={handleSubmit} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add Grow</Text>
          </TouchableOpacity>
        </Block>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    paddingBottom: theme.SIZES.BASE * 2,
  },
  formContainer: {
    width: width * 0.9,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 10,
    padding: 20,
    marginHorizontal: width * 0.05,
    marginTop: theme.SIZES.BASE,
    shadowColor: argonTheme.COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    shadowOpacity: 0.1,
    elevation: 3,
  },
  inputBlock: {
    marginBottom: theme.SIZES.BASE,
  },
  label: {
    color: argonTheme.COLORS.TEXT_DARK,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: theme.SIZES.BASE / 2,
  },
  input: {
    height: 44,
    backgroundColor: argonTheme.COLORS.NEUTRAL,
    borderColor: argonTheme.COLORS.BORDER,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: theme.SIZES.BASE,
    fontSize: 16,
    color: argonTheme.COLORS.TEXT_DARK,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 44,
    backgroundColor: argonTheme.COLORS.NEUTRAL,
    borderColor: argonTheme.COLORS.BORDER,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: theme.SIZES.BASE,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: argonTheme.COLORS.TEXT_DARK,
  },
  dateButton: {
    height: 44,
    backgroundColor: argonTheme.COLORS.NEUTRAL,
    borderColor: argonTheme.COLORS.BORDER,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: theme.SIZES.BASE,
  },
  dateText: {
    color: argonTheme.COLORS.TEXT_DARK,
    fontSize: 16,
  },
  growTypeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  growTypeButton: {
    flex: 1,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: argonTheme.COLORS.BORDER,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  selectedGrowType: {
    backgroundColor: argonTheme.COLORS.PRIMARY,
    borderColor: argonTheme.COLORS.PRIMARY,
  },
  growTypeText: {
    color: argonTheme.COLORS.TEXT_DARK,
    fontSize: 16,
  },
  selectedGrowTypeText: {
    color: argonTheme.COLORS.TEXT_LIGHT,
  },
  imageButton: {
    height: 44,
    backgroundColor: argonTheme.COLORS.SECONDARY,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  imageButtonText: {
    color: argonTheme.COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: "500",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    marginTop: theme.SIZES.BASE,
    borderRadius: 8,
  },
  addButton: {
    width: "100%",
    height: 44,
    backgroundColor: argonTheme.COLORS.PRIMARY,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.SIZES.BASE,
  },
  addButtonText: {
    color: argonTheme.COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: "500",
  },
});

export default AddGrow;
