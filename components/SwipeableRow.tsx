import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Animated, 
  PanResponder,
  Dimensions,
  TouchableOpacity,
  I18nManager
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useIsMountedRef } from '../utils/animationUtils';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 50; // Reduced threshold to make swiping easier
const ACTION_WIDTH = 80; // Width of action buttons

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  onEdit: () => void;
  isDark: boolean;
  itemName?: string; // For confirmation messages
}

const SwipeableRow: React.FC<SwipeableRowProps> = ({ 
  children, 
  onDelete, 
  onEdit, 
  isDark,
  itemName = 'item' 
}) => {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const position = useRef(new Animated.Value(0)).current;
  
  // Use our custom hook to track mounted state
  const isMounted = useIsMountedRef();
  
  // Colors based on theme
  const themeColors = {
    deleteBackground: '#ff4d4f',
    deleteText: '#ffffff',
    editBackground: '#40a9ff',
    editText: '#ffffff',
    iconColor: '#ffffff'
  };

  // Set up animation interpolations for background reveal
  const leftInterpolate = position.interpolate({
    inputRange: [0, ACTION_WIDTH],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const rightInterpolate = position.interpolate({
    inputRange: [-ACTION_WIDTH, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  // Reset the position of the card - with safety check
  const resetPosition = () => {
    if (isMounted.current) {
      Animated.spring(position, {
        toValue: 0,
        useNativeDriver: true,
        friction: 5
      }).start(() => {
        // Only update state if still mounted
        if (isMounted.current) {
          setSwipeDirection(null);
        }
      });
    }
  };

  // Perform the appropriate action based on swipe direction - with safety check
  const handleAction = (direction: 'left' | 'right') => {
    if (!isMounted.current) return;
    
    if (direction === 'left') {
      // Just call onDelete directly - parent will handle confirmation
      onDelete();
      resetPosition();
    } else {
      onEdit();
      resetPosition();
    }
  };

  // Create pan responder with enhanced safety checks
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isMounted.current,
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Only capture horizontal movements greater than 10px to avoid interfering with scrolling
        return isMounted.current && Math.abs(gesture.dx) > 10 && Math.abs(gesture.dy) < 20;
      },
      onPanResponderMove: (_, gesture) => {
        if (!isMounted.current) return;
        
        // Update swipe direction for visual feedback
        if (gesture.dx > 0 && swipeDirection !== 'right') {
          setSwipeDirection('right');
        } else if (gesture.dx < 0 && swipeDirection !== 'left') {
          setSwipeDirection('left');
        }
        
        position.setValue(gesture.dx);
      },
      onPanResponderRelease: (_, gesture) => {
        if (!isMounted.current) return;
        
        if (gesture.dx > SWIPE_THRESHOLD) {
          // Show action button and prepare for edit
          Animated.timing(position, {
            toValue: ACTION_WIDTH,
            duration: 250,
            useNativeDriver: true
          }).start(() => {
            if (isMounted.current) {
              handleAction('right');
            }
          });
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          // Show action button and prepare for delete
          Animated.timing(position, {
            toValue: -ACTION_WIDTH,
            duration: 250,
            useNativeDriver: true
          }).start(() => {
            if (isMounted.current) {
              handleAction('left');
            }
          });
        } else {
          resetPosition();
        }
      },
      onPanResponderTerminate: () => {
        if (isMounted.current) {
          resetPosition();
        }
      }
    })
  ).current;

  // Reset position when component unmounts and track mount state
  useEffect(() => {
    // Note: We're now using the hook which handles setting isMounted.current = true
    
    return () => {
      // When unmounting, immediately reset the animation state to prevent further animations
      position.setValue(0);
      
      // Force animations to stop by setting callbacks to no-op
      position.stopAnimation();
      position.removeAllListeners();
    };
  }, [position]);

  // Styles for the swiped card
  const cardStyle = {
    transform: [{ translateX: position }]
  };

  // Styles for the left and right action buttons
  const leftActionOpacity = { opacity: leftInterpolate };
  const rightActionOpacity = { opacity: rightInterpolate };

  return (
    <View style={styles.container}>
      {/* Left Action (Edit) */}
      <Animated.View 
        style={[
          styles.actionContainer, 
          styles.leftAction,
          leftActionOpacity,
          { backgroundColor: themeColors.editBackground }
        ]}
      >
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleAction('right')}
        >
          <MaterialIcons name="edit" size={24} color={themeColors.iconColor} />
          <Text style={[styles.actionText, { color: themeColors.editText }]}>
            Edit
          </Text>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Right Action (Delete) */}
      <Animated.View 
        style={[
          styles.actionContainer, 
          styles.rightAction,
          rightActionOpacity,
          { backgroundColor: themeColors.deleteBackground }
        ]}
      >
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleAction('left')}
        >
          <Ionicons name="trash-outline" size={24} color={themeColors.iconColor} />
          <Text style={[styles.actionText, { color: themeColors.deleteText }]}>
            Delete
          </Text>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Content (Password Card or Folder) */}
      <Animated.View 
        style={[styles.card, cardStyle]} 
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 16,
  },
  card: {
    zIndex: 2,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  actionContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  leftAction: {
    left: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  rightAction: {
    right: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default SwipeableRow; 