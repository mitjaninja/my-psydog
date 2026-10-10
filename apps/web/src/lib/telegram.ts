import {
  init,
  isTMA,
  miniApp,
  retrieveRawInitData,
  themeParams,
  viewport,
} from '@telegram-apps/sdk-react';

let rawInitData: string | undefined;

/**
 * Инициализирует SDK внутри Telegram: тема → CSS-переменные --tg-theme-*,
 * ready() и раскрытие на весь экран. В обычном браузере ничего не делает.
 */
export function initTelegram(): boolean {
  if (!isTMA()) return false;

  init();
  themeParams.mountSync.ifAvailable();
  themeParams.bindCssVars.ifAvailable();
  // dark:-варианты shadcn-компонентов — по теме Telegram
  if (themeParams.isDark()) document.documentElement.classList.add('dark');
  miniApp.mountSync.ifAvailable();
  miniApp.bindCssVars.ifAvailable();
  miniApp.ready.ifAvailable();

  const [mounted, mounting] = viewport.mount.ifAvailable();
  if (mounted) {
    void mounting.then(() => viewport.expand.ifAvailable()).catch(() => undefined);
  }

  rawInitData = retrieveRawInitData();
  return true;
}

/**
 * Заголовки авторизации для API. В Telegram — `tma <initData>`.
 * В dev-браузере — X-Dev-Tg-Id из `?devTgId=` (запоминается в localStorage).
 */
export function authHeaders(): Record<string, string> {
  if (rawInitData) return { Authorization: `tma ${rawInitData}` };
  if (import.meta.env.DEV) {
    const fromQuery = new URLSearchParams(location.search).get('devTgId');
    if (fromQuery) localStorage.setItem('devTgId', fromQuery);
    return { 'X-Dev-Tg-Id': fromQuery ?? localStorage.getItem('devTgId') ?? '1' };
  }
  return {};
}
