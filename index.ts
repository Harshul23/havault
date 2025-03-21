import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Export components
export * from './components';

// Export utils
export * from './utils/animationUtils';

// Re-export context
export * from './context/AuthContext';
export * from './context/ThemeContext';
export * from './PasswordContext';
