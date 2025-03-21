import React, { createContext, useContext } from 'react';
import { Appearance } from 'react-native';

// Theme color palette
interface ThemeColors {
  primary: string;
  background: string;
  card: string;
  text: string;
  secondaryText: string;
  border: string;
  notification: string;
  error: string;
  success: string;
  warning: string;
}

// Enhanced theme context with additional properties
interface ThemeContextProps {
  theme: 'dark';
  isDark: true; // Always true as we're permanently in dark mode
  colors: ThemeColors; // Color palette for dark theme
}

// Dark theme colors
const darkColors: ThemeColors = {
  primary: '#7B68EE',
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  secondaryText: '#AAAAAA',
  border: '#444444',
  notification: '#7B68EE',
  error: '#F44336',
  success: '#4CAF50',
  warning: '#FF9800'
};

const ThemeContext = createContext<ThemeContextProps>({
  theme: 'dark',
  isDark: true,
  colors: darkColors
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always use dark theme
  const theme = 'dark';
  const isDark = true;
  const colors = darkColors;
  
  const contextValue = {
    theme,
    isDark,
    colors
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);