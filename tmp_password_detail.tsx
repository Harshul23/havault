import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../context/ThemeContext';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Navigation, RootStackParamList, PasswordType } from '../navigation';

type RouteParams = {
  password: PasswordType;
};

const PasswordDetailScreen = () => {
  const navigation = useNavigation<Navigation<'PasswordDetail'>>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { password } = route.params;
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [usernameCopied, setUsernameCopied] = useState(false);
  
  // Add isMounted ref to prevent animations on unmounted components
  const isMounted = useRef(true);
  
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  const copyToClipboard = async (text: string, type: 'password' | 'username'): Promise<void> => {
    await Clipboard.setStringAsync(text);
    if (type === 'password') {
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    } else {
      setUsernameCopied(true);
      setTimeout(() => setUsernameCopied(false), 2000);
    }
  };
  
  const handleEdit = () => {
    navigation.navigate('EditPassword', { password });
  };
  
  const handleDelete = async () => {
    Alert.alert(
      'Delete Password',
      `Are you sure you want to delete the password for ${password.website}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const storedPasswords = await AsyncStorage.getItem('passwords');
              if (storedPasswords) {
                const passwords = JSON.parse(storedPasswords);
                const updatedPasswords: PasswordType[] = passwords.filter(
                  (item: PasswordType) => item.id !== password.id
                );
                await AsyncStorage.setItem(
                  'passwords',
                  JSON.stringify(updatedPasswords)
                );
                navigation.goBack();
              }
            } catch (error) {
              console.error('Failed to delete password:', error);
            }
          },
        },
      ]
    );
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
    // In a real app, we would use Linking.openURL(url)
    Alert.alert('Opening Website', `Would open ${url} in browser`);
  };
  
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
          
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Ionicons 
              name="trash-outline" 
              size={22} 
              color={isDark ? '#DDDDDD' : '#333333'} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.contentContainer}>
          {isMounted.current && (
            <Animated.View entering={FadeIn.duration(400)}>
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
            </Animated.View>
          )}
          
          {isMounted.current && (
            <Animated.View entering={FadeInUp.delay(100).duration(400)}>
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
            </Animated.View>
          )}
          
          {isMounted.current && (
            <Animated.View entering={FadeInUp.delay(200).duration(400)}>
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
            </Animated.View>
          )}
          
          {isMounted.current && (
            <Animated.View entering={FadeInUp.delay(300).duration(400)}>
              {/* Additional Info Card */}
              <View style={[styles.card, { backgroundColor: isDark ? '#2A2A2A' : 'white' }]}>
                <Text style={[styles.cardLabel, { color: isDark ? '#AAAAAA' : '#666666' }]}>
                  ADDITIONAL INFO
                </Text>
                
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons 
                    name="folder-outline" 
                    size={18} 
                    color={isDark ? '#AAAAAA' : '#666666'} 
                  />
                  <Text style={[styles.infoText, { color: isDark ? '#FFFFFF' : '#333333' }]}>
                    {password.folder}
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons 
                    name="calendar-outline" 
                    size={18} 
                    color={isDark ? '#AAAAAA' : '#666666'} 
                  />
                  <Text style={[styles.infoText, { color: isDark ? '#FFFFFF' : '#333333' }]}>
                    Added on {formatDate(password.dateAdded)}
                  </Text>
                </View>
                
                {password.lastModified && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons 
                      name="update" 
                      size={18} 
                      color={isDark ? '#AAAAAA' : '#666666'} 
                    />
                    <Text style={[styles.infoText, { color: isDark ? '#FFFFFF' : '#333333' }]}>
                      Last updated on {formatDate(password.lastModified)}
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
            </Animated.View>
          )}
        </View>
      </ScrollView>
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
    marginRight: 30,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 6,
    marginLeft: 10,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    flex: 1,
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  credentialText: {
    fontSize: 16,
    flex: 1,
  },
  passwordActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visibilityButton: {
    padding: 8,
  },
  copyButton: {
    padding: 8,
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