import React from "react";
import { Dimensions } from "react-native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createStackNavigator } from "@react-navigation/stack";

import CustomDrawerContent from "./Menu";
import Home from "../screens/Home";
import Onboarding from "../screens/Onboarding";
import Profile from "../screens/Profile";
import Register from "../screens/Register";
import Login from "../screens/Login";
import Grows from "../screens/Grows";
import AddGrow from "../screens/AddGrow";
import GrowItem from '../screens/GrowItem';
import Notifications from "../screens/Notifications";

const { width } = Dimensions.get("screen");

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// App Stack (Drawer)
function AppStack(props) {
  return (
    <Drawer.Navigator
      style={{ flex: 1 }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      drawerStyle={{
        backgroundColor: "white",
        width: width * 0.8,
      }}
      drawerContentOptions={{
        activeTintColor: "white",
        inactiveTintColor: "#000",
        activeBackgroundColor: "transparent",
        itemStyle: {
          width: width * 0.75,
          backgroundColor: "transparent",
          paddingVertical: 16,
          paddingHorizontal: 12,
          justifyContent: "center",
          alignContent: "center",
          alignItems: "center",
          overflow: "hidden",
        },
        labelStyle: {
          fontSize: 18,
          marginLeft: 12,
          fontWeight: "normal",
        },
      }}
      initialRouteName="Home"
    >
      <Drawer.Screen 
        name="Home" 
        component={Home}
        options={{
          headerShown: false,
        }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={Profile}
        options={{
          headerShown: false,
        }}
      />
      <Drawer.Screen 
        name="Grows" 
        component={Grows}
        options={{
          headerShown: false,
        }}
      />
    </Drawer.Navigator>
  );
}

// Onboarding Stack (includes Onboarding, Login, Register)
export default function OnboardingStack(props) {
  return (
    <Stack.Navigator
      screenOptions={{
        mode: "card",
        headerShown: false,
      }}
    >
      <Stack.Screen name="Onboarding" component={Onboarding} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
      <Stack.Screen name="App" component={AppStack} />
      <Stack.Screen name="AddGrow" component={AddGrow} />
      <Stack.Screen name="GrowItem" component={GrowItem} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={Notifications} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

export { OnboardingStack, AppStack };
