/**
 * OvaiJisuan MaaS 客户端——AI 文本/图片/视频/语音 一体化 OpenAI 兼容网关。
 *
 * 画布节点直接调用这里，使用用户在自己「设置→模型」里配置的 provider
 * （base_url + api_key + model）。全部为本地直连，不上传、不记账。
 */

export interface MaasProviderRef {
  /** 例如 https://maas.ovaijisuan.com/v1 */
  base_url: string;
  api_key: string;
}

export interface MaasChatParams {
  provider: MaasProviderRef;
  model: string;
  system?: string;
  prompt: string;
  /** 输出图片/视频时是否携带上游 URL 的引用 */
  images?: string[];
  /** 用于图片输入（vision）模型 */
  stream?: boolean;
}

export interface MaasImageParams {
  provider: MaasProviderRef;
  model: string;
  prompt: string;
  negative?: string;
  size?: string;
  n?: number;
}

export interface MaasTaskResult {
  /** 任务 id（视频/音频等异步任务） */
  id?: string;
  /** 产物 URL（图片/音频/视频） */
  url?: string;
  urls?: string[];
  text?: string;
  status?: string;
}

function joinUrl(baseUrl: string, path: string): string {
  return baseUrl.replace(/\/+$/, '') + path;
}

/**
 * 文本生成——POST /v1/chat/completions（同步/流式）。
 * 流式时通过 onChunk 回调累积文本。
 */
export async function maasChat(
  params: MaasChatParams,
  onChunk?: (delta: string) => void,
): Promise<string> {
  const { base_url, api_key } = params.provider;
  const body: Record<string, unknown> = {
    model: params.model,
    messages: [
      ...(params.system ? [{ role: 'system' as const, content: params.system }] : []),
      {
        role: 'user' as const,
        content: params.images?.length
          ? [
              { type: 'text', text: params.prompt },
              ...params.images.map((url) => ({ type: 'image_url', image_url: { url } })),
            ]
          : params.prompt,
      },
    ],
    stream: params.stream ?? onChunk != null,
  };

  const resp = await fetch(joinUrl(base_url, '/chat/completions'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${api_key}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`MaaS 文本生成失败（${resp.status}）：${errText}`);
  }

  // 流式
  if (onChunk && resp.body) {
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const delta: string = json.choices?.[0]?.delta?.content ?? '';
          if (delta) {
            full += delta;
            onChunk(delta);
          }
        } catch {
          // 忽略无法解析的分片
        }
      }
    }
    return full;
  }

  // 非流式
  const json = await resp.json().catch(() => ({}));
  return json.choices?.[0]?.message?.content ?? '';
}

/**
 * 图片生成——POST /v1/images/generations。
 * 返回图片 url 列表（部分服务直接返回 base64 data-url）。
 */
export async function maasImage(params: MaasImageParams): Promise<string[]> {
  const { base_url, api_key } = params.provider;
  const resp = await fetch(joinUrl(base_url, '/images/generations'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${api_key}`,
    },
    body: JSON.stringify({
      model: params.model,
      prompt: params.prompt,
      negative_prompt: params.negative,
      size: params.size,
      n: params.n ?? 1,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`MaaS 图片生成失败（${resp.status}）：${errText}`);
  }

  const json = await resp.json().catch(() => ({}));
  const data = Array.isArray(json.data) ? json.data : [];
  return data.map((d: { url?: string; b64_json?: string }) => d.url ?? (d.b64_json ? `data:image/png;base64,${d.b64_json}` : '')).filter(Boolean);
}

/**
 * 视频生成——POST /v1/videos。MaaS 视频通常是异步任务：
 * 返回 task id，需轮询 /v1/videos/:id 获取进度，完成后得到 video url。
 * 这里返回任务 id，由调用方决定轮询策略。
 */
export async function maasVideo(
  provider: MaasProviderRef,
  model: string,
  prompt: string,
): Promise<MaasTaskResult> {
  const { base_url, api_key } = provider;
  const resp = await fetch(joinUrl(base_url, '/videos'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${api_key}` },
    body: JSON.stringify({ model, prompt }),
  });
  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`MaaS 视频生成失败（${resp.status}）：${errText}`);
  }
  const json = await resp.json().catch(() => ({}));
  return { id: json.id, status: json.status, url: json.url ?? json.output?.url };
}

/** 视频任务轮询 */
export async function maasVideoStatus(
  provider: MaasProviderRef,
  taskId: string,
): Promise<MaasTaskResult> {
  const { base_url, api_key } = provider;
  const resp = await fetch(joinUrl(base_url, `/videos/${taskId}`), {
    headers: { Authorization: `Bearer ${api_key}` },
  });
  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`查询视频任务失败（${resp.status}）：${errText}`);
  }
  const json = await resp.json().catch(() => ({}));
  return { id: json.id, status: json.status, url: json.output?.url ?? json.url, text: json.output?.text };
}

/**
 * 语音/音乐——POST /v1/audio/speech。MaaS 的语音模型（indextts-2/moss-voicegen/qwen3-tts）
 * 返回音频 blob。这里返回一个 object URL 供 <audio> 播放。
 */
export async function maasAudioSpeech(
  provider: MaasProviderRef,
  model: string,
  text: string,
  voice?: string,
): Promise<string> {
  const { base_url, api_key } = provider;
  const resp = await fetch(joinUrl(base_url, '/audio/speech'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${api_key}` },
    body: JSON.stringify({ model, input: text, voice }),
  });
  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`MaaS 语音生成失败（${resp.status}）：${errText}`);
  }
  const blob = await resp.blob();
  return URL.createObjectURL(blob);
}
