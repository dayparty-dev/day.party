import type { EventData, Page } from '@nativescript/core';
import { Frame, Observable } from '@nativescript/core';

import { parseTokenFromUrl } from '../utils/parse-token-from-url';
import { authState } from '../services/auth-state';
import { refreshVisualPresetFromApi } from '../services/visual-preset';
import { isLikelyNetworkFailure } from '../utils/network-error';

class LoginViewModel extends Observable {
  email = '';
  tokenOrUrl = '';
  statusMessage = '';
  statusVisibility = 'collapse';
  errorMessage = '';
  errorBannerVisibility = 'collapse';
  retryVisibility = 'collapse';
  private lastFailedAction: 'send' | 'verify' | null = null;

  constructor() {
    super();
  }

  clearError(): void {
    this.set('errorMessage', '');
    this.set('errorBannerVisibility', 'collapse');
    this.set('retryVisibility', 'collapse');
    this.lastFailedAction = null;
  }

  showError(message: string, retry: 'send' | 'verify' | null): void {
    this.set('errorMessage', message);
    this.set('errorBannerVisibility', 'visible');
    this.set('retryVisibility', retry ? 'visible' : 'collapse');
    this.lastFailedAction = retry;
  }

  onSendLink(): void {
    void this.sendLinkAsync();
  }

  async sendLinkAsync(): Promise<void> {
    this.clearError();
    this.set('statusVisibility', 'visible');
    this.set('statusMessage', 'Enviando…');
    const result = await authState.login(this.email.trim());
    if (result.ok === false) {
      this.set('statusMessage', '');
      this.set('statusVisibility', 'collapse');
      const net = isLikelyNetworkFailure(result.error);
      this.showError(
        net ? 'No se pudo contactar al servidor. Comprueba la red o que la API esté en marcha.' : result.error.message,
        net ? 'send' : null,
      );
      return;
    }
    this.set('statusMessage', 'Si el servidor está en marcha, revisa la consola de la API para el enlace mágico.');
  }

  onVerify(): void {
    void this.verifyAsync();
  }

  async verifyAsync(): Promise<void> {
    this.clearError();
    const raw = this.tokenOrUrl.trim();
    const token = parseTokenFromUrl(raw) ?? raw;
    if (!token) {
      this.showError('Introduce un token o una URL con ?token=', null);
      return;
    }
    this.set('statusVisibility', 'visible');
    this.set('statusMessage', 'Verificando…');
    const result = await authState.verifyMagicLinkToken(token);
    this.set('statusMessage', '');
    this.set('statusVisibility', 'collapse');
    if (result.ok === false) {
      const net = isLikelyNetworkFailure(result.error);
      this.showError(
        net ? 'No se pudo contactar al servidor. Comprueba la red o que la API esté en marcha.' : result.error.message,
        net ? 'verify' : null,
      );
      return;
    }
    await refreshVisualPresetFromApi(authState.getClient(), () => {
      authState.clearSessionAndGoToLogin();
    });
    Frame.topmost()?.navigate({
      moduleName: 'views/rundown-view',
      clearHistory: true,
      animated: true,
    });
  }

  onRetry(): void {
    if (this.lastFailedAction === 'send') {
      void this.sendLinkAsync();
    } else if (this.lastFailedAction === 'verify') {
      void this.verifyAsync();
    }
  }
}

export function onNavigatingTo(args: EventData): void {
  const page = args.object as Page;
  page.bindingContext = new LoginViewModel();
}
