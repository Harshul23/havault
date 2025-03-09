import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from 'sonner-native';

// Screens
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import AddPasswordScreen from "./screens/AddPasswordScreen";
import PasswordDetailScreen from "./screens/PasswordDetailScreen";
import EditPasswordScreen from "./screens/EditPasswordScreen";
import ManageFoldersScreen from "./screens/ManageFoldersScreen";
import SettingsScreen from "./screens/SettingsScreen";
import EditProfileScreen from "./screens/EditProfileScreen";
import ChangeMasterPasswordScreen from "./screens/ChangeMasterPasswordScreen";

// Context
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { PasswordProvider } from "./PasswordContext";

const Stack = createNativeStackNavigator();

function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Pre-login routes */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      {/* Post-login routes */}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="AddPassword" component={AddPasswordScreen} />
      <Stack.Screen name="PasswordDetail" component={PasswordDetailScreen} />
      <Stack.Screen name="EditPassword" component={EditPasswordScreen} />
      <Stack.Screen name="ManageFolders" component={ManageFoldersScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangeMasterPassword" component={ChangeMasterPasswordScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider style={styles.container}>
      <Toaster />
      <AuthProvider>
        <ThemeProvider>
          <PasswordProvider>
            <NavigationContainer>
              <RootStack />
            </NavigationContainer>
          </PasswordProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
