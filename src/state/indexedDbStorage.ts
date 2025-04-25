// lib/storage/indexedDbStorage.ts
import { del, get, set } from "idb-keyval";

import type { PersistStorage, StorageValue } from "zustand/middleware";

export function createIndexedDbStorage<T>(): PersistStorage<T> {
  return {
    getItem: async (name) => {
      const str = await get<string>(name);
      if (!str) return null;
      return JSON.parse(str) as StorageValue<T>;
    },
    setItem: async (name, value) => {
      await set(name, JSON.stringify(value));
    },
    removeItem: async (name) => {
      await del(name);
    },
  };
}
