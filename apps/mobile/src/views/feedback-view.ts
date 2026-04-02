import type { EventData, Page } from '@nativescript/core';
import { Observable } from '@nativescript/core';

import { authState } from '../services/auth-state';
import { isLikelyNetworkFailure } from '../utils/network-error';

class FeedbackViewModel extends Observable {
  constructor() {
    super();
    this.set('messageText', '');
    this.set('categoryIndex', 0);
    this.set('categoryLabels', ['(ninguna)', 'bug', 'idea', 'other']);
    this.set('statusText', '');
    this.set('statusVisibility', 'collapse');
    this.set('saving', false);
    this.set('sendEnabled', true);
    this.set('sendButtonText', 'Enviar');
  }

  onBack(): void {
    authState.navigateToRundown();
  }

  async onSend(): Promise<void> {
    const body = String(this.get('messageText') ?? '').trim();
    if (!body) {
      this.set('statusText', 'Escribe un mensaje.');
      this.set('statusVisibility', 'visible');
      return;
    }
    const idx = Number(this.get('categoryIndex') ?? 0);
    const labels = this.get('categoryLabels') as string[];
    const label = labels[idx] ?? '';
    const category = idx > 0 && label !== '(ninguna)' ? (label as 'bug' | 'idea' | 'other') : undefined;

    this.set('statusVisibility', 'collapse');
    this.set('saving', true);
    this.set('sendEnabled', false);
    this.set('sendButtonText', 'Enviando…');
    const client = authState.getClient();
    const result = await client.submitFeedback({ message: body, category });
    this.set('saving', false);
    this.set('sendEnabled', true);
    this.set('sendButtonText', 'Enviar');
    if (authState.consumeUnauthorized(result)) {
      return;
    }
    if (result.ok === false) {
      const err = result.error;
      this.set('statusText', isLikelyNetworkFailure(err) ? err.message : err.message);
      this.set('statusVisibility', 'visible');
      return;
    }
    this.set('messageText', '');
    this.set('categoryIndex', 0);
    this.set('statusText', 'Gracias — enviado.');
    this.set('statusVisibility', 'visible');
  }
}

export function onNavigatingTo(args: EventData): void {
  const page = args.object as Page;
  page.bindingContext = new FeedbackViewModel();
}
