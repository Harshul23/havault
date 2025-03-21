import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ThemedViewProps extends ViewProps {
  children: React.ReactNode;
  useDarkBackground?: boolean; // For components that should use a darker background in dark mode
  useCardBackground?: boolean; // For card-like containers
}

/**
 * A dark theme View component
 * Use this wrapper for container components to ensure consistent theming
 */
const ThemedView: React.FC<ThemedViewProps> = ({ 
  children, 
  style, 
  useDarkBackground = false,
  useCardBackground = false,
  ...props 
}) => {
  const { colors } = useTheme();
  
  // Determine the appropriate background color based on props
  let backgroundColor;
  if (useCardBackground) {
    backgroundColor = colors.card;
  } else if (useDarkBackground) {
    backgroundColor = '#000000'; // Darker than the standard dark background
  } else {
    backgroundColor = colors.background;
  }
  
  return (
    <View
      style={[
        styles.container,
        { backgroundColor },
        style
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ThemedView; 