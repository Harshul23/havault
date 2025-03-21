import React, { useState, useRef, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Image
} from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Navigation } from '../navigation';
import CustomModal from '../components/CustomModal';

const RegisterScreen = () => {
  const navigation = useNavigation<Navigation<'Register'>>();
  const { register, googleSignIn, isAuthenticating } = useAuth();
  const { theme } = useTheme();
  // Force dark theme for register screen
  const isDark = true; // Always use dark theme regardless of system setting

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Custom modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info' | 'confirm'
  });
  
  const showModal = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' | 'confirm') => {
    setModalContent({ title, message, type });
    setModalVisible(true);
  };

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      showModal('Error', 'Please fill in all fields', 'error');
      return;
    }

    if (!validateEmail(email)) {
      showModal('Invalid Email', 'Please enter a valid email address', 'error');
      return;
    }

    if (!validatePassword(password)) {
      showModal('Weak Password', 'Password must be at least 8 characters long', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showModal('Password Mismatch', 'Passwords do not match', 'error');
      return;
    }

    Keyboard.dismiss();

    try {
      const success = await register(email, password, name);
      
      if (success) {
        showModal(
          'Registration Successful',
          'Your account has been created successfully!',
          'success'
        );
        // Navigate to home after they dismiss the modal
        setModalVisible(false);
        navigation.navigate('Home');
      } else {
        showModal('Registration Failed', 'Failed to create account. Please try again.', 'error');
      }
    } catch (error) {
      console.error(error);
      showModal('Error', 'An unexpected error occurred. Please try again.', 'error');
    }
  };
  
  const handleGoogleSignUp = async () => {
    try {
      const success = await googleSignIn();
      
      if (success) {
        // The auth context will handle setting the user details
        navigation.navigate('Home');
      } else {
        showModal('Sign Up Failed', 'Google sign up was cancelled or failed', 'error');
      }
    } catch (error) {
      console.error(error);
      showModal('Error', 'An unexpected error occurred with Google sign up', 'error');
    }
  };

  // Add isMounted ref to prevent animations on unmounted components
  const isMounted = useRef(true);
  
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {isMounted.current && (
              <Animated.View 
                entering={FadeInDown.duration(600).springify()}
                style={styles.logoContainer}
              >
                {isMounted.current && (
                  <Animated.View 
                    entering={FadeInDown.delay(200).duration(1000)}
                    style={[styles.logoBackground, { backgroundColor: isDark ? '#7B68EE' : '#6A5ACD' }]}
                  >
                    <FontAwesome5 name="shield-alt" size={48} color="white" />
                  </Animated.View>
                )}
                <Text style={[styles.logoText, { color: isDark ? '#FFFFFF' : '#333333' }]}>
                  Havault
                </Text>
                <Text style={[styles.logoSubtext, { color: isDark ? '#AAAAAA' : '#666666' }]}>
                  Create Your Account
                </Text>
              </Animated.View>
            )}
            
            {/* Form Inputs - with rounded corners */}
            {isMounted.current && (
              <Animated.View 
                entering={FadeInUp.delay(400).duration(600).springify()}
                style={styles.formContainer}
              >
                <View style={styles.inputContainer}>
                  <View style={[
                    styles.inputWrapper,
                    { backgroundColor: isDark ? '#2A2A2A' : 'white', borderRadius: 12 }
                  ]}>
                    <FontAwesome5 
                      name="user" 
                      size={16} 
                      color={isDark ? '#AAAAAA' : '#999999'} 
                      style={styles.inputIcon} 
                    />
                    <TextInput 
                      style={[
                        styles.input,
                        { color: isDark ? '#FFFFFF' : '#333333' }
                      ]}
                      placeholder="Full Name" 
                      placeholderTextColor={isDark ? '#666666' : '#999999'}
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                </View>
                
                <View style={styles.inputContainer}>
                  <View style={[
                    styles.inputWrapper,
                    { backgroundColor: isDark ? '#2A2A2A' : 'white', borderRadius: 12 }
                  ]}>
                    <FontAwesome5 
                      name="envelope" 
                      size={16} 
                      color={isDark ? '#AAAAAA' : '#999999'} 
                      style={styles.inputIcon} 
                    />
                    <TextInput 
                      style={[
                        styles.input,
                        { color: isDark ? '#FFFFFF' : '#333333' }
                      ]}
                      placeholder="Email" 
                      placeholderTextColor={isDark ? '#666666' : '#999999'}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>
              
                <View style={styles.inputContainer}>
                  <View style={[
                    styles.inputWrapper,
                    { backgroundColor: isDark ? '#2A2A2A' : 'white', borderRadius: 12 }
                  ]}>
                    <FontAwesome5 
                      name="lock" 
                      size={16} 
                      color={isDark ? '#AAAAAA' : '#999999'} 
                      style={styles.inputIcon} 
                    />
                    <TextInput
                      style={[
                        styles.input,
                        { color: isDark ? '#FFFFFF' : '#333333' }
                      ]}
                      placeholder="Password" 
                      placeholderTextColor={isDark ? '#666666' : '#999999'}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      style={styles.passwordToggle}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <FontAwesome5 
                        name={showPassword ? 'eye-slash' : 'eye'} 
                        size={16} 
                        color={isDark ? '#AAAAAA' : '#999999'} 
                      />
                    </TouchableOpacity>
                  </View>
                  {password && !validatePassword(password) && (
                    <Text style={styles.errorText}>
                      Password must be at least 8 characters
                    </Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <View style={[
                    styles.inputWrapper,
                    { backgroundColor: isDark ? '#2A2A2A' : 'white', borderRadius: 12 }
                  ]}>
                    <FontAwesome5 
                      name="lock" 
                      size={16} 
                      color={isDark ? '#AAAAAA' : '#999999'} 
                      style={styles.inputIcon} 
                    />
                    <TextInput
                      style={[
                        styles.input,
                        { color: isDark ? '#FFFFFF' : '#333333' }
                      ]}
                      placeholder="Confirm Password" 
                      placeholderTextColor={isDark ? '#666666' : '#999999'}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                      style={styles.passwordToggle}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <FontAwesome5 
                        name={showConfirmPassword ? 'eye-slash' : 'eye'} 
                        size={16} 
                        color={isDark ? '#AAAAAA' : '#999999'} 
                      />
                    </TouchableOpacity>
                  </View>
                  {confirmPassword && password !== confirmPassword && (
                    <Text style={styles.errorText}>
                      Passwords do not match
                    </Text>
                  )}
                </View>
                
                {/* Register Button */}
                <TouchableOpacity 
                  style={[
                    styles.button,
                    { backgroundColor: isDark ? '#7B68EE' : '#6A5ACD' },
                    isAuthenticating && { opacity: 0.7 }
                  ]}
                  onPress={handleRegister}
                  disabled={isAuthenticating}
                >
                  {isAuthenticating ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Create Account</Text>
                  )}
                </TouchableOpacity>
                
                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={[styles.divider, { backgroundColor: isDark ? '#333333' : '#E0E0E0' }]} />
                  <Text style={[styles.dividerText, { color: isDark ? '#AAAAAA' : '#999999' }]}>
                    OR
                  </Text>
                  <View style={[styles.divider, { backgroundColor: isDark ? '#333333' : '#E0E0E0' }]} />
                </View>
                
                {/* Google Sign Up Button */}
                <TouchableOpacity 
                  style={[
                    styles.socialButton,
                    { 
                      backgroundColor: isDark ? '#2A2A2A' : 'white',
                      borderColor: isDark ? '#333333' : '#E0E0E0' 
                    }
                  ]}
                  onPress={handleGoogleSignUp}
                  disabled={isAuthenticating}
                >
                  <Image 
                    source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }}
                    style={styles.googleIcon}
                    resizeMode="contain"
                  />
                  <Text style={[
                    styles.socialButtonText,
                    { color: isDark ? '#FFFFFF' : '#333333' }
                  ]}>
                    Sign up with Google
                  </Text>
                </TouchableOpacity>
                
                {/* Login Link */}
                <View style={styles.loginContainer}>
                  <Text style={[styles.loginText, { color: isDark ? '#AAAAAA' : '#666666' }]}>
                    Already have an account?
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={[styles.loginLink, { color: isDark ? '#7B68EE' : '#6A5ACD' }]}>
                      {' Sign In'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
        
        {/* Custom Modal */}
        <CustomModal
          visible={modalVisible}
          title={modalContent.title}
          message={modalContent.message}
          type={modalContent.type}
          isDark={isDark}
          onDismiss={() => setModalVisible(false)}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  logoSubtext: {
    fontSize: 16,
    marginTop: 8,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputIcon: {
    marginHorizontal: 12,
    width: 20,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    paddingVertical: 12,
  },
  passwordToggle: {
    padding: 8,
    marginRight: 4,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
  },
  socialButton: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
});

export default RegisterScreen;