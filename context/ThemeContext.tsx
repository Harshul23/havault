import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

type ThemeType = 'light' | 'dark';

interface ThemeContextProps {
  theme: ThemeType;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: 'light',
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceTheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>(deviceTheme as ThemeType || 'light');
  const { user } = useAuth();
  
  useEffect(() => {
    // Load saved theme
    const loadTheme = async () => {
      try {
        if (user) {
          const userThemeKey = `theme_${user.id}`;
          const savedTheme = await AsyncStorage.getItem(userThemeKey);
          if (savedTheme) {
            setTheme(JSON.parse(savedTheme) as ThemeType);
          }
        } else {
          // If no user is logged in, use device theme or default to light
          setTheme(deviceTheme as ThemeType || 'light');
        }
      } catch (error) {
        console.error('Failed to load theme', error);
      }
    };
    
    loadTheme();
  }, [user, deviceTheme]);
  
  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    try {
      if (user) {
        const userThemeKey = `theme_${user.id}`;
        await AsyncStorage.setItem(userThemeKey, JSON.stringify(newTheme));
      }
    } catch (error) {
      console.error('Failed to save theme', error);
    }
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);