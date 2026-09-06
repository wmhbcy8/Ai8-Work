/**
 * @license
 * Copyright 2026 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TKbAiSettings } from '@/common/knowledge/types';

/**
 * Lightweight OpenAI-compatible chat helper used by the knowledge base.
 *
 * The vault deliberately keeps its own AI settings (base URL / key / model):
 * it must work with any OpenAI-compatible endpoint the user already uses for
 * MaaS (or a local Ollama at http://127.0.0.1:11434/v1), without depending on
 * the backend-owned provider accounts.
 */

const DEFAULT_TIMEOUT_MS = 180_000;

export interface KbCompletionOptions {
  system: string;
  user: string;
  /** When present, sent as an image part (data URL) so vision models can read it. */
  imageDataUrl?: string;
  maxTokens?: number;
}

export function isAiConfigured(ai?: TKbAiSettings | null): boolean {
  return Boolean(ai && ai.baseUrl.trim() && ai.model.trim());
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
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

/**
 * Call an OpenAI-compatible `/chat/completions` endpoint. Implemented with a
 * plain fetch (no SDK dependency) so it works with OpenAI, DeepSeek, Ollama,
 * Qwen, Kimi … as long as they expose the OpenAI wire format.
 */
export async function chatCompletion(ai: TKbAiSettings, options: KbCompletionOptions): Promise<string> {
  if (!isAiConfigured(ai)) {
    throw new Error('请先在知识笔记的「AI 设置」中配置模型服务');
  }
  const baseUrl = normalizeBaseUrl(ai.baseUrl);
  const maxTokens = options.maxTokens ?? 4096;

  const content: unknown[] = [];
  if (options.imageDataUrl) {
    content.push({
      type: 'image_url',
      image_url: { url: options.imageDataUrl },
    });
  }
  content.push({ type: 'text', text: options.user });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ai.apiKey || 'local'}`,
      },
      body: JSON.stringify({
        model: ai.model,
        messages: [
          { role: 'system', content: options.system },
          { role: 'user', content },
        ],
        temperature: 0.3,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`模型服务返回 ${response.status}：${detail.slice(0, 300) || response.statusText}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const text = extractText(json.choices?.[0]?.message?.content).trim();
  if (!text) {
    throw new Error('模型服务返回了空内容');
  }
  return text;
}
