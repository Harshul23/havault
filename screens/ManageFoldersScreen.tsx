import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  FlatList,
  Alert,
  Keyboard
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Animated, { FadeIn, SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { Navigation } from '../navigation';
import CustomModal from '../components/CustomModal';

type RouteParams = {
  params: {
    folders: string[];
  }
};

const ManageFoldersScreen = () => {
  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const initialFolders = route.params?.folders || ['Personal', 'Work', 'Finance'];
  const navigation = useNavigation<Navigation<'ManageFolders'>>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';
  
  const [folders, setFolders] = useState(initialFolders);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info' | 'confirm',
    folderToDelete: ''
  });
  
  useEffect(() => {
    // Redirect to login if no user is logged in
    if (!user) {
      navigation.navigate('Login');
    }
  }, [user, navigation]);
  
  const showModal = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' | 'confirm', folderToDelete = '') => {
    setModalContent({ title, message, type, folderToDelete });
    setModalVisible(true);
  };
  
  const handleAddFolder = async () => {
    if (!user) return;
    if (!newFolderName.trim()) {
      showModal('Error', 'Please enter a folder name', 'error');
      return;
    }
    
    if (folders.includes(newFolderName.trim())) {
      showModal('Folder Exists', 'A folder with this name already exists.', 'error');
      return;
    }
    
    const updatedFolders = [...folders, newFolderName.trim()];
    
    try {
      const userFoldersKey = `folders_${user.id}`;
      await AsyncStorage.setItem(userFoldersKey, JSON.stringify(updatedFolders));
      setFolders(updatedFolders);
      setNewFolderName('');
      Keyboard.dismiss();
      showModal('Success', 'Folder added successfully', 'success');
    } catch (error) {
      console.error('Failed to add folder:', error);
      showModal('Error', 'Failed to add folder. Please try again.', 'error');
    }
  };
  
  interface Folder {
    name: string;
  }

  const handleEditFolder = (folder: string): void => {
    setEditingFolder(folder);
    setEditingFolderName(folder);
  };
  
  const handleUpdateFolder = async () => {
    if (!user) return;
    if (!editingFolderName.trim()) {
      showModal('Error', 'Please enter a folder name', 'error');
      return;
    }
    
    if (folders.includes(editingFolderName.trim()) && editingFolderName.trim() !== editingFolder) {
      showModal('Folder Exists', 'A folder with this name already exists.', 'error');
      return;
    }
    
    const updatedFolders = folders.map(folder => 
      folder === editingFolder ? editingFolderName.trim() : folder
    );
    
    try {
      const userFoldersKey = `folders_${user.id}`;
      await AsyncStorage.setItem(userFoldersKey, JSON.stringify(updatedFolders));
      
      // Update passwords in this folder
      const userPasswordsKey = `passwords_${user.id}`;
      const storedPasswords = await AsyncStorage.getItem(userPasswordsKey);
      if (storedPasswords) {
        const passwords = JSON.parse(storedPasswords);
        const updatedPasswords = passwords.map((password: { folder: string; [key: string]: any }) => 
          password.folder === editingFolder 
            ? { ...password, folder: editingFolderName.trim() }
            : password
        );
        await AsyncStorage.setItem(userPasswordsKey, JSON.stringify(updatedPasswords));
      }
      
      setFolders(updatedFolders);
      setEditingFolder(null);
      setEditingFolderName('');
      showModal('Success', 'Folder updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update folder:', error);
      showModal('Error', 'Failed to update folder. Please try again.', 'error');
    }
  };
  
  interface Password {
    folder: string;
    [key: string]: any;
  }
  
  const handleConfirmDeleteFolder = (folderToDelete: string) => {
    showModal(
      'Delete Folder',
      `Are you sure you want to delete "${folderToDelete}"? All passwords in this folder will be moved to "Personal".`,
      'confirm',
      folderToDelete
    );
  };
  
  const handleDeleteFolder = async (): Promise<void> => {
    if (!user) return;
    
    const folderToDelete = modalContent.folderToDelete;
    if (!folderToDelete) return;
    
    const updatedFolders = folders.filter(folder => folder !== folderToDelete);
    
    try {
      // Update folders
      const userFoldersKey = `folders_${user.id}`;
      await AsyncStorage.setItem(userFoldersKey, JSON.stringify(updatedFolders));
      
      // Move passwords to Personal folder
      const userPasswordsKey = `passwords_${user.id}`;
      const storedPasswords = await AsyncStorage.getItem(userPasswordsKey);
      if (storedPasswords) {
        const passwords = JSON.parse(storedPasswords);
        const updatedPasswords = passwords.map((password: Password) => 
          password.folder === folderToDelete 
            ? { ...password, folder: 'Personal' } 
            : password
        );
        await AsyncStorage.setItem(userPasswordsKey, JSON.stringify(updatedPasswords));
      }
      
      setFolders(updatedFolders);
      showModal('Success', 'Folder deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete folder:', error);
      showModal('Error', 'Failed to delete folder. Please try again.', 'error');
    }
  };
  
  const renderFolder = ({ item }: { item: string }) => {
    const isEditing = item === editingFolder;
    
    return (
      <Animated.View 
        entering={SlideInRight.duration(300)}
        exiting={SlideOutRight.duration(300)}
        style={[
          styles.folderItem, 
          { backgroundColor: isDark ? '#2A2A2A' : 'white' }
        ]}
      >
        <View style={styles.folderIconContainer}>
          <MaterialCommunityIcons 
            name="folder" 
            size={24} 
            color={isDark ? '#7B68EE' : '#6A5ACD'} 
          />
        </View>
        
        {isEditing ? (
          <TextInput
            style={[
              styles.folderEditInput,
              { 
                backgroundColor: isDark ? '#333333' : '#F5F5F5',
                color: isDark ? '#FFFFFF' : '#333333'
              }
            ]}
            value={editingFolderName}
            onChangeText={setEditingFolderName}
            autoFocus
            onSubmitEditing={handleUpdateFolder}
          />
        ) : (
          <Text style={[styles.folderName, { color: isDark ? '#FFFFFF' : '#333333' }]}>
            {item}
          </Text>
        )}
        
        <View style={styles.folderActions}>
          {isEditing ? (
            <TouchableOpacity 
              style={styles.folderActionButton}
              onPress={handleUpdateFolder}
            >
              <Ionicons 
                name="checkmark" 
                size={22} 
                color={isDark ? '#4CAF50' : '#4CAF50'} 
              />
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.folderActionButton}
                onPress={() => handleEditFolder(item)}
              >
                <Ionicons 
                  name="pencil" 
                  size={20} 
                  color={isDark ? '#AAAAAA' : '#666666'} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.folderActionButton}
                onPress={() => handleConfirmDeleteFolder(item)}
                disabled={item === 'Personal' || item === 'Work' || item === 'Finance'}
              >
                <Ionicons 
                  name="trash-outline" 
                  size={20} 
                  color={item === 'Personal' || item === 'Work' || item === 'Finance' 
                    ? (isDark ? '#555555' : '#CCCCCC') 
                    : (isDark ? '#AAAAAA' : '#666666')} 
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </Animated.View>
    );
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
          Manage Folders
        </Text>
        
        <View style={{ width: 30 }} /> {/* Spacer for center alignment */}
      </View>
      
      <View style={styles.content}>
        <Animated.View 
          entering={FadeIn.duration(300)}
          style={[styles.addFolderContainer, { backgroundColor: isDark ? '#2A2A2A' : 'white' }]}
        >
          <TextInput
            style={[
              styles.addFolderInput,
              { 
                backgroundColor: isDark ? '#333333' : '#F5F5F5',
                color: isDark ? '#FFFFFF' : '#333333'
              }
            ]}
            placeholder="New folder name"
            placeholderTextColor={isDark ? '#777777' : '#999999'}
            value={newFolderName}
            onChangeText={setNewFolderName}
            onSubmitEditing={handleAddFolder}
          />
          
          <TouchableOpacity 
            style={[
              styles.addFolderButton, 
              { 
                backgroundColor: isDark ? '#7B68EE' : '#6A5ACD',
                opacity: !newFolderName.trim() ? 0.5 : 1
              }
            ]}
            onPress={handleAddFolder}
            disabled={!newFolderName.trim()}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
        
        <Text style={[styles.sectionTitle, { color: isDark ? '#AAAAAA' : '#666666' }]}>
          YOUR FOLDERS
        </Text>
        
        <FlatList
          data={folders}
          renderItem={renderFolder}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.foldersList}
        />
      </View>
      
      <CustomModal
        visible={modalVisible}
        title={modalContent.title}
        message={modalContent.message}
        type={modalContent.type}
        onConfirm={handleDeleteFolder}
        onCancel={() => setModalVisible(false)}
      />
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
  },
  content: {
    flex: 1,
    padding: 16,
  },
  addFolderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addFolderInput: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginRight: 10,
  },
  addFolderButton: {
    width: 46,
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.7,
  },
  foldersList: {
    paddingBottom: 20,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  folderIconContainer: {
    marginRight: 12,
  },
  folderName: {
    flex: 1,
    fontSize: 16,
  },
  folderEditInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginRight: 10,
  },
  folderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderActionButton: {
    padding: 8,
    marginLeft: 4,
  },
});

export default ManageFoldersScreen;