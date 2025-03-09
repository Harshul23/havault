module.exports = {
  name: "Havault",
  slug: "havault",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/1741520661019.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/1741520661019.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
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
      backgroundColor: "#FFFFFF"
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
  extra: {
    // App-specific configuration
    appName: "Havault",
    displayName: "Havault"
  }
}; 