import React, { useEffect, ComponentProps } from 'react';
import { View, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useIsMountedRef, useSafeReanimatedTransition } from '../utils/animationUtils';

interface SafeScreenWrapperProps {
  children: React.ReactNode;
  style?: ComponentProps<typeof View>['style'];
  shouldUseAnimations?: boolean;
  // Optional custom animations
  enterAnimation?: any;
  exitAnimation?: any;
}

/**
 * A wrapper component for screens that ensures safe animations during navigation.
 * This prevents layout animations from running on unmounted components.
 * 
 * @example
 * // Basic usage:
 * <SafeScreenWrapper>
 *   <YourScreenContent />
 * </SafeScreenWrapper>
 * 
 * // With custom animations:
 * <SafeScreenWrapper 
 *   enterAnimation={SlideInRight.duration(300)} 
 *   exitAnimation={SlideOutRight.duration(300)}
 * >
 *   <YourScreenContent />
 * </SafeScreenWrapper>
 */
const SafeScreenWrapper: React.FC<SafeScreenWrapperProps> = ({ 
  children, 
  style, 
  shouldUseAnimations = true,
  enterAnimation = FadeIn.duration(300),
  exitAnimation = FadeOut.duration(300)
}) => {
  const isMounted = useIsMountedRef();
  const isFocused = useIsFocused();
  
  // Clean up any animations when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Get safe animations based on mounted and focused state
  const animations = useSafeReanimatedTransition(
    enterAnimation,
    exitAnimation,
    isMounted
  );
  
  // Determine if animations should be used
  const shouldAnimate = shouldUseAnimations && isMounted.current && isFocused;
  
  if (shouldAnimate) {
    return (
      <Animated.View 
        style={[styles.container, style]}
        entering={animations.entering}
        exiting={animations.exiting}
      >
        {children}
      </Animated.View>
    );
  }
  
  // If animations are disabled or not safe, render without animations
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SafeScreenWrapper; 