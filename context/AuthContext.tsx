import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

// Ensure the redirect URI is registered properly in Google Console
WebBrowser.maybeCompleteAuthSession();

interface User {
  id: string;
  name?: string;
  email: string;
  photoUrl?: string;
  provider?: 'email' | 'google';
}

interface AuthContextProps {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => Promise<boolean>;
  googleSignIn: () => Promise<boolean>;
  isAuthenticating: boolean;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  isLoading: true,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
  updateUser: async () => false,
  googleSignIn: async () => false,
  isAuthenticating: false,
});

// Key for storing user credentials
const USER_CREDENTIALS_KEY = 'user_credentials';
const CURRENT_USER_KEY = 'current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Configure Google authentication
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '337153757246-3pbq0lp7h6r2897nnbnphugc3jie0d54.apps.googleusercontent.com',
    androidClientId: '337153757246-3pbq0lp7h6r2897nnbnphugc3jie0d54.apps.googleusercontent.com',
    iosClientId: '337153757246-3pbq0lp7h6r2897nnbnphugc3jie0d54.apps.googleusercontent.com',
    webClientId: '337153757246-3pbq0lp7h6r2897nnbnphugc3jie0d54.apps.googleusercontent.com',
  });
  
  useEffect(() => {
    // Handle Google authentication response
    if (response?.type === 'success') {
      const { authentication } = response;
      fetchUserInfo(authentication?.accessToken);
    }
  }, [response]);
  
  const fetchUserInfo = async (token: string | undefined) => {
    if (!token) return false;
    
    try {
      const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userInfo = await response.json();
      const googleUser: User = {
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email,
        photoUrl: userInfo.picture,
        provider: 'google'
      };
      
      // Save user to secure storage
      await SecureStore.setItemAsync(CURRENT_USER_KEY, JSON.stringify(googleUser));
      
      // Check if user credentials exist, if not create them
      const existingCredentials = await SecureStore.getItemAsync(USER_CREDENTIALS_KEY);
      let credentials = existingCredentials ? JSON.parse(existingCredentials) : {};
      
      if (!credentials[googleUser.id]) {
        credentials[googleUser.id] = {
          email: googleUser.email,
          name: googleUser.name,
          provider: 'google',
          // No password for Google users
        };
        
        await SecureStore.setItemAsync(USER_CREDENTIALS_KEY, JSON.stringify(credentials));
      }
      
      // Initialize user data storage if not already done
      await initializeUserData(googleUser.id);
      
      setUser(googleUser);
      setIsAuthenticating(false);
      return true;
    } catch (error) {
      console.error('Failed to fetch Google user info:', error);
      setIsAuthenticating(false);
      return false;
    }
  };
  
  useEffect(() => {
    // Check if user is logged in
    const loadUser = async () => {
      try {
        const userData = await SecureStore.getItemAsync(CURRENT_USER_KEY);
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Failed to load user', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, []);
  
  // Initialize storage for a user if not already done
  const initializeUserData = async (userId: string) => {
    try {
      // Check if passwords exist for this user
      const userPasswordsKey = `passwords_${userId}`;
      const userFoldersKey = `folders_${userId}`;
      const userThemeKey = `theme_${userId}`;
      
      // Check if passwords exist for this user
      const passwordsData = await AsyncStorage.getItem(userPasswordsKey);
      if (!passwordsData) {
        // Initialize with empty array
        await AsyncStorage.setItem(userPasswordsKey, JSON.stringify([]));
      }
      
      // Check if folders exist for this user
      const foldersData = await AsyncStorage.getItem(userFoldersKey);
      if (!foldersData) {
        // Initialize with default folders
        const defaultFolders = ['Personal', 'Work', 'Finance'];
        await AsyncStorage.setItem(userFoldersKey, JSON.stringify(defaultFolders));
      }
      
      // Check if theme preference exists for this user
      const themeData = await AsyncStorage.getItem(userThemeKey);
      if (!themeData) {
        // Initialize with system default
        await AsyncStorage.setItem(userThemeKey, JSON.stringify('system'));
      }
      
    } catch (error) {
      console.error('Failed to initialize user data:', error);
    }
  };
  
  const login = async (email: string, password: string) => {
    setIsAuthenticating(true);
    
    try {
      // Validate inputs
      if (email.trim() === '' || !email.includes('@') || password.trim() === '') {
        setIsAuthenticating(false);
        return false;
      }
      
      // Get stored credentials
      const storedCredentials = await SecureStore.getItemAsync(USER_CREDENTIALS_KEY);
      if (!storedCredentials) {
        setIsAuthenticating(false);
        return false;
      }
      
      const credentials = JSON.parse(storedCredentials);
      
      // Find user by email
      let foundUserId = null;
      let foundUser = null;
      
      for (const userId in credentials) {
        if (credentials[userId].email === email) {
          // For email provider, verify password
          if (credentials[userId].provider === 'email') {
            if (credentials[userId].password === password) {
              foundUserId = userId;
              foundUser = credentials[userId];
              break;
            }
          }
        }
      }
      
      if (!foundUserId || !foundUser) {
        setIsAuthenticating(false);
        return false;
      }
      
      const loggedInUser: User = {
        id: foundUserId,
        email: foundUser.email,
        name: foundUser.name,
        provider: foundUser.provider,
      };
      
      // Initialize user data storage if not already done
      await initializeUserData(foundUserId);
      
      setUser(loggedInUser);
      await SecureStore.setItemAsync(CURRENT_USER_KEY, JSON.stringify(loggedInUser));
      setIsAuthenticating(false);
      return true;
    } catch (error) {
      console.error('Login failed', error);
      setIsAuthenticating(false);
      return false;
    }
  };
  
  const googleSignIn = async () => {
    setIsAuthenticating(true);
    
    try {
      const result = await promptAsync();
      return result.type === 'success';
    } catch (error) {
      console.error('Google Sign In failed', error);
      setIsAuthenticating(false);
      return false;
    }
  };
  
  const register = async (email: string, password: string, name?: string) => {
    setIsAuthenticating(true);
    
    try {
      // Validate inputs
      if (email.trim() === '' || !email.includes('@') || password.trim() === '' || password.length < 6) {
        setIsAuthenticating(false);
        return false;
      }
      
      // Check if email already exists
      const storedCredentials = await SecureStore.getItemAsync(USER_CREDENTIALS_KEY);
      let credentials = storedCredentials ? JSON.parse(storedCredentials) : {};
      
      for (const userId in credentials) {
        if (credentials[userId].email === email) {
          setIsAuthenticating(false);
          return false; // Email already in use
        }
      }
      
      // Create new user
      const userId = Date.now().toString();
      const newUser: User = {
        id: userId,
        email,
        name: name || email.split('@')[0],
        provider: 'email',
      };
      
      // Store user credentials
      credentials[userId] = {
        email: newUser.email,
        name: newUser.name,
        password: password,
        provider: 'email',
      };
      
      await SecureStore.setItemAsync(USER_CREDENTIALS_KEY, JSON.stringify(credentials));
      await SecureStore.setItemAsync(CURRENT_USER_KEY, JSON.stringify(newUser));
      
      // Initialize user data storage
      await initializeUserData(userId);
      
      setUser(newUser);
      setIsAuthenticating(false);
      return true;
    } catch (error) {
      console.error('Registration failed', error);
      setIsAuthenticating(false);
      return false;
    }
  };
  
  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync(CURRENT_USER_KEY);
      setUser(null);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };
  
  const updateUser = async (updatedUser: User) => {
    try {
      await SecureStore.setItemAsync(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      
      // Also update in credentials store
      const storedCredentials = await SecureStore.getItemAsync(USER_CREDENTIALS_KEY);
      if (storedCredentials) {
        const credentials = JSON.parse(storedCredentials);
        if (credentials[updatedUser.id]) {
          credentials[updatedUser.id].name = updatedUser.name;
          credentials[updatedUser.id].email = updatedUser.email;
          if (updatedUser.photoUrl) {
            credentials[updatedUser.id].photoUrl = updatedUser.photoUrl;
          }
          await SecureStore.setItemAsync(USER_CREDENTIALS_KEY, JSON.stringify(credentials));
        }
      }
      
      setUser(updatedUser);
      return true;
    } catch (error) {
      console.error('Update user failed', error);
      return false;
    }
  };
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      register, 
      logout, 
      updateUser, 
      googleSignIn,
      isAuthenticating 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);