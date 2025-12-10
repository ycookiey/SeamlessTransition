/**
 * Seamless Transition - Background Service Worker
 * 拡張機能のライフサイクル管理と設定の初期化
 */

// 初回インストール時のデフォルト設定
const DEFAULT_SETTINGS = {
  enabled: true,
  fadeOutDuration: 300,
  timeoutMs: 3000
};

/**
 * 拡張機能インストール/更新時の処理
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('[SeamlessTransition] Extension installed');
    
    // デフォルト設定を保存
    await chrome.storage.local.set({
      settings: DEFAULT_SETTINGS
    });
  } else if (details.reason === 'update') {
    console.log('[SeamlessTransition] Extension updated to version', chrome.runtime.getManifest().version);
  }
});

/**
 * タブが閉じられた時に、そのタブの色情報をクリーンアップ
 * （ストレージの肥大化を防ぐ）
 */
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  try {
    // st_tab_ で始まるキーでtabIdを含むものを削除
    // ただし、Content Script側でsessionStorageを使っているため、
    // ここでは追加のクリーンアップは不要
    // 将来的にtabIdベースの管理に変更する場合に使用
  } catch (e) {
    console.warn('[SeamlessTransition] Cleanup error:', e);
  }
});

/**
 * メッセージハンドラー（将来の機能拡張用）
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getSettings') {
    chrome.storage.local.get('settings').then(result => {
      sendResponse(result.settings || DEFAULT_SETTINGS);
    });
    return true; // 非同期レスポンスを示す
  }
  
  if (message.type === 'updateSettings') {
    chrome.storage.local.set({ settings: message.settings }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});
