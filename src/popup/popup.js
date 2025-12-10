/**
 * Seamless Transition - Popup Script
 * 設定UIのインタラクション管理
 */

document.addEventListener('DOMContentLoaded', async () => {
  // UI要素の取得
  const enableToggle = document.getElementById('enableToggle');
  const fadeSlider = document.getElementById('fadeSlider');
  const fadeValue = document.getElementById('fadeValue');
  const timeoutSlider = document.getElementById('timeoutSlider');
  const timeoutValue = document.getElementById('timeoutValue');
  const settingsSection = document.querySelector('.settings-section');

  /**
   * 設定を読み込んでUIに反映
   */
  async function loadSettings() {
    try {
      const result = await chrome.storage.local.get('settings');
      const settings = result.settings || {
        enabled: true,
        fadeOutDuration: 300,
        timeoutMs: 3000
      };

      enableToggle.checked = settings.enabled;
      fadeSlider.value = settings.fadeOutDuration;
      timeoutSlider.value = settings.timeoutMs;

      updateFadeValue();
      updateTimeoutValue();
      updateSettingsState();
    } catch (e) {
      console.error('[SeamlessTransition] Failed to load settings:', e);
    }
  }

  /**
   * 設定を保存
   */
  async function saveSettings() {
    try {
      const settings = {
        enabled: enableToggle.checked,
        fadeOutDuration: parseInt(fadeSlider.value),
        timeoutMs: parseInt(timeoutSlider.value)
      };
      await chrome.storage.local.set({ settings });
    } catch (e) {
      console.error('[SeamlessTransition] Failed to save settings:', e);
    }
  }

  /**
   * フェード時間の表示を更新
   */
  function updateFadeValue() {
    const ms = parseInt(fadeSlider.value);
    fadeValue.textContent = `${(ms / 1000).toFixed(1)}秒`;
  }

  /**
   * タイムアウトの表示を更新
   */
  function updateTimeoutValue() {
    const ms = parseInt(timeoutSlider.value);
    timeoutValue.textContent = `${(ms / 1000).toFixed(1)}秒`;
  }

  /**
   * 設定セクションの有効/無効状態を更新
   */
  function updateSettingsState() {
    const rows = settingsSection.querySelectorAll('.setting-row');
    rows.forEach(row => {
      if (enableToggle.checked) {
        row.classList.remove('disabled');
      } else {
        row.classList.add('disabled');
      }
    });
  }

  // イベントリスナーの設定
  enableToggle.addEventListener('change', () => {
    updateSettingsState();
    saveSettings();
  });

  fadeSlider.addEventListener('input', () => {
    updateFadeValue();
  });

  fadeSlider.addEventListener('change', () => {
    saveSettings();
  });

  timeoutSlider.addEventListener('input', () => {
    updateTimeoutValue();
  });

  timeoutSlider.addEventListener('change', () => {
    saveSettings();
  });

  // 初期化
  await loadSettings();
});
