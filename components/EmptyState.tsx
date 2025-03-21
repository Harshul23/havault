import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface EmptyStateProps {
  message: string;
  isDark: boolean;
  buttonText?: string;
  onButtonPress?: () => void;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  message, 
  isDark, 
  buttonText, 
  onButtonPress,
  icon
}) => {
  const textColor = isDark ? '#BBBBBB' : '#666666';
  const iconColor = isDark ? '#7B68EE' : '#6A5ACD';
  
  return (
    <View style={styles.container}>
      {icon || (
        <MaterialCommunityIcons 
          name="shield-key-outline" 
          size={60} 
          color={iconColor} 
          style={styles.icon}
        />
      )}
      <Text style={[styles.message, { color: textColor }]}>
        {message}
      </Text>
      
      {buttonText && onButtonPress && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: isDark ? '#7B68EE' : '#6A5ACD' }]}
          onPress={onButtonPress}
        >
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 20,
    height: 200, // Limit the height to prevent taking over the screen
  },
  icon: {
    marginBottom: 10,
    opacity: 0.8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 15,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  }
});

export default EmptyState;