import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  StatusBar,
  Modal,
  Alert
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { 
  FadeInUp, 
  FadeInDown, 
  SlideInRight, 
  ZoomIn, 
  FadeIn 
} from 'react-native-reanimated';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Navigation, RootStackParamList, PasswordType } from '../navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePassword } from '../PasswordContext';

// Components
import PasswordCard from '../components/PasswordCard';
import EmptyState from '../components/EmptyState';
import FolderList from '../components/FolderList';
import CustomModal from '../components/CustomModal';

// Define the Password type
type Password = PasswordType;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<Navigation<'Home'>>();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { passwords: contextPasswords, loadPasswords } = usePassword();
  const isDark = theme === 'dark';
  
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [foldersUpdated, setFoldersUpdated] = useState(0); // Counter to force reload
  
  // Use ref instead of state to prevent re-renders causing animation loops
  const animatedRef = useRef<boolean>(false);
  // Track when screen has fully loaded and mounted
  const isInitialMount = useRef<boolean>(true);
  
  // Modal state for custom alerts
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info' | 'confirm'
  });
  
  // Listen for folder changes from the FolderList component
  const handleFolderUpdated = useCallback(() => {
    setFoldersUpdated(prev => prev + 1);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadData();
        
        // Reset animation flag only on first navigation after login
        // This prevents animations on subsequent navigations back to HomeScreen
        if (isInitialMount.current) {
          animatedRef.current = false;
          isInitialMount.current = false;
        }
      } else {
        // Redirect to login if no user is logged in
        navigation.navigate('Login');
      }
      
      // Clear animation flag when component is unmounted (tab change, etc.)
      return () => {
        // Don't reset isInitialMount to preserve the "first mount" status
      };
    }, [user, contextPasswords, foldersUpdated])
  );

  // Add a listener to reload when returning to this screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (user) {
        loadData();
      } else {
        // Redirect to login if no user is logged in
        navigation.navigate('Login');
      }
    });
    
    return unsubscribe;
  }, [navigation, user]);

  // Reset animation state only when folder selection or search changes
  useEffect(() => {
    // Don't reset on initial render
    if (!isInitialMount.current) {
      animatedRef.current = false;
    }
  }, [selectedFolder, searchQuery]);

  // Add an effect that runs only once on mount to set initial animation state properly
  useEffect(() => {
    // Set animation state initially to false (play animations on first render)
    animatedRef.current = false;
    isInitialMount.current = true;
    
    // Return cleanup function to reset state when component unmounts completely
    return () => {
      animatedRef.current = false;
    };
  }, []); // Empty dependency array = componentDidMount equivalent

  const filteredPasswords = passwords.filter(password => 
    (selectedFolder === 'All' || password.folder === selectedFolder) &&
    (password.website.toLowerCase().includes(searchQuery.toLowerCase()) || 
     password.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (password.title && password.title.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const loadData = async () => {
    if (!user) return;
    
    try {
      // Reload passwords from context
      await loadPasswords();
      // Use the passwords from context
      setPasswords(contextPasswords);
      // Never reset animation flag here
      
      // Load folders for this specific user
      const userFoldersKey = `folders_${user.id}`;
      const storedFolders = await AsyncStorage.getItem(userFoldersKey);
      
      if (storedFolders) {
        setFolders(JSON.parse(storedFolders));
      } else {
        // Default folders if none exist
        const defaultFolders = ['Personal', 'Work', 'Finance'];
        await AsyncStorage.setItem(userFoldersKey, JSON.stringify(defaultFolders));
        setFolders(defaultFolders);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      showModal('Error', 'Failed to load your data. Please try again.', 'error');
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleFolderSelect = (folder: string) => {
    setSelectedFolder(folder);
  };

  const handleManageFolders = () => {
    setIsAddingFolder(true);
  };

  const showModal = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' | 'confirm') => {
    setModalContent({ title, message, type });
    setModalVisible(true);
  };

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) {
      return;
    }
    
    if (folders.includes(newFolderName.trim())) {
      showModal(
        'Folder Exists', 
        'A folder with this name already exists.',
        'warning'
      );
      return;
    }
    
    try {
      const updatedFolders = [...folders, newFolderName.trim()];
      const userFoldersKey = `folders_${user.id}`;
      await AsyncStorage.setItem(userFoldersKey, JSON.stringify(updatedFolders.filter(f => f !== 'All')));
      setFolders(updatedFolders);
      setNewFolderName('');
      setIsAddingFolder(false);
      setFoldersUpdated(foldersUpdated + 1);
      showModal('Success', 'Folder added successfully', 'success');
    } catch (error) {
      console.error('Failed to add folder:', error);
      showModal('Error', 'Failed to add folder', 'error');
    }
  };

  const handleAddPassword = () => {
    navigation.navigate('AddPassword', { folders });
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, {backgroundColor: isDark ? '#121212' : '#F5F5F5'}]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <Animated.View 
        entering={FadeInDown.duration(500)}
        style={[styles.header, {backgroundColor: isDark ? '#1E1E1E' : 'white'}]}
      >
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <FontAwesome5 name="shield-alt" size={24} color={isDark ? '#7B68EE' : '#6A5ACD'} />
            <Text style={[styles.title, {color: isDark ? '#FFFFFF' : '#333333'}]}>Havault</Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => setIsSearching(true)} 
              style={styles.iconButton}
            >
              <Ionicons 
                name="search" 
                size={24} 
                color={isDark ? '#DDDDDD' : '#333333'} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
              <Ionicons 
                name={isDark ? 'sunny' : 'moon'} 
                size={24} 
                color={isDark ? '#DDDDDD' : '#333333'} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => navigation.navigate('Settings')}
              style={styles.iconButton}
            >
              <Ionicons name="settings-outline" size={24} color={isDark ? '#DDDDDD' : '#333333'} />
            </TouchableOpacity>
          </View>
        </View>
        
        {isSearching && (
          <Animated.View 
            entering={FadeInDown.duration(300)}
            style={styles.searchContainer}
          >
            <View style={[
              styles.searchInputContainer,
              {backgroundColor: isDark ? '#333333' : '#F0F0F0'}
            ]}>
              <Ionicons 
                name="search" 
                size={20} 
                color={isDark ? '#999999' : '#777777'} 
                style={styles.searchIcon}
              />
              
              <TextInput
                style={[
                  styles.searchInput, 
                  {color: isDark ? 'white' : 'black'}
                ]}
                placeholder="Search passwords..."
                placeholderTextColor={isDark ? '#999999' : '#777777'}
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus={true}
              />
              
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                >
                  <Ionicons 
                    name="close-circle" 
                    size={20} 
                    color={isDark ? '#999999' : '#777777'} 
                  />
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.closeSearchButton}
              onPress={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
            >
              <Ionicons 
                name="close" 
                size={24} 
                color={isDark ? '#DDDDDD' : '#333333'} 
              />
            </TouchableOpacity>
          </Animated.View>
        )}
        
        <FolderList 
          folders={['All', ...folders]} 
          selectedFolder={selectedFolder}
          onSelectFolder={handleFolderSelect}
          onManageFolders={handleManageFolders}
          isDark={isDark}
          userID={user?.id}
        />
      </Animated.View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {filteredPasswords.length > 0 ? (
          filteredPasswords.map((item, index) => {
            // Only animate if we haven't animated AND we have passwords to show
            const shouldAnimate = !animatedRef.current && filteredPasswords.length > 0;
            
            return (
              <Animated.View 
                key={item.id} 
                entering={
                  shouldAnimate 
                    ? SlideInRight
                      .delay(index * 50)
                      .duration(300)
                      .springify()
                    : FadeIn.duration(10) // Instant appear with no animation if already animated
                }
                onAnimationEnd={() => {
                  // Mark as animated after ANY item completes its animation
                  // This is more robust than waiting for the last item
                  animatedRef.current = true;
                }}
              >
                <PasswordCard 
                  password={item} 
                  isDark={isDark}
                  onPress={() => navigation.navigate('PasswordDetail', { password: item })}
                />
              </Animated.View>
            );
          })
        ) : (
          <EmptyState 
            message={
              searchQuery 
                ? 'No passwords matching your search'
                : selectedFolder !== 'All'
                  ? `No passwords in the "${selectedFolder}" folder`
                  : 'No passwords added yet'
            }
            buttonText="Add Password"
            onButtonPress={handleAddPassword}
            icon={<MaterialCommunityIcons name="shield-key-outline" size={80} color={isDark ? '#7B68EE' : '#6A5ACD'} />}
            isDark={isDark}
          />
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity 
        style={[styles.addButton, {backgroundColor: isDark ? '#7B68EE' : '#6A5ACD'}]} 
        onPress={handleAddPassword}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
      
      {/* Add Folder Modal */}
      <Modal
        visible={isAddingFolder}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsAddingFolder(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setIsAddingFolder(false);
            setNewFolderName('');
          }}
        >
          <View 
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? '#2A2A2A' : 'white' }
            ]}
          >
            <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#333333' }]}>
              Add New Folder
            </Text>
            <TextInput
              style={[
                styles.folderInput,
                {
                  backgroundColor: isDark ? '#333333' : '#F5F5F5',
                  color: isDark ? '#FFFFFF' : '#333333',
                  borderColor: isDark ? '#444444' : '#DDDDDD'
                }
              ]}
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="Enter folder name"
              placeholderTextColor={isDark ? '#999999' : '#777777'}
              autoFocus={true}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setIsAddingFolder(false);
                  setNewFolderName('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]}
                onPress={handleAddFolder}
              >
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

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
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 6,
    marginLeft: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  closeSearchButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bottomPadding: {
    height: 80,
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  folderInput: {
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
  }
});

export default HomeScreen;