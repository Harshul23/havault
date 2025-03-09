import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInUp, FadeInDown } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CustomModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  onDismiss?: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  isDark?: boolean;
}

const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  title,
  message,
  type = 'info',
  onDismiss,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  isDark = false
}) => {
  // Define colors based on type and theme
  const getIconName = () => {
    switch(type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'confirm':
        return 'help-circle';
      default:
        return 'information-circle';
    }
  };
  
  const getIconColor = () => {
    switch(type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'warning':
        return '#FF9800';
      case 'confirm':
        return '#2196F3';
      default:
        return '#2196F3';
    }
  };
  
  const getPrimaryButtonColor = () => {
    switch(type) {
      case 'success':
        return isDark ? '#388E3C' : '#4CAF50';
      case 'error':
        return isDark ? '#D32F2F' : '#F44336';
      case 'warning':
        return isDark ? '#F57C00' : '#FF9800';
      case 'confirm':
        return isDark ? '#7B68EE' : '#6A5ACD';
      default:
        return isDark ? '#7B68EE' : '#6A5ACD';
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View 
              entering={SlideInUp.springify().damping(15)}
              style={[
                styles.modalContainer,
                { backgroundColor: isDark ? '#2A2A2A' : 'white' }
              ]}
            >
              {/* Header with Icon */}
              <Animated.View 
                entering={FadeInDown.delay(100).duration(500)}
                style={[
                  styles.iconCircle,
                  { backgroundColor: isDark ? '#333333' : '#F5F5F5' }
                ]}
              >
                <Ionicons 
                  name={getIconName() as any}
                  size={40}
                  color={getIconColor()}
                  style={styles.icon}
                />
              </Animated.View>
              
              <Animated.Text 
                entering={FadeInDown.delay(200).duration(500)}
                style={[
                  styles.title,
                  { color: isDark ? '#FFFFFF' : '#333333' }
                ]}
              >
                {title}
              </Animated.Text>
              
              <Animated.Text 
                entering={FadeInDown.delay(300).duration(500)}
                style={[
                  styles.message,
                  { color: isDark ? '#AAAAAA' : '#666666' }
                ]}
              >
                {message}
              </Animated.Text>
              
              {/* Buttons */}
              <Animated.View 
                entering={FadeInDown.delay(400).duration(500)}
                style={[
                  styles.buttonContainer,
                  type === 'confirm' && styles.buttonRow
                ]}
              >
                {type === 'confirm' && (
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.cancelButton,
                      { backgroundColor: isDark ? '#333333' : '#EEEEEE' }
                    ]}
                    onPress={onDismiss}
                  >
                    <Text style={[
                      styles.buttonText,
                      { color: isDark ? '#DDDDDD' : '#666666' }
                    ]}>
                      {cancelText}
                    </Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[
                    styles.button,
                    {backgroundColor: getPrimaryButtonColor()},
                    type === 'confirm' && styles.confirmButton
                  ]}
                  onPress={type === 'confirm' ? onConfirm : onDismiss}
                >
                  <Text style={[styles.buttonText, { color: 'white' }]}>
                    {type === 'confirm' ? confirmText : 'OK'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(5px)'
  },
  modalContainer: {
    width: SCREEN_WIDTH * 0.85,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  icon: {
    textAlign: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center'
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22
  },
  buttonContainer: {
    width: '100%',
    marginTop: 8
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    width: '100%',
    marginVertical: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cancelButton: {
    width: '48%',
  },
  confirmButton: {
    width: '48%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  }
});

export default CustomModal; 