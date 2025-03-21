import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Linking,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../context/ThemeContext';
import { Navigation, RootStackParamList, PasswordType } from '../navigation';
import { usePassword } from '../PasswordContext';
import CustomModal from '../components/CustomModal';
import SafeScreenWrapper from '../components/SafeScreenWrapper';
import { useIsMountedRef } from '../utils/animationUtils';

type RouteParams = {
  password: PasswordType;
};

const PasswordDetailScreen = () => {
  const navigation = useNavigation<Navigation<'PasswordDetail'>>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { password: initialPassword } = route.params;
  const { theme } = useTheme();
  const { deletePassword, passwords } = usePassword();
  const isDark = theme === 'dark';
  const isMounted = useIsMountedRef();
  const isFocused = useIsFocused();
  
  // Store the password in local state and ensure it's updated when changed
  const [password, setPassword] = useState<PasswordType>(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [usernameCopied, setUsernameCopied] = useState(false);
  
  // Update local password state when it changes in the context
  useEffect(() => {
    if (isMounted.current && isFocused) {
    const updatedPassword = passwords.find(p => p.id === initialPassword.id);
    if (updatedPassword) {
      setPassword(updatedPassword);
    }
    }
  }, [passwords, initialPassword.id, isFocused]);
  
  // Clean up timers and state when unmounting
  useEffect(() => {
    return () => {
      setPasswordCopied(false);
      setUsernameCopied(false);
      setShowPassword(false);
    };
  }, []);
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    type: 'confirm' as 'success' | 'error' | 'warning' | 'info' | 'confirm'
  });
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  const copyToClipboard = async (text: string, type: 'password' | 'username'): Promise<void> => {
    try {
      await Clipboard.setStringAsync(text);
      if (type === 'password') {
        setPasswordCopied(true);
        setTimeout(() => setPasswordCopied(false), 2000);
      } else {
        setUsernameCopied(true);
        setTimeout(() => setUsernameCopied(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setModalContent({
        title: 'Error',
        message: 'Failed to copy to clipboard. Please try again.',
        type: 'error'
      });
      setModalVisible(true);
    }
  };
  
  const handleEdit = () => {
    navigation.navigate('EditPassword', { password });
  };
  
  const confirmDelete = () => {
    setModalContent({
      title: 'Delete Password',
      message: 'Are you sure you want to delete the password for ' + password.website + '?',
      type: 'confirm'
    });
    setModalVisible(true);
  };
  
  const handleDelete = async () => {
    try {
      await deletePassword(password.id);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to delete password:', error);
      setModalContent({
        title: 'Error',
        message: 'Failed to delete password. Please try again.',
        type: 'error'
      });
      setModalVisible(true);
    }
  };
  
  interface StrengthColors {
    Strong: string;
    Medium: string;
    Weak: string;
    [key: string]: string;
  }

  const strengthColors: StrengthColors = {
    Strong: '#4CAF50',
    Medium: '#FFC107',
    Weak: '#F44336',
  };

  const getStrengthColor = (strength: 'Strong' | 'Medium' | 'Weak' | undefined): string => {
    return strengthColors[strength || 'Strong'];
  };
  
  const strengthColor = getStrengthColor(password.strength || 'Strong');
  
  interface GetWebsiteURL {
    (website: string): string;
  }

  const getWebsiteURL: GetWebsiteURL = (website) => {
    if (!website) return '';
    if (website.startsWith('http://') || website.startsWith('https://')) {
      return website;
    }
    return 'https://' + website;
  };
  
  const openWebsite = () => {
    const url = getWebsiteURL(password.website);
    // In a real app, we would open the URL
    try {
      Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };
  
  // Utility function to dismiss keyboard with better handling
  const dismissKeyboard = () => {
    // Use a slight delay to ensure smooth transition when dismissing keyboard
    setTimeout(() => {
      Keyboard.dismiss();
    }, 0);
  };
  
  // Use a consistent background color variable
  const screenBackgroundColor = isDark ? '#121212' : '#F5F5F5';
  
  return (
    <SafeScreenWrapper>
      <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: screenBackgroundColor }]}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
          <View style={{ flex: 1, backgroundColor: screenBackgroundColor }}>
            {/* Header with top padding */}
            <View style={[
              styles.header, 
              { 
                backgroundColor: isDark ? '#1E1E1E' : 'white',
                paddingTop: Platform.OS === 'ios' ? 50 : 30 // Add top padding here
              }
            ]}>
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
                Password Details
              </Text>
              
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
                  <Ionicons 
                    name="pencil" 
                    size={22} 
                    color={isDark ? '#DDDDDD' : '#333333'} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton} onPress={confirmDelete}>
                  <Ionicons 
                    name="trash-outline" 
                    size={22} 
                    color={isDark ? '#DDDDDD' : '#333333'} 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Wrap ScrollView in a View for consistent background */}
            <View style={{ 
              flex: 1, 
              backgroundColor: screenBackgroundColor 
            }}>
              <ScrollView 
                style={[styles.content, { backgroundColor: screenBackgroundColor }]}
                contentContainerStyle={{ 
                  paddingBottom: 20,
                  backgroundColor: screenBackgroundColor 
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                keyboardDismissMode="on-drag"
              >
                {/* Website Card */}
                <View style={[styles.card, { backgroundColor: isDark ? '#2A2A2A' : 'white' }]}>
                  <Text style={[styles.cardLabel, { color: isDark ? '#AAAAAA' : '#666666' }]}>
                    WEBSITE
                  </Text>
                  <Text style={[styles.websiteText, { color: isDark ? '#FFFFFF' : '#333333' }]}>
                    {password.website}
                  </Text>
                  
                  <TouchableOpacity 
                    style={[styles.websiteButton, { backgroundColor: isDark ? '#333333' : '#F0F0F0' }]}
                    onPress={openWebsite}
                  >
                    <Ionicons name="open-outline" size={16} color={isDark ? '#DDDDDD' : '#333333'} />
                    <Text style={[styles.websiteButtonText, { color: isDark ? '#DDDDDD' : '#333333' }]}>
                      Open Website
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* Username Card */}
                <View style={[styles.card, { backgroundColor: isDark ? '#2A2A2A' : 'white' }]}>
                  <Text style={[styles.cardLabel, { color: isDark ? '#AAAAAA' : '#666666' }]}>
                    USERNAME
                  </Text>
                  <View style={styles.credentialRow}>
                    <Text style={[styles.credentialText, { color: isDark ? '#FFFFFF' : '#333333' }]}>
                      {password.username}
                    </Text>
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={() => copyToClipboard(password.username, 'username')}
                    >
                      <Ionicons 
                        name={usernameCopied ? "checkmark" : "copy-outline"} 
                        size={20} 
                        color={usernameCopied ? "#4CAF50" : (isDark ? '#AAAAAA' : '#666666')} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Password Card */}
                <View style={[styles.card, { backgroundColor: isDark ? '#2A2A2A' : 'white' }]}>
                  <Text style={[styles.cardLabel, { color: isDark ? '#AAAAAA' : '#666666' }]}>
                    PASSWORD
                  </Text>
                  <View style={styles.credentialRow}>
                    <Text style={[styles.credentialText, { color: isDark ? '#FFFFFF' : '#333333' }]}>
                      {showPassword ? password.password : '••••••••••••••'}
                    </Text>
                    <View style={styles.passwordActions}>
                      <TouchableOpacity 
                        style={styles.visibilityButton}
                        onPress={toggleShowPassword}
                      >
                        <Ionicons 
                          name={showPassword ? "eye-off-outline" : "eye-outline"} 
                          size={20} 
                          color={isDark ? '#AAAAAA' : '#666666'} 
                        />
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.copyButton}
                        onPress={() => copyToClipboard(password.password, 'password')}
                      >
                        <Ionicons 
                          name={passwordCopied ? "checkmark" : "copy-outline"} 
                          size={20} 
                          color={passwordCopied ? "#4CAF50" : (isDark ? '#AAAAAA' : '#666666')} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthLabelContainer}>
                      <Text style={[styles.strengthLabel, { color: isDark ? '#AAAAAA' : '#666666' }]}>
                        STRENGTH
                      </Text>
                      <Text style={[styles.strengthText, { color: strengthColor }]}>
                        {password.strength || 'Strong'}
                      </Text>
                    </View>
                    <View style={[styles.strengthBar, { backgroundColor: isDark ? '#333333' : '#E0E0E0' }]}>
                      <View 
                        style={[
                          styles.strengthFill, 
                          { 
                            backgroundColor: strengthColor,
                            width: password.strength === 'Weak' ? '33%' : password.strength === 'Medium' ? '66%' : '100%'
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
                
                {/* Additional Info Card */}
                <View style={[styles.card, { backgroundColor: isDark ? '#2A2A2A' : 'white' }]}>
                  <Text style={[styles.cardLabel, { color: isDark ? '#AAAAAA' : '#666666' }]}>
                    ADDITIONAL INFORMATION
                  </Text>
                  
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="folder-outline" size={16} color={isDark ? '#AAAAAA' : '#666666'} />
                    <Text style={[styles.infoText, { color: isDark ? '#FFFFFF' : '#333333' }]}>
                      Folder: {password.folder}
                    </Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="calendar" size={16} color={isDark ? '#AAAAAA' : '#666666'} />
                    <Text style={[styles.infoText, { color: isDark ? '#AAAAAA' : '#666666' }]}>
                      Added: {formatDate(password.dateAdded)}
                    </Text>
                  </View>
                  
                  {password.lastModified && (
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="update" size={16} color={isDark ? '#AAAAAA' : '#666666'} />
                      <Text style={[styles.infoText, { color: isDark ? '#AAAAAA' : '#666666' }]}>
                        Modified: {formatDate(password.lastModified)}
                      </Text>
                    </View>
                  )}
                  
                  {password.notes && (
                    <View style={styles.notesContainer}>
                      <Text style={[styles.notesLabel, { color: isDark ? '#AAAAAA' : '#666666' }]}>
                        NOTES
                      </Text>
                      <Text style={[styles.notesText, { color: isDark ? '#FFFFFF' : '#333333' }]}>
                        {password.notes}
                      </Text>
                    </View>
                  )}
                </View>
                
                {/* Add bottom padding */}
                <View style={{ height: 50, backgroundColor: screenBackgroundColor, width: '100%' }} />
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
        
        {/* CustomModal for delete confirmation */}
        <CustomModal
          visible={modalVisible}
          title={modalContent.title}
          message={modalContent.message}
          type={modalContent.type}
          isDark={isDark}
          onDismiss={() => setModalVisible(false)}
          onConfirm={handleDelete}
          confirmText="Delete"
          cancelText="Cancel"
        />
      </KeyboardAvoidingView>
    </View>
    </SafeScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 25,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 15,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
  },
  card: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  websiteText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 4,
  },
  websiteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  credentialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  credentialText: {
    fontSize: 18,
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyButton: {
    padding: 8,
  },
  passwordActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visibilityButton: {
    padding: 8,
    marginRight: 4,
  },
  strengthContainer: {
    marginTop: 16,
  },
  strengthLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '700',
  },
  strengthBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
  },
  notesContainer: {
    marginTop: 16,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default PasswordDetailScreen;