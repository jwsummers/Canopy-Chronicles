import { Block, Text, theme } from "galio-framework";
import argonTheme from "../constants/Theme";
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { DrawerItem as DrawerCustomItem } from "../components";
import Images from "../constants/Images";
import React, { useEffect, useState } from "react";
import { auth, db } from "../config/firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, getDoc } from 'firebase/firestore';

function CustomDrawerContent({
  drawerPosition,
  navigation,
  profile,
  focused,
  state,
  ...rest
}) {
  const [username, setUsername] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  
  const screens = ["Home", "Profile", "Grows"];

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUsername(userData.displayName || user.email.split('@')[0]);
          setProfilePic(userData.photoURL || null);
        }
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Onboarding' }],
      });
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <Block
  style={styles.container}
  forceInset={{ top: "always", horizontal: "never" }}
>
  {/* Logo in the top-left */}
  <Block style={styles.logoContainer}>
    <Image style={styles.logo} source={Images.Logo} />
  </Block>
  
  {/* User Info Header */}
  <Block flex={0.2} style={styles.profileHeader}>
    <View style={styles.profileContainer}>
      <Image
        style={styles.profilePic}
        source={profilePic ? { uri: profilePic } : Images.ProfilePlaceholder}
      />
      <Text style={styles.username}>{username}</Text>
    </View>
  </Block>
  
  {/* Navigation Items */}
  <Block flex style={{ paddingLeft: 8, paddingRight: 14 }}>
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {screens.map((item, index) => {
        return (
          <DrawerCustomItem
            title={item}
            key={index}
            navigation={navigation}
            focused={state.index === index}
          />
        );
      })}
      <Block
        flex
        style={{ marginTop: 24, marginVertical: 8, paddingHorizontal: 8 }}
      >
        <Block
          style={{
            borderColor: "rgba(0,0,0,0.2)",
            width: "100%",
            borderWidth: StyleSheet.hairlineWidth,
          }}
        />
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </Block>
    </ScrollView>
  </Block>
  
  {/* Footer */}
  <View style={styles.footer}>
    <Text style={styles.copyrightText}>© 2024 Canopy Chronicles</Text>
  </View>
</Block>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoContainer: {
    paddingHorizontal: 28,
    paddingTop: theme.SIZES.BASE * 2,
    paddingBottom: theme.SIZES.BASE,
    alignItems: "flex-start",
  },
  logo: {
    width: 100, 
    height: 100,
  },
  profileHeader: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: argonTheme.COLORS.PRIMARY,
    paddingVertical: theme.SIZES.BASE,
    borderRadius: 20,
    marginBottom: 20,
    width: '90%',
    alignSelf: 'center',
  },
  profileContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  profilePic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: theme.COLORS.WHITE,
  },
  username: {
    marginTop: 10,
    fontSize: 18,
    color: theme.COLORS.WHITE,
    fontWeight: "bold",
  },
  logoutButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  logoutText: {
    fontSize: 16,
    color: theme.COLORS.PRIMARY,
  },
  footer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  copyrightText: {
    fontSize: 12,
    color: "rgba(0,0,0,0.5)",
  },
});

export default CustomDrawerContent;

