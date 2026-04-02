/*
 * NativeScript entry: root Frame + initial route from persisted session.
 * Authenticated routes (moduleName): views/rundown-view, views/ongoing-view,
 * views/task-detail-view, views/rewards-view
 */
import { Application, Frame } from '@nativescript/core';

import { registerDeepLinkHandlers } from './deep-link-handlers';
import { authState } from './services/auth-state';

import './app.css';

registerDeepLinkHandlers();

Application.run({
  create: () => {
    authState.hydrateFromStorage();
    const frame = new Frame();
    const start = authState.isAuthenticated() ? 'views/rundown-view' : 'views/login-view';
    frame.navigate({
      moduleName: start,
      clearHistory: true,
    });
    return frame;
  },
});
