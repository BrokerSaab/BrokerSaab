const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

config.resolver.extraNodeModules = {
  '@brokersaab/shared-types': path.resolve(monorepoRoot, 'packages/shared-types/src/index.ts'),
};

// Force all React-related imports to always resolve from the mobile app's
// own node_modules, regardless of which package in the monorepo is importing them.
// Without this, packages in the monorepo root resolve to a different React instance,
// causing "Invalid hook call" / "useContext of null" crashes.
const DEDUPE = ['react', 'react-dom', 'react-native', 'react-native/'];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const shouldDedupe = moduleName === 'react'
    || moduleName === 'react-dom'
    || moduleName === 'react-native'
    || moduleName.startsWith('react/')
    || moduleName.startsWith('react-native/');

  if (shouldDedupe) {
    return context.resolveRequest(
      { ...context, originModulePath: path.join(projectRoot, 'index.js') },
      moduleName,
      platform,
    );
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
