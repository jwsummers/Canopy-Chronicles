import React, { useState, useEffect } from "react";
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Block } from "galio-framework";
import { AntDesign } from '@expo/vector-icons';
import { auth } from "../config/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { argonTheme } from "../constants";
import { useNavigation } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import { getSavedCredentials } from '../utils/credentialStore';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const CustomButton = ({ onPress, loading, color, icon, children }) => (
  <TouchableOpacity
    style={[styles.customButton, { backgroundColor: color }, loading && styles.disabledButton]}
    onPress={onPress}
    disabled={loading}
  >
    {icon && <View style={styles.iconContainer}>{icon}</View>}
    <Text style={styles.buttonText}>{children}</Text>
  </TouchableOpacity>
);

const Login = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);
    })();
  }, []);

  const handleBiometricAuth = async () => {
    const savedCredentials = await getSavedCredentials();
    if (!savedCredentials) {
      Alert.alert("No saved credentials", "Please log in with your email and password first.");
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Log in with biometrics',
      cancelLabel: 'Cancel',
      disableDeviceFallback: true,
    });

    if (result.success) {
      // Biometric authentication successful, log in with saved credentials
      handleLogin(savedCredentials.email, savedCredentials.password);
    } else {
      Alert.alert("Authentication failed", "Please try again or use your email and password.");
    }
  };

  const handleLogin = async (email = "", password = "") => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("User logged in!");
      navigation.navigate("App", { screen: "Home" });
    } catch (error) {
      console.error("Login failed", error);
      Alert.alert("Login failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[argonTheme.COLORS.PRIMARY, argonTheme.COLORS.SECONDARY]}
      style={styles.container}
    >
      <BlurView intensity={80} style={styles.blurContainer}>
        <Block style={styles.formContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <CustomButton
            onPress={() => handleLogin(email, password)}
            loading={loading}
            color={argonTheme.COLORS.PRIMARY}
          >
            Login
          </CustomButton>
          {isBiometricSupported && (
            <CustomButton
              onPress={handleBiometricAuth}
              color={argonTheme.COLORS.INFO}
              icon={<AntDesign name="scan1" size={20} color="white" />}
            >
              Login with Face ID
            </CustomButton>
          )}
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.signupText}>
              Don't have an account? <Text style={styles.signupLink}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </Block>
      </BlurView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    width: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: argonTheme.COLORS.PRIMARY,
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    height: 44,
    backgroundColor: argonTheme.COLORS.NEUTRAL,
    marginBottom: 20,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: argonTheme.COLORS.TEXT_DARK,
  },
  signupText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    color: argonTheme.COLORS.TEXT_DARK,
  },
  signupLink: {
    color: argonTheme.COLORS.ACCENT,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.7,
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    padding: 12,
    marginVertical: 10,
    width: '100%',
  },
  iconContainer: {
    marginRight: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Login;
