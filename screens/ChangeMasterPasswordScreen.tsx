import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Navigation } from '../navigation';
import CustomAlert from '../components/CustomAlert';

const ChangeMasterPasswordScreen: React.FC = () => {
  const navigation = useNavigation<Navigation<'ChangeMasterPassword'>>();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    buttons: [{ text: 'OK' }]
  });
  
  const showAlert = (title: string, message: string, buttons = [{ text: 'OK' }]) => {
    setAlertConfig({ title, message, buttons });
    setAlertVisible(true);
  };
  
  const handleChangePassword = async () => {
    // Validate inputs
    if (!currentPassword) {
      showAlert('Error', 'Current password cannot be empty');
      return;
    }
    
    if (!newPassword) {
      showAlert('Error', 'New password cannot be empty');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showAlert('Error', 'Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      showAlert('Error', 'Password must be at least 8 characters');
      return;
    }
    
    setIsLoading(true);
    
    // This would be integrated with your actual authentication system
    setTimeout(() => {
      setIsLoading(false);
      showAlert(
        'Success',
        'Master password changed successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 1500);
  };
  
  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
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
          Change Master Password
        </Text>
        
        <View style={{ width: 30 }} /> {/* Spacer for center alignment */}
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Animated.View 
          style={styles.formContainer}
          entering={FadeIn.duration(300)}
        >
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: isDark ? '#AAAAAA' : '#666666' }]}>
              Current Password
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: isDark ? '#2A2A2A' : 'white',
                  color: isDark ? '#FFFFFF' : '#333333',
                  borderColor: isDark ? '#333333' : '#E0E0E0'
                }
              ]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={isDark ? '#666666' : '#999999'}
              secureTextEntry
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: isDark ? '#AAAAAA' : '#666666' }]}>
              New Password
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: isDark ? '#2A2A2A' : 'white',
                  color: isDark ? '#FFFFFF' : '#333333',
                  borderColor: isDark ? '#333333' : '#E0E0E0'
                }
              ]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor={isDark ? '#666666' : '#999999'}
              secureTextEntry
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: isDark ? '#AAAAAA' : '#666666' }]}>
              Confirm Password
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: isDark ? '#2A2A2A' : 'white',
                  color: isDark ? '#FFFFFF' : '#333333',
                  borderColor: isDark ? '#333333' : '#E0E0E0'
                }
              ]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={isDark ? '#666666' : '#999999'}
              secureTextEntry
            />
          </View>
          
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: isDark ? '#7B68EE' : '#6A5ACD' },
              isLoading && { opacity: 0.7 }
            ]}
            onPress={handleChangePassword}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Changing...' : 'Change Password'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
      
      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={() => setAlertVisible(false)}
        isDark={isDark}
      />
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
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  formContainer: {
    marginTop: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  saveButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChangeMasterPasswordScreen; 