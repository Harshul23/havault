import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Keyboard, Platform } from 'react-native';
import BottomNavBar from './BottomNavBar';
import { useTheme } from '../context/ThemeContext';

interface NavigationWrapperProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
}

const NavigationWrapper: React.FC<NavigationWrapperProps> = ({ 
  children, 
  showBottomNav = true 
}) => {
  const { isDark } = useTheme();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    // Cleanup listeners on unmount
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {children}
      </View>
      {showBottomNav && !keyboardVisible && <BottomNavBar isDark={isDark} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default NavigationWrapper;