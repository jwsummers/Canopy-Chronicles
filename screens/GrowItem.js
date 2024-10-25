import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Block, Text, Button } from "galio-framework";
import { argonTheme } from "../constants";
import { useRoute, useNavigation } from "@react-navigation/native";
import { db, storage, auth } from "../config/firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import Header from "../components/Header";
import * as ImageManipulator from "expo-image-manipulator";

const GrowItem = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { growId, growName } = route.params;

  const [growDetails, setGrowDetails] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [eventType, setEventType] = useState("Watered");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showStagePicker, setShowStagePicker] = useState(false);
  const [showEventTypePicker, setShowEventTypePicker] = useState(false);
  const [image, setImage] = useState(null);
  const [notes, setNotes] = useState([]);
  const [images, setImages] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [imageDescription, setImageDescription] = useState("");
  const [activities, setActivities] = useState([]); // For combined feed of events, notes, and images

  useEffect(() => {
    fetchGrowDetails();
    fetchActivities();
    navigation.setOptions({
      onDelete: handleDeleteGrow,
    });
  }, [growId]);

  const fetchGrowDetails = async () => {
    try {
      const growRef = doc(db, "grows", growId);
      const growSnap = await getDoc(growRef);
      if (growSnap.exists()) {
        setGrowDetails(growSnap.data());
      }
    } catch (error) {
      console.error("Error fetching grow details:", error);
    }
  };

  const fetchActivities = async () => {
    try {
      const notesSnapshot = await getDocs(
        query(collection(db, "notes"), where("growId", "==", growId))
      );
      const imagesSnapshot = await getDocs(
        query(collection(db, "images"), where("growId", "==", growId))
      );
      const eventsSnapshot = await getDocs(
        query(collection(db, "events"), where("growId", "==", growId))
      );

      const notes = notesSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        type: "note",
      }));
      const images = imagesSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        type: "image",
      }));
      const events = eventsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        type: "event",
      }));

      const combinedActivities = [...notes, ...images, ...events].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      setActivities(combinedActivities);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri); // Set the URI of the selected image
      } else {
        console.log("Image picking was canceled or failed.");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick an image. Please try again.");
    }
  };

  const uploadImage = async (uri) => {
    console.log("Starting image upload with URI:", uri);
    try {
      const response = await fetch(uri); // Fetch the image from the local URI
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const blob = await response.blob(); // Convert image to blob for upload
      const filename = `${growId}_${Date.now()}.jpg`; // Generate a filename
      const storageRef = ref(storage, `growImages/${filename}`); // Firebase storage ref

      console.log("Uploading image to Firebase storage...");
      await uploadBytes(storageRef, blob); // Upload the image blob
      const downloadURL = await getDownloadURL(storageRef); // Get download URL
      console.log("Image uploaded successfully, URL:", downloadURL);
      return downloadURL; // Return the image download URL
    } catch (error) {
      console.error("Error in uploadImage:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
      return null;
    }
  };

  const handleAddEvent = async () => {
    const eventNote = noteText.trim().length > 0 ? noteText : "Event Added";

    try {
      const newEvent = {
        growId,
        description: eventType,
        note: eventNote,
        date: selectedDate.toISOString(),
        userId: auth.currentUser.uid,
      };
      await addDoc(collection(db, "events"), newEvent);
      await logActivity("add_event", { eventName: eventType, eventNote });

      setEventType("Watered");
      setNoteText("");
      setShowDatePicker(false);
      Alert.alert("Event Added", "New event added to the grow!");
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  const handleAddImage = async () => {
    if (!image) {
      Alert.alert("Error", "Please choose an image.");
      return;
    }

    try {
      const resizedUri = await resizeAndCompressImage(image);
      const imageUrl = await uploadImage(resizedUri);

      if (imageUrl) {
        const newImage = {
          id: Date.now().toString(),
          growId,
          imageUrl,
          description: imageDescription || "Event Added", // Use imageDescription
          timestamp: new Date().toISOString(),
          userId: auth.currentUser.uid,
        };

        const docRef = await addDoc(collection(db, "images"), newImage);
        setImages((prevImages) => [
          ...prevImages,
          { id: docRef.id, ...newImage },
        ]);
        await logActivity("add_image", { description: imageDescription });

        Alert.alert("Success", "Image added to the grow!");

        // Reset image and description
        setImage(null);
        setImageDescription(""); // Clear image description after submission
      }
    } catch (error) {
      console.error("Error adding image:", error);
      Alert.alert("Error", "Failed to add image. Please try again.");
    }
  };

  const logActivity = async (type, additionalData = {}) => {
    try {
      const activity = {
        type,
        growId,
        growName,
        userId: auth.currentUser.uid,
        timestamp: new Date().toISOString(),
        ...additionalData,
      };
      await addDoc(collection(db, "activities"), activity);
      console.log("Activity logged:", activity);
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  const handleMarkComplete = async () => {
    try {
      const growRef = doc(db, "grows", growId);
      await updateDoc(growRef, { status: "Complete" });
      await logActivity("finish_grow");
      Alert.alert("Grow marked as complete!", "This grow is now complete.");
      navigation.navigate("Grows");
    } catch (error) {
      console.error("Error marking grow as complete:", error);
    }
  };

  const handleUpdateGrow = async () => {
    try {
      const growRef = doc(db, "grows", growId);
      await updateDoc(growRef, { ...growDetails });
      await logActivity("update_stage", { newStage: growDetails.growStage });
      setIsEditing(false);
      Alert.alert("Success", "Grow details updated!");
    } catch (error) {
      console.error("Error updating grow details:", error);
    }
  };

  const handleDeleteGrow = async () => {
    try {
      const growRef = doc(db, "grows", growId);
      await deleteDoc(growRef);

      if (growDetails.imageUrl) {
        const imageRef = ref(storage, growDetails.imageUrl);
        await deleteObject(imageRef);
      }

      const activity = {
        type: "delete_grow",
        growId,
        growName: growDetails.strainName,
        userId: auth.currentUser.uid,
        timestamp: new Date().toISOString(),
      };
      await addDoc(collection(db, "activities"), activity);

      Alert.alert("Deleted", "The grow has been deleted and activity logged.");
      navigation.navigate("Grows");
    } catch (error) {
      console.error("Error deleting grow or logging activity:", error);
    }
  };

  const resizeAndCompressImage = async (uri) => {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }], // Resize to 1080px width
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      console.log(
        "Image resized and compressed, new size:",
        manipulatedImage.width,
        "x",
        manipulatedImage.height
      );
      return manipulatedImage.uri;
    } catch (error) {
      console.error("Error resizing image:", error);
      return uri; // Return original URI if resize fails
    }
  };

  if (!growDetails) {
    return (
      <Block flex center>
        <Text>Loading...</Text>
      </Block>
    );
  }

  return (
    <Block flex style={styles.screen}>
      <Header
        title={growDetails.strainName}
        navigation={navigation}
        back
        black
        iconColor={argonTheme.COLORS.ICON}
      />

      <ScrollView contentContainerStyle={styles.container}>
        <Block flex style={styles.growDetails}>
          <TouchableOpacity onPress={pickImage} disabled={!isEditing}>
            <Image
              source={{ uri: image || growDetails.imageUrl }}
              defaultSource={require("../assets/imgs/Default-Grow.png")}
              style={styles.growImage}
            />
          </TouchableOpacity>

          {isEditing ? (
            <>
              <TextInput
                style={styles.input}
                value={growDetails.strainName}
                onChangeText={(text) =>
                  setGrowDetails({ ...growDetails, strainName: text })
                }
              />

              <TouchableOpacity
                onPress={() => setShowStagePicker(!showStagePicker)}
                style={styles.dropdownButton}
              >
                <Text style={styles.dropdownText}>{growDetails.growStage}</Text>
                <Ionicons name="chevron-down" size={24} color="black" />
              </TouchableOpacity>

              {showStagePicker && (
                <Picker
                  selectedValue={growDetails.growStage}
                  style={styles.picker}
                  onValueChange={(itemValue) =>
                    setGrowDetails({ ...growDetails, growStage: itemValue })
                  }
                >
                  <Picker.Item label="Germinating" value="Germinating" />
                  <Picker.Item label="Seedling" value="Seedling" />
                  <Picker.Item label="Vegetative" value="Vegetative" />
                  <Picker.Item label="Pre-flowering" value="Pre-flowering" />
                  <Picker.Item label="Flowering" value="Flowering" />
                  <Picker.Item label="Harvesting" value="Harvesting" />
                  <Picker.Item label="Completed" value="Completed" />
                </Picker>
              )}

              <Button onPress={handleUpdateGrow}>Save Changes</Button>
            </>
          ) : (
            <>
              <Text h5>{growDetails.strainName}</Text>
              <Text>Stage: {growDetails.growStage}</Text>
              <Text>
                Start Date: {new Date(growDetails.startDate).toDateString()}
              </Text>
              <Text>{growDetails.isIndoor ? "Indoor" : "Outdoor"}</Text>
            </>
          )}

          <Button
            color={argonTheme.COLORS.SECONDARY}
            onPress={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Cancel Edit" : "Edit Grow"}
          </Button>
        </Block>
        {/* Add Event, Add Image, and Add Note Section */}
        <Block flex style={styles.addEventSection}>
          <Text h5>Add New Event</Text>

          <TouchableOpacity
            onPress={() => setShowEventTypePicker(!showEventTypePicker)}
            style={styles.dropdownButton}
          >
            <Text style={styles.dropdownText}>{eventType}</Text>
            <Ionicons name="chevron-down" size={24} color="black" />
          </TouchableOpacity>

          {showEventTypePicker && (
            <Picker
              selectedValue={eventType}
              style={styles.picker}
              onValueChange={(itemValue) => setEventType(itemValue)}
            >
              <Picker.Item label="Watered" value="Watered" />
              <Picker.Item label="Fertilized" value="Fertilized" />
              <Picker.Item label="Trimmed" value="Trimmed" />
              <Picker.Item label="Trained" value="Trained" />
              <Picker.Item label="Repot/Relocate" value="Repot/Relocate" />
              <Picker.Item label="Treat" value="Treat" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          )}

          {/* Description for event */}
          <TextInput
            style={styles.input}
            placeholder="Enter event description (optional)"
            value={noteText}
            onChangeText={setNoteText}
            maxLength={30}
            multiline
          />

          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.datePickerButton}
          >
            <Text>{selectedDate.toDateString()}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                const currentDate = date || selectedDate;
                setSelectedDate(currentDate);
                setShowDatePicker(false);
              }}
            />
          )}

          <Button onPress={handleAddEvent}>Add Event</Button>

          <Text h5>Add Image</Text>

          {/* Camera icon to choose the image */}
          <TouchableOpacity onPress={pickImage} style={styles.iconButton}>
            <Ionicons
              name="camera-outline"
              size={32}
              color={argonTheme.COLORS.PRIMARY}
            />
          </TouchableOpacity>

          {/* Display selected image if any */}
          {image && (
            <Image source={{ uri: image }} style={styles.selectedImage} />
          )}

          {/* Description for the image */}
          <TextInput
            style={styles.input}
            placeholder="Enter image description (optional)"
            value={imageDescription} // Use imageDescription state
            onChangeText={setImageDescription} // Update imageDescription state
            maxLength={30}
            multiline
          />

          {/* Button to add (upload) the image */}
          <Button onPress={handleAddImage} style={styles.button}>
            Add Image
          </Button>
        </Block>

        <Block flex style={styles.completeSection}>
          <Button
            color={
              growDetails.status === "Active"
                ? argonTheme.COLORS.SUCCESS
                : argonTheme.COLORS.WARNING
            }
            onPress={handleMarkComplete}
          >
            {growDetails.status === "Active" ? "Mark as Complete" : "Completed"}
          </Button>

          <Button color={argonTheme.COLORS.WARNING} onPress={handleDeleteGrow}>
            Delete Grow
          </Button>
        </Block>

        <Block flex style={styles.feedSection}>
          <Text h5>Activity Feed</Text>
          <ScrollView style={styles.feedContent}>
            {activities.map((activity) => (
              <Block key={activity.id} style={styles.feedItem}>
                {/* Handle different activity types: event, note, image */}
                {activity.type === "note" && (
                  <Block style={styles.noteItem}>
                    <Text style={styles.activityText}>
                      Note: {activity.text}
                    </Text>
                  </Block>
                )}

                {activity.type === "event" && (
                  <Block style={styles.eventItem}>
                    <Text style={styles.activityText}>
                      Event: {activity.description}
                    </Text>
                    <Text style={styles.timestamp}>
                      Date: {new Date(activity.date).toLocaleString()}
                    </Text>
                  </Block>
                )}

                {activity.type === "image" && (
                  <Block style={styles.imageItem}>
                    <Image
                      source={{ uri: activity.imageUrl }}
                      style={styles.thumbnailImage}
                    />
                    <Text style={styles.activityText}>
                      Image Description: {activity.description}
                    </Text>
                  </Block>
                )}

                <Text style={styles.timestamp}>
                  {new Date(activity.timestamp).toLocaleString()}
                </Text>
              </Block>
            ))}
          </ScrollView>
        </Block>
      </ScrollView>
    </Block>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: argonTheme.COLORS.BACKGROUND,
  },
  container: {
    padding: 20,
  },
  growDetails: {
    marginBottom: 20,
  },
  growImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: argonTheme.COLORS.BORDER,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "white",
  },
  addEventSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: argonTheme.COLORS.BORDER,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  completeSection: {
    marginTop: 20,
    flexDirection: "row",
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: argonTheme.COLORS.BORDER,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "white",
  },
  dropdownText: {
    fontSize: 16,
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  selectedImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  picker: {
    borderWidth: 1,
    borderColor: argonTheme.COLORS.BORDER,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  button: {
    marginVertical: 10,
  },
  notesAndImagesSection: {
    marginTop: 20,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: argonTheme.COLORS.BORDER,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: argonTheme.COLORS.PRIMARY,
  },
  tabText: {
    fontSize: 16,
    color: argonTheme.COLORS.PRIMARY,
  },
  tabContent: {
    flex: 1,
  },
  noteItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: argonTheme.COLORS.BORDER,
  },
  imageItem: {
    padding: 10,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: argonTheme.COLORS.BORDER,
  },
  thumbnailImage: {
    width: 200,
    height: 150,
    resizeMode: "cover",
    borderRadius: 8,
  },
  timestamp: {
    fontSize: 12,
    color: argonTheme.COLORS.MUTED,
    marginTop: 5,
  },
  feedSection: {
    marginTop: 20,
    padding: 20,
    backgroundColor: argonTheme.COLORS.BACKGROUND,
  },
  feedContent: {
    paddingBottom: 10,
  },
  feedItem: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: argonTheme.COLORS.WHITE,
    borderRadius: 8,
    shadowColor: argonTheme.COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  activityText: {
    fontSize: 16,
    marginBottom: 5,
    color: argonTheme.COLORS.TEXT_DARK,
  },
  timestamp: {
    fontSize: 12,
    color: argonTheme.COLORS.MUTED,
    marginTop: 5,
  },
  noteItem: {
    borderLeftWidth: 4,
    borderLeftColor: argonTheme.COLORS.PRIMARY,
    paddingLeft: 10,
  },
  eventItem: {
    borderLeftWidth: 4,
    borderLeftColor: argonTheme.COLORS.SUCCESS,
    paddingLeft: 10,
  },
  imageItem: {
    borderLeftWidth: 4,
    borderLeftColor: argonTheme.COLORS.INFO,
    paddingLeft: 10,
    alignItems: "center",
  },
  thumbnailImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
});

export default GrowItem;
