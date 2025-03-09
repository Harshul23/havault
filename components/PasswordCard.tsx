import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Pressable
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface PasswordCardProps {
  password: {
    website: string;
    username: string;
    folder: string;
    dateAdded: string;
  };
  isDark: boolean;
  onPress: () => void;
}

const PasswordCard: React.FC<PasswordCardProps> = ({ password, isDark, onPress }) => {
  const cardBg = isDark ? '#2A2A2A' : 'white';
  const textColor = isDark ? '#FFFFFF' : '#333333';
  const secondaryTextColor = isDark ? '#AAAAAA' : '#777777';
  
  // Get website domain for icon
  const getDomain = (url: string): string => {
    try {
      // Try to parse the URL
      let domain = url.toLowerCase();
      if (!domain.startsWith('http')) {
        domain = 'https://' + domain;
      }
      const hostname = new URL(domain).hostname;
      return hostname.replace('www.', '');
    } catch (e) {
      // If URL is invalid, just return the original
      return url;
    }
  };
  
  const domain = getDomain(password.website);
  
  // Get initial letter for favicon placeholder
  const getInitial = () => {
    if (!domain || domain.length === 0) return '?';
    return domain.charAt(0).toUpperCase();
  };
  
  // Get icon color based on domain
  const getIconColor = () => {
    const colors = [
      '#4285F4', '#EA4335', '#FBBC05', '#34A853', // Google colors
      '#0866FF', '#CD486B', '#1DB954', '#FF9900', // Facebook, Instagram, Spotify, Amazon
      '#1DA1F2', '#FF0000', '#7289DA', '#25D366'  // Twitter, YouTube, Discord, WhatsApp
    ];
    
    // Simple hash function for domain name
    let hash = 0;
    for (let i = 0; i < domain.length; i++) {
      hash = domain.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card, 
        { 
          backgroundColor: cardBg,
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
          <Text style={[styles.websiteText, { color: textColor }]} numberOfLines={1}>
            {password.website}
          </Text>
          <Text style={[styles.usernameText, { color: secondaryTextColor }]} numberOfLines={1}>
            {password.username}
          </Text>
          <View style={styles.metaContainer}>
            <View style={styles.folderBadge}>
              <MaterialCommunityIcons 
                name="folder-outline" 
                size={12} 
                color={secondaryTextColor}
              />
              <Text style={[styles.folderText, { color: secondaryTextColor }]}>
                {password.folder}
              </Text>
            </View>
            
            <Text style={[styles.dateText, { color: secondaryTextColor }]}>
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
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 42,
    height: 42,
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
    marginBottom: 2,
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
    marginLeft: 10,
  }
});

export default PasswordCard;