import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Alert,
  Switch,
  TouchableOpacity,
} from "react-native";
import { Block, Text, theme } from "galio-framework";
import { Button, Icon, Input } from "../components";
import { Images, argonTheme } from "../constants";
import { auth } from "../config/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import * as LocalAuthentication from "expo-local-authentication";
import { saveCredentials } from "../utils/credentialStore";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("screen");

const Register = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [enableBiometrics, setEnableBiometrics] = useState(false);

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);
    })();
  }, []);

  const handleRegister = async () => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("Account created!");

      if (enableBiometrics) {
        await saveCredentials(email, password);
      }

      navigation.navigate("App", { screen: "Home" });
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        Alert.alert(
          "Registration failed",
          "The email address is already in use. Please use a different email or log in."
        );
      } else {
        console.error("Registration failed", error);
        Alert.alert("Registration failed", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[argonTheme.COLORS.PRIMARY, argonTheme.COLORS.SECONDARY]}
      style={styles.gradient}
    >
      <Block flex middle>
        <StatusBar hidden />
        <Block safe flex middle>
          <Block style={styles.registerContainer}>
            <Block flex>
              <Block flex={0.17} middle>
                <Text color="#8898AA" size={12}>
                  Sign up with email
                </Text>
              </Block>
              <Block flex center>
                <KeyboardAvoidingView
                  style={{ flex: 1 }}
                  behavior="padding"
                  enabled
                >
                  <Block width={width * 0.8} style={{ marginBottom: 15 }}>
                    <Input
                      borderless
                      placeholder="Name"
                      value={name}
                      onChangeText={setName}
                      iconContent={
                        <Icon
                          size={16}
                          color={argonTheme.COLORS.ICON}
                          name="person"
                          family="Ionicon"
                          style={styles.inputIcons}
                        />
                      }
                    />
                  </Block>
                  <Block width={width * 0.8} style={{ marginBottom: 15 }}>
                    <Input
                      borderless
                      placeholder="Email"
                      value={email}
                      onChangeText={setEmail}
                      iconContent={
                        <Icon
                          size={16}
                          color={argonTheme.COLORS.ICON}
                          name="mail"
                          family="Ionicon"
                          style={styles.inputIcons}
                        />
                      }
                    />
                  </Block>
                  <Block width={width * 0.8}>
                    <Input
                      password
                      borderless
                      placeholder="Password"
                      value={password}
                      onChangeText={setPassword}
                      iconContent={
                        <Icon
                          size={16}
                          color={argonTheme.COLORS.ICON}
                          name="lock-closed"
                          family="Ionicon"
                          style={styles.inputIcons}
                        />
                      }
                    />
                    <Block row style={styles.passwordCheck}>
                      <Text size={12} color={argonTheme.COLORS.MUTED}>
                        password strength:
                      </Text>
                      <Text bold size={12} color={argonTheme.COLORS.SUCCESS}>
                        {" "}
                        strong
                      </Text>
                    </Block>
                  </Block>
                  {isBiometricSupported && (
                    <Block row middle style={styles.biometricsToggle}>
                      <Text size={14} color={argonTheme.COLORS.TEXT}>
                        Enable Face ID for future logins
                      </Text>
                      <Switch
                        value={enableBiometrics}
                        onValueChange={setEnableBiometrics}
                        trackColor={{
                          false: argonTheme.COLORS.SWITCH_OFF,
                          true: argonTheme.COLORS.SWITCH_ON,
                        }}
                      />
                    </Block>
                  )}
                  <Block middle>
                    <Button
                      color="primary"
                      style={styles.createButton}
                      onPress={handleRegister}
                      loading={loading}
                    >
                      <Text bold size={14} color={argonTheme.COLORS.WHITE}>
                        CREATE ACCOUNT
                      </Text>
                    </Button>
                  </Block>

                  {/* Add the link to return to Login screen */}
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Login")}
                  >
                    <Text style={styles.loginLink}>
                      Already have an account?{" "}
                      <Text style={styles.loginLinkText}>Log in</Text>
                    </Text>
                  </TouchableOpacity>
                </KeyboardAvoidingView>
              </Block>
            </Block>
          </Block>
        </Block>
      </Block>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  registerContainer: {
    width: width * 0.9,
    height: height * 0.875,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 10,
    padding: 20,
    shadowColor: argonTheme.COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    shadowOpacity: 0.1,
    elevation: 3,
  },
  socialConnect: {
    backgroundColor: argonTheme.COLORS.WHITE,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#8898AA",
  },
  socialButtons: {
    width: 120,
    height: 40,
    backgroundColor: "#fff",
    shadowColor: argonTheme.COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    shadowOpacity: 0.1,
    elevation: 1,
  },
  socialTextButtons: {
    color: argonTheme.COLORS.PRIMARY,
    fontWeight: "800",
    fontSize: 14,
  },
  inputIcons: { marginRight: 12 },
  color: argonTheme.COLORS.ICON,
  passwordCheck: { paddingLeft: 15, paddingTop: 13, paddingBottom: 30 },
  createButton: { width: width * 0.5, marginTop: 25 },
  biometricsToggle: {
    marginTop: 15,
    marginBottom: 15,
    width: width * 0.8,
    justifyContent: "space-between",
  },
  loginLink: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    color: argonTheme.COLORS.TEXT_DARK,
  },
  loginLinkText: {
    color: argonTheme.COLORS.PRIMARY,
    fontWeight: "bold",
  },
});

export default Register;
