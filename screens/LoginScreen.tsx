import React, { useState, useEffect, useRef } from 'react';
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
  Image,
  ScrollView,
  Dimensions,
  StatusBar,
  Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Navigation } from '../navigation';
import CustomModal from '../components/CustomModal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const LoginScreen = () => {
  const navigation = useNavigation<Navigation<'Login'>>();
  const { login, googleSignIn, isAuthenticating } = useAuth();
  const { isDark, colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // Custom modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info' | 'confirm'
  });

  // Generate UI colors based on the theme
  const uiColors = {
    background: colors.background,
    logoBackground: colors.primary,
    logoText: colors.text,
    logoSubtext: isDark ? '#AAAAAA' : '#666666',
    inputBackground: isDark ? '#2A2A2A' : 'white',
    inputText: colors.text,
    inputIcon: isDark ? '#AAAAAA' : '#999999',
    inputPlaceholder: isDark ? '#666666' : '#999999',
    forgotPasswordText: colors.primary,
    buttonBackground: colors.primary,
    biometricBorder: isDark ? '#333333' : '#E0E0E0',
    biometricIcon: colors.primary,
    biometricText: colors.text,
    dividerBackground: isDark ? '#333333' : '#E0E0E0',
    dividerText: isDark ? '#AAAAAA' : '#999999',
    socialButtonBackground: isDark ? '#2A2A2A' : 'white',
    socialButtonBorder: isDark ? '#333333' : '#E0E0E0',
    socialButtonText: colors.text,
    registerText: isDark ? '#AAAAAA' : '#666666',
    registerLink: colors.primary
  };
  
  // Add mounted ref
  const isMounted = useRef(true);
  
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);
    })();
    
    // Add keyboard listeners to detect when keyboard appears/disappears
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      
      // Subtle animation for the logo - keeps screen position stable
      if (isMounted.current) {
        Animated.timing(fadeAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }).start();
      }
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      
      // Fade logo back in
      if (isMounted.current) {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      }
    });
    
    // Clean up listeners
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
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
        promptMessage: 'Authenticate to Login',
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
    <View 
      style={[styles.container, { backgroundColor: uiColors.background }]}
    >
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor="transparent" 
        translucent 
      />
      
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.contentContainer}>
            <Animated.View style={[
              styles.logoContainer, 
              { 
                opacity: fadeAnim,
                transform: [
                  { scale: fadeAnim.interpolate({
                    inputRange: [0.8, 1],
                    outputRange: [0.9, 1]
                  })}
                ]
              }
            ]}>
              <View style={[styles.logoBackground, { backgroundColor: uiColors.logoBackground }]}>
                <FontAwesome5 name="shield-alt" size={48} color="white" />
              </View>
              <Text style={[styles.logoText, { color: uiColors.logoText }]}>
                Havault
              </Text>
              <Text style={[styles.logoSubtext, { color: uiColors.logoSubtext }]}>
                Secure Password Manager
              </Text>
            </Animated.View>
            
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <View style={[
                  styles.inputWrapper,
                  { backgroundColor: uiColors.inputBackground }
                ]}>
                  <FontAwesome5 
                    name="envelope" 
                    size={16} 
                    color={uiColors.inputIcon} 
                    style={styles.inputIcon} 
                  />
                  <TextInput 
                    style={[
                      styles.input,
                      { color: uiColors.inputText }
                    ]}
                    placeholder="Email" 
                    placeholderTextColor={uiColors.inputPlaceholder}
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
                  { backgroundColor: uiColors.inputBackground }
                ]}>
                  <FontAwesome5 
                    name="lock" 
                    size={16} 
                    color={uiColors.inputIcon} 
                    style={styles.inputIcon} 
                  />
                  <TextInput 
                    style={[
                      styles.input,
                      { color: uiColors.inputText }
                    ]}
                    placeholder="Password" 
                    placeholderTextColor={uiColors.inputPlaceholder}
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
                      color={uiColors.inputIcon} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={[styles.forgotPasswordText, { color: uiColors.forgotPasswordText }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.button,
                  { backgroundColor: uiColors.buttonBackground },
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
                    { borderColor: uiColors.biometricBorder }
                  ]}
                  onPress={handleBiometricLogin}
                >
                  <FontAwesome5 
                    name="fingerprint" 
                    size={20} 
                    color={uiColors.biometricIcon} 
                  />
                  <Text style={[
                    styles.biometricButtonText,
                    { color: uiColors.biometricText }
                  ]}>
                    Use Biometrics
                  </Text>
                </TouchableOpacity>
              )}
              
              <View style={styles.dividerContainer}>
                <View style={[styles.divider, { backgroundColor: uiColors.dividerBackground }]} />
                <Text style={[styles.dividerText, { color: uiColors.dividerText }]}>
                  OR
                </Text>
                <View style={[styles.divider, { backgroundColor: uiColors.dividerBackground }]} />
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.socialButton,
                  { 
                    backgroundColor: uiColors.socialButtonBackground,
                    borderColor: uiColors.socialButtonBorder 
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
                  { color: uiColors.socialButtonText }
                ]}>
                  Sign in with Google
                </Text>
              </TouchableOpacity>
              
              <View style={styles.registerContainer}>
                <Text style={[styles.registerText, { color: uiColors.registerText }]}>
                  Don't have an account?
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={[styles.registerLink, { color: uiColors.registerLink }]}>
                    {' Sign Up'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
      
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: SCREEN_HEIGHT,
    justifyContent: 'center', // Center the content vertically
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 40,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
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