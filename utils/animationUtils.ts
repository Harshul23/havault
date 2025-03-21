import React, { RefObject, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

/**
 * Safely runs Animated.timing that checks if the component is still mounted
 * before starting the animation. This helps prevent SIGSEGV errors.
 * 
 * @param animatedValue The Animated.Value to animate
 * @param toValue Target value for the animation
 * @param duration Duration of the animation in ms
 * @param isMountedRef React ref tracking if component is mounted
 * @param useNativeDriver Whether to use native driver (default: true)
 * @param callback Optional callback after animation completes
 */
export const safeAnimatedTiming = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number,
  isMountedRef: RefObject<boolean>,
  useNativeDriver: boolean = true,
  callback?: () => void
): void => {
  if (isMountedRef.current) {
    Animated.timing(animatedValue, {
      toValue,
      duration,
      useNativeDriver,
    }).start(() => {
      if (callback && isMountedRef.current) {
        callback();
      }
    });
  }
};

/**
 * Hook to ensure animations are properly cleaned up when a component unmounts.
 * This should be used with all components that use animations.
 * 
 * @example
 * const isMounted = useIsMountedRef();
 * // Later in code:
 * if (isMounted.current) {
 *   // Run animation
 * }
 */
export const useIsMountedRef = (): RefObject<boolean> => {
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  return isMountedRef;
};

/**
 * Safely start a layout animation with an isMounted check
 * 
 * @param startLayoutAnimation The animation function to call
 * @param isMountedRef React ref tracking if component is mounted 
 */
export const safeStartLayoutAnimation = (
  startLayoutAnimation: () => void,
  isMountedRef: RefObject<boolean>
): void => {
  if (isMountedRef.current) {
    startLayoutAnimation();
  }
};

/**
 * Creates a debounced navigation function to prevent
 * multiple rapid navigation actions which can cause SIGSEGV errors.
 * 
 * @param navigationFn The navigation function to debounce
 * @param delay The debounce delay in ms (default: 300ms)
 * @returns Debounced navigation function
 */
export const debounceNavigation = <T extends (...args: any[]) => any>(
  navigationFn: T,
  delay: number = 300
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let isNavigating = false;
  
  return (...args: Parameters<T>) => {
    if (isNavigating) return; // Prevent navigation if already navigating
    
    if (timeoutId) clearTimeout(timeoutId);
    
    isNavigating = true;
    timeoutId = setTimeout(() => {
      navigationFn(...args);
      // Reset after a delay to allow the navigation to complete
      setTimeout(() => {
        isNavigating = false;
      }, 500);
    }, delay);
  };
};

/**
 * Utility function to safely apply Reanimated layout animations
 * with proper mounted checks to prevent SIGSEGV crashes.
 * 
 * @param enteringAnimation The animation to use when component enters
 * @param exitingAnimation The animation to use when component exits
 * @param isMountedRef React ref tracking if component is mounted
 * @returns An object with entering and exiting properties for Animated.View
 */
export const useSafeReanimatedTransition = (
  enteringAnimation: any,
  exitingAnimation: any,
  isMountedRef: RefObject<boolean>
) => {
  return {
    entering: isMountedRef.current ? enteringAnimation : undefined,
    exiting: isMountedRef.current ? exitingAnimation : undefined,
  };
};

/**
 * Hook to check if it's safe to animate based on mounted and focused state
 * 
 * @returns Boolean indicating if it's safe to animate
 */
export const useSafeToAnimate = (): boolean => {
  const isMounted = useIsMountedRef();
  const isFocused = useIsFocused();
  
  // Ensure we return a boolean value
  return Boolean(isMounted.current && isFocused);
}; 