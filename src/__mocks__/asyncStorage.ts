const storage: Record<string, string> = {};

const AsyncStorage = {
  getItem: jest.fn((key: string) => {
    return Promise.resolve(storage[key] || null);
  }),
  setItem: jest.fn((key: string, value: string) => {
    storage[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete storage[key];
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    Object.keys(storage).forEach(key => delete storage[key]);
    return Promise.resolve();
  }),
  getAllKeys: jest.fn(() => {
    return Promise.resolve(Object.keys(storage));
  }),
  multiGet: jest.fn((keys: string[]) => {
    return Promise.resolve(keys.map(key => [key, storage[key] || null]));
  }),
  multiSet: jest.fn((pairs: [string, string][]) => {
    pairs.forEach(([key, value]) => {
      storage[key] = value;
    });
    return Promise.resolve();
  }),
};

export default AsyncStorage;
