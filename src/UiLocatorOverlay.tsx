import { useEffect, useMemo, useState } from 'react';
import { resolveReactSource } from './reactSourceResolver';
import type { InspectorSnapshot, UiLocatorOverlayProps } from './types';

function compactText(value: string, max = 120): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }
  if (normalized.length <= max) {
    return normalized;
  }
  return `${normalized.slice(0, max)}...`;
}

function buildSelector(element: HTMLElement): string {
  const id = element.id?.trim();
  if (id) {
    return `#${id}`;
  }
  const parts: string[] = [];
  let cursor: HTMLElement | null = element;
  let depth = 0;
  while (cursor && depth < 5) {
    const tag = cursor.tagName.toLowerCase();
    const className = (cursor.className || '')
      .toString()
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join('.');
    parts.unshift(className ? `${tag}.${className}` : tag);
    cursor = cursor.parentElement;
    depth += 1;
  }
  return parts.join(' > ');
}

function resolveTarget(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof HTMLElement)) {
    return null;
  }
  if (target.closest('[data-ui-locator-overlay="true"]')) {
    return null;
  }
  return target;
}

export function UiLocatorOverlay({
  enabled = true,
  devOnly = true,
  showHintBadge = true,
  zIndex = 3000,
  maxTextLength = 120,
  hotkey,
  sourceResolver,
  onInspect
}: UiLocatorOverlayProps) {
  const [active, setActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const [hoverTag, setHoverTag] = useState('');
  const [snapshot, setSnapshot] = useState<InspectorSnapshot | null>(null);

  const isDev = typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : true;
  const canRun = enabled && (!devOnly || isDev);

  const hotkeyConfig = {
    ctrlOrMeta: hotkey?.ctrlOrMeta ?? true,
    shift: hotkey?.shift ?? true,
    alt: hotkey?.alt ?? false,
    key: (hotkey?.key ?? 'l').toLowerCase()
  };

  useEffect(() => {
    if (!canRun) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const withCtrlOrMeta = event.ctrlKey || event.metaKey;
      if (
        key === hotkeyConfig.key
        && (!hotkeyConfig.ctrlOrMeta || withCtrlOrMeta)
        && (!hotkeyConfig.shift || event.shiftKey)
        && (!hotkeyConfig.alt || event.altKey)
      ) {
        event.preventDefault();
        setActive((previous) => !previous);
        setCopied(false);
        return;
      }
      if (key === 'escape' && active) {
        event.preventDefault();
        setActive(false);
        setHoverRect(null);
        setSnapshot(null);
        setCopied(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, canRun, hotkeyConfig.alt, hotkeyConfig.ctrlOrMeta, hotkeyConfig.key, hotkeyConfig.shift]);

  useEffect(() => {
    if (!canRun || !active) {
      return;
    }

    const onMove = (event: MouseEvent) => {
      const target = resolveTarget(event.target);
      if (!target) {
        return;
      }
      setHoverRect(target.getBoundingClientRect());
      setHoverTag(target.tagName.toLowerCase());
    };

    const onClick = (event: MouseEvent) => {
      const target = resolveTarget(event.target);
      if (!target) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();

      const source = sourceResolver ? sourceResolver(target) : resolveReactSource(target);
      const nextSnapshot: InspectorSnapshot = {
        elementTag: target.tagName.toLowerCase(),
        selector: buildSelector(target),
        textPreview: compactText(target.textContent || '', maxTextLength),
        componentName: source?.componentName || 'UnknownComponent',
        fileName: source?.fileName || '未解析到源码（请在开发模式下使用）',
        lineNumber: source?.lineNumber ?? null,
        columnNumber: source?.columnNumber ?? null
      };

      setSnapshot(nextSnapshot);
      setHoverRect(target.getBoundingClientRect());
      setHoverTag(target.tagName.toLowerCase());
      setCopied(false);
      onInspect?.(nextSnapshot);
    };

    window.addEventListener('mousemove', onMove, true);
    window.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('mousemove', onMove, true);
      window.removeEventListener('click', onClick, true);
    };
  }, [active, canRun, maxTextLength, onInspect, sourceResolver]);

  const sourceLocation = useMemo(() => {
    if (!snapshot) {
      return '';
    }
    if (snapshot.lineNumber === null) {
      return snapshot.fileName;
    }
    if (snapshot.columnNumber === null) {
      return `${snapshot.fileName}:${snapshot.lineNumber}`;
    }
    return `${snapshot.fileName}:${snapshot.lineNumber}:${snapshot.columnNumber}`;
  }, [snapshot]);

  const handleCopy = async () => {
    if (!snapshot) {
      return;
    }
    const payload = [
      `组件: ${snapshot.componentName}`,
      `源码: ${sourceLocation}`,
      `元素: ${snapshot.elementTag}`,
      `选择器: ${snapshot.selector}`,
      `文本: ${snapshot.textPreview || '(空)'}`
    ].join('\n');

    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  if (!canRun) {
    return null;
  }

  if (!active) {
    if (!showHintBadge) {
      return null;
    }
    return (
      <div
        data-ui-locator-overlay="true"
        style={{
          position: 'fixed',
          right: 12,
          bottom: 12,
          zIndex,
          pointerEvents: 'none',
          padding: '4px 10px',
          borderRadius: 999,
          border: '1px solid #cbd5e1',
          color: '#334155',
          background: 'rgba(255,255,255,0.92)',
          fontSize: 12
        }}
      >
        UI 定位器：Ctrl/⌘ + Shift + {hotkeyConfig.key.toUpperCase()}
      </div>
    );
  }

  return (
    <>
      {hoverRect ? (
        <div
          data-ui-locator-overlay="true"
          style={{
            position: 'fixed',
            left: hoverRect.left,
            top: hoverRect.top,
            width: Math.max(0, hoverRect.width),
            height: Math.max(0, hoverRect.height),
            border: '2px solid #10b981',
            background: 'rgba(16,185,129,0.12)',
            zIndex,
            pointerEvents: 'none'
          }}
        />
      ) : null}

      {hoverRect ? (
        <div
          data-ui-locator-overlay="true"
          style={{
            position: 'fixed',
            left: hoverRect.left,
            top: Math.max(0, hoverRect.top - 24),
            zIndex: zIndex + 1,
            pointerEvents: 'none',
            fontSize: 12,
            color: '#065f46',
            background: '#ecfdf5',
            border: '1px solid #34d399',
            borderRadius: 6,
            padding: '1px 6px'
          }}
        >
          {hoverTag || 'element'}
        </div>
      ) : null}

      <div
        data-ui-locator-overlay="true"
        style={{
          position: 'fixed',
          right: 12,
          bottom: 12,
          width: 500,
          maxWidth: '92vw',
          borderRadius: 12,
          border: '1px solid #94a3b8',
          background: 'rgba(255,255,255,0.98)',
          boxShadow: '0 14px 34px rgba(15,23,42,0.18)',
          padding: 12,
          zIndex: zIndex + 2,
          pointerEvents: 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <strong style={{ color: '#0f172a', fontSize: 14 }}>UI 定位模式已开启</strong>
          <span style={{ fontSize: 12, color: '#475569' }}>Esc 退出</span>
        </div>

        {!snapshot ? (
          <div style={{ fontSize: 13, color: '#64748b' }}>请点击页面任意区域，查看对应组件与源码位置。</div>
        ) : (
          <div style={{ display: 'grid', rowGap: 8 }}>
            <div>
              <div style={{ fontSize: 12, color: '#64748b' }}>组件</div>
              <div style={{ fontSize: 13, color: '#0f172a', wordBreak: 'break-all' }}>{snapshot.componentName}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#64748b' }}>源码</div>
              <div style={{ fontSize: 13, color: '#0f172a', wordBreak: 'break-all' }}>{sourceLocation}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#64748b' }}>选择器</div>
              <div style={{ fontSize: 13, color: '#0f172a', wordBreak: 'break-all' }}>{snapshot.selector}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#64748b' }}>文本预览</div>
              <div style={{ fontSize: 13, color: '#0f172a', wordBreak: 'break-all' }}>{snapshot.textPreview || '(空)'}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
              <button
                type="button"
                onClick={() => void handleCopy()}
                style={{
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#334155',
                  borderRadius: 8,
                  fontSize: 12,
                  padding: '6px 10px',
                  cursor: 'pointer'
                }}
              >
                {copied ? '已复制' : '复制定位信息'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSnapshot(null);
                  setCopied(false);
                }}
                style={{
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#334155',
                  borderRadius: 8,
                  fontSize: 12,
                  padding: '6px 10px',
                  cursor: 'pointer'
                }}
              >
                清空
              </button>
              <button
                type="button"
                onClick={() => {
                  setActive(false);
                  setHoverRect(null);
                }}
                style={{
                  border: '1px solid #16a34a',
                  background: '#16a34a',
                  color: '#fff',
                  borderRadius: 8,
                  fontSize: 12,
                  padding: '6px 10px',
                  cursor: 'pointer'
                }}
              >
                退出
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
