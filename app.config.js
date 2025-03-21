module.exports = {
  name: "Havault",
  slug: "havault",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/1741520661019.png",
  userInterfaceStyle: "light",
  scheme: "havault",
  splash: {
    image: "./assets/1741520661019.png",
    resizeMode: "contain",
    backgroundColor: "#121212"
  },
  updates: {
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.metaworld.havault",
    buildNumber: "1.0.0"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/1741520661019.png",
      backgroundColor: "#121212"
    },
    package: "com.metaworld.havault",
    versionCode: 1,
    // Ensure the app name is set for Android display
    androidStatusBar: {
      backgroundColor: "#000000",
      translucent: false
    },
    // Permissions needed for the app
    permissions: [
      "USE_BIOMETRIC",
      "USE_FINGERPRINT"
    ]
  },
  web: {
    favicon: "./assets/1741520661019.png"
  },
  description: "Secure password manager with encrypted local storage",
  plugins: [
    "expo-secure-store",
    "expo-splash-screen"
  ],
  extra: {
    // App-specific configuration
    appName: "Havault",
    displayName: "Havault",
    eas: {
      projectId: "f6913340-e2f1-4248-9df6-18df2e93bc4a"
    }
  },
  // Enable the new architecture for better performance
  newArchEnabled: true
}; 