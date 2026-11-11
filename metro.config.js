const { getDefaultConfig } = require('expo/metro-config');

/**
 * Firebase Auth's React Native bundle relies on legacy package resolution.
 * Keep Expo's package exports enabled, since Expo packages use exported
 * subpaths such as @expo/log-box/LogBox.
 */
const config = getDefaultConfig(__dirname);
const isFirebaseModule = (moduleName) =>
  moduleName === 'firebase' ||
  moduleName.startsWith('firebase/') ||
  moduleName.startsWith('@firebase/');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (isFirebaseModule(moduleName)) {
    return context.resolveRequest(
      { ...context, unstable_enablePackageExports: false },
      moduleName,
      platform,
    );
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
