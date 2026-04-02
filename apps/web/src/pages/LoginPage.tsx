import { ERROR_CODES } from '@dayparty/core';
import type { FormEvent, ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { isLikelyNetworkFailure } from '../utils/network-error';
import styles from './LoginPage.module.css';

function extractMagicToken(search: string): string | null {
  const params = new URLSearchParams(search);
  const direct = params.get('token');
  if (direct) {
    return direct;
  }
  const u = params.get('url');
  if (u) {
    try {
      const inner = new URL(u);
      const t = inner.searchParams.get('token');
      if (t) {
        return t;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function LoginPage(): ReactElement {
  const { t } = useTranslation();
  const { login, verifyFromToken, isAuthenticated, authReady, onUnauthorized } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [networkBanner, setNetworkBanner] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const clearTokenFromUrl = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('token');
    next.delete('url');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (authReady && isAuthenticated) {
      navigate('/rundown', { replace: true });
    }
  }, [authReady, isAuthenticated, navigate]);

  useEffect(() => {
    const token = extractMagicToken(window.location.search);
    if (!token) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const ok = await verifyFromToken(token);
      if (cancelled) {
        return;
      }
      clearTokenFromUrl();
      if (ok) {
        navigate('/rundown', { replace: true });
      } else {
        setError(t('auth.invalidMagicLink'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clearTokenFromUrl, navigate, verifyFromToken]);

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setStatus(null);
    setError(null);
    setNetworkBanner(null);
    const result = await login(email.trim());
    if (!result.ok) {
      if (result.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      if (isLikelyNetworkFailure(result.error)) {
        setNetworkBanner(result.error.message);
        return;
      }
      setError(result.error.message);
      return;
    }
    setStatus(result.data.message);
  }

  if (!authReady) {
    return (
      <div className={styles.boot} aria-busy="true" aria-live="polite">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('auth.title')}</h1>
        <p className={styles.sub}>{t('auth.subtitle')}</p>
      </header>

      {networkBanner ? (
        <div className={styles.banner} role="status">
          <p className={styles.bannerText}>{t('auth.cannotReachApi', { detail: networkBanner })}</p>
          <button type="button" className={styles.retry} onClick={() => setNetworkBanner(null)}>
            {t('common.dismiss')}
          </button>
        </div>
      ) : null}

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label}>
          {t('auth.email')}
          <input
            className={styles.input}
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            required
          />
        </label>
        <button className={styles.submit} type="submit">
          {t('auth.sendMagicLink')}
        </button>
      </form>

      {status ? <p className={styles.ok}>{status}</p> : null}
      {error ? <p className={styles.err}>{error}</p> : null}

      <p className={styles.hint}>{t('auth.devHint')}</p>
    </div>
  );
}
