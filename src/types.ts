export interface SourceLocation {
  componentName?: string;
  fileName?: string;
  lineNumber?: number | null;
  columnNumber?: number | null;
}

export interface InspectorSnapshot {
  elementTag: string;
  selector: string;
  textPreview: string;
  componentName: string;
  fileName: string;
  lineNumber: number | null;
  columnNumber: number | null;
}

export interface HotkeyConfig {
  ctrlOrMeta?: boolean;
  shift?: boolean;
  alt?: boolean;
  key?: string;
}

export interface UiLocatorOverlayProps {
  enabled?: boolean;
  devOnly?: boolean;
  showHintBadge?: boolean;
  zIndex?: number;
  maxTextLength?: number;
  hotkey?: HotkeyConfig;
  sourceResolver?: (element: HTMLElement) => SourceLocation | null;
  onInspect?: (snapshot: InspectorSnapshot) => void;
}
