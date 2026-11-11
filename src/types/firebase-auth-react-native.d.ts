import type { Persistence } from 'firebase/auth';

/**
 * Firebase 10 exposes this function in its React Native runtime entry point,
 * but not in the package's default TypeScript declaration.
 */
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
