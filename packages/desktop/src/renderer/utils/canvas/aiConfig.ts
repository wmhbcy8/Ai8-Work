import type { IProvider } from '@/common/config/storage';

export interface CanvasChannelModel {
  name: string;
  capability: 'text' | 'image' | 'video' | 'audio';
}

export interface CanvasChannel {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  apiFormat: 'openai' | 'gemini';
  models: CanvasChannelModel[];
}

/**
 * The subset of the Infinite Canvas AI config we inject. The canvas app
 * (zustand persist store, key `infinite-canvas:ai_config_store`) merges this
 * with its defaults on boot, so only `channels` plus the primary text model
 * are strictly required; the rest falls back to canvas defaults.
 */
export interface CanvasAiConfig {
  channelMode: 'local';
  channels: CanvasChannel[];
  textModel?: string;
  imageModel?: string;
  videoModel?: string;
  audioModel?: string;
}

const MODEL_SEPARATOR = ':';

/**
 * Translate AionUi providers (Settings -> Model, OpenAI-compatible channels)
 * into the config shape the Infinite Canvas sub-app expects.
 *
 * - Prefers an enabled OpenAI-compatible provider (platform openai / new-api),
 *   falls back to gemini, then any provider with an api_key.
 * - All models are exposed to the canvas as text models (chat / canvas QA).
 *   Image / video / audio generation can be configured inside the canvas
 *   settings panel later; the injected channel is reused as the base.
 */
export function providersToCanvasConfig(providers: IProvider[] | null | undefined): CanvasAiConfig | null {
  const list = Array.isArray(providers) ? providers : [];
  const pool = list.filter((p) => p && p.api_key && p.enabled !== false);
  const provider =
    pool.find((p) => p.platform === 'openai' || p.platform === 'new-api') ??
    pool.find((p) => p.platform === 'gemini') ??
    pool[0];
  if (!provider) return null;

  const models: CanvasChannelModel[] = (provider.models ?? [])
    .filter((name) => typeof name === 'string' && name.trim())
    .map((name) => ({ name, capability: 'text' as const }));
  if (models.length === 0) return null;

  const channelId = provider.id || 'aionui-default';
  const channel: CanvasChannel = {
    id: channelId,
    name: provider.name || provider.platform || 'AionUi',
    baseUrl: (provider.base_url || '').replace(/\/+$/, ''),
    apiKey: provider.api_key,
    apiFormat: 'openai',
    models,
  };

  return {
    channelMode: 'local',
    channels: [channel],
    textModel: `${channelId}${MODEL_SEPARATOR}${models[0].name}`,
  };
}
