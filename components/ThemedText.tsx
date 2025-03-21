import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ThemedTextProps extends TextProps {
  children: React.ReactNode;
  type?: 'primary' | 'secondary' | 'heading' | 'caption';
}

/**
 * A theme-aware Text component that automatically applies theme colors
 * Use this component for text elements to ensure consistent theming
 */
const ThemedText: React.FC<ThemedTextProps> = ({ 
  children, 
  style, 
  type = 'primary',
  ...props 
}) => {
  const { colors } = useTheme();
  
  // Determine text style based on type
  let textStyle = {};
  let textColor = colors.text;
  
  switch (type) {
    case 'secondary':
      textColor = colors.secondaryText;
      textStyle = styles.secondary;
      break;
    case 'heading':
      textStyle = styles.heading;
      break;
    case 'caption':
      textColor = colors.secondaryText;
      textStyle = styles.caption;
      break;
    default:
      textStyle = styles.primary;
  }
  
  return (
    <Text
      style={[
        textStyle,
        { color: textColor },
        style
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  primary: {
    fontSize: 16,
  },
  secondary: {
    fontSize: 14,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  caption: {
    fontSize: 12,
  },
});

export default ThemedText; 