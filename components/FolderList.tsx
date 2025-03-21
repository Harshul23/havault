import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInRight } from 'react-native-reanimated';
import CustomModal from './CustomModal';
import { useNavigation } from '@react-navigation/native';
import { useIsMountedRef } from '../utils/animationUtils';

type FolderListProps = {
  folders: string[];
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
  onManageFolders: () => void;
  isDark: boolean;
  userID?: string; // Add user ID for folder operations
};

const FolderList: React.FC<FolderListProps> = ({ 
  folders, 
  selectedFolder, 
  onSelectFolder, 
  onManageFolders,
  isDark,
  userID 
}) => {
  const navigation = useNavigation();
  const [longPressedFolder, setLongPressedFolder] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Add isMounted ref to prevent animations on unmounted components
  const isMounted = useRef(true);
  
  useEffect(() => {
    isMounted.current = true;
    return () => { 
      isMounted.current = false;
    };
  }, []);
  
  // Custom Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    type: 'confirm' as 'success' | 'error' | 'warning' | 'info' | 'confirm',
    folderToDelete: '',
    afterDismissAction: null as (() => void) | null
  });
  
  const handleLongPress = (folder: string) => {
    // Don't allow editing the "All" folder
    if (folder === 'All') return;
    
    setLongPressedFolder(folder);
    setNewFolderName(folder);
  };
  
  const showDeleteConfirmation = (folder: string) => {
    // Prevent deleting the "All" folder
    if (folder === 'All') {
      setModalContent({
        title: 'Cannot Delete',
        message: 'The "All" folder cannot be deleted as it is the default folder.',
        type: 'error',
        folderToDelete: '',
        afterDismissAction: null
      });
      setModalVisible(true);
      return;
    }
    
    setModalContent({
      title: 'Delete Folder',
      message: 'Are you sure you want to delete "' + folder + '"? Passwords in this folder will be moved to the "All" folder.',
      type: 'confirm',
      folderToDelete: folder,
      afterDismissAction: null
    });
    setModalVisible(true);
  };
  
  const handleModalDismiss = () => {
    setModalVisible(false);
    
    // Execute the afterDismissAction if it exists (for success modals)
    if (modalContent.afterDismissAction) {
      modalContent.afterDismissAction();
    }
  };
  
  const handleDelete = async (folder: string) => {
    // Extra safety check to prevent deleting the "All" folder
    if (folder === 'All') {
      setModalContent({
        title: 'Cannot Delete',
        message: 'The "All" folder cannot be deleted as it is the default folder.',
        type: 'error',
        folderToDelete: '',
        afterDismissAction: null
      });
      setModalVisible(true);
      return;
    }
    
    try {
      // Update folders in AsyncStorage
      const filteredFolders = folders.filter(f => f !== folder);
      
      // Use user-specific storage key if userID is provided
      const storageKey = userID ? `folders_${userID}` : 'folders';
      await AsyncStorage.setItem(storageKey, JSON.stringify(
        filteredFolders.filter(f => f !== 'All')
      ));
      
      // If the deleted folder was selected, switch to "All"
      if (selectedFolder === folder) {
        onSelectFolder('All');
      }
      
      // Update passwords that were in this folder
      const passwordsKey = userID ? `passwords_${userID}` : 'passwords';
      const storedPasswords = await AsyncStorage.getItem(passwordsKey);
      if (storedPasswords) {
        const passwords = JSON.parse(storedPasswords);
        const updatedPasswords = passwords.map((pass: any) => {
          if (pass.folder === folder) {
            return { ...pass, folder: 'All' };
          }
          return pass;
        });
        await AsyncStorage.setItem(passwordsKey, JSON.stringify(updatedPasswords));
      }
      
      setLongPressedFolder(null);
      
      // Create a callback that will execute when user clicks "OK" on success modal
      const refreshFoldersAfterDismiss = () => {
        // Navigate to Home with folderDeleted parameter to trigger a refresh
        (navigation as any).navigate('Home', { folderDeleted: true });
      };
      
      // Show success message with the callback
      setModalContent({
        title: 'Success',
        message: 'Folder "' + folder + '" has been deleted successfully.',
        type: 'success',
        folderToDelete: '',
        afterDismissAction: refreshFoldersAfterDismiss
      });
      setModalVisible(true);
    } catch (error) {
      console.error('Failed to delete folder:', error);
      setModalContent({
        title: 'Error',
        message: 'Failed to delete folder. Please try again.',
        type: 'error',
        folderToDelete: '',
        afterDismissAction: null
      });
      setModalVisible(true);
    }
  };
  
  const handleRename = () => {
    setIsRenaming(true);
  };
  
  const handleRenameSubmit = async () => {
    if (!newFolderName.trim() || !longPressedFolder) {
      setIsRenaming(false);
      return;
    }
    
    // Prevent renaming to "All" if it's not already "All"
    if (newFolderName.trim().toLowerCase() === 'all' && longPressedFolder !== 'All') {
      setModalContent({
        title: 'Reserved Folder Name',
        message: 'The name "All" is reserved for the default folder and cannot be used.',
        type: 'error',
        folderToDelete: '',
        afterDismissAction: null
      });
      setModalVisible(true);
      return;
    }
    
    if (folders.includes(newFolderName.trim()) && newFolderName.trim() !== longPressedFolder) {
      setModalContent({
        title: 'Folder Exists',
        message: 'A folder with this name already exists.',
        type: 'error',
        folderToDelete: '',
        afterDismissAction: null
      });
      setModalVisible(true);
      return;
    }
    
    try {
      // Update folders in AsyncStorage
      const storageKey = userID ? `folders_${userID}` : 'folders';
      const updatedFolders = folders.map(f => 
        f === longPressedFolder ? newFolderName.trim() : f
      );
      await AsyncStorage.setItem(storageKey, JSON.stringify(
        updatedFolders.filter(f => f !== 'All')
      ));
      
      // If the renamed folder was selected, update selection
      if (selectedFolder === longPressedFolder) {
        onSelectFolder(newFolderName.trim());
      }
      
      // Update passwords that were in this folder
      const passwordsKey = userID ? `passwords_${userID}` : 'passwords';
      const storedPasswords = await AsyncStorage.getItem(passwordsKey);
      if (storedPasswords) {
        const passwords = JSON.parse(storedPasswords);
        const updatedPasswords = passwords.map((pass: any) => {
          if (pass.folder === longPressedFolder) {
            return { ...pass, folder: newFolderName.trim() };
          }
          return pass;
        });
        await AsyncStorage.setItem(passwordsKey, JSON.stringify(updatedPasswords));
      }
      
      setLongPressedFolder(null);
      setIsRenaming(false);
    } catch (error) {
      console.error('Failed to rename folder:', error);
      setModalContent({
        title: 'Error',
        message: 'Failed to rename folder. Please try again.',
        type: 'error',
        folderToDelete: '',
        afterDismissAction: null
      });
      setModalVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.folderListContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingRight: 50 } // Add padding for the fixed button
          ]}
        >
          {folders.map((folder, index) => (
            <Animated.View 
              key={folder} 
              entering={isMounted.current ? FadeInRight.delay(index * 100).duration(300) : undefined}
            >
              <TouchableOpacity
                style={[
                  styles.folderButton,
                  folder === selectedFolder && styles.selectedFolder,
                  folder === selectedFolder && { 
                    backgroundColor: isDark ? '#7B68EE20' : '#6A5ACD20'
                  }
                ]}
                onPress={() => onSelectFolder(folder)}
                onLongPress={() => handleLongPress(folder)}
              >
                <MaterialCommunityIcons 
                  name={folder === 'All' ? 'folder-multiple' : 'folder'}
                  size={16} 
                  color={
                    folder === selectedFolder
                      ? isDark ? '#7B68EE' : '#6A5ACD'
                      : isDark ? '#AAAAAA' : '#666666'
                  } 
                  style={styles.folderIcon}
                />
                <Text 
                  style={[
                    styles.folderText,
                    folder === selectedFolder && styles.selectedFolderText,
                    { 
                      color: folder === selectedFolder
                        ? isDark ? '#7B68EE' : '#6A5ACD'
                        : isDark ? '#DDDDDD' : '#333333'
                    }
                  ]}
                >
                  {folder}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
        
        {/* Fixed Add Button */}
        <View style={styles.fixedButtonContainer}>
          <TouchableOpacity
            style={[
              styles.manageFoldersButton,
              { backgroundColor: isDark ? '#1E1E1E' : 'white' }
            ]}
            onPress={onManageFolders}
          >
            <Ionicons 
              name="add-circle-outline" 
              size={20} 
              color={isDark ? '#AAAAAA' : '#666666'} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Folder Actions Modal */}
      <Modal
        visible={longPressedFolder !== null && !isRenaming}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLongPressedFolder(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          onPress={() => setLongPressedFolder(null)}
          activeOpacity={1}
        >
          <View 
            style={[
              styles.modalContainer,
              { backgroundColor: isDark ? '#2A2A2A' : 'white' },
              { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -150 }, { translateY: -100 }], width: 300 }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#333333' }]}>
                {longPressedFolder}
              </Text>
              <TouchableOpacity onPress={() => setLongPressedFolder(null)}>
                <Ionicons 
                  name="close" 
                  size={24} 
                  color={isDark ? '#DDDDDD' : '#333333'} 
                />
              </TouchableOpacity>
            </View>
            
            <>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: isDark ? '#444444' : '#F5F5F5' }]}
                  onPress={handleRename}
                >
                  <MaterialCommunityIcons name="pencil" size={20} color={isDark ? '#DDDDDD' : '#333333'} />
                  <Text style={{ color: isDark ? '#DDDDDD' : '#333333', marginLeft: 8 }}>Rename</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: isDark ? '#444444' : '#F5F5F5' }]}
                  onPress={() => {
                    if (longPressedFolder) {
                      showDeleteConfirmation(longPressedFolder);
                      setLongPressedFolder(null); // Close the action modal
                    }
                  }}
                >
                  <MaterialCommunityIcons name="delete" size={20} color="#F44336" />
                  <Text style={{ color: '#F44336', marginLeft: 8 }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Rename Modal */}
      <Modal
        visible={isRenaming}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsRenaming(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          onPress={() => setIsRenaming(false)}
          activeOpacity={1}
        >
          <View 
            style={[
              styles.modalContainer,
              { backgroundColor: isDark ? '#2A2A2A' : 'white' },
              { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -150 }, { translateY: -100 }], width: 300 }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#333333' }]}>
                Rename Folder
              </Text>
              <TouchableOpacity onPress={() => setIsRenaming(false)}>
                <Ionicons 
                  name="close" 
                  size={24} 
                  color={isDark ? '#DDDDDD' : '#333333'} 
                />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[
                styles.renameInput,
                { 
                  backgroundColor: isDark ? '#333333' : '#F5F5F5',
                  color: isDark ? '#FFFFFF' : '#333333'
                }
              ]}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
              onSubmitEditing={handleRenameSubmit}
            />
            
            <TouchableOpacity
              style={[
                styles.renameButton,
                { backgroundColor: isDark ? '#7B68EE' : '#6A5ACD' }
              ]}
              onPress={handleRenameSubmit}
            >
              <Text style={styles.renameButtonText}>Rename</Text>
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
        onDismiss={handleModalDismiss}
        onConfirm={
          modalContent.type === 'confirm'
            ? () => handleDelete(modalContent.folderToDelete)
            : handleModalDismiss
        }
        isDark={isDark}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  folderListContainer: {
    width: '100%',
    paddingHorizontal: 12,
    paddingRight: 28,
    flexDirection: 'row',
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  folderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedFolder: {
    borderColor: '#7B68EE30',
  },
  folderIcon: {
    marginRight: 4,
  },
  folderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedFolderText: {
    fontWeight: 'bold',
  },
  manageFoldersButton: {
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 25,
    marginLeft: 25, // Shift the button a little to the right
    width: 80, // Increase width to 100%
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedButtonContainer: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtons: {
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  renameContainer: {
    width: '100%',
  },
  renameInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#888888',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#6A5ACD',
    marginLeft: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  renameButton: {
    backgroundColor: '#6A5ACD',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  renameButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FolderList;