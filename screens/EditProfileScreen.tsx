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
import { useAuth } from '../context/AuthContext';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Navigation } from '../navigation';
import CustomAlert from '../components/CustomAlert';

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<Navigation<'EditProfile'>>();
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();
  const isDark = theme === 'dark';
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
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
  
  const handleSave = async () => {
    // Validate inputs
    if (!name.trim()) {
      showAlert('Error', 'Name cannot be empty');
      return;
    }
    
    if (!email.trim()) {
      showAlert('Error', 'Email cannot be empty');
      return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      showAlert('Error', 'Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (!user) {
        throw new Error('User not found');
      }
      
      // Update the user profile using the context function
      const updatedUser = {
        ...user,
        name,
        email
      };
      
      const success = await updateUser(updatedUser);
      
      if (success) {
        showAlert(
          'Success',
          'Profile updated successfully',
          [{ 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }]
        );
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      showAlert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
          Edit Profile
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
          {/* Profile Avatar */}
          <View style={styles.avatarContainer}>
            <View style={[styles.profileAvatar, { backgroundColor: isDark ? '#7B68EE' : '#6A5ACD' }]}>
              <Text style={styles.profileInitial}>
                {name ? name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          
          {/* Form Fields */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: isDark ? '#AAAAAA' : '#666666' }]}>
              Name
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
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={isDark ? '#666666' : '#999999'}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: isDark ? '#AAAAAA' : '#666666' }]}>
              Email
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
              value={email}
              onChangeText={setEmail}
              placeholder="Your email"
              placeholderTextColor={isDark ? '#666666' : '#999999'}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: isDark ? '#7B68EE' : '#6A5ACD' },
              isLoading && { opacity: 0.7 }
            ]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : 'Save Changes'}
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 40,
    color: 'white',
    fontWeight: 'bold',
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

export default EditProfileScreen; 