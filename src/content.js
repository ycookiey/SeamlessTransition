/**
 * Seamless Transition - Content Script
 * ページ遷移時のちらつきを防止するオーバーレイを管理
 * 
 * 【重要】このスクリプトはdocument_startで実行され、
 * ストレージの非同期読み取りを待たずに即座にオーバーレイを生成します。
 */

// === 即時実行部分（同期的） ===
// ストレージ読み取りを待たずに、まずデフォルト色でオーバーレイを生成
(function immediateOverlay() {
  'use strict';

  const OVERLAY_ID = 'seamless-transition-overlay';

  // OS/ブラウザのテーマに基づくデフォルト色（同期的に取得可能）
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const defaultColor = prefersDark ? '#1a1a1a' : '#f5f5f5';

  // 即座にhtml要素の背景色を設定（CSSより確実）
  document.documentElement.style.setProperty('background-color', defaultColor, 'important');

  // オーバーレイを即座に生成
  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 2147483647 !important;
    background-color: ${defaultColor} !important;
    opacity: 1 !important;
    transition: opacity 0.3s ease-out !important;
    pointer-events: none !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
  `;

  // DOMの最上位に挿入
  document.documentElement.appendChild(overlay);

  // グローバルに参照を保存
  window.__seamlessOverlay = overlay;
  window.__seamlessDefaultColor = defaultColor;
})();

// === 非同期処理部分 ===
(async function asyncHandler() {
  'use strict';

  const STORAGE_KEY_PREFIX = 'st_tab_';
  const FADE_DURATION = 300;
  const TIMEOUT_DURATION = 3000;

  const overlay = window.__seamlessOverlay;
  const defaultColor = window.__seamlessDefaultColor;

  if (!overlay) return;

  // タブ固有のキーを生成/取得
  let tabColorKey = sessionStorage.getItem('seamlessTransitionTabKey');
  if (!tabColorKey) {
    tabColorKey = STORAGE_KEY_PREFIX + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('seamlessTransitionTabKey', tabColorKey);
  }

  /**
   * ストレージから前回の色を取得し、オーバーレイの色を更新
   */
  async function updateOverlayColor() {
    try {
      const result = await chrome.storage.local.get(tabColorKey);
      const savedColor = result[tabColorKey];
      if (savedColor && savedColor !== defaultColor) {
        overlay.style.backgroundColor = savedColor + ' !important';
        document.documentElement.style.setProperty('background-color', savedColor, 'important');
      }
    } catch (e) {
      // ストレージエラーは無視（デフォルト色のまま）
    }
  }

  /**
   * 色をストレージに保存
   */
  async function saveColor(color) {
    try {
      await chrome.storage.local.set({ [tabColorKey]: color });
    } catch (e) {
      // 保存エラーは無視
    }
  }

  /**
   * RGB文字列をHEXに変換
   */
  function parseRgbToHex(rgbString) {
    if (!rgbString || rgbString === 'transparent') return null;
    const match = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return null;
    const [, r, g, b] = match;
    return '#' + [r, g, b].map(c => parseInt(c).toString(16).padStart(2, '0')).join('');
  }

  /**
   * 色が透明かどうか
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
   * ページの背景色を抽出
   */
  function extractPageColor() {
    // 1. meta theme-color
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      const content = themeColorMeta.getAttribute('content');
      if (content?.startsWith('#')) return content;
    }

    // 2. body の背景色
    if (document.body) {
      const bodyBg = getComputedStyle(document.body).backgroundColor;
      if (!isTransparent(bodyBg)) {
        const hex = parseRgbToHex(bodyBg);
        if (hex) return hex;
      }
    }

    // 3. html の背景色
    const htmlBg = getComputedStyle(document.documentElement).backgroundColor;
    if (!isTransparent(htmlBg)) {
      const hex = parseRgbToHex(htmlBg);
      if (hex) return hex;
    }

    return defaultColor;
  }

  /**
   * オーバーレイをフェードアウトして削除
   */
  function fadeOutOverlay() {
    if (!overlay || overlay.dataset.removed) return;
    overlay.dataset.removed = 'true';

    overlay.style.opacity = '0';
    
    setTimeout(() => {
      overlay.remove();
      // html要素の背景色もリセット
      document.documentElement.style.removeProperty('background-color');
    }, FADE_DURATION);

    // 現在のページの色を保存
    setTimeout(() => {
      const currentColor = extractPageColor();
      saveColor(currentColor);
    }, 100);
  }

  // ストレージから色を読み込んでオーバーレイを更新（非同期）
  await updateOverlayColor();

  // タイムアウト（フェイルセーフ）
  const timeoutId = setTimeout(fadeOutOverlay, TIMEOUT_DURATION);

  // 読み込み完了イベント
  if (document.readyState === 'complete') {
    clearTimeout(timeoutId);
    fadeOutOverlay();
  } else {
    window.addEventListener('load', () => {
      clearTimeout(timeoutId);
      fadeOutOverlay();
    }, { once: true });
  }

})();
