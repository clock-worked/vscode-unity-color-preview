import * as vscode from 'vscode';

// Matches: new Color(r, g, b) or new Color(r, g, b, a) with optional spaces and trailing f for floats
// Also matches: Color(r, g, b [, a]) without 'new', and fully-qualified UnityEngine.Color
// Captures r, g, b, a as groups 1..4
const COLOR_REGEX = /\b(?:new\s+)?(?:(?:global::)?UnityEngine\.)?Color\s*\(\s*([0-9]*\.?[0-9]+)f?\s*,\s*([0-9]*\.?[0-9]+)f?\s*,\s*([0-9]*\.?[0-9]+)f?(?:\s*,\s*([0-9]*\.?[0-9]+)f?\s*)?\)/g;

// Matches: new Color32(r, g, b [, a]) where r,g,b,a are 0-255 ints, and fully-qualified UnityEngine.Color32
const COLOR32_REGEX = /\b(?:new\s+)?(?:(?:global::)?UnityEngine\.)?Color32\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d{1,3})\s*)?\)/g;

// Matches: Color.red, UnityEngine.Color.red, etc. (optional global:: qualifier)
const NAMED_COLOR_REGEX = /\b(?:(?:global::)?UnityEngine\.)?Color\.(red|green|blue|black|white|grey|gray|cyan|magenta|yellow|clear)\b/g;

// (removed duplicate clamp helpers; defined once above)

type ExtensionConfig = {
  showHighlightColor: boolean;
  highlightOpacity: number; // 0..1
  highlightStyle: 'background' | 'underline';
  showOverviewRulerColor: boolean;
  preferredFormat: 'Color' | 'Color32';
  floatPrecision: number; // 0..6
  includeAlphaByDefault: boolean;
  enableNamedColors: boolean;
};

