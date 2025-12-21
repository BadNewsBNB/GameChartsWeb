/**
 * IndexedDB 存储工具
 * 用于存储包含自定义图片的游戏数据，解决 localStorage 容量限制问题
 */

const DB_NAME = "GameChartsDB";
const DB_VERSION = 1;
const STORE_NAME = "gameData";

let db = null;

/**
 * 初始化数据库
 */
export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("IndexedDB 打开失败:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      
      // 如果对象存储不存在，创建它
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, {
          keyPath: "key",
        });
        objectStore.createIndex("key", "key", { unique: true });
      }
    };
  });
}

/**
 * 获取数据库实例（如果未初始化则先初始化）
 */
async function getDB() {
  if (!db) {
    await initDB();
  }
  return db;
}

/**
 * 保存数据到 IndexedDB
 */
export async function saveToIndexedDB(key, data) {
  try {
    const database = await getDB();
    if (!database) {
      throw new Error("数据库未初始化");
    }
    
    // 深拷贝数据，将 Vue 响应式对象转换为纯 JavaScript 对象
    // 使用 JSON 序列化/反序列化来确保数据可克隆
    const clonedData = JSON.parse(JSON.stringify(data));
    
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const objectStore = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = objectStore.put({ key, data: clonedData, timestamp: Date.now() });
      
      request.onsuccess = () => {
        console.log(`[IndexedDB] 保存成功: ${key}`);
        resolve();
      };
      
      request.onerror = () => {
        console.error(`[IndexedDB] 保存失败: ${key}`, request.error);
        reject(request.error);
      };
      
      // 添加事务错误处理
      transaction.onerror = () => {
        console.error(`[IndexedDB] 事务失败: ${key}`, transaction.error);
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error(`[IndexedDB] 保存异常: ${key}`, error);
    throw error;
  }
}

/**
 * 从 IndexedDB 读取数据
 */
export async function loadFromIndexedDB(key) {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORE_NAME], "readonly");
    const objectStore = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = objectStore.get(key);
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.data);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => {
        console.error(`从 IndexedDB 读取 ${key} 失败:`, request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error("IndexedDB 读取失败:", error);
    // 如果 IndexedDB 不可用，返回 null
    return null;
  }
}

/**
 * 检查数据是否包含自定义图片
 * 检测条件：
 * 1. type === "custom" 且 image 是 base64
 * 2. 或者 image 是 base64 且 id 以 "local_" 开头（兼容导入的数据）
 */
function hasCustomImages(data) {
  if (!data || !Array.isArray(data)) {
    return false;
  }
  
  return data.some((item) => {
    if (!item || !item.image) {
      return false;
    }
    
    // 检查是否是 base64 图片
    const isBase64Image = item.image.startsWith("data:image");
    
    // 检查是否是自定义图片：type === "custom" 或 id 以 "local_" 开头
    const isCustomType = item.type === "custom" || (item.id && item.id.startsWith("local_"));
    
    return isBase64Image && isCustomType;
  });
}

/**
 * 智能保存：如果包含自定义图片，使用 IndexedDB；否则使用 localStorage
 */
export async function smartSave(key, data, localStorageKey) {
  try {
    // 检查是否包含自定义图片
    const hasCustom = hasCustomImages(data);
    
    console.log(`[存储] ${key}: 包含自定义图片=${hasCustom}, 数据长度=${data?.length || 0}`);
    
    if (hasCustom) {
      // 包含自定义图片，使用 IndexedDB
      console.log(`[存储] 保存到 IndexedDB: ${key}`);
      await saveToIndexedDB(key, data);
      // 同时在 localStorage 中存储一个标记，表示数据在 IndexedDB 中
      try {
        localStorage.setItem(localStorageKey + "_indexed", "true");
        console.log(`[存储] IndexedDB 保存成功，已设置标记: ${key}`);
      } catch (e) {
        // localStorage 可能也满了，但标记不是必需的，忽略
        console.warn(`[存储] 设置 IndexedDB 标记失败:`, e);
      }
    } else {
      // 不包含自定义图片，尝试使用 localStorage
      console.log(`[存储] 尝试保存到 localStorage: ${key}`);
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(data));
        // 清除 IndexedDB 标记
        try {
          localStorage.removeItem(localStorageKey + "_indexed");
          // 同时清除 IndexedDB 中的旧数据（如果存在）
          try {
            const database = await getDB();
            const transaction = database.transaction([STORE_NAME], "readwrite");
            const objectStore = transaction.objectStore(STORE_NAME);
            objectStore.delete(key);
          } catch (e) {
            // 忽略删除错误
          }
        } catch (e) {
          // 忽略错误
        }
      } catch (e) {
        // localStorage 保存失败（可能是空间不足），自动切换到 IndexedDB
        console.warn(`[存储] localStorage 保存失败，自动切换到 IndexedDB: ${key}`, e);
        await saveToIndexedDB(key, data);
        // 尝试设置标记（可能失败，但不影响数据保存）
        try {
          localStorage.setItem(localStorageKey + "_indexed", "true");
        } catch (markError) {
          console.warn(`[存储] 设置 IndexedDB 标记失败（localStorage 已满）:`, markError);
        }
      }
    }
  } catch (error) {
    // 如果 IndexedDB 失败，回退到 localStorage
    console.error(`[存储] IndexedDB 保存失败，回退到 localStorage: ${key}`, error);
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(data));
      localStorage.removeItem(localStorageKey + "_indexed");
      console.log(`[存储] 回退到 localStorage 成功: ${key}`);
    } catch (e) {
      console.error(`[存储] localStorage 也失败: ${key}`, e);
      throw e; // 如果 localStorage 也失败，抛出错误
    }
  }
}

/**
 * 智能加载：优先从 IndexedDB 加载，如果没有则从 localStorage 加载
 */
export async function smartLoad(key, localStorageKey) {
  try {
    // 检查是否有 IndexedDB 标记
    const useIndexedDB = localStorage.getItem(localStorageKey + "_indexed") === "true";
    
    console.log(`[加载] ${key}: 使用 IndexedDB=${useIndexedDB}`);
    
    if (useIndexedDB) {
      // 从 IndexedDB 加载
      const data = await loadFromIndexedDB(key);
      if (data !== null) {
        console.log(`[加载] 从 IndexedDB 加载成功: ${key}, 数据长度=${data?.length || 0}`);
        return data;
      }
      console.warn(`[加载] IndexedDB 中没有数据: ${key}，尝试从 localStorage 加载`);
      // 如果 IndexedDB 中没有数据，尝试从 localStorage 加载（数据迁移场景）
    }
    
    // 从 localStorage 加载
    const localData = localStorage.getItem(localStorageKey);
    if (localData) {
      const parsed = JSON.parse(localData);
      console.log(`[加载] 从 localStorage 加载成功: ${key}, 数据长度=${parsed?.length || 0}`);
      return parsed;
    }
    
    console.log(`[加载] 没有找到数据: ${key}`);
    return null;
  } catch (error) {
    console.error(`[加载] 加载数据失败: ${key}`, error);
    // 尝试从 localStorage 加载作为后备
    try {
      const localData = localStorage.getItem(localStorageKey);
      if (localData) {
        console.log(`[加载] 从 localStorage 后备加载成功: ${key}`);
        return JSON.parse(localData);
      }
    } catch (e) {
      console.error(`[加载] 后备加载也失败: ${key}`, e);
    }
    return null;
  }
}

/**
 * 清除 IndexedDB 中的数据
 */
export async function clearIndexedDB(key) {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const objectStore = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = objectStore.delete(key);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error("清除 IndexedDB 数据失败:", error);
  }
}

