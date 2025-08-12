import * as vscode from 'vscode';

// Matches: new Color(r, g, b) or new Color(r, g, b, a) with optional spaces and trailing f for floats
// Also matches: Color(r, g, b [, a]) without 'new', and fully-qualified UnityEngine.Color
// Captures r, g, b, a as groups 1..4
const COLOR_REGEX = /\b(?:new\s+)?(?:(?:global::)?UnityEngine\.)?Color\s*\(\s*([0-9]*\.?[0-9]+)f?\s*,\s*([0-9]*\.?[0-9]+)f?\s*,\s*([0-9]*\.?[0-9]+)f?(?:\s*,\s*([0-9]*\.?[0-9]+)f?\s*)?\)/g;

// Matches: new Color32(r, g, b [, a]) where r,g,b,a are 0-255 ints, and fully-qualified UnityEngine.Color32
const COLOR32_REGEX = /\b(?:new\s+)?(?:(?:global::)?UnityEngine\.)?Color32\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d{1,3})\s*)?\)/g;

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function activate(context: vscode.ExtensionContext) {
  const selector: vscode.DocumentSelector = [
    { language: 'csharp', scheme: 'file' },
    { language: 'csharp', scheme: 'untitled' },
  ];

  const provider: vscode.DocumentColorProvider = {
    provideDocumentColors(document) {
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

      return results;
    },
    provideColorPresentations(color, context) {
      const r255 = Math.round(color.red * 255);
      const g255 = Math.round(color.green * 255);
      const b255 = Math.round(color.blue * 255);
      const a255 = Math.round(color.alpha * 255);

      // Presentations for both Color and Color32 so users can switch
      const p1 = new vscode.ColorPresentation(`new Color(${color.red.toFixed(3)}f, ${color.green.toFixed(3)}f, ${color.blue.toFixed(3)}f, ${color.alpha.toFixed(3)}f)`);
      const p2 = new vscode.ColorPresentation(`new Color(${color.red.toFixed(3)}f, ${color.green.toFixed(3)}f, ${color.blue.toFixed(3)}f)`);
      const p3 = new vscode.ColorPresentation(`new Color32(${r255}, ${g255}, ${b255}, ${a255})`);
      const p4 = new vscode.ColorPresentation(`new Color32(${r255}, ${g255}, ${b255})`);

      return [p1, p2, p3, p4];
    },
  };

  const disposable = vscode.languages.registerColorProvider(selector, provider);
  context.subscriptions.push(disposable);
}

export function deactivate() {}


