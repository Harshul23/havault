import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Navigation } from '../navigation';

interface BottomNavBarProps {
  isDark: boolean;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ isDark }) => {
  const navigation = useNavigation<Navigation<'Home'>>();

  const handleNavigate = (screen: 'Home' | 'AddPassword' | 'Settings') => {
    navigation.navigate(screen);
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? '#1E1E1E' : 'white' }
    ]}>
      <TouchableOpacity 
        style={styles.navButton}
        onPress={() => handleNavigate('Home')}
      >
        <Ionicons 
          name="home-outline" 
          size={24} 
          color={isDark ? '#DDDDDD' : '#333333'} 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: isDark ? '#7B68EE' : '#6A5ACD' }]}
        onPress={() => handleNavigate('AddPassword')}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.navButton}
        onPress={() => handleNavigate('Settings')}
      >
        <Ionicons 
          name="settings-outline" 
          size={24} 
          color={isDark ? '#DDDDDD' : '#333333'} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  navButton: {
    padding: 12,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    transform: [{ translateY: -8 }],
  },
});

export default BottomNavBar;