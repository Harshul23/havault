import React, { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Animated, { FadeInDown, FadeInUp, BounceIn } from 'react-native-reanimated';
import { Navigation } from '../navigation';
import CustomModal from '../components/CustomModal';

const LoginScreen = () => {
  const navigation = useNavigation<Navigation<'Login'>>();
  const { login, googleSignIn, isAuthenticating } = useAuth();
  const { theme, toggleTheme } = useTheme();
  // Force dark theme for login screen
  const isDark = true; // Always use dark theme regardless of system setting

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  
  // Custom modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info' | 'confirm'
  });
  
  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);
    })();
  }, []);
  
  const showModal = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' | 'confirm') => {
    setModalContent({ title, message, type });
    setModalVisible(true);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showModal('Login Error', 'Please enter both email and password', 'error');
      return;
    }

    Keyboard.dismiss();

    try {
      const success = await login(email, password);
      
      if (success) {
        navigation.navigate('Home');
      } else {
        showModal('Login Failed', 'Invalid email or password. Please check your credentials and try again.', 'error');
      }
    } catch (error) {
      console.error(error);
      showModal('Error', 'An unexpected error occurred. Please try again later.', 'error');
    }
  };
  
  const handleGoogleSignIn = async () => {
    try {
      const success = await googleSignIn();
      
      if (success) {
        navigation.navigate('Home');
      } else {
        showModal('Sign In Failed', 'Google sign in was cancelled or failed', 'error');
      }
    } catch (error) {
      console.error(error);
      showModal('Error', 'An unexpected error occurred with Google sign in', 'error');
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const biometricAuth = await LocalAuthentication.authenticateAsync({
        promptMessage: `Authenticate to Login`,
        fallbackLabel: 'Enter Password',
      });
      if (biometricAuth.success) {
        // Check if user is already logged in or registered.
        const storedUser = await AsyncStorage.getItem('current_user');
        if (storedUser) {
          navigation.navigate('Home');
        } else {
          showModal('No Account', 'No account exists. Please sign up first.', 'warning');
        }
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      showModal('Authentication Error', 'Biometric authentication failed.', 'error');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.contentContainer}>
            <Animated.View 
              entering={FadeInDown.duration(600).springify()}
              style={styles.logoContainer}
            >
              <Animated.View 
                entering={BounceIn.delay(300).duration(1000)}
                style={[styles.logoBackground, { backgroundColor: isDark ? '#7B68EE' : '#6A5ACD' }]}
              >
                <FontAwesome5 name="shield-alt" size={48} color="white" />
              </Animated.View>
              <Text style={[styles.logoText, { color: isDark ? '#FFFFFF' : '#333333' }]}>
                Havault
              </Text>
              <Text style={[styles.logoSubtext, { color: isDark ? '#AAAAAA' : '#666666' }]}>
                Secure Password Manager
              </Text>
            </Animated.View>
            
            <Animated.View 
              entering={FadeInUp.delay(400).duration(600).springify()}
              style={styles.formContainer}
            >
              <View style={styles.inputContainer}>
                <View style={[
                  styles.inputWrapper,
                  { backgroundColor: isDark ? '#2A2A2A' : 'white' }
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
                  { backgroundColor: isDark ? '#2A2A2A' : 'white' }
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
              </View>
              
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={[styles.forgotPasswordText, { color: isDark ? '#7B68EE' : '#6A5ACD' }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.button,
                  { backgroundColor: isDark ? '#7B68EE' : '#6A5ACD' },
                  isAuthenticating && { opacity: 0.7 }
                ]}
                onPress={handleLogin}
                disabled={isAuthenticating}
              >
                {isAuthenticating ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>
              
              {isBiometricSupported && (
                <TouchableOpacity 
                  style={[
                    styles.biometricButton,
                    { borderColor: isDark ? '#333333' : '#E0E0E0' }
                  ]}
                  onPress={handleBiometricLogin}
                >
                  <FontAwesome5 
                    name="fingerprint" 
                    size={20} 
                    color={isDark ? '#7B68EE' : '#6A5ACD'} 
                  />
                  <Text style={[
                    styles.biometricButtonText,
                    { color: isDark ? '#FFFFFF' : '#333333' }
                  ]}>
                    Use Biometrics
                  </Text>
                </TouchableOpacity>
              )}
              
              <View style={styles.dividerContainer}>
                <View style={[styles.divider, { backgroundColor: isDark ? '#333333' : '#E0E0E0' }]} />
                <Text style={[styles.dividerText, { color: isDark ? '#AAAAAA' : '#999999' }]}>
                  OR
                </Text>
                <View style={[styles.divider, { backgroundColor: isDark ? '#333333' : '#E0E0E0' }]} />
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.socialButton,
                  { 
                    backgroundColor: isDark ? '#2A2A2A' : 'white',
                    borderColor: isDark ? '#333333' : '#E0E0E0' 
                  },
                  isAuthenticating && { opacity: 0.7 }
                ]}
                onPress={handleGoogleSignIn}
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
                  Sign in with Google
                </Text>
              </TouchableOpacity>
              
              <View style={styles.registerContainer}>
                <Text style={[styles.registerText, { color: isDark ? '#AAAAAA' : '#666666' }]}>
                  Don't have an account?
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={[styles.registerLink, { color: isDark ? '#7B68EE' : '#6A5ACD' }]}>
                    {' Sign Up'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
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
    justifyContent: 'center',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
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
    fontSize: 32,
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
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 16,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  biometricButton: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  biometricButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
    height: 50,
    borderRadius: 8,
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
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;