function getConfig(): ExtensionConfig {
  const cfg = vscode.workspace.getConfiguration('unityColorPreview');
  return {
    showHighlightColor: cfg.get<boolean>('showHighlightColor', false),
    highlightOpacity: Math.max(0, Math.min(1, cfg.get<number>('highlightOpacity', 0.25))),
    highlightStyle: cfg.get<'background' | 'underline'>('highlightStyle', 'background'),
    showOverviewRulerColor: cfg.get<boolean>('showOverviewRulerColor', false),
    preferredFormat: cfg.get<'Color' | 'Color32'>('preferredFormat', 'Color'),
    floatPrecision: Math.max(0, Math.min(6, cfg.get<number>('floatPrecision', 3))),
    includeAlphaByDefault: cfg.get<boolean>('includeAlphaByDefault', true),
    enableNamedColors: cfg.get<boolean>('enableNamedColors', true),
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function toCssRgba(color: vscode.Color, alphaOverride?: number): string {
  const r = Math.round(color.red * 255);
  const g = Math.round(color.green * 255);
  const b = Math.round(color.blue * 255);
  const a = alphaOverride !== undefined ? clamp01(alphaOverride) : clamp01(color.alpha);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function getNamedUnityColor(name: string): vscode.Color | undefined {
  switch (name.toLowerCase()) {
    case 'red': return new vscode.Color(1, 0, 0, 1);
    case 'green': return new vscode.Color(0, 1, 0, 1);
    case 'blue': return new vscode.Color(0, 0, 1, 1);
    case 'black': return new vscode.Color(0, 0, 0, 1);
    case 'white': return new vscode.Color(1, 1, 1, 1);
    case 'grey':
    case 'gray': return new vscode.Color(0.5, 0.5, 0.5, 1);
    case 'cyan': return new vscode.Color(0, 1, 1, 1);
    case 'magenta': return new vscode.Color(1, 0, 1, 1);
    case 'yellow': return new vscode.Color(1, 1, 0, 1);
    case 'clear': return new vscode.Color(0, 0, 0, 0);
    default: return undefined;
  }
}

function scanDocumentForColors(document: vscode.TextDocument, includeNamed: boolean): vscode.ColorInformation[] {
  const results: vscode.ColorInformation[] = [];
  const text = document.getText();

  // Color (float 0..1)
  for (const match of text.matchAll(COLOR_REGEX)) {
    const r = clamp01(parseFloat(match[1]));
    const g = clamp01(parseFloat(match[2]));
    const b = clamp01(parseFloat(match[3]));
    const a = clamp01(match[4] !== undefined ? parseFloat(match[4]) : 1.0);
    const start = document.positionAt(match.index || 0);
    const end = document.positionAt((match.index || 0) + match[0].length);
    results.push({ range: new vscode.Range(start, end), color: new vscode.Color(r, g, b, a) });
  }

  // Color32 (0..255)
  for (const match of text.matchAll(COLOR32_REGEX)) {
    const r = clamp01(clamp255(parseInt(match[1], 10)) / 255);
    const g = clamp01(clamp255(parseInt(match[2], 10)) / 255);
    const b = clamp01(clamp255(parseInt(match[3], 10)) / 255);
    const aRaw = match[4] !== undefined ? clamp255(parseInt(match[4], 10)) : 255;
    const a = clamp01(aRaw / 255);
    const start = document.positionAt(match.index || 0);
    const end = document.positionAt((match.index || 0) + match[0].length);
    results.push({ range: new vscode.Range(start, end), color: new vscode.Color(r, g, b, a) });
  }

  if (includeNamed) {
    for (const match of text.matchAll(NAMED_COLOR_REGEX)) {
      const named = getNamedUnityColor(match[1]);
      if (!named) { continue; }
      const start = document.positionAt(match.index || 0);
      const end = document.positionAt((match.index || 0) + match[0].length);
      results.push({ range: new vscode.Range(start, end), color: named });
    }
  }

  return results;
}

const editorToDecorations = new Map<vscode.TextEditor, vscode.TextEditorDecorationType[]>();

function disposeEditorDecorations(editor: vscode.TextEditor | undefined) {
  if (!editor) return;
  const list = editorToDecorations.get(editor);
  if (list) {
    for (const deco of list) deco.dispose();
    editorToDecorations.delete(editor);
  }
}

function updateHighlightsForEditor(editor: vscode.TextEditor | undefined) {
  if (!editor) return;
  if (editor.document.languageId !== 'csharp') return;
  const config = getConfig();
  disposeEditorDecorations(editor);
  if (!config.showHighlightColor) return;

  const infos = scanDocumentForColors(editor.document, config.enableNamedColors);
  // Group by CSS color string (without alpha override when using underline border)
  type Group = { cssColor: string; ranges: vscode.Range[] };
  const map = new Map<string, Group>();
  for (const info of infos) {
    const css = toCssRgba(info.color, config.highlightOpacity);
    const key = css;
    const group = map.get(key) || { cssColor: css, ranges: [] };
    group.ranges.push(info.range);
    map.set(key, group);
  }

  const decos: vscode.TextEditorDecorationType[] = [];
  for (const group of map.values()) {
    const render: vscode.DecorationRenderOptions = {};
    if (config.highlightStyle === 'background') {
      render.backgroundColor = group.cssColor;
    } else if (config.highlightStyle === 'underline') {
      render.textDecoration = `underline solid ${group.cssColor}`;
    }
    if (config.showOverviewRulerColor) {
      render.overviewRulerColor = group.cssColor;
      render.overviewRulerLane = vscode.OverviewRulerLane.Right;
    }
    const decoType = vscode.window.createTextEditorDecorationType(render);
    decos.push(decoType);
    editor.setDecorations(decoType, group.ranges);
  }
  editorToDecorations.set(editor, decos);
}

export function activate(context: vscode.ExtensionContext) {
  const selector: vscode.DocumentSelector = [
    { language: 'csharp', scheme: 'file' },
    { language: 'csharp', scheme: 'untitled' },
  ];

  const provider: vscode.DocumentColorProvider = {
    provideDocumentColors(document) {
      const config = getConfig();
      const results = scanDocumentForColors(document, config.enableNamedColors);
      return results;
    },
    provideColorPresentations(color, context) {
      const cfg = getConfig();
      const precision = cfg.floatPrecision;
      const r255 = Math.round(color.red * 255);
      const g255 = Math.round(color.green * 255);
      const b255 = Math.round(color.blue * 255);
      const a255 = Math.round(color.alpha * 255);

      const withAlphaColor = new vscode.ColorPresentation(`new Color(${color.red.toFixed(precision)}f, ${color.green.toFixed(precision)}f, ${color.blue.toFixed(precision)}f, ${color.alpha.toFixed(precision)}f)`);
      const noAlphaColor = new vscode.ColorPresentation(`new Color(${color.red.toFixed(precision)}f, ${color.green.toFixed(precision)}f, ${color.blue.toFixed(precision)}f)`);
      const withAlphaColor32 = new vscode.ColorPresentation(`new Color32(${r255}, ${g255}, ${b255}, ${a255})`);
      const noAlphaColor32 = new vscode.ColorPresentation(`new Color32(${r255}, ${g255}, ${b255})`);

      const preferColor = cfg.preferredFormat === 'Color';
      const showAlphaFirst = cfg.includeAlphaByDefault;

      const ordered: vscode.ColorPresentation[] = [];
      if (preferColor) {
        ordered.push(...(showAlphaFirst ? [withAlphaColor, noAlphaColor] : [noAlphaColor, withAlphaColor]));
        ordered.push(...(showAlphaFirst ? [withAlphaColor32, noAlphaColor32] : [noAlphaColor32, withAlphaColor32]));
      } else {
        ordered.push(...(showAlphaFirst ? [withAlphaColor32, noAlphaColor32] : [noAlphaColor32, withAlphaColor32]));
        ordered.push(...(showAlphaFirst ? [withAlphaColor, noAlphaColor] : [noAlphaColor, withAlphaColor]));
      }
      return ordered;
    },
  };

  const disposable = vscode.languages.registerColorProvider(selector, provider);
  context.subscriptions.push(disposable);

  // Initial highlight and listeners
  const refreshAllEditors = () => {
    for (const ed of vscode.window.visibleTextEditors) {
      updateHighlightsForEditor(ed);
    }
  };

  refreshAllEditors();

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((ed) => updateHighlightsForEditor(ed)),
    vscode.window.onDidChangeVisibleTextEditors(() => refreshAllEditors()),
    vscode.workspace.onDidChangeTextDocument((e) => {
      for (const ed of vscode.window.visibleTextEditors) {
        if (ed.document === e.document) {
          updateHighlightsForEditor(ed);
        }
      }
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('unityColorPreview')) {
        refreshAllEditors();
      }
    }),
    { dispose: () => { for (const ed of editorToDecorations.keys()) disposeEditorDecorations(ed); } }
  );
}

export function deactivate() {}


