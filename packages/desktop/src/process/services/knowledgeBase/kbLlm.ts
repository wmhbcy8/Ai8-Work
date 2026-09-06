/*
 * @license
 * Copyright 2026 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { IProvider } from '@/common/config/storage';
import type { TKbAiSettings } from '@/common/knowledge/types';

/**
 * Lightweight LLM helper used by the knowledge base.
 *
 * The knowledge base does NOT own a separate model/API-key configuration.
 * It reuses the model providers already configured in 「设置 → 模型」
 * (read from the backend `/api/providers` through the same bridge the
 * Settings page uses):
 *
 * - When the user bound a specific provider+model (AI 设置 in Knowledge Notes),
 *   that exact model is used.
 * - Without a binding, the first enabled provider with usable models is used
 *   (the app's default model).
 * - When no usable provider exists at all, operations fail with a clear message
 *   guiding the user to the Settings page.
 */

const DEFAULT_TIMEOUT_MS = 180_000;

export type KbModelProtocol = 'openai' | 'anthropic' | 'gemini';

export interface KbCompletionOptions {
  system: string;
  user: string;
  /** When present, sent as an image part (data URL) so vision models can read it. */
  imageDataUrl?: string;
  maxTokens?: number;
}

export interface KbLlmTarget {
  provider: IProvider;
  model: string;
  protocol: KbModelProtocol;
}

// ── provider rows (short-lived cache) ─────────────────────────────────────

let rowsCache: IProvider[] | null = null;
let rowsCacheAt = 0;

async function listProviderRows(): Promise<IProvider[]> {
  const now = Date.now();
  if (rowsCache && now - rowsCacheAt < 3_000) {
    return rowsCache;
  }
  const rows = ((await ipcBridge.mode.listProviders.invoke()) ?? []) as IProvider[];
  rowsCache = rows;
  rowsCacheAt = now;
  return rows;
}

// ── usable model / provider semantics (mirrors the Settings model picker) ─

function isModelEnabled(provider: IProvider, model: string): boolean {
  return provider.model_enabled?.[model] !== false;
}

function usableModels(provider: IProvider): string[] {
  return (provider.models ?? []).filter((model) => isModelEnabled(provider, model));
}

function isUsableProvider(provider: IProvider): boolean {
  return (
    provider.enabled !== false &&
    Boolean(provider.base_url) &&
    Boolean(provider.api_key) &&
    usableModels(provider).length > 0
  );
}

function resolveModelProtocol(provider: IProvider, model: string): KbModelProtocol {
  if (provider.platform === 'new-api' && provider.model_protocols?.[model]) {
    const protocol = provider.model_protocols[model];
    if (protocol === 'anthropic' || protocol === 'gemini' || protocol === 'openai') {
      return protocol;
    }
  }
  if (provider.platform === 'anthropic') return 'anthropic';
  if (provider.platform === 'gemini') return 'gemini';
  return 'openai';
}

/**
 * Resolve which model to call for a knowledge-base operation.
 *
 * Returns null when there is no usable provider at all (the caller turns this
 * into a "go to Settings to add a model" error). Throws when the user-bound
 * provider/model no longer exists or is disabled.
 */
export async function resolveKbLlmTarget(ai?: TKbAiSettings | null): Promise<KbLlmTarget | null> {
  const rows = await listProviderRows();
  const boundProviderId = ai?.providerId?.trim();
  const boundModel = ai?.model?.trim();

  if (boundProviderId) {
    const provider = rows.find((p) => p.id === boundProviderId);
    if (!provider || provider.enabled === false) {
      throw new Error('知识笔记绑定的模型服务已不存在或已停用，请到「知识笔记 → AI 设置」重新选择模型。');
    }
    if (boundModel) {
      if (!(provider.models ?? []).includes(boundModel) || !isModelEnabled(provider, boundModel)) {
        throw new Error(`知识笔记绑定的模型「${boundModel}」已不可用，请到「知识笔记 → AI 设置」重新选择模型。`);
      }
      return { provider, model: boundModel, protocol: resolveModelProtocol(provider, boundModel) };
    }
    const models = usableModels(provider);
    if (models.length === 0) {
      throw new Error('知识笔记绑定的模型服务当前没有可用模型，请到「知识笔记 → AI 设置」重新选择模型。');
    }
    const model = models[0];
    return { provider, model, protocol: resolveModelProtocol(provider, model) };
  }

  // 未绑定 → 使用软件已配置的默认模型（第一个可用 provider 的第一个可用模型）
  const provider = rows.find(isUsableProvider);
  if (!provider) return null;
  const model = usableModels(provider)[0];
  return { provider, model, protocol: resolveModelProtocol(provider, model) };
}

