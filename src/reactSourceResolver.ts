import type { SourceLocation } from './types';

interface FiberDebugSource {
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
}

interface FiberNode {
  return?: FiberNode | null;
  type?: unknown;
  elementType?: unknown;
  _debugSource?: FiberDebugSource;
}

function getFiberFromElement(element: HTMLElement): FiberNode | null {
  const raw = element as unknown as Record<string, unknown>;
  for (const key of Object.keys(raw)) {
    if (key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')) {
      return raw[key] as FiberNode;
    }
  }
  return null;
}

function resolveComponentName(fiber: FiberNode | null): string {
  let cursor = fiber;
  let depth = 0;
  while (cursor && depth < 80) {
    const candidate = cursor.elementType ?? cursor.type;
    if (typeof candidate === 'function') {
      const typed = candidate as { displayName?: string; name?: string };
      return typed.displayName || typed.name || 'AnonymousComponent';
    }
    if (candidate && typeof candidate === 'object') {
      const typed = candidate as {
        displayName?: string;
        name?: string;
        render?: { displayName?: string; name?: string };
      };
      const name = typed.displayName || typed.name || typed.render?.displayName || typed.render?.name;
      if (name) {
        return name;
      }
    }
    cursor = cursor.return ?? null;
    depth += 1;
  }
  return 'UnknownComponent';
}

function resolveDebugSource(fiber: FiberNode | null): FiberDebugSource | null {
  let cursor = fiber;
  let depth = 0;
  while (cursor && depth < 120) {
    if (cursor._debugSource?.fileName) {
      return cursor._debugSource;
    }
    cursor = cursor.return ?? null;
    depth += 1;
  }
  return null;
}

export function resolveReactSource(element: HTMLElement): SourceLocation | null {
  const fiber = getFiberFromElement(element);
  const source = resolveDebugSource(fiber);
  return {
    componentName: resolveComponentName(fiber),
    fileName: source?.fileName,
    lineNumber: Number.isFinite(source?.lineNumber) ? (source?.lineNumber as number) : null,
    columnNumber: Number.isFinite(source?.columnNumber) ? (source?.columnNumber as number) : null
  };
}
