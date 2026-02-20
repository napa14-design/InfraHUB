export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const createMemoryStorage = (): StorageLike => {
  const memory = new Map<string, string>();

  return {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
    removeItem: (key: string) => {
      memory.delete(key);
    }
  };
};

const memoryStorage = createMemoryStorage();

const canUseStorage = (storage: Storage): boolean => {
  try {
    const probe = '__nexus_storage_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
};

export const getStorage = (): StorageLike => {
  if (typeof window === 'undefined' || !window.sessionStorage) return memoryStorage;

  if (canUseStorage(window.sessionStorage)) {
    return window.sessionStorage;
  }

  return memoryStorage;
};