export function isAiConfigured(ai?: TKbAiSettings | null): boolean {
  return Boolean(ai && ai.providerId?.trim());
}

/** Resolve the model to use or fail with a guidance message (no usable provider). */
export async function requireKbLlmTarget(ai?: TKbAiSettings | null): Promise<KbLlmTarget> {
  const target = await resolveKbLlmTarget(ai);
  if (!target) {
    throw new Error('尚未配置可用的模型服务。请先到「设置 → 模型」中添加并启用一个模型，再执行该操作。');
  }
  return target;
}

// ── wire helpers ──────────────────────────────────────────────────────────

function trimSlashes(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

function buildEndpointUrl(provider: IProvider, model: string, protocol: KbModelProtocol): string {
  if (provider.is_full_url) {
    return trimSlashes(provider.base_url);
  }
  const base = trimSlashes(provider.base_url);
  if (protocol === 'openai') {
    if (base.endsWith('/chat/completions')) return base;
    if (base.endsWith('/v1')) return `${base}/chat/completions`;
    return `${base}/v1/chat/completions`;
  }
  if (protocol === 'anthropic') {
    if (base.endsWith('/messages')) return base;
    if (base.endsWith('/v1')) return `${base}/messages`;
    return `${base}/v1/messages`;
  }
  // gemini
  return `${base}/v1beta/models/${encodeURIComponent(model)}:generateContent`;
}

function extractText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (part && typeof part === 'object' && 'text' in part) {
          const p = part as { text?: string };
          return p.text ?? '';
        }
        return '';
      })
      .join('');
  }
  return '';
}

function imageMimeAndData(imageDataUrl: string): { mime: string; data: string } {
  const match = /^data:([^;,]+);base64,(.+)$/.exec(imageDataUrl);
  if (!match) return { mime: 'image/png', data: imageDataUrl };
  return { mime: match[1], data: match[2] };
}

/**
 * Run one chat completion against the resolved model. Implemented with plain
 * fetch so it works with any OpenAI / Anthropic / Gemini style endpoint.
 */
export async function chatCompletion(ai: TKbAiSettings | undefined, options: KbCompletionOptions): Promise<string> {
  const target = await resolveKbLlmTarget(ai);
  if (!target) {
    throw new Error('尚未配置可用的模型服务。请先到「设置 → 模型」中添加并启用一个模型，再执行该操作。');
  }
  const { provider, model, protocol } = target;
  const url = buildEndpointUrl(provider, model, protocol);
  const maxTokens = options.maxTokens ?? 4096;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  let response: Response;
  try {
    if (protocol === 'anthropic') {
      const userParts: Array<Record<string, unknown>> = [];
      if (options.imageDataUrl) {
        const { mime, data } = imageMimeAndData(options.imageDataUrl);
        userParts.push({ type: 'image', source: { type: 'base64', media_type: mime, data } });
      }
      userParts.push({ type: 'text', text: options.user });
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': provider.api_key || 'local',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature: 0.3,
          ...(options.system ? { system: options.system } : {}),
          messages: [{ role: 'user', content: userParts }],
        }),
        signal: controller.signal,
      });
    } else if (protocol === 'gemini') {
      const parts: Array<Record<string, unknown>> = [{ text: options.user }];
      if (options.imageDataUrl) {
        const { mime, data } = imageMimeAndData(options.imageDataUrl);
        parts.push({ inline_data: { mime_type: mime, data } });
      }
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': provider.api_key || 'local',
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          ...(options.system ? { systemInstruction: { parts: [{ text: options.system }] } } : {}),
          generationConfig: { temperature: 0.3, maxOutputTokens: maxTokens },
        }),
        signal: controller.signal,
      });
    } else {
      const content: unknown[] = [];
      if (options.imageDataUrl) {
        content.push({ type: 'image_url', image_url: { url: options.imageDataUrl } });
      }
      content.push({ type: 'text', text: options.user });
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.api_key || 'local'}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: options.system },
            { role: 'user', content },
          ],
          temperature: 0.3,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });
    }
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`模型服务返回 ${response.status}：${detail.slice(0, 300) || response.statusText}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: unknown } }>;
    content?: Array<{ type?: string; text?: string }>;
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };
  if (json.error?.message) {
    throw new Error(`模型服务调用失败：${json.error.message}`);
  }

  let text = '';
  if (protocol === 'anthropic') {
    text = (json.content ?? [])
      .filter((part) => part.type === 'text')
      .map((part) => part.text ?? '')
      .join('');
  } else if (protocol === 'gemini') {
    text = (json.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? '').join('');
  } else {
    text = extractText(json.choices?.[0]?.message?.content);
  }
  text = text.trim();
  if (!text) {
    throw new Error('模型服务返回了空内容');
  }
  return text;
}
