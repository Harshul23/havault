import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './context/AuthContext';

// Define the Password type
export interface PasswordType {
    id: string;
    title: string;
    username: string;
    password: string;
    website: string;
    folder: string;
    dateAdded: string;
    lastModified?: string;
    notes?: string;
    strength?: string;
}

// Define the context type
interface PasswordContextType {
    passwords: PasswordType[];
    addPassword: (password: Omit<PasswordType, 'id'>) => Promise<void>;
    updatePassword: (id: string, updates: Partial<PasswordType>) => Promise<void>;
    deletePassword: (id: string) => Promise<void>;
    loadPasswords: () => Promise<void>;
    isLoading: boolean;
    updatePasswordsFolder: (oldFolder: string, newFolder: string) => Promise<void>;
}

// Create the context
const PasswordContext = createContext<PasswordContextType | undefined>(undefined);

// Create a provider component
export const PasswordProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [passwords, setPasswords] = useState<PasswordType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();

    // Load passwords when user changes
    useEffect(() => {
        if (user) {
            loadPasswords();
        } else {
            // Clear passwords when user logs out
            setPasswords([]);
        }
    }, [user]);

    const savePasswordsToStorage = async (userPasswords: PasswordType[]) => {
        if (!user) return;
        
        try {
            const passwordKey = `passwords_${user.id}`;
            await AsyncStorage.setItem(passwordKey, JSON.stringify(userPasswords));
            console.log(`Saved ${userPasswords.length} passwords for user ${user.id}`);
        } catch (error) {
            console.error('Failed to save passwords to storage:', error);
            throw error; // Rethrow to handle in calling function
        }
    };

    const loadPasswords = async () => {
        if (!user) return;
        
        setIsLoading(true);
        
        try {
            const passwordKey = `passwords_${user.id}`;
            const storedPasswords = await AsyncStorage.getItem(passwordKey);
            
            console.log(`Loading passwords for user ${user.id}`);
            
            if (storedPasswords) {
                const parsedPasswords = JSON.parse(storedPasswords);
                console.log(`Loaded ${parsedPasswords.length} passwords`);
                setPasswords(parsedPasswords);
            } else {
                // Initialize with empty array if not found
                console.log('No passwords found, initializing with empty array');
                setPasswords([]);
                await AsyncStorage.setItem(passwordKey, JSON.stringify([]));
            }
        } catch (error) {
            console.error('Failed to load passwords:', error);
            // Initialize with empty array in case of error
            setPasswords([]);
        } finally {
            setIsLoading(false);
        }
    };

    const addPassword = useCallback(async (password: Omit<PasswordType, 'id'>) => {
        if (!user) return;
        
        try {
            const newPassword: PasswordType = { 
                ...password, 
                id: Date.now().toString(),
                dateAdded: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };
            
            // Create a new array with the added password
            const updatedPasswords = [...passwords, newPassword];
            
            // Update state
            setPasswords(updatedPasswords);
            
            // Save to AsyncStorage
            await savePasswordsToStorage(updatedPasswords);
            
            console.log(`Added password: ${newPassword.title}`);
        } catch (error) {
            console.error('Failed to add password:', error);
            // Revert state change if storage fails
            await loadPasswords();
        }
    }, [user, passwords]);

    const updatePassword = useCallback(async (id: string, updates: Partial<PasswordType>) => {
        if (!user) return;
        
        try {
            // Update password in state
            const updatedPasswords = passwords.map(password => 
                password.id === id 
                ? { 
                    ...password, 
                    ...updates, 
                    lastModified: new Date().toISOString() 
                } 
                : password
            );
            
            // Update state
            setPasswords(updatedPasswords);
            
            // Save to AsyncStorage
            await savePasswordsToStorage(updatedPasswords);
            
            console.log(`Updated password: ${id}`);
        } catch (error) {
            console.error('Failed to update password:', error);
            // Revert state change if storage fails
            await loadPasswords();
        }
    }, [user, passwords]);

    const deletePassword = useCallback(async (id: string) => {
        if (!user) return;
        
        try {
            // Filter out the deleted password
            const updatedPasswords = passwords.filter(password => password.id !== id);
            
            // Update state
            setPasswords(updatedPasswords);
            
            // Save to AsyncStorage
            await savePasswordsToStorage(updatedPasswords);
            
            console.log(`Deleted password: ${id}`);
        } catch (error) {
            console.error('Failed to delete password:', error);
            // Revert state change if storage fails
            await loadPasswords();
        }
    }, [user, passwords]);

    const updatePasswordsFolder = useCallback(async (oldFolder: string, newFolder: string) => {
        if (!user) return;
        
        try {
            // Filter passwords in the specified folder
            const folderPasswords = passwords.filter(password => password.folder === oldFolder);
            
            if (folderPasswords.length === 0) {
                console.log(`No passwords found in folder "${oldFolder}"`);
                return;
            }
            
            console.log(`Moving ${folderPasswords.length} passwords from "${oldFolder}" to "${newFolder}"`);
            
            // Update all passwords in the old folder to the new folder
            const updatedPasswords = passwords.map(password => 
                password.folder === oldFolder
                    ? { ...password, folder: newFolder, lastModified: new Date().toISOString() }
                    : password
            );
            
            // Update state
            setPasswords(updatedPasswords);
            
            // Save to AsyncStorage
            await savePasswordsToStorage(updatedPasswords);
            
            console.log(`Successfully moved passwords from "${oldFolder}" to "${newFolder}"`);
        } catch (error) {
            console.error(`Failed to update passwords from folder "${oldFolder}" to "${newFolder}":`, error);
            // Revert state change if storage fails
            await loadPasswords();
        }
    }, [user, passwords]);

    const value: PasswordContextType = {
        passwords,
        addPassword,
        updatePassword,
        deletePassword,
        loadPasswords,
        isLoading,
        updatePasswordsFolder
    };

    return (
        <PasswordContext.Provider value={value}>
            {children}
        </PasswordContext.Provider>
    );
};

// Create a custom hook to use the context
export const usePassword = () => {
    const context = useContext(PasswordContext);
    if (!context) {
        throw new Error('usePassword must be used within a PasswordProvider');
    }
    return context;
};