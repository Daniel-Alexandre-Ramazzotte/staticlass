/**
 * MathText — renderiza texto com LaTeX inline/bloco via KaTeX e imagens inline via [img:filename].
 *
 * Uso:
 *   <MathText fontSize={16} color="#fff" apiBase="http://10.0.2.2:5000">
 *     Seja $\bar{x}$ a média. Veja [img:grafico1.jpg] e calcule.
 *   </MathText>
 *
 * Comportamento:
 *   - Texto sem '$' nem '[img:': renderiza <Text> nativo (sem custo extra).
 *   - Android/iOS com '$' ou '[img:': WebView + KaTeX CDN (auto-height).
 *   - Web com '$' ou '[img:': KaTeX via dangerouslySetInnerHTML + <Image> inline.
 */
import React, { useState } from 'react';
import { Image, Platform, StyleSheet, TextStyle, ViewStyle, View } from 'react-native';
import { Text } from 'tamagui';

interface MathTextProps {
  children: string;
  fontSize?: number;
  color?: string;
  style?: TextStyle | ViewStyle;
  /** URL base da API, usada para resolver [img:filename] */
  apiBase?: string;
  /** Altura inicial estimada em px para o WebView (mobile) */
  webViewHeight?: number;
}

const IMG_PATTERN = /\[img:([^\]]+)\]/g;

function normalizeNumbering(text: string): string {
  return text.replace(/(?<!\d)([1-5])\)(?=\s|$)/g, (_, n) =>
    ({ '1': 'a', '2': 'b', '3': 'c', '4': 'd', '5': 'e' } as Record<string, string>)[n] + ')'
  );
}

function needsWebView(text: string): boolean {
  return text.includes('$') || text.includes('[img:');
}

function preprocessImages(text: string, apiBase: string): string {
  return text.replace(IMG_PATTERN, (_, filename) =>
    `<img src="${apiBase}/questions/uploads/${encodeURIComponent(filename)}" style="max-width:100%;height:auto;display:block;margin:8px auto;" />`
  );
}

function buildKatexHtml(text: string, fontSize: number, color: string, apiBase: string): string {
  const processed = preprocessImages(text, apiBase);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" />
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, sans-serif;
      font-size: ${fontSize}px;
      color: ${color};
      background: transparent;
      padding: 4px 0;
      word-wrap: break-word;
    }
    .katex { font-size: 1em; }
    img { border-radius: 4px; }
  </style>
</head>
<body id="content">${processed}</body>
<script>
  renderMathInElement(document.getElementById('content'), {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$',  right: '$',  display: false },
    ],
    throwOnError: false,
  });
  window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
    String(document.body.scrollHeight)
  );
</script>
</html>`;
}

function extractLayoutStyle(style: any): any {
  if (!style) return {};
  const layoutKeys = ['flex', 'width', 'minWidth', 'maxWidth', 'alignSelf',
    'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight'];
  const out: any = {};
  layoutKeys.forEach((k) => { if (style[k] !== undefined) out[k] = style[k]; });
  return out;
}

// ─── Renderizador web (KaTeX via dangerouslySetInnerHTML + Image para [img:]) ─

function MathTextWeb({ children, fontSize = 16, color = '#000', style, apiBase = '' }: MathTextProps) {
  if (!children) return null;
  const text = normalizeNumbering(children);

  if (!needsWebView(text)) {
    return <Text style={[{ color, fontSize }, style as TextStyle]}>{text}</Text>;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const katex = require('katex');

  const IMG_SPLIT = /(\[img:[^\]]+\]|\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g;
  const segments = text.split(IMG_SPLIT);
  const parts = segments.map((seg, i) => {
    if (/^\[img:([^\]]+)\]$/.test(seg)) {
      const filename = seg.slice(5, -1);
      const uri = `${apiBase}/questions/uploads/${encodeURIComponent(filename)}`;
      return (
        <Image
          key={i}
          source={{ uri }}
          style={{ width: '100%' as any, height: 200, resizeMode: 'contain', marginVertical: 8 }}
        />
      );
    }
    if (seg.startsWith('$$') && seg.endsWith('$$')) {
      const formula = seg.slice(2, -2);
      try {
        const html = katex.renderToString(formula, { displayMode: true, throwOnError: false });
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch {
        return <span key={i}>{seg}</span>;
      }
    }
    if (seg.startsWith('$') && seg.endsWith('$')) {
      const formula = seg.slice(1, -1);
      try {
        const html = katex.renderToString(formula, { displayMode: false, throwOnError: false });
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch {
        return <span key={i}>{seg}</span>;
      }
    }
    return <span key={i}>{seg}</span>;
  });

  return (
    <Text style={[{ color, fontSize }, style as TextStyle]}>
      {parts as any}
    </Text>
  );
}

// ─── Renderizador nativo (WebView + KaTeX CDN) ────────────────────────────────

function MathTextNative({ children, fontSize = 16, color = '#000', style, webViewHeight, apiBase = '' }: MathTextProps) {
  const [height, setHeight] = useState(webViewHeight ?? fontSize * 3);

  if (!children) return null;
  const text = normalizeNumbering(children);

  if (!needsWebView(text)) {
    return <Text style={[{ color, fontSize }, style as TextStyle]}>{text}</Text>;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { WebView } = require('react-native-webview');
  const viewStyle = extractLayoutStyle(style);

  return (
    <View style={[nativeStyles.webViewWrapper, { height }, viewStyle]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: buildKatexHtml(text, fontSize, color, apiBase) }}
        scrollEnabled={false}
        style={nativeStyles.webView}
        onMessage={(event: any) => {
          const h = Number(event.nativeEvent.data);
          if (h > 0) setHeight(h + 8);
        }}
      />
    </View>
  );
}

const nativeStyles = StyleSheet.create({
  webViewWrapper: { width: '100%', overflow: 'hidden' },
  webView: { flex: 1, backgroundColor: 'transparent' },
});

// ─── Export unificado ─────────────────────────────────────────────────────────

export function MathText(props: MathTextProps) {
  return Platform.OS === 'web' ? <MathTextWeb {...props} /> : <MathTextNative {...props} />;
}
