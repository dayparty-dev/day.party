/*
 * NativeScript entry: root Frame + initial route from persisted session.
 * Authenticated routes (moduleName): views/rundown-view, views/ongoing-view,
 * views/task-detail-view, views/rewards-view, views/history-view,
 * views/tag-settings-view, views/feedback-view
 * US5 (T046): Frame navigated → apply cached `visualPreset` class; authed cold start + post-login refresh prefs from API.
 */
import { Application, Frame } from '@nativescript/core';

import { registerDeepLinkHandlers } from './deep-link-handlers';
import { authState } from './services/auth-state';
import { applyAppearanceToPage, refreshVisualPresetFromApi } from './services/visual-preset';

import './app.css';

registerDeepLinkHandlers();

Application.run({
  create: () => {
    authState.hydrateFromStorage();
    const frame = new Frame();
    frame.on(Frame.navigatedToEvent, () => {
      const page = frame.currentPage;
      if (page) {
        applyAppearanceToPage(page);
      }
    });
    Application.on(Application.systemAppearanceChangedEvent, () => {
      const page = frame.currentPage;
      if (page) {
        applyAppearanceToPage(page);
      }
    });
    const start = authState.isAuthenticated() ? 'views/rundown-view' : 'views/login-view';
    frame.navigate({
      moduleName: start,
      clearHistory: true,
    });
    if (authState.isAuthenticated()) {
      void refreshVisualPresetFromApi(authState.getClient(), () => {
        authState.clearSessionAndGoToLogin();
      });
    }
    return frame;
  },
});
