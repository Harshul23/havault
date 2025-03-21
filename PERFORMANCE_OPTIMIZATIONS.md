# Havault Performance Optimizations

This document outlines the performance optimizations implemented in the Havault password manager app to ensure smooth performance, especially in production builds.

## Key Optimizations

### 1. FlatList Implementation

- **Replaced ScrollView with FlatList**: Implemented virtualized rendering to only render items visible on screen
- **Optimized FlatList configuration**:
  - `initialNumToRender`: Limited to 10 items
  - `maxToRenderPerBatch`: Set to 5 for optimal frame rates
  - `windowSize`: Configured to 10 to balance memory usage and rendering performance
  - `removeClippedSubviews`: Enabled to remove items from native view when not visible

### 2. React Hooks Optimization

- **useMemo**: Implemented for expensive calculations like filtering passwords
- **useCallback**: Applied to all event handlers and functions to prevent unnecessary re-renders
- **Component Memoization**: Added for list items, empty state, and other components

### 3. Efficient AsyncStorage Usage

- **Parallel Data Loading**: Implemented Promise.all for concurrent data loading
- **Background Processing**: Used InteractionManager to move operations off the UI thread
- **Loading State Management**: Added proper loading states to prevent UI jank

### 4. Animation Optimizations

- **Native Driver**: Enabled `useNativeDriver: true` for all animations to run on the native thread
- **Fade Animations**: Implemented with proper cleanup to prevent memory leaks
- **Modal Transitions**: Improved with fade animations

### 5. Performance Monitoring & Logging

- **Logger Utility**: Created for conditionally disabling logs in production
- **Performance Monitoring**: Added utility for tracking operation timing
- **Non-blocking Operations**: Implemented utilities to run heavy tasks without blocking the UI

### 6. Production Optimizations

- **Cache Clearing Script**: Added a script to clear Metro bundler cache before building
- **Console Log Removal**: Stripped unnecessary console logs from production builds
- **Error Handling**: Optimized to maintain stability while limiting verbose logging

## How to Use the Performance Utilities

### Logger Usage

```typescript
import logger from '../utils/logger';

// Instead of console.log
logger.info('This message only appears in development');

// For critical warnings that should appear in production (but throttled)
logger.warn('Important warning');

// For error logging (sanitized in production)
logger.error('Operation failed', error);
```

### Performance Monitoring

```typescript
import performance from '../utils/performance';

// Measure operation time
performance.startTimer('loadPasswords');
await loadPasswords();
performance.endTimer('loadPasswords');

// Run expensive operations without blocking UI
await performance.runAfterInteractions(() => {
  // Heavy computation here
});
```

### Clearing Cache

Run this command before building for production:

```bash
node scripts/clean-cache.js
```

## Best Practices for Maintaining Performance

1. **Always use FlatList** for long lists of items
2. **Memoize expensive calculations** with useMemo
3. **Optimize event handlers** with useCallback
4. **Enable useNativeDriver** for all animations
5. **Avoid using console.log** in production code
6. **Run heavy tasks off the UI thread** using performance utilities
7. **Clear Metro cache** before final testing and building 