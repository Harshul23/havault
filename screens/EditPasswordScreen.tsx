import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Modal, ScrollView, TouchableWithoutFeedback, Keyboard, StatusBar } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Navigation, PasswordType } from '../navigation';
import { usePassword } from '../PasswordContext';
import { useAuth } from '../context/AuthContext';
import CustomModal from '../components/CustomModal';

type RouteParams = {
  params: {
    password: PasswordType;
  }
};

const EditPasswordScreen = () => {
  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const password = route.params.password;
  
  const navigation = useNavigation<Navigation<'EditPassword'>>();
  const { updatePassword } = usePassword();
  const { user } = useAuth();
  
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [website, setWebsite] = useState(password?.website || '');
  const [username, setUsername] = useState(password?.username || '');
  const [pwd, setPwd] = useState(password?.password || '');
  const [notes, setNotes] = useState(password?.notes || '');
  const [folder, setFolder] = useState(password?.folder || 'Personal');
  const [showPassword, setShowPassword] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [availableFolders, setAvailableFolders] = useState<string[]>(['Personal']);

  // Modal state for alerts
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info' | 'confirm'
  });
  
  // Show custom modal
  const showModal = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' | 'confirm') => {
    setModalContent({ title, message, type });
    setModalVisible(true);
  };

  // Load folders whenever the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadFolders();
    }, [user])
  );

  // Also load folders when component mounts
  useEffect(() => {
    loadFolders();
  }, [user]);

  // Function to load folders using user ID if available
  const loadFolders = async () => {
    if (!user) return;
    
    try {
      const storageKey = `folders_${user.id}`;
      const storedFolders = await AsyncStorage.getItem(storageKey);
      if (storedFolders) {
        setAvailableFolders(JSON.parse(storedFolders));
      } else {
        // Default folders
        setAvailableFolders(['Personal', 'Work', 'Finance']);
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
      showModal('Error', 'Failed to load folders. Please try again.', 'error');
    }
  };

  const handleUpdate = async () => {
    if (!website.trim() || !username.trim() || !pwd.trim()) {
      showModal('Incomplete Information', 'Please fill in all required fields.', 'error');
      return;
    }
    
    // Check if anything has actually changed
    const hasChanges = 
      website.trim() !== password.website ||
      username.trim() !== password.username ||
      pwd !== password.password ||
      folder !== password.folder ||
      notes.trim() !== (password.notes || '');
      
    // If nothing changed, just go back without showing success message
    if (!hasChanges) {
      navigation.goBack();
      return;
    }
    
    try {
      await updatePassword(password.id, {
        ...password,
        website,
        username,
        password: pwd,
        folder,
        notes,
        lastModified: new Date().toISOString()
      });
      
      showModal('Success', 'Password updated successfully!', 'success');
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('Failed to update password:', error);
      showModal('Error', 'Failed to update password. Please try again.', 'error');
    }
  };

  // Utility function to dismiss keyboard with better handling
  const dismissKeyboard = () => {
    // Use a slight delay to ensure smooth transition when dismissing keyboard
    setTimeout(() => {
      Keyboard.dismiss();
    }, 0);
  };

  // Use consistent background color variable
  const screenBackgroundColor = isDark ? '#121212' : '#F5F5F5';

  // Create dynamically styled inputs inside component where isDark is accessible
  const inputStyle = [
    styles.input, 
    { 
      backgroundColor: isDark ? '#333333' : '#F5F5F5', 
      color: isDark ? '#FFFFFF' : '#333333',
      borderColor: isDark ? '#404040' : '#E0E0E0' 
    }
  ];

  // Create password input style that extends the base input style
  const passwordInputStyle = [
    styles.input,
    styles.passwordInput,
    { 
      backgroundColor: isDark ? '#333333' : '#F5F5F5', 
      color: isDark ? '#FFFFFF' : '#333333',
      borderColor: isDark ? '#404040' : '#E0E0E0' 
    }
  ];
  
  // Create notes input style that extends the base input style
  const notesInputStyle = [
    styles.input,
    styles.notesInput,
    { 
      backgroundColor: isDark ? '#333333' : '#F5F5F5', 
      color: isDark ? '#FFFFFF' : '#333333',
      borderColor: isDark ? '#404040' : '#E0E0E0' 
    }
  ];

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: screenBackgroundColor,
    }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: screenBackgroundColor }]} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={{ flex: 1, backgroundColor: screenBackgroundColor }}>
            <View style={[
              styles.header, 
              { 
                backgroundColor: isDark ? '#1E1E1E' : 'white',
                paddingTop: Platform.OS === 'ios' ? 50 : 30 // Add top padding
              }
            ]}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={isDark ? '#DDDDDD' : '#333333'} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#333333' }]}>Edit Password</Text>
              <View style={{ width: 24 }} />
            </View>
            
            <ScrollView 
              style={[styles.content, { backgroundColor: screenBackgroundColor }]}
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="on-drag"
            >
              <TextInput 
                style={inputStyle} 
                value={website} 
                onChangeText={setWebsite} 
                placeholder="Website" 
                placeholderTextColor={isDark ? '#777777' : '#999999'} 
                returnKeyType="next"
                blurOnSubmit={false}
              />
              
              <TextInput 
                style={inputStyle} 
                value={username} 
                onChangeText={setUsername} 
                placeholder="Username" 
                placeholderTextColor={isDark ? '#777777' : '#999999'} 
                returnKeyType="next"
                blurOnSubmit={false}
              />
              
              <View style={styles.passwordContainer}>
                <TextInput 
                  style={passwordInputStyle} 
                  value={pwd} 
                  onChangeText={setPwd} 
                  placeholder="Password" 
                  placeholderTextColor={isDark ? '#777777' : '#999999'} 
                  secureTextEntry={!showPassword} 
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
                <TouchableOpacity 
                  style={styles.eyeButton} 
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={24} 
                    color={isDark ? '#AAAAAA' : '#666666'} 
                  />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.folderSelector, 
                  { backgroundColor: isDark ? '#333333' : '#F5F5F5', borderColor: isDark ? '#444444' : '#DDDDDD' }
                ]} 
                onPress={() => setShowFolderModal(true)}
              >
                <MaterialCommunityIcons name="folder" size={20} color={isDark ? '#AAAAAA' : '#666666'} style={styles.folderIcon} />
                <Text style={{ flex: 1, color: isDark ? '#FFFFFF' : '#333333' }}>{folder}</Text>
                <Ionicons name="chevron-down" size={20} color={isDark ? '#AAAAAA' : '#666666'} />
              </TouchableOpacity>
              
              <TextInput 
                style={notesInputStyle} 
                value={notes} 
                onChangeText={setNotes} 
                placeholder="Notes (Optional)" 
                placeholderTextColor={isDark ? '#777777' : '#999999'} 
                multiline={true}
                textAlignVertical="top"
                numberOfLines={4}
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={dismissKeyboard}
              />
              
              <TouchableOpacity 
                style={[styles.updateButton, { backgroundColor: isDark ? '#7B68EE' : '#6A5ACD' }]} 
                onPress={handleUpdate}
              >
                <Text style={styles.updateButtonText}>Update</Text>
              </TouchableOpacity>
              
              {/* Add bottom padding */}
              <View style={{ height: 50, backgroundColor: screenBackgroundColor, width: '100%' }} />
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
        
        {/* Folder Selection Modal - keep outside TouchableWithoutFeedback */}
        <Modal
          visible={showFolderModal}
          transparent={true}
          animationType="none"
          onRequestClose={() => setShowFolderModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: 'transparent' }}
          >
            <TouchableOpacity 
              style={[
                styles.modalOverlay,
                { backgroundColor: 'rgba(0, 0, 0, 0.5)' }
              ]}
              activeOpacity={1}
              onPress={() => setShowFolderModal(false)}
            >
              <TouchableWithoutFeedback>
                <View 
                  style={[
                    styles.modalContent,
                    { backgroundColor: isDark ? '#2A2A2A' : 'white' }
                  ]}
                >
                  <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#333333' }]}>
                    Select Folder
                  </Text>
                  <ScrollView 
                    style={styles.folderList}
                    keyboardShouldPersistTaps="handled"
                  >
                    {availableFolders.map((folderItem) => (
                      <TouchableOpacity
                        key={folderItem}
                        style={[
                          styles.folderItem,
                          folderItem === folder ? 
                            { backgroundColor: isDark ? '#444444' : '#EFEFEF' } : null
                        ]}
                        onPress={() => {
                          setFolder(folderItem);
                          setShowFolderModal(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.folderName,
                            { color: isDark ? '#FFFFFF' : '#333333' },
                            folderItem === folder ? { fontWeight: 'bold' } : null
                          ]}
                        >
                          {folderItem}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity
                    style={[styles.closeButton, { backgroundColor: isDark ? '#444444' : '#F5F5F5' }]}
                    onPress={() => setShowFolderModal(false)}
                  >
                    <Text style={{ color: isDark ? '#FFFFFF' : '#333333' }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>
        
        {/* Custom Modal */}
        <CustomModal
          visible={modalVisible}
          title={modalContent.title}
          message={modalContent.message}
          type={modalContent.type}
          isDark={isDark}
          onDismiss={() => setModalVisible(false)}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: 'transparent', // Let the theme color flow through
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    marginTop: 25,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    zIndex: 10, // Ensure header is above other elements
  },
  backButton: { padding: 6 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  content: { 
    flex: 1, 
    padding: 16,
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    marginBottom: 0,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  notesInput: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  folderSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  folderIcon: {
    marginRight: 10,
  },
  updateButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
    elevation: 2, // Add elevation for Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  updateButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  folderList: {
    marginBottom: 16,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedFolderItem: {
    borderWidth: 1,
    borderColor: '#6A5ACD20',
  },
  closeButton: {
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderName: {
    flex: 1,
  },
});

export default EditPasswordScreen;