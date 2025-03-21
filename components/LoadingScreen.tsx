import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Animated, 
  Dimensions 
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface LoadingScreenProps {
  onFinish?: () => void;
  duration?: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  onFinish, 
  duration = 5000 
}) => {
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Start animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();

    // Set timeout to call onFinish after duration
    if (onFinish) {
      const timer = setTimeout(() => {
        // Fade out animation
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(onFinish);
      }, duration - 500); // Subtract fadeout duration
      
      return () => clearTimeout(timer);
    }
  }, [fadeAnim, scaleAnim, onFinish, duration]);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={styles.circularLogoContainer}>
          <Image 
            source={require('../assets/1741520661019.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appName}>Havault</Text>
        <Text style={{ fontSize: 16, color: '#AAAAAA', textAlign: 'center' }}>A secure Password Manager</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: 10,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
    letterSpacing: 1,
  },
  circularLogoContainer: {
    width: width * 0.32,
    height: width * 0.32,
    borderRadius: width * 0.2,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default LoadingScreen; 