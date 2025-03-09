import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { Navigation } from '../navigation';

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<Navigation<'ForgotPassword'>>();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#DDDDDD' : '#333333'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#333333' }]}>Forgot Password</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <Text style={{ color: isDark ? '#BBBBBB' : '#666666', fontSize: 16 }}>
          Reset password functionality coming soon.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
  },
  backButton: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default ForgotPasswordScreen;