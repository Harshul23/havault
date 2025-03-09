// navigation.ts

import { ParamListBase } from '@react-navigation/native';

// Define the Password type (ensure it matches your actual Password type)
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

// Define the RootStackParamList type
export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  AddPassword: { folders: string[] };
  PasswordDetail: { password: PasswordType }; // Pass the full password object
  EditPassword: { password: PasswordType }; // Pass the full password object for editing
  ManageFolders: { folders: string[] };
  Settings: undefined;
  ChangeMasterPassword: undefined;
  EditProfile: undefined;
};

// Helper type for useRoute
import { RouteProp } from '@react-navigation/native';
export type Route<T extends keyof RootStackParamList> = RouteProp<RootStackParamList, T>;

// Helper type for useNavigation
import { StackNavigationProp } from '@react-navigation/stack';
export type Navigation<T extends keyof RootStackParamList> = StackNavigationProp<RootStackParamList, T>;