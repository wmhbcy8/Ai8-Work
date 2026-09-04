import React, { memo, useCallback } from 'react';
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import { Input, Spin, Button, Tooltip, Typography } from '@arco-design/web-react';
import { IconImage, IconPoweroff } from '@arco-design/web-react/icon';
import { KIND_META, STATUS_META, type CanvasNode } from './nodeMeta';

const { TextArea } = Input;
const { Text } = Typography;

/** 文本输出预览：溢出安全（自动换行 + 限高滚动） */
function OutputText({ text, color }: { text: string; color: string }) {
  return (
    <div
      style={{
        maxHeight: 180,
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        fontSize: 12,
        lineHeight: 1.7,
        color,
        borderRadius: 6,
        background: 'rgba(0,0,0,0.03)',
        padding: '8px 10px',
      }}
    >
      {text || <span style={{ color: '#c9cdd4' }}>（暂无输出）</span>}
    </div>
  );
}

/** 图片结果预览网格 */
function ImageGrid({ urls, width }: { urls: string[]; width: number }) {
  if (!urls.length) return null;
  const cols = urls.length === 1 ? 1 : 2;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 }}>
      {urls.map((u, i) => (
        <img
          key={i}
          src={u}
          alt={`结果 ${i + 1}`}
          loading='lazy'
          style={{
            width: '100%',
            aspectRatio: '1 / 1',
            objectFit: 'cover',
            borderRadius: 6,
            border: '1px solid #e5e6eb',
            background: '#f7f8fa',
          }}
        />
      ))}
    </div>
  );
}

/** 状态角标 */
function StatusBadge({ status }: { status: keyof typeof STATUS_META }) {
  const meta = STATUS_META[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 500,
        color: meta.color,
        background: meta.bg,
        padding: '2px 7px',
        borderRadius: 10,
        whiteSpace: 'nowrap',
      }}
    >
      {status === 'running' ? <Spin size={10} /> : null}
      {meta.label}
    </span>
  );
}

function CanvasNodeInner({ id, data, selected, isConnectable }: NodeProps<CanvasNode>) {
  const { updateNodeData } = useReactFlow();
  const setData = useCallback((patch: Partial<typeof data>) => updateNodeData(id, patch), [id, updateNodeData]);
  const meta = KIND_META[data.kind];
  const isRunning = data.status === 'running';

  const handleDelete = useCallback(() => setData({ status: 'idle', output: '', imageUrls: [] }), [setData]);

  return (
    <div
      style={{
        width: meta.width,
        maxHeight: 480,
        borderRadius: 10,
        background: meta.softBg,
        border: `1px solid ${selected ? meta.accent : meta.border}`,
        boxShadow: selected ? `0 0 0 2px ${meta.accent}55, 0 4px 14px rgba(0,0,0,0.08)` : '0 1px 4px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
      }}
    >
      {/* 头部：颜色条 + 图标 + 标题 + 状态 */}
      <div
        style={{
          background: meta.accent,
          color: '#fff',
          padding: '7px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 14, lineHeight: 1 }}>{meta.emoji}</span>
        <span style={{ flex: 1, fontWeight: 600, fontSize: 12.5, color: '#fff' }}>{meta.label}</span>
        {isRunning ? <Spin size={12} style={{ color: '#fff' }} /> : <StatusBadge status={data.status} />}
      </div>

      {/* 主体：溢出安全 */}
      <div style={{ flex: 1, minHeight: 0, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.kind === 'text' && (
          <TextArea
            placeholder='输入文本内容，连接到下游节点…'
            value={data.content}
            autoSize={{ minRows: 3, maxRows: 10 }}
            onChange={(v) => setData({ content: v })}
            style={{ fontSize: 13, width: '100%', boxSizing: 'border-box' }}
          />
        )}

        {data.kind === 'aiText' && (
          <>
            {data.content ? (
              <TextArea
                placeholder='提示词（可选，留空则用上游文本）…'
                value={data.content}
                autoSize={{ minRows: 2, maxRows: 4 }}
                onChange={(v) => setData({ content: v })}
                style={{ fontSize: 12, width: '100%', boxSizing: 'border-box' }}
              />
            ) : null}
            {data.model && (
              <Text typography='secondary' style={{ fontSize: 11, color: meta.accent }}>
                模型：{data.model}
              </Text>
            )}
            {data.output && <OutputText text={data.output} color='#4e5969' />}
            {data.status === 'error' && data.error && (
              <Text style={{ fontSize: 12, color: '#f53f3f' }}>{data.error}</Text>
            )}
          </>
        )}

        {data.kind === 'image' && (
          <>
            <TextArea
              placeholder='绘图提示词…'
              value={data.content}
              autoSize={{ minRows: 2, maxRows: 4 }}
              onChange={(v) => setData({ content: v })}
              style={{ fontSize: 12, width: '100%', boxSizing: 'border-box' }}
            />
            {data.model && (
              <Text typography='secondary' style={{ fontSize: 11, color: meta.accent }}>
                模型：{data.model}
              </Text>
            )}
            {data.imageUrls.length ? (
              <ImageGrid urls={data.imageUrls} width={meta.width} />
            ) : (
              !data.output && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c9cdd4' }}>
                  <IconImage style={{ fontSize: 28 }} />
                  <span style={{ fontSize: 12 }}>生成图片将展示在这里</span>
                </div>
              )
            )}
            {data.output && <OutputText text={data.output} color='#4e5969' />}
          </>
        )}

        {data.kind === 'result' && (
          <>
            <Text typography='secondary' style={{ fontSize: 12 }}>
              汇聚上游产出
            </Text>
            {data.imageUrls.length ? <ImageGrid urls={data.imageUrls} width={meta.width} /> : null}
            {data.output && <OutputText text={data.output} color='#4e5969' />}
          </>
        )}
      </div>

      {/* 操作条 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 4,
          padding: '0 8px 8px',
          flexShrink: 0,
          opacity: selected || data.status === 'done' ? 1 : 0,
          transition: 'opacity 0.15s ease',
        }}
      >
        <Tooltip content='清除本节点结果'>
          <Button size='mini' type='text' icon={<IconPoweroff />} onClick={handleDelete} />
        </Tooltip>
      </div>

      {/* 连接手柄 */}
      {data.kind !== 'text' && (
        <Handle
          type='target'
          position={Position.Left}
          isConnectable={isConnectable}
          style={{ width: 10, height: 10, background: meta.accent, border: '2px solid #fff' }}
        />
      )}
      {data.kind !== 'result' && (
        <Handle
          type='source'
          position={Position.Right}
          isConnectable={isConnectable}
          style={{ width: 10, height: 10, background: meta.accent, border: '2px solid #fff' }}
        />
      )}
    </div>
  );
}

export const CanvasNode = memo(CanvasNodeInner);
