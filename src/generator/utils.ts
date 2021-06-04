import { Module } from '../types';

export function applyDefaultCustomTags(module: Module, defaultCustomTags: Record<string, unknown>): void {
  Object.entries(defaultCustomTags).forEach(([key, value]) => {
    if (module.customTags[key] !== undefined) {
      return;
    }

    module.customTags[key] = value;
  });
}
