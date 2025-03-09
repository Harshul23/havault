import React, { useState } from 'react';
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
  const [longPressedFolder, setLongPressedFolder] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Custom Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    type: 'confirm' as 'success' | 'error' | 'warning' | 'info' | 'confirm',
    folderToDelete: ''
  });
  
  const handleLongPress = (folder: string) => {
    // Don't allow editing the "All" folder
    if (folder === 'All') return;
    
    setLongPressedFolder(folder);
    setNewFolderName(folder);
  };
  
  const showDeleteConfirmation = (folder: string) => {
    setModalContent({
      title: 'Delete Folder',
      message: `Are you sure you want to delete "${folder}"? Passwords in this folder will be moved to Personal.`,
      type: 'confirm',
      folderToDelete: folder
    });
    setModalVisible(true);
  };
  
  const handleDelete = async (folder: string) => {
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
            return { ...pass, folder: 'Personal' };
          }
          return pass;
        });
        await AsyncStorage.setItem(passwordsKey, JSON.stringify(updatedPasswords));
      }
      
      setLongPressedFolder(null);
      
      // Show success message
      setModalContent({
        title: 'Success',
        message: `Folder "${folder}" has been deleted successfully.`,
        type: 'success',
        folderToDelete: ''
      });
      setModalVisible(true);
    } catch (error) {
      console.error('Failed to delete folder:', error);
      setModalContent({
        title: 'Error',
        message: 'Failed to delete folder. Please try again.',
        type: 'error',
        folderToDelete: ''
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
    
    if (folders.includes(newFolderName.trim()) && newFolderName.trim() !== longPressedFolder) {
      setModalContent({
        title: 'Folder Exists',
        message: 'A folder with this name already exists.',
        type: 'error',
        folderToDelete: ''
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
        folderToDelete: ''
      });
      setModalVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {folders.map((folder, index) => (
          <Animated.View 
            key={folder} 
            entering={FadeInRight.delay(index * 100).duration(300)}
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
        
        <Animated.View entering={FadeInRight.delay(folders.length * 100).duration(300)}>
          <TouchableOpacity
            style={[styles.manageFoldersButton]}
            onPress={onManageFolders}
          >
            <Ionicons 
              name="add-circle-outline" 
              size={20} 
              color={isDark ? '#AAAAAA' : '#666666'} 
            />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
      
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
      
      {/* CustomModal for confirmations */}
      <CustomModal
        visible={modalVisible}
        title={modalContent.title}
        message={modalContent.message}
        type={modalContent.type}
        isDark={isDark}
        onDismiss={() => setModalVisible(false)}
        onConfirm={() => {
          if (modalContent.type === 'confirm' && modalContent.folderToDelete) {
            handleDelete(modalContent.folderToDelete);
          }
          setModalVisible(false);
        }}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  scrollContent: {
    paddingRight: 10,
  },
  folderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
  },
  selectedFolder: {
    borderWidth: 1,
    borderColor: '#6A5ACD20',
  },
  folderIcon: {
    marginRight: 6,
  },
  folderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedFolderText: {
    fontWeight: '600',
  },
  manageFoldersButton: {
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
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