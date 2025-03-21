import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  Platform
} from 'react-native';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
  isDark?: boolean;
}

// Define the type for the component with the static method
interface CustomAlertComponent extends React.FC<CustomAlertProps> {
  alert: (title: string, message: string, buttons?: AlertButton[]) => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK' }],
  onDismiss,
  isDark = false
}) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.container,
          { backgroundColor: isDark ? '#2A2A2A' : 'white' }
        ]}>
          <Text style={[
            styles.title,
            { color: isDark ? 'white' : 'black' }
          ]}>
            {title}
          </Text>
          <Text style={[
            styles.message,
            { color: isDark ? '#CCCCCC' : '#333333' }
          ]}>
            {message}
          </Text>
          <View style={[
            styles.buttonContainer,
            buttons.length > 2 ? styles.buttonContainerVertical : null
          ]}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  {
                    backgroundColor: button.style === 'destructive' 
                      ? '#FF3B30' 
                      : (isDark ? '#444444' : '#F0F0F0')
                  },
                  buttons.length > 1 && index < buttons.length - 1 ? 
                    { marginRight: 8 } : null
                ]}
                onPress={() => {
                  if (button.onPress) {
                    button.onPress();
                  } else if (onDismiss) {
                    onDismiss();
                  }
                }}
              >
                <Text style={[
                  styles.buttonText,
                  {
                    color: button.style === 'destructive' 
                      ? 'white' 
                      : (button.style === 'cancel' 
                          ? (isDark ? '#0A84FF' : '#007AFF') 
                          : (isDark ? 'white' : 'black'))
                  }
                ]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    width: '80%',
    maxWidth: 320,
    borderRadius: 13,
    overflow: 'hidden',
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 16,
    paddingBottom: 0,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    padding: 16,
    paddingTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#CCCCCC',
  },
  buttonContainerVertical: {
    flexDirection: 'column',
  },
  button: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

// Static method to mimic React Native's Alert API
(CustomAlert as CustomAlertComponent).alert = (
  title: string, 
  message: string, 
  buttons: AlertButton[] = [{ text: 'OK' }]
) => {
  // This is a placeholder. In a real implementation, you would
  // need to use a global state management solution or a context
  // to show the alert from anywhere in the app
  // Remove console.log for production build performance
};

export default CustomAlert as CustomAlertComponent; 