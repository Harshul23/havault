import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  StatusBar,
  Modal,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation, NavigationProp, useRoute, ParamListBase, RouteProp, CommonActions } from '@react-navigation/native';
import { Navigation, RootStackParamList, PasswordType } from '../navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePassword } from '../PasswordContext';

// Import performance and logger utilities
import performance from '../utils/performance';
import logger from '../utils/logger';
import { debounceNavigation } from '../utils/animationUtils';

// Components
import PasswordCard from '../components/PasswordCard';
import EmptyState from '../components/EmptyState';
import FolderList from '../components/FolderList';
import CustomModal from '../components/CustomModal';

// Define the Password type
type Password = PasswordType;

// Create memoized components for better performance
const MemoizedPasswordCard = React.memo(PasswordCard);

// Define Home screen params that include folderDeleted
interface HomeScreenParams {
  folderDeleted?: boolean;
}

// Extend RootStackParamList to include HomeScreenParams
type ExtendedRootStackParamList = RootStackParamList & {
  Home: HomeScreenParams | undefined;
};

// Define properly typed navigation
type HomeScreenNavigationProp = NavigationProp<ExtendedRootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { passwords: contextPasswords, loadPasswords, deletePassword: contextDeletePassword, isLoading: passwordsLoading } = usePassword();
  
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [filteredPasswords, setFilteredPasswords] = useState<Password[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [foldersUpdated, setFoldersUpdated] = useState(0); // Counter to force reload
  const [isLoading, setIsLoading] = useState(true);
  
  // Add isMounted ref to prevent animations on unmounted components
  const isMounted = useRef(true);
  
  // Folder data cache to improve folder switching speed
  const folderDataCache = useRef<Record<string, Password[]>>({});
  
  // Animation ref for optimized transitions
  const fadeAnim = useRef(new Animated.Value(1)).current; // Start visible
  
  // Memoize theme-dependent colors to avoid recalculations during render
  const themeColors = useMemo(() => ({
    screenBackground: '#121212',
    headerBackground: '#1E1E1E',
    textPrimary: '#FFFFFF',
    textSecondary: '#AAAAAA',
    accent: '#7B68EE',
    searchBackground: '#333333',
    searchBorder: '#444444',
    searchPlaceholder: '#999999',
    modalBackground: '#2A2A2A',
    inputBackground: '#333333',
  }), []);
  
  // Track when screen has fully loaded and mounted
  const isInitialMount = useRef<boolean>(true);
  
  // Modal state for custom alerts
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info' | 'confirm'
  });
  
  // Add a ref at the component level (outside of any effect)
  const folderDeletedProcessedRef = useRef(false);
  
  // Add this state for tracking the current item to delete
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);
  
  // Update filtered passwords when folder selection or search query changes
  useEffect(() => {
    performance.startTimer('filterPasswords');
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = passwords.filter(password => 
        (selectedFolder === 'All' || password.folder === selectedFolder) &&
        (password.title?.toLowerCase().includes(query) || 
         password.username?.toLowerCase().includes(query) ||
         password.website?.toLowerCase().includes(query) ||
         password.notes?.toLowerCase().includes(query))
      );
      
      // Cache the result for performance
      const cacheKey = `${selectedFolder}_${searchQuery}`;
      folderDataCache.current[cacheKey] = filtered;
      
      setFilteredPasswords(filtered);
    } else {
      // If no search query, just filter by selected folder
      const filtered = selectedFolder === 'All'
        ? passwords
        : passwords.filter(password => password.folder === selectedFolder);
      
      // Cache the result for performance
      const cacheKey = `${selectedFolder}_${searchQuery}`;
      folderDataCache.current[cacheKey] = filtered;
      
      setFilteredPasswords(filtered);
    }
    
    performance.endTimer('filterPasswords');
  }, [passwords, selectedFolder, searchQuery]);

  // Listen for folder changes from the FolderList component
  const handleFolderUpdated = useCallback(() => {
    setFoldersUpdated(prev => prev + 1);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadData();
      } else {
        // Redirect to login if no user is logged in
        navigation.navigate('Login');
      }
      
      return () => {
        // Clean up any resources
      };
    }, [user])
  );

  // Add a listener to reload when returning to this screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (user) {
        // Pre-load data but don't wait for it to complete
        performance.runNonBlocking(() => {
          loadData();
        });
      } else {
        // Redirect to login if no user is logged in
        navigation.navigate('Login');
      }
    });
    
    return unsubscribe;
  }, [navigation, user]);

  // Add an effect that runs only once on mount to set initial animation state properly
  useEffect(() => {
    // Set animation state initially to false (play animations on first render)
    isInitialMount.current = true;
    
    // Pre-load and cache all folders on initial mount for faster folder switching
    if (user) {
      loadFolders().then(() => {
        // Pre-compute folder data for fast switching
        prefetchFolderData();
      });
    }
    
    // Return cleanup function to reset state when component unmounts completely
    return () => {
      // Clear folder data cache when component is completely unmounted
      folderDataCache.current = {};
    };
  }, []); // Empty dependency array = componentDidMount equivalent

  // Prefetch folder data for fast switching
  const prefetchFolderData = useCallback(() => {
    // Run in background to avoid blocking UI
    performance.runAfterInteractions(() => {
      folders.forEach(folder => {
        const key = `${folder}_`;
        // Precalculate and cache filtered results for each folder
        folderDataCache.current[key] = passwords.filter(
          password => folder === 'All' || password.folder === folder
        );
      });
    });
  }, [folders, passwords]);

  // Memoized loadFolders function with optimized caching
  const loadFolders = useCallback(async () => {
    if (!user) return;
    
    try {
      const userFoldersKey = `folders_${user.id}`;
      const storedFolders = await AsyncStorage.getItem(userFoldersKey);
      
      if (storedFolders) {
        const folderList = JSON.parse(storedFolders);
        setFolders(folderList);
      } else {
        // Default folders if none stored
        setFolders(['Personal', 'Work', 'Finance']);
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  }, [user]);

  // Memoized loadData function to prevent unnecessary re-renders
  const loadData = useCallback(async () => {
    if (!user) return;
    
    performance.startTimer('loadData');
    setIsLoading(true);
    
    try {
      // Start passwords and folders loading in parallel
      const passwordsPromise = loadPasswords();
      const foldersPromise = loadFolders();
      
      // Wait for both to complete
      await Promise.all([passwordsPromise, foldersPromise]);
      
      // Use InteractionManager to update state after any animations complete
      performance.runAfterInteractions(() => {
        // Update state with data from context
        setPasswords(contextPasswords);
        
        // Reset folder data cache since passwords have changed
        folderDataCache.current = {};
        
        // Pre-compute folder data for fast switching
        prefetchFolderData();
        
        setIsLoading(false);
      });
      
      performance.endTimer('loadData');
    } catch (error) {
      console.error('Failed to load data:', error);
      showModal('Error', 'Failed to load your data. Please try again.', 'error');
      setIsLoading(false);
      performance.endTimer('loadData');
    }
  }, [user, contextPasswords, loadPasswords, prefetchFolderData, loadFolders]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  // Optimized folder selection for faster switching
  const handleFolderSelect = useCallback((folder: string) => {
    // Start transition immediately for better UX
    performance.startTimer('folderSwitch');
    
    // If we have cached data for this folder, use it immediately
    const cacheKey = `${folder}_${searchQuery}`;
    if (folderDataCache.current[cacheKey]) {
      // Ultra-fast folder switching using pre-computed data
      setSelectedFolder(folder);
      performance.endTimer('folderSwitch');
      return;
    }
    
    // Otherwise, update the folder and let the useMemo recalculate
    setSelectedFolder(folder);
    
    // Pre-compute other folder combinations in the background
    performance.runAfterInteractions(() => {
      if (searchQuery) {
        // Pre-compute results for this folder with no search query for future use
        const noSearchKey = `${folder}_`;
        folderDataCache.current[noSearchKey] = passwords.filter(
          password => folder === 'All' || password.folder === folder
        );
      }
      performance.endTimer('folderSwitch');
    });
  }, [searchQuery, passwords]);

  const handleManageFolders = useCallback(() => {
    setIsAddingFolder(true);
  }, []);

  const showModal = useCallback((title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' | 'confirm') => {
    setModalContent({ title, message, type });
    setModalVisible(true);
  }, []);

  const handleAddFolder = useCallback(async () => {
    if (newFolderName.trim() === '') {
      // Don't add empty folder names
      return;
    }

    // Prevent adding a folder named "All" since it's reserved
    if (newFolderName.trim().toLowerCase() === 'all') {
      setModalContent({
        title: 'Reserved Folder Name',
        message: 'The name "All" is reserved for the default folder and cannot be used.',
        type: 'error'
      });
      setModalVisible(true);
      return;
    }

    if (folders.includes(newFolderName.trim())) {
      // Handle duplicate folder
      setModalContent({
        title: 'Folder Already Exists',
        message: `The folder "${newFolderName.trim()}" already exists.`,
        type: 'error'
      });
      setModalVisible(true);
      return;
    }

    try {
      performance.startTimer('addFolder');
      const updatedFolders = [...folders, newFolderName.trim()];
      // Check if user exists before using it
      if (user) {
        const userFoldersKey = `folders_${user.id}`;
        // Make sure "All" is not stored in AsyncStorage as it's a UI concept
        await AsyncStorage.setItem(userFoldersKey, JSON.stringify(updatedFolders.filter(f => f !== 'All')));
      }
      setFolders(updatedFolders);
      setNewFolderName('');
      setIsAddingFolder(false);
      
      // Pre-compute folder data for the new folder
      performance.runAfterInteractions(() => {
        const key = `${newFolderName.trim()}_`;
        folderDataCache.current[key] = passwords.filter(
          password => password.folder === newFolderName.trim()
        );
        performance.endTimer('addFolder');
      });
    } catch (error) {
      console.error('Failed to save folder:', error);
      performance.endTimer('addFolder');
    }
  }, [folders, newFolderName, user, passwords]);

  const handleAddPassword = useCallback(() => {
    navigation.navigate('AddPassword', { folders });
  }, [navigation, folders]);

  // Optimized delete password function
  const deletePassword = useCallback(async (id: string) => {
    try {
      await contextDeletePassword(id);
      // Invalidate folder data cache since passwords have changed
      folderDataCache.current = {};
    } catch (error) {
      console.error('Failed to delete password:', error);
      showModal('Error', 'Failed to delete password. Please try again.', 'error');
    }
  }, [contextDeletePassword, showModal]);

  // Utility function to dismiss keyboard with better handling
  const dismissKeyboard = useCallback(() => {
    // Use a slight delay to ensure smooth transition when dismissing keyboard
    Keyboard.dismiss();
  }, []);

  // Update the renderPasswordItem function to handle swipe actions
  const renderPasswordItem = useCallback(({ item }: { item: Password }) => (
    <MemoizedPasswordCard 
      password={item} 
      isDark={isDark}
      onPress={() => debouncedNavigateToPasswordDetail(item)}
      onDelete={(id) => {
        // Show confirmation modal before deleting
        setModalContent({
          title: 'Delete Password',
          message: `Are you sure you want to delete the password for "${item.website || item.title}"?`,
          type: 'confirm'
        });
        setModalVisible(true);
        // Store the ID to be deleted when confirmed
        setCurrentItemId(item.id);
      }}
      onEdit={(id) => {
        // Navigate to edit screen for the password
        debouncedNavigateToEditPassword(item);
      }}
    />
  ), [isDark, debouncedNavigateToPasswordDetail, debouncedNavigateToEditPassword, setModalContent]);

  // Memoized keyExtractor for FlatList
  const keyExtractor = useCallback((item: Password) => item.id, []);

  // Memoized ListEmptyComponent for FlatList
  const ListEmptyComponent = useMemo(() => (
    <View style={{ paddingTop: 0, paddingBottom: 80 }}>
      <EmptyState 
        message={
          searchQuery 
            ? 'No passwords matching your search'
            : selectedFolder !== 'All'
              ? `No passwords in the "${selectedFolder}" folder`
              : 'No passwords yet. Tap the + button at the bottom right to add your first password.'
        }
        isDark={isDark}
        buttonText={undefined}
        onButtonPress={undefined}
      />
    </View>
  ), [searchQuery, selectedFolder, isDark]);

  // Update passwords when contextPasswords changes
  useEffect(() => {
    if (contextPasswords) {
      setPasswords(contextPasswords);
      setIsLoading(false);
    }
  }, [contextPasswords]);

  // Effect to detect folder changes from ManageFoldersScreen
  useEffect(() => {
    const handleScreenFocus = () => {
      const state = navigation.getState();
      const route = state?.routes?.find(r => r.name === 'Home');
      
      // Get the folderDeleted param safely
      const folderDeleted = route?.params && 'folderDeleted' in (route.params || {}) 
        ? (route.params as HomeScreenParams).folderDeleted 
        : false;
      
      // If folderDeleted is true and we haven't processed it yet
      if (folderDeleted && !folderDeletedProcessedRef.current) {
        console.log('Folder deleted detected, refreshing data...');
        
        // Set our ref to true to avoid multiple refreshes
        folderDeletedProcessedRef.current = true;
        
        // Reload data
        if (user) {
          // Reset the navigation state to clear params
          navigation.dispatch(
            CommonActions.navigate({
              name: 'Home',
              params: {},
            })
          );
          
          // Force reload folders
          const loadFolders = async () => {
            try {
              const userFoldersKey = `folders_${user.id}`;
              const storedFolders = await AsyncStorage.getItem(userFoldersKey);
              
              if (storedFolders) {
                const folderList = JSON.parse(storedFolders);
                setFolders(folderList);
                
                // If current folder was deleted, switch to "All"
                if (!folderList.includes(selectedFolder) && selectedFolder !== 'All') {
                  setSelectedFolder('All');
                }
              } else {
                // Default folders if none stored
                setFolders(['Personal', 'Work', 'Finance']);
              }
            } catch (error) {
              console.error('Failed to load folders:', error);
            }
          };
          
          // Load both folders and passwords
          loadFolders();
          loadPasswords();
        }
      } else if (!folderDeleted) {
        // Reset the flag if no folderDeleted param is present
        folderDeletedProcessedRef.current = false;
      }
    };

    // Add the focus listener
    const unsubscribe = navigation.addListener('focus', handleScreenFocus);
    
    // Call on initial mount to handle deep linking or direct navigation
    handleScreenFocus();
    
    // Clean up the listener when component unmounts
    return unsubscribe;
  }, [navigation, user, selectedFolder]);

  // Search input container styling
  const searchInputContainerStyle = useMemo(() => [
    styles.searchInputContainer,
    { 
      backgroundColor: themeColors.searchBackground,
      borderColor: themeColors.searchBorder,
      borderWidth: 1
    }
  ], [themeColors]);

  // Render the search bar
  const renderSearchBar = () => (
    <View style={[styles.searchContainer, { backgroundColor: themeColors.headerBackground }]}>
      <View style={searchInputContainerStyle}>
        <Ionicons 
          name="search" 
          size={20} 
          color={themeColors.searchPlaceholder} 
          style={styles.searchIcon} 
        />
        <TextInput
          style={[styles.searchInput, { color: themeColors.textPrimary }]}
          placeholder="Search passwords..."
          placeholderTextColor={themeColors.searchPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons name="close-circle" size={18} color={themeColors.searchPlaceholder} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // When using Animated.timing
  const animateFade = (toValue: number, duration: number = 150) => {
    if (isMounted.current) {
      Animated.timing(fadeAnim, {
        toValue,
        duration,
        useNativeDriver: true,
      }).start();
    }
  };

  // Update the modal dismiss handler to handle delete confirmation
  const handleModalDismiss = useCallback(async (confirmed: boolean = false) => {
    if (confirmed && currentItemId && modalContent.type === 'confirm') {
      // Delete the password when user confirms
      await deletePassword(currentItemId);
      // Reset the current item ID
      setCurrentItemId(null);
    }
    
    setModalVisible(false);
  }, [currentItemId, modalContent.type, deletePassword]);

  // Create debounced navigation functions
  const debouncedNavigateToPasswordDetail = useCallback(
    debounceNavigation((password: Password) => {
      if (isMounted.current) {
        navigation.navigate('PasswordDetail', { password });
      }
    }),
    [navigation]
  );
  
  const debouncedNavigateToEditPassword = useCallback(
    debounceNavigation((password: Password) => {
      if (isMounted.current) {
        navigation.navigate('EditPassword', { password });
      }
    }),
    [navigation]
  );

  // Render loading indicator if data is loading
  if (isLoading || passwordsLoading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.screenBackground, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={themeColors.accent} />
        <Text style={{ marginTop: 20, color: themeColors.textPrimary }}>Loading your passwords...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#121212' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <KeyboardAvoidingView 
        style={{ flex: 1, backgroundColor: '#121212' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isMounted.current && (
          <Animated.View 
            style={[
              styles.content,
              {
                backgroundColor: '#121212',
                opacity: fadeAnim
              }
            ]}
          >
            {/* Header Section */}
            <View style={[styles.header, { backgroundColor: themeColors.headerBackground }]}>
              <View style={styles.headerTop}>
                <View style={styles.logoContainer}>
                  <FontAwesome5 name="shield-alt" size={24} color={themeColors.accent} />
                  <View style={styles.headerTitleContainer}>
                    <Text style={[styles.title, {color: themeColors.textPrimary}]}>Havault</Text>
                  </View>
                </View>
                
                <View style={styles.headerActions}>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('Settings')}
                    style={styles.iconButton}
                  >
                    <Ionicons name="settings-outline" size={24} color={themeColors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
              
              {renderSearchBar()}
              
              <FolderList 
                folders={['All', ...folders]} 
                selectedFolder={selectedFolder}
                onSelectFolder={handleFolderSelect}
                onManageFolders={() => navigation.navigate('ManageFolders', { folders: folders })}
                isDark={true}
                userID={user?.id}
              />
            </View>

            {/* Content - Main area below header */}
            <View style={{ flex: 1 }}>
              <FlatList
                data={filteredPasswords}
                keyExtractor={(item) => item.id}
                renderItem={renderPasswordItem}
                contentContainerStyle={[
                  styles.passwordList,
                  filteredPasswords.length === 0 ? { flex: 1, justifyContent: 'center' } : null
                ]}
                ListEmptyComponent={ListEmptyComponent}
                showsVerticalScrollIndicator={false}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={10}
                removeClippedSubviews={true}
                style={{ backgroundColor: themeColors.screenBackground }}
              />
            </View>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
        
      {/* Add Folder Modal */}
      <Modal
        visible={isAddingFolder}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsAddingFolder(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{
            flex: 1,
            backgroundColor: 'transparent'
          }}
        >
          <TouchableOpacity 
            style={[
              styles.modalOverlay,
              {backgroundColor: 'rgba(0, 0, 0, 0.5)'}
            ]}
            activeOpacity={1}
            onPress={() => {
              dismissKeyboard();
              setIsAddingFolder(false);
              setNewFolderName('');
            }}
          >
            <TouchableWithoutFeedback>
              <Animated.View 
                style={[
                  styles.modalContent,
                  { backgroundColor: themeColors.modalBackground }
                ]}
              >
                <Text style={[styles.modalTitle, { color: themeColors.textPrimary }]}>
                  Add New Folder
                </Text>
                <TextInput
                  style={[
                    styles.folderInput,
                    {
                      backgroundColor: themeColors.inputBackground,
                      color: themeColors.textPrimary,
                      borderColor: themeColors.searchBorder
                    }
                  ]}
                  value={newFolderName}
                  onChangeText={setNewFolderName}
                  placeholder="Enter folder name"
                  placeholderTextColor={themeColors.searchPlaceholder}
                  autoFocus={true}
                  returnKeyType="done"
                  onSubmitEditing={handleAddFolder}
                  blurOnSubmit={false}
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
              </Animated.View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      <CustomModal
        visible={modalVisible}
        title={modalContent.title}
        message={modalContent.message}
        type={modalContent.type}
        isDark={isDark}
        onDismiss={handleModalDismiss}
        confirmText="Delete"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Let the theme background color flow through
  },
  header: {
    paddingTop: 60,
    paddingBottom: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    zIndex: 10, // Ensure header is above other elements
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    width: '100%',
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
  content: {
    flex: 1,
    paddingBottom: 0,
  },
  bottomPadding: {
    height: 100,
    width: '100%', // Ensure it covers the full width
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
  },
  passwordCardContainer: {
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 6,
    marginLeft: 12,
  },
  passwordList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;