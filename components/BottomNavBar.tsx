import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text, Modal, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Navigation } from '../navigation';

interface BottomNavBarProps {
  isDark: boolean;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ isDark }) => {
  const navigation = useNavigation<Navigation<'Home'>>();
  const [showOptions, setShowOptions] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handleNavigate = (screen: 'Home' | 'AddPassword' | 'Settings') => {
    navigation.navigate(screen);
  };
  
  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: showOptions ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showOptions]);

  const handleAddOption = (option: string) => {
    setShowOptions(false);
    
    switch(option) {
      case 'password':
        navigation.navigate('AddPassword', { folders: [] });
        break;
      case 'note':
        // Note: This screen doesn't exist yet, so we'll just show a message
        alert('Note feature coming soon!');
        break;
      case 'card':
        // Card feature doesn't exist yet
        alert('Card feature coming soon!');
        break;
      default:
        break;
    }
  };

  return (
    <>
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
          onPress={() => setShowOptions(!showOptions)}
          activeOpacity={0.8}
        >
          <Animated.View
            style={{
              transform: [{
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '45deg']
                })
              }]
            }}
          >
            <Ionicons name="add" size={32} color="white" />
          </Animated.View>
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
      
      <Modal
        visible={showOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={[
            styles.optionsContainer,
            { backgroundColor: isDark ? '#2A2A2A' : 'white' }
          ]}>
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={() => handleAddOption('password')}
              activeOpacity={0.7}
            >
              <Ionicons name="key-outline" size={24} color={isDark ? '#DDDDDD' : '#333333'} />
              <Text style={[styles.optionText, { color: isDark ? '#FFFFFF' : '#333333' }]}>Add Password</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={() => handleAddOption('note')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="note-text-outline" size={24} color={isDark ? '#DDDDDD' : '#333333'} />
              <Text style={[styles.optionText, { color: isDark ? '#FFFFFF' : '#333333' }]}>Write Note</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={() => handleAddOption('card')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="credit-card-outline" size={24} color={isDark ? '#DDDDDD' : '#333333'} />
              <Text style={[styles.optionText, { color: isDark ? '#FFFFFF' : '#333333' }]}>Add Card</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.cancelButton, { backgroundColor: isDark ? '#444444' : '#F0F0F0' }]}
              onPress={() => setShowOptions(false)}
              activeOpacity={0.7}
            >
              <Text style={{ color: isDark ? '#FFFFFF' : '#333333', fontWeight: '500' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
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
    zIndex: 1,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  optionsContainer: {
    width: '80%',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    transform: [{ translateY: -20 }],
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
    borderRadius: 8,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default BottomNavBar;