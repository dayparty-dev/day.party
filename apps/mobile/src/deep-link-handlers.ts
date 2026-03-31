import { Application, isAndroid, isIOS } from '@nativescript/core';

import { authState } from './services/auth-state';
import { parseTokenFromUrl } from './utils/parse-token-from-url';

function handlePossibleDeepLink(url: string | undefined | null): void {
  if (!url) {
    return;
  }
  const token = parseTokenFromUrl(url);
  if (!token) {
    return;
  }
  void authState.verifyMagicLinkToken(token).then((result) => {
    if (result.ok === true) {
      authState.navigateToRundown();
    }
  });
}

/**
 * Register platform handlers so `dayparty://auth/verify?token=...` (and HTTPS verify URLs) complete login.
 */
export function registerDeepLinkHandlers(): void {
  if (isAndroid) {
    Application.android.on(Application.android.activityNewIntentEvent, (args) => {
      const intent = args.intent;
      const data = intent?.getData?.();
      const url = data?.toString?.() ?? null;
      handlePossibleDeepLink(url);
    });

    Application.on(Application.launchEvent, () => {
      const activity = Application.android.foregroundActivity ?? Application.android.startActivity;
      const intent = activity?.getIntent?.();
      const data = intent?.getData?.();
      handlePossibleDeepLink(data?.toString?.() ?? null);
    });
  }

  if (isIOS) {
    Application.ios.addDelegateHandler('applicationOpenURLOptions', (application, url) => {
      handlePossibleDeepLink(url?.absoluteString ?? null);
      return true;
    });
  }
}
