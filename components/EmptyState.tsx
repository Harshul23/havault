import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

interface EmptyStateProps {
  message: string;
  isDark: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message, isDark }) => {
  const textColor = isDark ? '#BBBBBB' : '#666666';
  const iconColor = isDark ? '#7B68EE' : '#6A5ACD';
  
  return (
    <Animated.View 
      entering={FadeIn.duration(500).delay(200)}
      style={styles.container}
    >
      <MaterialCommunityIcons 
        name="shield-key-outline" 
        size={80} 
        color={iconColor} 
        style={styles.icon}
      />
      <Text style={[styles.message, { color: textColor }]}>
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 50,
  },
  icon: {
    marginBottom: 20,
    opacity: 0.8,
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 24,
  }
});

export default EmptyState;