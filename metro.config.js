const { getDefaultConfig } = require('expo/metro-config');

/**
 * Firebase Auth's React Native bundle relies on legacy package resolution.
 * Keep Expo's package exports enabled, since Expo packages use exported
 * subpaths such as @expo/log-box/LogBox.
 */
const config = getDefaultConfig(__dirname);

// GLB files are bundled as assets and resolved to a local URI at runtime.
config.resolver.assetExts = [...config.resolver.assetExts, 'glb', 'gltf', 'bin'];

const isFirebaseModule = (moduleName) =>
  moduleName === 'firebase' ||
  moduleName.startsWith('firebase/') ||
  moduleName.startsWith('@firebase/');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // GLTFLoader imports the bare `three` entry point. Its renderer and addons
  // must share the WebGPU build, otherwise native materials and loaders clash.
  if (moduleName === 'three') moduleName = 'three/webgpu';

  const resolverContext = isFirebaseModule(moduleName)
    ? { ...context, unstable_enablePackageExports: false }
    : context;

  return context.resolveRequest(resolverContext, moduleName, platform);
};

module.exports = config;
