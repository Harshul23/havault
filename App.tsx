import React, { useCallback, useEffect, useState, useRef } from 'react';
import { NavigationContainer, DarkTheme as NavigationDarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View, Platform } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from 'sonner-native';
import { useAuth } from './context/AuthContext';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Components
import { NavigationWrapper, LoadingScreen, ThemedStatusBar } from './components';

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

// Create custom dark theme
const customDarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: '#7B68EE',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    border: '#444444',
    notification: '#7B68EE',
  },
};

const Stack = createNativeStackNavigator();

// Create wrapped screen components
const WrappedHomeScreen = () => (
  <NavigationWrapper showBottomNav={true}>
    <HomeScreen />
  </NavigationWrapper>
);

const WrappedPasswordDetailScreen = () => (
  <NavigationWrapper showBottomNav={true}>
    <PasswordDetailScreen />
  </NavigationWrapper>
);

const WrappedAddPasswordScreen = () => (
  <NavigationWrapper showBottomNav={true}>
    <AddPasswordScreen />
  </NavigationWrapper>
);

const WrappedEditPasswordScreen = () => (
  <NavigationWrapper showBottomNav={true}>
    <EditPasswordScreen />
  </NavigationWrapper>
);

const WrappedManageFoldersScreen = () => (
  <NavigationWrapper showBottomNav={true}>
    <ManageFoldersScreen />
  </NavigationWrapper>
);

const WrappedSettingsScreen = () => (
  <NavigationWrapper showBottomNav={true}>
    <SettingsScreen />
  </NavigationWrapper>
);

const WrappedEditProfileScreen = () => (
  <NavigationWrapper showBottomNav={true}>
    <EditProfileScreen />
  </NavigationWrapper>
);

const WrappedChangeMasterPasswordScreen = () => (
  <NavigationWrapper showBottomNav={true}>
    <ChangeMasterPasswordScreen />
  </NavigationWrapper>
);

// Auth screens without bottom navigation
const WrappedLoginScreen = () => (
  <NavigationWrapper showBottomNav={false}>
    <LoginScreen />
  </NavigationWrapper>
);

const WrappedRegisterScreen = () => (
  <NavigationWrapper showBottomNav={false}>
    <RegisterScreen />
  </NavigationWrapper>
);

const WrappedForgotPasswordScreen = () => (
  <NavigationWrapper showBottomNav={false}>
    <ForgotPasswordScreen />
  </NavigationWrapper>
);

// RootStack with screen configurations and LoadingScreen wrapper
function RootStack() {
  const { user } = useAuth();
  const [showHomeLoadingScreen, setShowHomeLoadingScreen] = useState(false);
  
  // Create a modified version of HomeScreen with loading screen
  const HomeScreenWithLoading = (props: any) => {
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
      if (!showHomeLoadingScreen) {
        setIsLoading(false);
        return;
      }
      setShowHomeLoadingScreen(false);
    }, [showHomeLoadingScreen]);
    
    if (isLoading) {
      return (
        <LoadingScreen 
          onFinish={() => setIsLoading(false)}
          duration={5000}
        />
      );
    }
    
    return (
      <NavigationWrapper showBottomNav={true}>
        <HomeScreen {...props} />
      </NavigationWrapper>
    );
  };

  // Handle user login navigation with loading screen
  const handleLoginNavigation = () => {
    if (user) {
      setShowHomeLoadingScreen(true);
    }
  };
  
  // Use effect to trigger navigation to home when user logs in
  useEffect(() => {
    if (user) {
      setShowHomeLoadingScreen(true);
    }
  }, [user]);
  
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: Platform.OS === 'android' ? 'fade' : 'default',
        // For React Navigation v6, animation duration is set differently
        animationDuration: 300,
      }} 
      initialRouteName={user ? "Home" : "Login"}
    >
      <Stack.Group>
        {/* Pre-login routes */}
        <Stack.Screen 
          name="Login" 
          component={WrappedLoginScreen} 
          listeners={{
            beforeRemove: (e) => {
              if (user) {
                setShowHomeLoadingScreen(true);
              }
            }
          }}
        />
        <Stack.Screen name="Register" component={WrappedRegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={WrappedForgotPasswordScreen} />
        {/* Post-login routes */}
        <Stack.Screen name="Home" component={HomeScreenWithLoading} />
        <Stack.Screen name="AddPassword" component={WrappedAddPasswordScreen} />
        <Stack.Screen name="PasswordDetail" component={WrappedPasswordDetailScreen} />
        <Stack.Screen name="EditPassword" component={WrappedEditPasswordScreen} />
        <Stack.Screen name="ManageFolders" component={WrappedManageFoldersScreen} />
        <Stack.Screen name="Settings" component={WrappedSettingsScreen} />
        <Stack.Screen name="EditProfile" component={WrappedEditProfileScreen} />
        <Stack.Screen name="ChangeMasterPassword" component={WrappedChangeMasterPasswordScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
}

// Main app with navigation container
function MainApp() {
  const { user, isLoading: authLoading } = useAuth();
  const [initialAppLoading, setInitialAppLoading] = useState(true);
  const navigationRef = useRef(null);
  
  useEffect(() => {
    // Define an async function to hide the splash screen
    async function hideSplashScreen() {
      if (!authLoading) {
        // Reduce delay for a quicker transition from splash screen
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Hide the expo splash screen
        await SplashScreen.hideAsync();
        
        // Now that the splash screen is hidden, show our own loading screen
        setInitialAppLoading(false);
      }
    }
    
    hideSplashScreen();
  }, [authLoading]);
  
  if (authLoading || initialAppLoading) {
    return (
      <View style={{ flex: 1 }}>
        <LoadingScreen duration={5000} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: customDarkTheme.colors.background }}>
      <ThemedStatusBar />
      <NavigationContainer 
        theme={customDarkTheme}
        ref={navigationRef as any}
        onReady={() => {
          console.log('Navigation container ready');
        }}
        onStateChange={(state) => {
          // Log navigation state changes for debugging
          console.log('Navigation state changed');
        }}
      >
        <RootStack />
      </NavigationContainer>
      <Toaster />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <PasswordProvider>
            <MainApp />
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
