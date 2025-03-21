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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CustomModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  onDismiss: (confirmed?: boolean) => void;
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
        return 'checkmark-circle-outline';
      case 'error':
        return 'alert-circle-outline';
      case 'warning':
        return 'warning-outline';
      case 'confirm':
        return 'help-circle-outline';
      default:
        return 'information-circle-outline';
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
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => onDismiss(false)}
    >
      <TouchableWithoutFeedback onPress={() => onDismiss(false)}>
        <View style={[
          styles.overlay,
          { backgroundColor: 'rgba(0, 0, 0, 0.5)' }
        ]}>
          <TouchableWithoutFeedback>
            <View 
              style={[
                styles.modalContainer,
                { borderRadius: 20, alignItems: 'center', width: '90%' },
                { backgroundColor: isDark ? '#1E1E1E' : 'white' }
              ]}
            >
              {/* Header with Icon */}
              <View 
                style={[
                  styles.iconCircle,
                  { backgroundColor: isDark ? '#333333' : '#F5F5F5' }
                ]}
              >
                <Ionicons 
                  name={getIconName()}
                  size={40}
                  color={getIconColor()}
                  style={styles.icon}
                />
              </View>
              
              <Text 
                style={[
                  styles.title,
                  { color: isDark ? '#FFFFFF' : '#333333' }
                ]}
              >
                {title}
              </Text>
              
              <Text 
                style={[
                  styles.message,
                  { color: isDark ? '#AAAAAA' : '#666666' }
                ]}
              >
                {message}
              </Text>
              
              {/* Buttons */}
              <View 
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
                    onPress={() => onDismiss(false)}
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
                  onPress={() => {
                    if (onConfirm) onConfirm();
                    onDismiss(true);
                  }}
                >
                  <Text style={[styles.buttonText, { color: 'white' }]}>
                    {type === 'confirm' ? confirmText : 'OK'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
    width: '100%',
  },
  modalContainer: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    alignSelf: 'center',
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
    width: 60,
    height: 60,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 15,
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
    marginLeft: 20,
    marginRight: 20, 
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22
  },
  buttonContainer: {
    width: '80%',
    marginTop: 8,
    alignSelf: 'center',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    width: '100%',
    marginVertical: 25,
    marginRight: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
        borderRadius: 12,
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