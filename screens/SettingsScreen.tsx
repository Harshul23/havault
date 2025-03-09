import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Switch,
  ScrollView,
  Linking
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Navigation } from '../navigation';
import CustomModal from '../components/CustomModal';

const SettingsScreen = () => {
  const navigation = useNavigation<Navigation<'Settings'>>();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const isDark = theme === 'dark';
  
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info' | 'confirm',
    action: '' as 'logout' | 'clearData' | 'none' | 'privacyPolicy' | 'about'
  });
  
  const toggleBiometrics = () => {
    setBiometricsEnabled(!biometricsEnabled);
    // In a real app, we'd save this to AsyncStorage or another persistence mechanism
  };
  
  const toggleAutoLock = () => {
    setAutoLockEnabled(!autoLockEnabled);
    // In a real app, we'd save this to AsyncStorage or another persistence mechanism
  };
  
  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    // In a real app, we'd save this to AsyncStorage or another persistence mechanism
  };
  
  const showModal = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' | 'confirm', action: 'logout' | 'clearData' | 'none' | 'privacyPolicy' | 'about' = 'none') => {
    setModalContent({ title, message, type, action });
    setModalVisible(true);
  };
  
  const handleConfirm = async () => {
    const { action } = modalContent;
    setModalVisible(false);
    
    if (action === 'logout') {
      if (logout) {
        await logout();
      }
      navigation.navigate('Login');
    } else if (action === 'clearData') {
      try {
        if (user) {
          const userPasswordsKey = `passwords_${user.id}`;
          const userFoldersKey = `folders_${user.id}`;
          
          await AsyncStorage.removeItem(userPasswordsKey);
          
          // Keep default folders
          const defaultFolders = ['Personal', 'Work', 'Finance'];
          await AsyncStorage.setItem(userFoldersKey, JSON.stringify(defaultFolders));
          
          showModal('Success', 'All data has been cleared successfully', 'success');
        }
      } catch (error) {
        console.error('Failed to clear data:', error);
        showModal('Error', 'Failed to clear data. Please try again.', 'error');
      }
    }
  };
  
  const clearAllData = () => {
    showModal(
      'Clear All Data',
      'Are you sure you want to clear all saved passwords and folders? This action cannot be undone.',
      'confirm',
      'clearData'
    );
  };
  
  const handleLogout = () => {
    showModal(
      'Log Out',
      'Are you sure you want to log out?',
      'confirm',
      'logout'
    );
  };
  
  const showPrivacyPolicy = () => {
    showModal(
      'Privacy Policy',
      'Havault respects your privacy and is committed to protecting your personal data. All your passwords are encrypted and stored locally on your device. We do not collect or store any of your passwords on our servers. Your biometric data is processed by your device and never shared with us. We may collect anonymous usage statistics to improve the app, but this data cannot be linked to your identity.',
      'info',
      'privacyPolicy'
    );
  };
  
  const showAboutHavault = () => {
    showModal(
      'About Havault',
      'Havault v3.0 is a secure password manager designed to help you store, manage, and protect your passwords. Our mission is to provide a simple yet powerful solution for your password security needs. Havault encrypts all your data using AES-256 encryption and stores it locally on your device. The app was developed by team Harvist passionate about security and user experience. For support, please contact: support@havault.com',
      'info',
      'about'
    );
  };
  
  const renderSettingItem = (
    icon: string, 
    title: string, 
    description: string, 
    value: boolean, 
    onToggle: () => void
  ) => (
    <View style={[styles.settingItem, { backgroundColor: isDark ? '#2A2A2A' : 'white' }]}>
      <View style={styles.settingIconContainer}>
        {icon}
      </View>
      
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: isDark ? '#FFFFFF' : '#333333' }]}>
          {title}
        </Text>
        {description && (
          <Text style={[styles.settingDescription, { color: isDark ? '#AAAAAA' : '#666666' }]}>
            {description}
          </Text>
        )}
      </View>
      
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#767577', true: isDark ? '#7B68EE80' : '#6A5ACD80' }}
        thumbColor={value ? (isDark ? '#7B68EE' : '#6A5ACD') : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
      />
    </View>
  );
  
  const renderActionItem = (
    icon: string, 
    title: string, 
    description: string, 
    onPress: () => void, 
    destructive: boolean = false
  ) => (
    <TouchableOpacity 
      style={[styles.settingItem, { backgroundColor: isDark ? '#2A2A2A' : 'white' }]}
      onPress={onPress}
    >
      <View style={styles.settingIconContainer}>
        {icon}
      </View>
      
      <View style={styles.settingInfo}>
        <Text 
          style={[
            styles.settingTitle, 
            { 
              color: destructive 
                ? '#F44336' 
                : (isDark ? '#FFFFFF' : '#333333') 
            }
          ]}
        >
          {title}
        </Text>
        {description && (
          <Text style={[styles.settingDescription, { color: isDark ? '#AAAAAA' : '#666666' }]}>
            {description}
          </Text>
        )}
      </View>
      
      <Ionicons 
        name="chevron-forward" 
        size={20} 
        color={destructive ? '#F44336' : (isDark ? '#AAAAAA' : '#666666')} 
      />
    </TouchableOpacity>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1E1E1E' : 'white' }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={isDark ? '#DDDDDD' : '#333333'} 
          />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#333333' }]}>
          Settings
        </Text>
        
        <View style={{ width: 30 }} /> {/* Spacer for center alignment */}
      </View>
      
      <ScrollView style={styles.content}>
        <Animated.View entering={FadeIn.duration(300)}>
          {/* Account Section */}
          <Text style={[styles.sectionTitle, { color: isDark ? '#AAAAAA' : '#666666' }]}>
            ACCOUNT
          </Text>
          
          <View style={[styles.profileCard, { backgroundColor: isDark ? '#2A2A2A' : 'white' }]}>
            <View style={styles.profileInfo}>
              <View style={[styles.profileAvatar, { backgroundColor: isDark ? '#7B68EE' : '#6A5ACD' }]}>
                <Text style={styles.profileInitial}>
                  {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              
              <View>
                <Text style={[styles.profileName, { color: isDark ? '#FFFFFF' : '#333333' }]}>
                  {user?.name || 'User'}
                </Text>
                <Text style={[styles.profileEmail, { color: isDark ? '#AAAAAA' : '#666666' }]}>
                  {user?.email || 'user@example.com'}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.editProfileButton, { borderColor: isDark ? '#333333' : '#E0E0E0' }]}
              onPress={() => {
                console.log('Navigating to EditProfile screen');
                navigation.navigate('EditProfile');
              }}
            >
              <Text style={[styles.editProfileText, { color: isDark ? '#DDDDDD' : '#333333' }]}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Security Section */}
          <Text style={[styles.sectionTitle, { color: isDark ? '#AAAAAA' : '#666666', marginTop: 20 }]}>
            SECURITY
          </Text>
          
          {renderSettingItem(
            <MaterialCommunityIcons name="fingerprint" size={24} color={isDark ? '#7B68EE' : '#6A5ACD'} />,
            'Biometric Authentication',
            'Use fingerprint or Face ID to unlock app',
            biometricsEnabled,
            toggleBiometrics
          )}
          
          {renderSettingItem(
            <MaterialCommunityIcons name="lock-clock" size={24} color={isDark ? '#7B68EE' : '#6A5ACD'} />,
            'Auto-Lock',
            'Lock app when not in use',
            autoLockEnabled,
            toggleAutoLock
          )}
          
          {renderActionItem(
            <MaterialCommunityIcons name="key-change" size={24} color={isDark ? '#7B68EE' : '#6A5ACD'} />,
            'Change Master Password',
            'Update your primary password',
            () => navigation.navigate('ChangeMasterPassword')
          )}
          
          {/* Preferences Section */}
          <Text style={[styles.sectionTitle, { color: isDark ? '#AAAAAA' : '#666666', marginTop: 20 }]}>
            PREFERENCES
          </Text>
          
          {renderSettingItem(
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={24} color={isDark ? '#7B68EE' : '#6A5ACD'} />,
            'Dark Theme',
            'Toggle between light and dark mode',
            isDark,
            toggleTheme
          )}
          
          {renderSettingItem(
            <Ionicons name="notifications-outline" size={24} color={isDark ? '#7B68EE' : '#6A5ACD'} />,
            'Notifications',
            'Enable or disable app notifications',
            notificationsEnabled,
            toggleNotifications
          )}
          
          {/* About Section */}
          <Text style={[styles.sectionTitle, { color: isDark ? '#AAAAAA' : '#666666', marginTop: 20 }]}>
            ABOUT
          </Text>
          
          {renderActionItem(
            <MaterialIcons name="privacy-tip" size={24} color={isDark ? '#7B68EE' : '#6A5ACD'} />,
            'Privacy Policy',
            'Read our privacy policy',
            showPrivacyPolicy
          )}
          
          {renderActionItem(
            <Ionicons name="information-circle-outline" size={24} color={isDark ? '#7B68EE' : '#6A5ACD'} />,
            'About Havault',
            'App information and credits',
            showAboutHavault
          )}
          
          {renderActionItem(
            <MaterialIcons name="rate-review" size={24} color={isDark ? '#7B68EE' : '#6A5ACD'} />,
            'Rate the App',
            'Let us know how we\'re doing',
            () => Linking.openURL('https://play.google.com/store/apps/details?id=com.havault')
          )}
          
          {/* Data Management Section */}
          <Text style={[styles.sectionTitle, { color: isDark ? '#AAAAAA' : '#666666', marginTop: 20 }]}>
            DATA MANAGEMENT
          </Text>
          
          {renderActionItem(
            <MaterialCommunityIcons name="database-export" size={24} color={isDark ? '#7B68EE' : '#6A5ACD'} />,
            'Export Data',
            'Export your passwords as CSV',
            () => console.log('Export data')
          )}
          
          {renderActionItem(
            <MaterialCommunityIcons name="database-import" size={24} color={isDark ? '#7B68EE' : '#6A5ACD'} />,
            'Import Data',
            'Import passwords from CSV',
            () => console.log('Import data')
          )}
          
          {renderActionItem(
            <MaterialCommunityIcons name="delete-sweep" size={24} color="#F44336" />,
            'Clear All Data',
            'Delete all passwords and folders',
            clearAllData,
            true
          )}
          
          {/* Log Out */}
          <TouchableOpacity
            style={[styles.logoutButton, { borderColor: isDark ? '#333333' : '#E0E0E0' }]}
            onPress={handleLogout}
          >
            <Text style={[styles.logoutText, { color: '#F44336' }]}>
              Log Out
            </Text>
          </TouchableOpacity>
          
          <View style={styles.versionInfo}>
            <Text style={[styles.versionText, { color: isDark ? '#777777' : '#999999' }]}>
              Version 3.0.0
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Custom Modal for confirmations and info */}
      <CustomModal
        visible={modalVisible}
        title={modalContent.title}
        message={modalContent.message}
        type={modalContent.type}
        isDark={isDark}
        onDismiss={() => setModalVisible(false)}
        onConfirm={handleConfirm}
        confirmText={modalContent.action === 'logout' ? 'Log Out' : 'Confirm'}
        cancelText="Cancel"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.7,
  },
  profileCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  profileInitial: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
  },
  editProfileButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  editProfileText: {
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingIconContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 10,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 3,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  versionInfo: {
    alignItems: 'center',
    marginVertical: 20,
  },
  versionText: {
    fontSize: 13,
  },
});

export default SettingsScreen;