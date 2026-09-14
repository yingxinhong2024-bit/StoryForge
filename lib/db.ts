'use client';

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { CustomTechnique, HistoryRecord, ModelSettings } from './types';

// ===== IndexedDB 封装 =====
// 三张表：
//   settings         —— 模型配置（含 API Key，仅存于浏览器本地）
//   customTechniques —— 用户自定义技法库
//   history          —— 生成历史（Markdown 报告）

interface StoryForgeDB extends DBSchema {
  settings: {
    key: string;
    value: ModelSettings;
  };
  customTechniques: {
    key: string;
    value: CustomTechnique;
  };
  history: {
    key: string;
    value: HistoryRecord;
    indexes: { 'by-createdAt': number };
  };
}

const DB_NAME = 'storyforge';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<StoryForgeDB>> | null = null;

function getDB(): Promise<IDBPDatabase<StoryForgeDB>> {
  if (!dbPromise) {
    dbPromise = openDB<StoryForgeDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        if (!db.objectStoreNames.contains('customTechniques')) {
          db.createObjectStore('customTechniques', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('history')) {
          const store = db.createObjectStore('history', { keyPath: 'id' });
          store.createIndex('by-createdAt', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
}

// ===== 模型设置 =====

const SETTINGS_KEY = 'modelConfig';

export async function getSettings(): Promise<ModelSettings | undefined> {
  const db = await getDB();
  return db.get('settings', SETTINGS_KEY);
}

export async function saveSettings(settings: ModelSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, SETTINGS_KEY);
}

// ===== 自定义技法 =====

export async function getAllCustomTechniques(): Promise<CustomTechnique[]> {
  const db = await getDB();
  const all = await db.getAll('customTechniques');
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function addCustomTechnique(
  technique: CustomTechnique
): Promise<void> {
  const db = await getDB();
  await db.put('customTechniques', technique);
}

export async function deleteCustomTechnique(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('customTechniques', id);
}

// ===== 历史记录 =====

export async function addHistory(record: HistoryRecord): Promise<void> {
  const db = await getDB();
  await db.put('history', record);
}

export async function getAllHistory(): Promise<HistoryRecord[]> {
  const db = await getDB();
  const all = await db.getAll('history');
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteHistory(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('history', id);
}
