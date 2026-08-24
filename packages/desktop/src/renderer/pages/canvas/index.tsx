import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProvidersQuery, useModelProviderList } from '@/renderer/hooks/agent/useModelProviderList';
import { hasSpecificModelCapability } from '@/renderer/utils/model/modelCapabilities';
import type { IProvider } from '@/common/config/storage';
import tapnowHtml from './tapnow.html?raw';

// ---------------------------------------------------------------------------
// 无限画布 —— 采用自包含的 Tapnow-Studio 画布引擎，注入 AionUi 内置模型。
// 该应用被打包成单文件 HTML（resource：../tapnow.html），通过 Blob URL 在
// iframe 中运行，并用 postMessage 注入 AionUi 的 provider / 模型 / 模型库 /
// API Key，使画布直接使用 AionUi 的内置模型。
//
// 关键：为了让模型名与 MaaS /v1/models 权威列表完全一致（避免卡片显示错误名称、
// 以及请求“Failed to fetch”），这里直接 fetch `${base}/v1/models` 拿权威模型 id，
// 再按分类映射为 Tapnow 的 Chat / Image / Video。图像模型优先用 AionUi 的
// image_generation 能力判断；视频则由模型 id 关键词识别。模型 _uid 采用确定性前缀
// （chat:/img:/video:），确保画布节点刷新/重载后仍能匹配到同一模型，避免 Fallback 到
// DEFAULT_BASE_URL 造成 Failed to fetch。
// 注意：Tapnow-Studio 仅支持 Chat / Image / Video 三类节点，无 Audio，故音频模型跳过。
// ---------------------------------------------------------------------------

const TAPNOW_CONFIG_MSG = 'aionui:config';

export type ModelType = 'Chat' | 'Image' | 'Video';

export interface TapnowApiConfig {
  id: string;
  provider: string;
  type: ModelType;
  modelName: string;
  displayName: string;
  _uid: string;
}

export interface TapnowProviderConfig {
  id: string;
  name: string;
  url: string;
  apiKey: string;
  enabled: boolean;
  apiType: 'openai' | 'gemini';
}

export interface TapnowInjectedConfig {
  providers: TapnowProviderConfig[];
  apiConfigs: TapnowApiConfig[];
  modelLibrary: TapnowApiConfig[];
  globalApiKey: string;
}

function isModelEnabled(p: IProvider, modelName: string): boolean {
  // 默认启用；显式禁用才跳过
  return p.model_enabled?.[modelName] !== false;
}

/**
 * AionUi 的 base_url 本身以 /v1 结尾（如 https://maas.ovaijisuan.com/v1），
 * 而 Tapnow 会在 provider.url 之后"追加" /v1/xxx，因此需去掉末尾的 /v1，
 * 避免出现 /v1/v1/chat/completions。
 */
function normalizeBaseUrl(raw: string): string {
  if (!raw) return '';
  let u = raw.replace(/\/+$/, '');
  u = u.replace(/\/v1$/i, '');
  return u;
}

function pickApiType(p: IProvider): 'openai' | 'gemini' {
  const platform = (p.platform || '').toLowerCase();
  return platform.includes('gemini') || platform.includes('google') ? 'gemini' : 'openai';
}

/**
 * 根据模型 id 关键词分类其所属类型（用于把 MaaS 的文本/图片/视频分组映射到
 * Tapnow 的 Chat/Image/Video 节点）。音频模型因 Tapnow 无对应节点返回 'Audio'，
 * 由调用方跳过。关键词需保持保守：文本模型（GLM/DeepSeek/Qwen 等）不得误判。
 */
function classifyModel(id: string): ModelType | 'Audio' {
  const s = id.toLowerCase();
  // 视频（先判，避免 "hunyuan-video" / "wan-video" 被图片规则误判）
  if (/(cogvideo|cogvideox|kling|wan-|wanx|runway|gen-?3|sora|hunyuan-video|minimax-video|pika|hailuo|vidu|seedance|veo|video|film|animation|t2v|i2v)/.test(s)) return 'Video';
  // 音频 / 语音（Tapnow 无音频节点）
  if (/(tts|speech|speak|audio|voice|cosy|melo|suno|fish|elevenlabs|asr|whisper|transcri|dash-?audio|minimax-?audio|seed-?tts)/.test(s)) return 'Audio';
  // 图片
  if (/(flux|fluffy|dall-e|dalle|stable|sdxl|stability|imagen|kolors|midjourney|recraft|seedream|playground|gpt-image|nano-banana|image|picture|t2i|i2i|hunyuan-image|kandinsky|txt2img|draw)/.test(s)) return 'Image';
  return 'Chat';
}

/** _uid 使用确定性前缀，保证画布节点刷新/重载后仍能匹配同一模型。 */
function modelUid(type: ModelType, id: string): string {
  const p = type === 'Image' ? 'img' : type === 'Video' ? 'video' : 'chat';
  return `${p}:${id}`;
}

