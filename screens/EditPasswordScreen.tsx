import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Modal, ScrollView } from 'react-native';
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

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.header, { backgroundColor: isDark ? '#1E1E1E' : 'white' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#DDDDDD' : '#333333'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#333333' }]}>Edit Password</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <TextInput 
          style={[styles.input, { backgroundColor: isDark ? '#333333' : '#F5F5F5', color: isDark ? '#FFFFFF' : '#333333' }]} 
          value={website} 
          onChangeText={setWebsite} 
          placeholder="Website" 
          placeholderTextColor={isDark ? '#777777' : '#999999'} 
        />
        
        <TextInput 
          style={[styles.input, { backgroundColor: isDark ? '#333333' : '#F5F5F5', color: isDark ? '#FFFFFF' : '#333333' }]} 
          value={username} 
          onChangeText={setUsername} 
          placeholder="Username" 
          placeholderTextColor={isDark ? '#777777' : '#999999'} 
        />
        
        <View style={styles.passwordContainer}>
          <TextInput 
            style={[
              styles.input, 
              styles.passwordInput,
              { backgroundColor: isDark ? '#333333' : '#F5F5F5', color: isDark ? '#FFFFFF' : '#333333' }
            ]} 
            value={pwd} 
            onChangeText={setPwd} 
            placeholder="Password" 
            placeholderTextColor={isDark ? '#777777' : '#999999'} 
            secureTextEntry={!showPassword} 
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
          style={[
            styles.input, 
            styles.notesInput,
            { backgroundColor: isDark ? '#333333' : '#F5F5F5', color: isDark ? '#FFFFFF' : '#333333' }
          ]} 
          value={notes} 
          onChangeText={setNotes} 
          placeholder="Notes (Optional)" 
          placeholderTextColor={isDark ? '#777777' : '#999999'} 
          multiline={true}
          textAlignVertical="top"
          numberOfLines={4}
        />
        
        <TouchableOpacity 
          style={[styles.updateButton, { backgroundColor: isDark ? '#7B68EE' : '#6A5ACD' }]} 
          onPress={handleUpdate}
        >
          <Text style={styles.updateButtonText}>Update</Text>
        </TouchableOpacity>
      </View>
      
      {/* Folder Selection Modal */}
      <Modal
        visible={showFolderModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFolderModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFolderModal(false)}
        >
          <View 
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? '#2A2A2A' : 'white' }
            ]}
          >
            <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#333333' }]}>
              Select Folder
            </Text>
            <ScrollView style={styles.folderList}>
              {availableFolders.map((folderItem) => (
                <TouchableOpacity
                  key={folderItem}
                  style={[
                    styles.folderItem,
                    folderItem === folder && styles.selectedFolderItem,
                    { 
                      backgroundColor: folderItem === folder 
                        ? (isDark ? '#7B68EE20' : '#6A5ACD20') 
                        : 'transparent'
                    }
                  ]}
                  onPress={() => {
                    setFolder(folderItem);
                    setShowFolderModal(false);
                  }}
                >
                  <MaterialCommunityIcons 
                    name="folder" 
                    size={20} 
                    color={
                      folderItem === folder
                        ? isDark ? '#7B68EE' : '#6A5ACD'
                        : isDark ? '#AAAAAA' : '#666666'
                    } 
                    style={styles.folderIcon}
                  />
                  <Text 
                    style={{ 
                      color: folderItem === folder
                        ? isDark ? '#7B68EE' : '#6A5ACD'
                        : isDark ? '#FFFFFF' : '#333333' 
                    }}
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
        </TouchableOpacity>
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
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
  },
  backButton: { padding: 6 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  content: { flex: 1, padding: 16 },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
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
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
});

export default EditPasswordScreen;