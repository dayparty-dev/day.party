import { ERROR_CODES } from '@dayparty/core';
import type { FormEvent, ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';
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
  const { login, verifyFromToken, isAuthenticated, onUnauthorized } = useAuth();
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
    if (isAuthenticated) {
      navigate('/rundown', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
        setError('This sign-in link is invalid or has expired.');
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

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <h1 className={styles.title}>day.party</h1>
        <p className={styles.sub}>Sign in with a magic link sent to your email.</p>
      </header>

      {networkBanner ? (
        <div className={styles.banner} role="status">
          <p className={styles.bannerText}>Cannot reach the API ({networkBanner}).</p>
          <button type="button" className={styles.retry} onClick={() => setNetworkBanner(null)}>
            Dismiss
          </button>
        </div>
      ) : null}

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label}>
          Email
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
          Send magic link
        </button>
      </form>

      {status ? <p className={styles.ok}>{status}</p> : null}
      {error ? <p className={styles.err}>{error}</p> : null}

      <p className={styles.hint}>
        Local dev note: no real email is sent. Use the magic link printed in the API logs; opening it here should sign
        you in and redirect to your rundown.
      </p>
    </div>
  );
}
