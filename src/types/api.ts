export type ApiProvider = 'openai' | 'anthropic';

export interface ApiConfig {
  provider: ApiProvider;
  apiKey: string;
  model: string;
}

export interface ApiKeySettings {
  openai: string | null;
  anthropic: string | null;
  preferredProvider: ApiProvider;
  storeKeys: boolean;
}

export const DEFAULT_MODELS = {
  openai: 'gpt-4-turbo-preview',
  anthropic: 'claude-3-sonnet-20240229',
};
