
import { LyricSearchResult, SearchHistoryEntry } from '../types';

const DB_NAME = 'LyricFinderDB';
const DB_VERSION = 1;
const HISTORY_STORE_NAME = 'searchHistory';
const RESULTS_CACHE_STORE_NAME = 'resultsCache';

let db: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
      reject('Error opening IndexedDB.');
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const tempDb = (event.target as IDBOpenDBRequest).result;
      if (!tempDb.objectStoreNames.contains(HISTORY_STORE_NAME)) {
        tempDb.createObjectStore(HISTORY_STORE_NAME, { keyPath: 'id' });
      }
      if (!tempDb.objectStoreNames.contains(RESULTS_CACHE_STORE_NAME)) {
        tempDb.createObjectStore(RESULTS_CACHE_STORE_NAME, { keyPath: 'query' });
      }
    };
  });
};

// Internal helper functions using an existing db instance
const _getFromStore = (dbInstance: IDBDatabase, storeName: string, key: IDBValidKey): Promise<any> => {
  return new Promise((resolve, reject) => {
    const transaction = dbInstance.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const _putInStore = (dbInstance: IDBDatabase, storeName: string, value: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = dbInstance.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    // No need for request variable if not using its result
    transaction.objectStore(storeName).put(value);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

const _deleteFromStore = (dbInstance: IDBDatabase, storeName: string, key: IDBValidKey): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = dbInstance.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};


export const addSearchHistory = async (query: string): Promise<void> => {
  const database = await openDB();
  const historyEntry: SearchHistoryEntry = {
    id: query.toLowerCase(), 
    query: query,
    timestamp: Date.now(),
  };
  return _putInStore(database, HISTORY_STORE_NAME, historyEntry);
};

export const getSearchHistory = async (): Promise<SearchHistoryEntry[]> => {
  const database = await openDB();
  const transaction = database.transaction(HISTORY_STORE_NAME, 'readonly');
  const store = transaction.objectStore(HISTORY_STORE_NAME);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve((request.result as SearchHistoryEntry[]).sort((a, b) => b.timestamp - a.timestamp));
    };
    request.onerror = () => reject(request.error);
  });
};

export const saveSearchResult = async (query: string, result: LyricSearchResult): Promise<void> => {
  const database = await openDB();
  return _putInStore(database, RESULTS_CACHE_STORE_NAME, { query: query.toLowerCase(), result });
};

export const getCachedSearchResult = async (query: string): Promise<LyricSearchResult | null> => {
  const database = await openDB();
  const resultContainer = await _getFromStore(database, RESULTS_CACHE_STORE_NAME, query.toLowerCase());
  return resultContainer ? resultContainer.result : null;
};

export const deleteSearchHistoryItem = async (id: string): Promise<void> => {
  const database = await openDB();
  const normalizedId = id.toLowerCase();
  await _deleteFromStore(database, HISTORY_STORE_NAME, normalizedId);
  await _deleteFromStore(database, RESULTS_CACHE_STORE_NAME, normalizedId);
};

export const clearAllSearchHistory = async (): Promise<void> => {
  const database = await openDB();
  const historyTx = database.transaction(HISTORY_STORE_NAME, 'readwrite');
  historyTx.objectStore(HISTORY_STORE_NAME).clear();

  const cacheTx = database.transaction(RESULTS_CACHE_STORE_NAME, 'readwrite');
  cacheTx.objectStore(RESULTS_CACHE_STORE_NAME).clear();

   return Promise.all([
    new Promise<void>((res, rej) => { historyTx.oncomplete = () => res(); historyTx.onerror = () => rej(historyTx.error); }),
    new Promise<void>((res, rej) => { cacheTx.oncomplete = () => res(); cacheTx.onerror = () => rej(cacheTx.error); })
  ]).then(() => {});
};

export const updateSearchHistoryItemQuery = async (oldQuery: string, newQuery: string): Promise<void> => {
  const database = await openDB();

  const oldId = oldQuery.toLowerCase();
  const newId = newQuery.toLowerCase();

  if (oldId === newId) {
    // If only casing changed, we might still want to update the `query` field
    const currentEntry = await _getFromStore(database, HISTORY_STORE_NAME, oldId) as SearchHistoryEntry | undefined;
    if (currentEntry && currentEntry.query !== newQuery) {
        currentEntry.query = newQuery; // Update query preserving original ID and timestamp
        await _putInStore(database, HISTORY_STORE_NAME, currentEntry);
    }
    return;
  }

  // Get old history entry
  const oldHistoryEntry = await _getFromStore(database, HISTORY_STORE_NAME, oldId) as SearchHistoryEntry | undefined;
  if (!oldHistoryEntry) {
    console.warn(`Original history item with query "${oldQuery}" (id: "${oldId}") not found for update.`);
    return; 
  }

  // Get old cached result
  const oldCachedResultContainer = await _getFromStore(database, RESULTS_CACHE_STORE_NAME, oldId) as { query: string; result: LyricSearchResult } | undefined;
  
  // IMPORTANT: Before deleting old, check if newId already exists.
  // If newId exists, we might want to merge or decide on a strategy.
  // For now, this implementation will effectively overwrite any existing entry with newId.
  // If oldId's timestamp is desired for the newId entry, this is implicitly handled.

  // Delete old entries first
  await _deleteFromStore(database, HISTORY_STORE_NAME, oldId);
  if (oldCachedResultContainer) {
    await _deleteFromStore(database, RESULTS_CACHE_STORE_NAME, oldId);
  }

  // Create and add new history entry
  const newHistoryEntry: SearchHistoryEntry = {
    id: newId,
    query: newQuery,
    timestamp: oldHistoryEntry.timestamp, // Preserve original timestamp
  };
  await _putInStore(database, HISTORY_STORE_NAME, newHistoryEntry);

  // Add new cached result (if it existed)
  if (oldCachedResultContainer?.result) {
    await _putInStore(database, RESULTS_CACHE_STORE_NAME, { query: newId, result: oldCachedResultContainer.result });
  }
  console.log(`Updated history item from "${oldQuery}" to "${newQuery}"`);
};


// Initialize DB on load
openDB().catch(err => console.error("Failed to initialize IndexedDB on load:", err));
