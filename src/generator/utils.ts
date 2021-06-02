import { Module } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyDefaultCustomTags(module: Module, defaultCustomTags: Record<string, any>): void {
  Object.entries(defaultCustomTags).forEach(([key, value]) => {
    if (module.customTags[key] !== undefined) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    module.customTags[key] = value;
  });
}