/** 拉取 MaaS /v1/models 权威模型列表，用于保证模型 id 与 MaaS 一致。失败则返回空。 */
async function fetchAuthoritativeModels(provider: IProvider): Promise<string[]> {
  const base = normalizeBaseUrl(provider.base_url || '');
  if (!base) return [];
  try {
    const res = await fetch(`${base}/v1/models`, {
      headers: { Authorization: `Bearer ${provider.api_key || ''}` },
    });
    if (!res.ok) return [];
    const j = (await res.json()) as { data?: Array<{ id: string }> };
    return (j.data || [])
      .map((m) => m.id)
      .filter((id) => !/(embedding|rerank|reranker)/i.test(id)); // 剔除非可用作节点的模型
  } catch {
    return [];
  }
}

/**
 * 将 AionUi 的 provider/model 配置映射为 Tapnow Studio 能识别的结构。
 * Tapnow 以 apiConfig.id 作为向 API 发送的 model 名，因此 id 取真实模型名；
 * 文本模型 id 以 /v1/models 权威列表为准，图像模型按 image_generation 能力。
 */
async function buildTapnowConfig(
  rawProviders: IProvider[],
  getAvailableModels: (p: IProvider) => string[]
): Promise<TapnowInjectedConfig> {
  const providers: TapnowProviderConfig[] = [];
  const apiConfigs: TapnowApiConfig[] = [];
  const seenModelIds = new Set<string>();

  for (const p of rawProviders) {
    if (p.enabled === false) continue;
    if (!p.base_url) continue; // 无 base_url 的伪 provider 无法被 OpenAI 兼容调用

    providers.push({
      id: p.id,
      name: p.name || p.id,
      url: normalizeBaseUrl(p.base_url),
      apiKey: p.api_key || '',
      enabled: true,
      apiType: pickApiType(p),
    });

    // 模型池：优先权威列表（/v1/models），失败回退到 AionUi 可用模型
    const authoritative = await fetchAuthoritativeModels(p);
    const pool = authoritative.length ? authoritative : getAvailableModels(p) || [];

    for (const m of pool) {
      // 音频模型 Tapnow 无对应节点，跳过
      let t = classifyModel(m);
      if (t === 'Audio') continue;
      // AionUi 明确标记 image_generation 的模型优先归为 Image
      if (t === 'Chat' && hasSpecificModelCapability(p, m, 'image_generation') === true) t = 'Image';
      const u = modelUid(t, m);
      if (seenModelIds.has(u)) continue;
      seenModelIds.add(u);
      apiConfigs.push({ id: m, provider: p.id, type: t, modelName: m, displayName: m, _uid: u });
    }

    // 补充：权威列表未覆盖、但 AionUi 有 image_generation 能力的图像模型
    for (const m of p.models || []) {
      if (!isModelEnabled(p, m)) continue;
      if (hasSpecificModelCapability(p, m, 'image_generation') !== true) continue;
      const u = modelUid('Image', m);
      if (seenModelIds.has(u)) continue;
      seenModelIds.add(u);
      apiConfigs.push({ id: m, provider: p.id, type: 'Image', modelName: m, displayName: m, _uid: u });
    }
  }

  const modelLibrary: TapnowApiConfig[] = apiConfigs.map((c) => ({ ...c }));
  return { providers, apiConfigs, modelLibrary, globalApiKey: '' };
}

export default function CanvasPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const { data: rawProviders } = useProvidersQuery();
  const { getAvailableModels } = useModelProviderList();

  const providerList = useMemo<IProvider[]>(
    () => (Array.isArray(rawProviders) ? rawProviders : []),
    [rawProviders]
  );

  const [config, setConfig] = useState<TapnowInjectedConfig>({
    providers: [],
    apiConfigs: [],
    modelLibrary: [],
    globalApiKey: '',
  });

  // 异步构建（拉取 /v1/models 拿权威模型 id）
  useEffect(() => {
    let alive = true;
    (async () => {
      const cfg = await buildTapnowConfig(providerList, getAvailableModels);
      if (alive) setConfig(cfg);
    })();
    return () => {
      alive = false;
    };
  }, [providerList, getAvailableModels]);

  const blobUrl = useMemo(() => {
    const blob = new Blob([tapnowHtml], { type: 'text/html;charset=utf-8' });
    return URL.createObjectURL(blob);
  }, []);

  useEffect(() => {
    return () => URL.revokeObjectURL(blobUrl);
  }, [blobUrl]);

  // 用 ref 持有最新 config，避免 handleLoad 定时器闭包捕获旧的（空）配置，
  // 在异步拉取 /v1/models 完成后仍推送空配置而覆盖掉已加载的模型。
  const configRef = useRef(config);
  configRef.current = config;

  const pushConfig = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage({ type: TAPNOW_CONFIG_MSG, ...configRef.current }, '*');
  }, []);

  const handleLoad = useCallback(() => {
    setReady(true);
    let attempts = 0;
    const timer = window.setInterval(() => {
      pushConfig();
      attempts += 1;
      if (attempts >= 8) window.clearInterval(timer);
    }, 600);
    pushConfig();
    return () => window.clearInterval(timer);
  }, [pushConfig]);

  // 模型配置构建完成后，若子应用已就绪则推送一次
  useEffect(() => {
    if (ready) pushConfig();
  }, [config, ready, pushConfig]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <iframe
        ref={iframeRef}
        src={blobUrl}
        onLoad={handleLoad}
        title="Infinite Canvas"
        style={{ width: '100%', height: '100%', border: '0', display: 'block' }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
      />
    </div>
  );
}
