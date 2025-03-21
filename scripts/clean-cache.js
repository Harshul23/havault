/**
 * Script to clean Metro bundler cache and temporary files
 * to ensure optimal performance when testing the app
 * 
 * Run with: node scripts/clean-cache.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

console.log(`${colors.blue}Starting cache cleanup process...${colors.reset}\n`);

try {
  // 1. Clear React Native / Expo cache
  console.log(`${colors.yellow}Clearing React Native / Expo cache...${colors.reset}`);
  execSync('npx expo start --clear', { stdio: 'inherit' });
  console.log(`${colors.green}✓ Expo cache cleared${colors.reset}\n`);

  // 2. Clear watchman cache (if available)
  try {
    console.log(`${colors.yellow}Clearing Watchman cache...${colors.reset}`);
    execSync('watchman watch-del-all', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Watchman cache cleared${colors.reset}\n`);
  } catch (error) {
    console.log(`${colors.yellow}⚠ Watchman not available or failed to clear cache${colors.reset}\n`);
  }

  // 3. Clear temporary directories
  const tempDirs = [
    path.join(os.tmpdir(), 'metro-*'),
    path.join(os.tmpdir(), 'haste-map-*')
  ];

  console.log(`${colors.yellow}Clearing temporary directories...${colors.reset}`);
  tempDirs.forEach(tempPattern => {
    try {
      execSync(`rm -rf ${tempPattern}`, { stdio: 'inherit' });
    } catch (error) {
      // Windows doesn't support the same shell pattern matching
      if (process.platform === 'win32') {
        // On Windows, we need to handle this differently
        console.log(`${colors.yellow}⚠ Skipping pattern-based cleanup on Windows${colors.reset}`);
      }
    }
  });

  // 4. Clear node_modules/.cache
  console.log(`${colors.yellow}Clearing node_modules/.cache...${colors.reset}`);
  const cachePath = path.join(process.cwd(), 'node_modules', '.cache');
  if (fs.existsSync(cachePath)) {
    if (process.platform === 'win32') {
      execSync(`rmdir /s /q "${cachePath}"`, { stdio: 'inherit' });
    } else {
      execSync(`rm -rf "${cachePath}"`, { stdio: 'inherit' });
    }
    console.log(`${colors.green}✓ node_modules/.cache cleared${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}⚠ node_modules/.cache not found${colors.reset}\n`);
  }

  // 5. Final message
  console.log(`${colors.green}✓ Cache cleanup completed successfully!${colors.reset}`);
  console.log(`${colors.blue}You can now build your app with optimal performance.${colors.reset}`);
  console.log(`${colors.blue}Run the following command to start your app:${colors.reset}`);
  console.log(`${colors.yellow}npx expo start${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Error cleaning cache: ${error.message}${colors.reset}`);
  process.exit(1);
} 