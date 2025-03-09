import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../context/ThemeContext';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Navigation } from '../navigation';
import { usePassword } from '../PasswordContext';

const AddPasswordScreen = () => {
  const navigation = useNavigation<Navigation<'AddPassword'>>();
  const route = useRoute();
  const { folders } = (route.params || { folders: ['Personal', 'Work', 'Finance'] }) as { folders: string[] };
  const { theme } = useTheme();
  const { addPassword } = usePassword();
  const isDark = theme === 'dark';
  
  const [website, setWebsite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [folder, setFolder] = useState(folders[0] || 'Personal');
  const [showPassword, setShowPassword] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  
  const generateRandomPassword = () => {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=";
    let newPassword = "";
    for (let i = 0; i < length; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setPassword(newPassword);
  };
  
  interface PasswordStrength {
    (pwd: string): 'Weak' | 'Medium' | 'Strong';
  }

  const checkPasswordStrength: PasswordStrength = (pwd) => {
    if (!pwd) return 'Weak';

    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*()_\-+=]/.test(pwd);
    const isLongEnough = pwd.length >= 8;

    const score = [hasLower, hasUpper, hasNumber, hasSpecial, isLongEnough].filter(Boolean).length;

    if (score <= 2) return 'Weak';
    if (score <= 4) return 'Medium';
    return 'Strong';
  };
  
  const passwordStrength = checkPasswordStrength(password);
  
  interface StrengthColor {
    (strength: 'Weak' | 'Medium' | 'Strong'): string;
  }

  const getStrengthColor: StrengthColor = (strength) => {
    switch (strength) {
      case 'Strong':
        return '#4CAF50';
      case 'Medium':
        return '#FFC107';
      case 'Weak':
        return '#F44336';
      default:
        return '#4CAF50';
    }
  };
  
  const strengthColor = getStrengthColor(passwordStrength);
  
  const handleSave = async () => {
    if (!website || !username || !password) {
      Alert.alert('Incomplete Information', 'Please fill in all required fields.');
      return;
    }
    
    try {
      await addPassword({
        title: website,
        website,
        username,
        password,
        notes,
        folder,
        dateAdded: new Date().toISOString(),
        strength: passwordStrength
      });
      
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save password:', error);
      Alert.alert('Error', 'Failed to save password. Please try again.');
    }
  };
  
  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1E1E1E' : 'white' }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons 
            name="close" 
            size={24} 
            color={isDark ? '#DDDDDD' : '#333333'} 
          />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#333333' }]}>
          Add Password
        </Text>
        
        <TouchableOpacity 
          style={[
            styles.saveButton, 
            { opacity: (!website || !username || !password) ? 0.5 : 1 }
          ]} 
          onPress={handleSave}
          disabled={!website || !username || !password}
        >
          <Text style={[styles.saveButtonText, { color: isDark ? '#7B68EE' : '#6A5ACD' }]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <Animated.View entering={FadeIn.duration(300)}>
          {/* Input Fields */}
          <View style={[styles.card, { backgroundColor: isDark ? '#2A2A2A' : 'white' }]}>
            <Text style={[styles.inputLabel, { color: isDark ? '#AAAAAA' : '#666666' }]}>
              WEBSITE
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: isDark ? '#333333' : '#F5F5F5',
                  color: isDark ? '#FFFFFF' : '#333333'
                }
              ]}
              placeholder="Enter website (e.g. facebook.com)"
              placeholderTextColor={isDark ? '#777777' : '#999999'}
              value={website}
              onChangeText={setWebsite}
              autoCapitalize="none"
              keyboardType="url"
            />
            
            <Text style={[styles.inputLabel, { color: isDark ? '#AAAAAA' : '#666666', marginTop: 16 }]}>
              USERNAME
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: isDark ? '#333333' : '#F5F5F5',
                  color: isDark ? '#FFFFFF' : '#333333'
                }
              ]}
              placeholder="Enter username or email"
              placeholderTextColor={isDark ? '#777777' : '#999999'}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            
            <Text style={[styles.inputLabel, { color: isDark ? '#AAAAAA' : '#666666', marginTop: 16 }]}>
              PASSWORD
            </Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[
                  styles.passwordInput,
                  { 
                    backgroundColor: isDark ? '#333333' : '#F5F5F5',
                    color: isDark ? '#FFFFFF' : '#333333'
                  }
                ]}
                placeholder="Enter password"
                placeholderTextColor={isDark ? '#777777' : '#999999'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={styles.visibilityButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={isDark ? '#AAAAAA' : '#666666'} 
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.strengthContainer}>
              <View style={styles.strengthLabelContainer}>
                <Text style={[styles.strengthLabel, { color: isDark ? '#AAAAAA' : '#666666' }]}>
                  PASSWORD STRENGTH
                </Text>
                <Text style={[styles.strengthText, { color: strengthColor }]}>
                  {passwordStrength}
                </Text>
              </View>
              <View style={[styles.strengthBar, { backgroundColor: isDark ? '#333333' : '#E0E0E0' }]}>
                <View 
                  style={[
                    styles.strengthFill, 
                    { 
                      backgroundColor: strengthColor,
                      width: passwordStrength === 'Weak' ? '33%' : passwordStrength === 'Medium' ? '66%' : '100%'
                    }
                  ]} 
                />
              </View>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.generateButton, 
                { backgroundColor: isDark ? '#333333' : '#F0F0F0' }
              ]}
              onPress={generateRandomPassword}
            >
              <Ionicons name="refresh-outline" size={16} color={isDark ? '#DDDDDD' : '#333333'} />
              <Text style={[styles.generateButtonText, { color: isDark ? '#DDDDDD' : '#333333' }]}>
                Generate Strong Password
              </Text>
            </TouchableOpacity>
            
            <Text style={[styles.inputLabel, { color: isDark ? '#AAAAAA' : '#666666', marginTop: 16 }]}>
              FOLDER
            </Text>
            <TouchableOpacity 
              style={[
                styles.folderButton, 
                { backgroundColor: isDark ? '#333333' : '#F5F5F5' }
              ]}
              onPress={() => setShowFolderPicker(!showFolderPicker)}
            >
              <View style={styles.folderButtonContent}>
                <MaterialCommunityIcons 
                  name="folder-outline" 
                  size={20} 
                  color={isDark ? '#AAAAAA' : '#666666'} 
                />
                <Text style={[styles.folderButtonText, { color: isDark ? '#FFFFFF' : '#333333' }]}>
                  {folder}
                </Text>
              </View>
              <Ionicons 
                name={showFolderPicker ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={isDark ? '#AAAAAA' : '#666666'} 
              />
            </TouchableOpacity>
            
            {showFolderPicker && (
              <View style={[
                styles.pickerContainer, 
                { backgroundColor: isDark ? '#333333' : '#F5F5F5' }
              ]}>
                {folders.map((folderName) => (
                  <TouchableOpacity 
                    key={folderName}
                    style={[
                      styles.pickerItem,
                      folder === folderName && {
                        backgroundColor: isDark ? '#444444' : '#E5E5E5'
                      }
                    ]}
                    onPress={() => {
                      setFolder(folderName);
                      setShowFolderPicker(false);
                    }}
                  >
                    <Text style={{ color: isDark ? '#FFFFFF' : '#333333' }}>
                      {folderName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            <Text style={[styles.inputLabel, { color: isDark ? '#AAAAAA' : '#666666', marginTop: 16 }]}>
              NOTES (OPTIONAL)
            </Text>
            <TextInput
              style={[
                styles.notesInput,
                { 
                  backgroundColor: isDark ? '#333333' : '#F5F5F5',
                  color: isDark ? '#FFFFFF' : '#333333',
                  height: 100,
                  textAlignVertical: 'top'
                }
              ]}
              placeholder="Add notes (optional)"
              placeholderTextColor={isDark ? '#777777' : '#999999'}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  saveButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  visibilityButton: {
    position: 'absolute',
    right: 12,
    height: 50,
    justifyContent: 'center',
  },
  strengthContainer: {
    marginTop: 12,
    marginBottom: 16,
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
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 8,
    marginBottom: 16,
  },
  generateButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  folderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  folderButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderButtonText: {
    marginLeft: 10,
    fontSize: 16,
  },
  pickerContainer: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  pickerItem: {
    padding: 12,
  },
  notesInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
  },
});

export default AddPasswordScreen;