import type { Node } from '@xyflow/react';

export type NodeKind = 'text' | 'aiText' | 'image' | 'result';
export type NodeStatus = 'idle' | 'running' | 'done' | 'error';

export interface CanvasNodeData {
  kind: NodeKind;
  label: string;
  content: string;
  output: string;
  imageUrls: string[];
  model: string;
  status: NodeStatus;
  error?: string;
}

export type CanvasNode = Node<CanvasNodeData>;

interface KindMeta {
  label: string;
  emoji: string;
  accent: string; // 主题色（header/indicator）
  softBg: string; // 卡片淡淡的背景
  border: string; // 卡片边框
  width: number;
  category: 'source' | 'ai' | 'output';
}

export const KIND_META: Record<NodeKind, KindMeta> = {
  text: { label: '文字', emoji: '📝', accent: '#165dff', softBg: '#f5f8ff', border: '#c9d8ff', width: 232, category: 'source' },
  aiText: { label: 'AI 文本', emoji: '🤖', accent: '#722ed1', softBg: '#f9f5ff', border: '#d3c0f0', width: 268, category: 'ai' },
  image: { label: 'AI 绘图', emoji: '🎨', accent: '#00b42a', softBg: '#f6fdf6', border: '#b7eb8f', width: 268, category: 'ai' },
  result: { label: '结果', emoji: '📋', accent: '#ff7d00', softBg: '#fffbe6', border: '#ffe58f', width: 300, category: 'output' },
};

export const STATUS_META: Record<NodeStatus, { label: string; color: string; bg: string }> = {
  idle: { label: '待运行', color: '#86909c', bg: '#f2f3f5' },
  running: { label: '运行中', color: '#165dff', bg: '#e8f3ff' },
  done: { label: '已完成', color: '#00b42a', bg: '#e8ffee' },
  error: { label: '出错', color: '#f53f3f', bg: '#ffece8' },
};

export function createNodeData(kind: NodeKind): CanvasNodeData {
  return {
    kind,
    label: KIND_META[kind].label,
    content: '',
    output: '',
    imageUrls: [],
    model: '',
    status: 'idle',
  };
}

/** 优雅截断过长的文本为摘要（用于输出预览 + 结果合并） */
export function textSummarize(text: string, max = 800): string {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

export const NODE_KINDS = Object.keys(KIND_META) as NodeKind[];
