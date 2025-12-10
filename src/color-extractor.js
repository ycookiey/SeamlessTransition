/**
 * 色抽出ユーティリティ
 * ページの主要な背景色を検出する
 */

/**
 * RGB文字列をパースして配列に変換
 * @param {string} rgbString - 'rgb(r, g, b)' または 'rgba(r, g, b, a)' 形式
 * @returns {number[]|null} [r, g, b] または null
 */
function parseRgb(rgbString) {
  if (!rgbString || rgbString === 'transparent') return null;
  const match = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
}

/**
 * RGB配列をHEX文字列に変換
 * @param {number[]} rgb - [r, g, b]
 * @returns {string} '#RRGGBB' 形式
 */
function rgbToHex(rgb) {
  return '#' + rgb.map(c => c.toString(16).padStart(2, '0')).join('');
}

/**
 * 色が透明かどうかを判定
 * @param {string} colorString - CSS色文字列
 * @returns {boolean}
 */
function isTransparent(colorString) {
  if (!colorString || colorString === 'transparent') return true;
  if (colorString.includes('rgba')) {
    const alphaMatch = colorString.match(/rgba\([^)]+,\s*([0-9.]+)\)/);
    if (alphaMatch && parseFloat(alphaMatch[1]) === 0) return true;
  }
  return false;
}

/**
 * ページの主要な背景色を抽出する
 * 優先順位:
 * 1. meta theme-color
 * 2. body の背景色
 * 3. html の背景色
 * 4. OS/ブラウザテーマに基づくデフォルト色
 * @returns {string} HEX形式の色 (#RRGGBB)
 */
function extractPageColor() {
  // 1. meta theme-color を確認
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    const themeColor = themeColorMeta.getAttribute('content');
    if (themeColor && themeColor.startsWith('#')) {
      return themeColor;
    }
    // CSS色名やrgb形式の場合は変換を試みる
    const tempEl = document.createElement('div');
    tempEl.style.color = themeColor;
    document.body.appendChild(tempEl);
    const computed = getComputedStyle(tempEl).color;
    document.body.removeChild(tempEl);
    const rgb = parseRgb(computed);
    if (rgb) return rgbToHex(rgb);
  }

  // 2. body の背景色を確認
  if (document.body) {
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    if (!isTransparent(bodyBg)) {
      const rgb = parseRgb(bodyBg);
      if (rgb) return rgbToHex(rgb);
    }
  }

  // 3. html の背景色を確認
  const htmlBg = getComputedStyle(document.documentElement).backgroundColor;
  if (!isTransparent(htmlBg)) {
    const rgb = parseRgb(htmlBg);
    if (rgb) return rgbToHex(rgb);
  }

  // 4. デフォルト色（OSテーマに基づく）
  return getDefaultColor();
}

/**
 * OS/ブラウザのテーマ設定に基づくデフォルト色を取得
 * @returns {string} HEX形式の色
 */
function getDefaultColor() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? '#1a1a1a' : '#f5f5f5';
}

// エクスポート（Content Script内で使用）
if (typeof window !== 'undefined') {
  window.SeamlessTransition = window.SeamlessTransition || {};
  window.SeamlessTransition.extractPageColor = extractPageColor;
  window.SeamlessTransition.getDefaultColor = getDefaultColor;
}
