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
}

// Create the context
const PasswordContext = createContext<PasswordContextType | undefined>(undefined);

// Create a provider component
export const PasswordProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [passwords, setPasswords] = useState<PasswordType[]>([]);
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

    const loadPasswords = async () => {
        if (!user) return;
        
        try {
            const passwordKey = `passwords_${user.id}`;
            const storedPasswords = await AsyncStorage.getItem(passwordKey);
            
            if (storedPasswords) {
                setPasswords(JSON.parse(storedPasswords));
            } else {
                // Initialize with empty array if not found
                setPasswords([]);
                await AsyncStorage.setItem(passwordKey, JSON.stringify([]));
            }
        } catch (error) {
            console.error('Failed to load passwords:', error);
        }
    };

    // Save passwords when they change
    useEffect(() => {
        const savePasswords = async () => {
            if (!user) return;
            
            try {
                const passwordKey = `passwords_${user.id}`;
                await AsyncStorage.setItem(passwordKey, JSON.stringify(passwords));
            } catch (error) {
                console.error('Failed to save passwords:', error);
            }
        };

        if (user) {
            savePasswords();
        }
    }, [passwords, user]);

    const addPassword = useCallback(async (password: Omit<PasswordType, 'id'>) => {
        if (!user) return;
        
        const newPassword: PasswordType = { 
            ...password, 
            id: Date.now().toString(),
            dateAdded: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        setPasswords(prevPasswords => [...prevPasswords, newPassword]);
    }, [user]);

    const updatePassword = useCallback(async (id: string, updates: Partial<PasswordType>) => {
        if (!user) return;
        
        setPasswords(prevPasswords =>
            prevPasswords.map(password => 
                password.id === id 
                ? { 
                    ...password, 
                    ...updates, 
                    lastModified: new Date().toISOString() 
                } 
                : password
            )
        );
    }, [user]);

    const deletePassword = useCallback(async (id: string) => {
        if (!user) return;
        
        setPasswords(prevPasswords => prevPasswords.filter(password => password.id !== id));
    }, [user]);

    const value: PasswordContextType = {
        passwords,
        addPassword,
        updatePassword,
        deletePassword,
        loadPasswords
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