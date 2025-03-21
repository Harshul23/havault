import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  FlatList,
  Keyboard
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Animated, { FadeIn, SlideInRight, SlideOutRight } from 'react-native-reanimated';
import CustomModal from '../components/CustomModal';
import { usePassword } from '../PasswordContext';
import SwipeableRow from '../components/SwipeableRow';
import { useIsMountedRef, useSafeReanimatedTransition } from '../utils/animationUtils';

type RouteParams = {
  params: {
    folders: string[];
  }
};

// Add ErrorBoundary class to handle potential SwipeableRow errors
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when SwipeableRow fails
      return this.props.children;
    }

    return this.props.children;
  }
}

const ManageFoldersScreen = () => {
  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const initialFolders = route.params?.folders || ['Personal', 'Work', 'Finance'];
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { updatePasswordsFolder } = usePassword();
  
  const isMounted = useIsMountedRef();
  const isFocused = useIsFocused();
  
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
    folderToDelete: '',
    afterDismissAction: null as (() => void) | null
  });
  
  // Cleanup on unmount - ensure no animations run after unmounting
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Cancel any pending operations when screen loses focus
  useEffect(() => {
    if (!isFocused && isMounted.current) {
      // Reset any editing state
      setEditingFolder('');
      setEditingFolderName('');
    }
  }, [isFocused]);
  
  useEffect(() => {
    if (!user) {
      navigation.navigate('Login');
    }
  }, [user, navigation]);
  
  const showModal = (
    title: string, 
    message: string, 
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm', 
    folderToDelete = '',
    afterDismissAction: (() => void) | null = null
  ) => {
    setModalContent({ title, message, type, folderToDelete, afterDismissAction });
    setModalVisible(true);
  };
  
  const handleModalDismiss = (confirmed: boolean = false) => {
    if (confirmed && modalContent.folderToDelete) {
      // Actually delete the folder
      handleDeleteFolder(modalContent.folderToDelete);
    }
    
    setModalVisible(false);
    
    // Execute afterDismissAction if it exists (for success modals)
    if (modalContent.afterDismissAction) {
      modalContent.afterDismissAction();
    }
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

  const handleEditFolder = (folder: string) => {
    setEditingFolder(folder);
    setEditingFolderName(folder);
  };
  
  const handleUpdateFolder = async () => {
    if (!user) return;
    if (!editingFolderName.trim()) {
      showModal('Error', 'Please enter a folder name', 'error');
      return;
    }
    
    if (editingFolderName.trim().toLowerCase() === 'all' && editingFolder !== 'All') {
      showModal('Reserved Folder Name', 'The name "All" is reserved for the default folder and cannot be used.', 'error');
      return;
    }
    
    if (folders.includes(editingFolderName.trim()) && editingFolderName.trim() !== editingFolder) {
      showModal('Folder Exists', 'A folder with this name already exists.', 'error');
      return;
    }
    
    // Skip update if name hasn't changed
    if (editingFolderName.trim() === editingFolder) {
      setEditingFolder(null);
      setEditingFolderName('');
      return; // No changes, so just exit edit mode without showing success message
    }
    
    const updatedFolders = folders.map(folder => 
      folder === editingFolder ? editingFolderName.trim() : folder
    );
    
    try {
      const userFoldersKey = `folders_${user.id}`;
      await AsyncStorage.setItem(userFoldersKey, JSON.stringify(updatedFolders));
      
      await updatePasswordsFolder(editingFolder || '', editingFolderName.trim());
      
      setFolders(updatedFolders);
      setEditingFolder(null);
      setEditingFolderName('');
      showModal('Success', 'Folder updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update folder:', error);
      showModal('Error', 'Failed to update folder. Please try again.', 'error');
    }
  };
  
  const handleConfirmDeleteFolder = (folderToDelete: string) => {
    if (folderToDelete === 'All') {
      showModal(
        'Cannot Delete',
        'The "All" folder cannot be deleted as it is the default folder.',
        'error'
      );
      return;
    }
    
    showModal(
      'Delete Folder',
      'Are you sure you want to delete "' + folderToDelete + '"? All passwords in this folder will be moved to the "All" folder.',
      'confirm',
      folderToDelete
    );
  };
  
  const handleDeleteFolder = async (folderToDelete?: string) => {
    if (!user) return;
    
    // Use the parameter if provided, otherwise use the one from modalContent
    const folderName = folderToDelete || modalContent.folderToDelete;
    if (!folderName) return;
    
    if (folderName === 'All') {
      showModal(
        'Cannot Delete',
        'The "All" folder cannot be deleted as it is the default folder.',
        'error'
      );
      return;
    }
    
    const updatedFolders = folders.filter(folder => folder !== folderName);
    setFolders(updatedFolders);
    
    try {
      const userFoldersKey = `folders_${user.id}`;
      await AsyncStorage.setItem(userFoldersKey, JSON.stringify(updatedFolders));
      
      await updatePasswordsFolder(folderName, 'All');
      
      const refreshFoldersAfterDismiss = () => {
        (navigation as any).navigate('Home', { 
          folderDeleted: true,
          timestamp: Date.now()
        });
      };
      
      showModal(
        'Success', 
        'Folder deleted successfully', 
        'success',
        '',
        refreshFoldersAfterDismiss
      );
    } catch (error) {
      console.error('Failed to delete folder:', error);
      setFolders([...folders]);
      showModal('Error', 'Failed to delete folder. Please try again.', 'error');
    }
  };
  
  const renderFolder = useCallback(({ item }: { item: string }) => {
    const isEditing = item === editingFolder;
    
    // Skip "All" folder since it's the default and shouldn't be modified
    if (item === 'All') {
      return (
        <Animated.View 
          entering={isMounted.current ? SlideInRight.duration(300) : undefined}
          exiting={isMounted.current ? SlideOutRight.duration(300) : undefined}
          style={[
            styles.folderItem, 
            { backgroundColor: isDark ? '#2A2A2A' : 'white' }
          ]}
        >
          <View style={styles.folderIconContainer}>
            <MaterialCommunityIcons 
              name="folder-multiple" 
              size={24} 
              color={isDark ? '#7B68EE' : '#6A5ACD'} 
            />
          </View>
          <Text style={[styles.folderName, { color: isDark ? '#FFFFFF' : '#333333' }]}>
            {item} (Default)
          </Text>
        </Animated.View>
      );
    }
    
    // For editable folders, implement swipeable
    const folderContent = (
      <View style={[
        styles.folderItem, 
        { backgroundColor: isDark ? '#2A2A2A' : 'white' }
      ]}>
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
      </View>
    );
    
    // When not in editing mode, use SwipeableRow
    if (!isEditing) {
      // Only apply animations when component is mounted and screen is focused
      const animations = useSafeReanimatedTransition(
        SlideInRight.duration(300),
        SlideOutRight.duration(300),
        isMounted
      );
      
      return (
        <Animated.View 
          entering={isFocused ? animations.entering : undefined}
          exiting={isFocused ? animations.exiting : undefined}
        >
          <ErrorBoundary>
            <SwipeableRow
              onDelete={() => handleConfirmDeleteFolder(item)}
              onEdit={() => handleEditFolder(item)}
              isDark={isDark}
              itemName="folder"
            >
              {folderContent}
            </SwipeableRow>
          </ErrorBoundary>
        </Animated.View>
      );
    }
    
    // When in editing mode, show without swipeable
    // Only apply animations when component is mounted and screen is focused
    const animations = useSafeReanimatedTransition(
      SlideInRight.duration(300),
      SlideOutRight.duration(300),
      isMounted
    );
    
    return (
      <Animated.View 
        entering={isFocused ? animations.entering : undefined}
        exiting={isFocused ? animations.exiting : undefined}
      >
        {folderContent}
      </Animated.View>
    );
  }, [isDark, editingFolder, editingFolderName, handleUpdateFolder, handleConfirmDeleteFolder, handleEditFolder, isMounted, isFocused]);
  
  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
      <View style={[styles.header, { backgroundColor: isDark ? '#1E1E1E' : 'white' }]}>
        <View style={styles.headerLeft}>
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
        </View>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#333333' }]}>
            Manage Folders
          </Text>
        </View>
        
        <View style={styles.headerRight} />
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
        onDismiss={handleModalDismiss}
        confirmText="Delete"
        isDark={isDark}
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
  headerLeft: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
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