import React from 'react';
import { StatusBar, StatusBarProps, Platform } from 'react-native';

/**
 * A StatusBar component that is permanently set to dark theme
 */
const ThemedStatusBar: React.FC<StatusBarProps> = (props) => {
  return (
    <StatusBar
      translucent
      backgroundColor="transparent"
      barStyle="light-content"
      {...props}
    />
  );
};

export default ThemedStatusBar; 