import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Pressable
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import SwipeableRow from './SwipeableRow';

interface PasswordCardProps {
  password: {
    id: string;
    website: string;
    username: string;
    folder: string;
    dateAdded: string;
  };
  isDark: boolean;
  onPress: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

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

const PasswordCard: React.FC<PasswordCardProps> = ({ 
  password, 
  isDark, 
  onPress, 
  onDelete = () => {}, 
  onEdit = () => {} 
}) => {
  const cardBg = isDark ? '#2A2A2A' : 'white';
  const textColor = isDark ? '#FFFFFF' : '#333333';
  const secondaryTextColor = isDark ? '#AAAAAA' : '#666666';
  
  // Get website name for the icon
  const getWebsiteName = () => {
    try {
      if (!password.website) return '';
      let website = password.website.toLowerCase();
      if (website.startsWith('http://')) website = website.substring(7);
      if (website.startsWith('https://')) website = website.substring(8);
      if (website.startsWith('www.')) website = website.substring(4);
      
      return website.split('.')[0] || '';
    } catch (e) {
      return '';
    }
  };
  
  // Get first letter of website for icon
  const getInitial = () => {
    const name = getWebsiteName();
    return name.charAt(0).toUpperCase() || '#';
  };
  
  // Get a consistent color based on website name
  const getIconColor = () => {
    const colors = [
      '#7B68EE', '#1E90FF', '#FF69B4', '#20B2AA', '#FF7F50', 
      '#6A5ACD', '#32CD32', '#FF4500', '#4169E1', '#8A2BE2'
    ];
    
    const name = getWebsiteName();
    if (!name) return colors[0];
    
    // Use char codes to create a consistent "random" index
    const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = sum % colors.length;
    
    return colors[index];
  };

  // Handle delete and edit actions
  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(password.id);
    }
  }, [onDelete, password.id]);

  const handleEdit = useCallback(() => {
    if (onEdit) {
      onEdit(password.id);
    }
  }, [onEdit, password.id]);

  // Main card content
  const cardContent = (
    <Pressable
      style={({ pressed }) => [
        styles.card, 
        { 
          backgroundColor: isDark ? '#2A2A2A' : 'white',
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }]
        }
      ]}
      onPress={onPress}
    >
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: getIconColor() }]}>
          <Text style={styles.iconText}>{getInitial()}</Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={[styles.websiteText, { color: isDark ? '#FFFFFF' : '#333333' }]} numberOfLines={1}>
            {password.website}
          </Text>
          <Text style={[styles.usernameText, { color: isDark ? '#AAAAAA' : '#666666' }]} numberOfLines={1}>
            {password.username}
          </Text>
          <View style={styles.metaContainer}>
            <View style={styles.folderBadge}>
              <MaterialCommunityIcons 
                name="folder-outline" 
                size={12} 
                color={isDark ? '#AAAAAA' : '#666666'}
              />
              <Text style={[styles.folderText, { color: isDark ? '#AAAAAA' : '#666666' }]}>
                {password.folder}
              </Text>
            </View>
            
            <Text style={[styles.dateText, { color: isDark ? '#AAAAAA' : '#666666' }]}>
              {new Date(password.dateAdded).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        <View style={styles.arrowContainer}>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={isDark ? '#888888' : '#AAAAAA'} 
          />
        </View>
      </View>
    </Pressable>
  );

  // Wrap in ErrorBoundary to prevent app crashes
  return (
    <ErrorBoundary>
      <SwipeableRow 
        onDelete={handleDelete} 
        onEdit={handleEdit} 
        isDark={isDark}
        itemName="password"
      >
        {cardContent}
      </SwipeableRow>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  websiteText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  usernameText: {
    fontSize: 14,
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  folderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderText: {
    fontSize: 12,
    marginLeft: 4,
  },
  dateText: {
    fontSize: 12,
  },
  arrowContainer: {
    marginLeft: 12,
  }
});

export default PasswordCard;