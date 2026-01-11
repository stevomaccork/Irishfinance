import type { FormData } from '../types/form';
import type { GeneratedPlan } from '../types/plan';

const STORAGE_KEYS = {
  FORM_DATA: 'slainte_form_data',
  GENERATED_PLAN: 'slainte_generated_plan',
  API_KEYS: 'slainte_api_keys',
  SETTINGS: 'slainte_settings',
} as const;

export const storage = {
  // Form data
  saveFormData: (data: FormData): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.FORM_DATA, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save form data:', e);
    }
  },

  loadFormData: (): FormData | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FORM_DATA);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load form data:', e);
      return null;
    }
  },

  // Generated plan
  savePlan: (plan: GeneratedPlan): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.GENERATED_PLAN, JSON.stringify(plan));
    } catch (e) {
      console.error('Failed to save plan:', e);
    }
  },

  loadPlan: (): GeneratedPlan | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GENERATED_PLAN);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load plan:', e);
      return null;
    }
  },

  // API keys (only if user opted in)
  saveApiKey: (provider: 'openai' | 'anthropic', key: string): void => {
    try {
      const existing = storage.loadApiKeys();
      existing[provider] = key;
      localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(existing));
    } catch (e) {
      console.error('Failed to save API key:', e);
    }
  },

  loadApiKeys: (): { openai: string | null; anthropic: string | null } => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.API_KEYS);
      return data ? JSON.parse(data) : { openai: null, anthropic: null };
    } catch (e) {
      return { openai: null, anthropic: null };
    }
  },

  clearApiKeys: (): void => {
    localStorage.removeItem(STORAGE_KEYS.API_KEYS);
  },

  // Clear all data
  clearAll: (): void => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },

  // Export all data as JSON (for user to download)
  exportData: (): string => {
    const data = {
      formData: storage.loadFormData(),
      plan: storage.loadPlan(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  },

  // Import data from JSON
  importData: (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.formData) {
        storage.saveFormData(data.formData);
      }
      if (data.plan) {
        storage.savePlan(data.plan);
      }
      return true;
    } catch (e) {
      console.error('Failed to import data:', e);
      return false;
    }
  },

  // Get storage usage
  getStorageUsage: (): { used: number; available: number } => {
    let used = 0;
    Object.values(STORAGE_KEYS).forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        used += item.length * 2; // Rough estimate (UTF-16)
      }
    });
    return {
      used,
      available: 5 * 1024 * 1024, // ~5MB typical limit
    };
  },
};
