import type { ApiLedgerEntry, ApiRewardDefinition } from '@dayparty/api-client';
import { ERROR_CODES } from '@dayparty/core';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { isLikelyNetworkFailure } from '../utils/network-error';
import styles from './RewardsPage.module.css';

function formatLedgerLine(e: ApiLedgerEntry): string {
  const d = new Date(e.createdAt);
  const when = Number.isNaN(d.getTime()) ? e.createdAt : d.toLocaleString();
  return `${when} · ${e.reason.replace(/_/g, ' ')}`;
}

export function RewardsPage(): ReactElement {
  const { client, onUnauthorized } = useAuth();
  const [rewards, setRewards] = useState<ApiRewardDefinition[] | null>(null);
  const [entries, setEntries] = useState<ApiLedgerEntry[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [networkBanner, setNetworkBanner] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'instant' | 'banked' | 'scheduled'>('instant');
  const [newCost, setNewCost] = useState(10);
  const [purchaseBusyId, setPurchaseBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    setNetworkBanner(null);
    const [rRes, lRes] = await Promise.all([client.getRewards(), client.getLedger({ limit: 30 })]);
    if (!rRes.ok) {
      if (rRes.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      if (isLikelyNetworkFailure(rRes.error)) {
        setNetworkBanner(rRes.error.message);
        return;
      }
      setLoadError(rRes.error.message);
      return;
    }
    if (!lRes.ok) {
      if (lRes.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      if (isLikelyNetworkFailure(lRes.error)) {
        setNetworkBanner(lRes.error.message);
        return;
      }
      setLoadError(lRes.error.message);
      return;
    }
    setRewards(rRes.data);
    setEntries(lRes.data.entries);
    setBalance(lRes.data.balance);
  }, [client, onUnauthorized]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreateReward(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const result = await client.createRewardDefinition({
      name,
      type: newType,
      costCurrency: Math.max(0, Math.floor(newCost)),
    });
    if (!result.ok) {
      if (result.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      if (isLikelyNetworkFailure(result.error)) {
        setNetworkBanner(result.error.message);
        return;
      }
      setLoadError(result.error.message);
      return;
    }
    setNewName('');
    await load();
  }

  async function onPurchase(id: string): Promise<void> {
    setPurchaseBusyId(id);
    const result = await client.purchaseReward(id);
    setPurchaseBusyId(null);
    if (!result.ok) {
      if (result.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      if (isLikelyNetworkFailure(result.error)) {
        setNetworkBanner(result.error.message);
        return;
      }
      setLoadError(result.error.message);
      return;
    }
    setBalance(result.data.balance);
    await load();
  }

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Link className={styles.back} to="/rundown">
          ← Rundown
        </Link>
        <span className={styles.balance} aria-live="polite">
          Balance: {balance}
        </span>
      </header>

      {networkBanner ? (
        <div className={styles.banner} role="status">
          <p className={styles.bannerText}>Network error: {networkBanner}</p>
          <button type="button" className={styles.retry} onClick={() => void load()}>
            Retry
          </button>
        </div>
      ) : null}

      {loadError ? <p className={styles.err}>{loadError}</p> : null}

      <section className={styles.section} aria-labelledby="catalog-heading">
        <h2 id="catalog-heading" className={styles.sectionTitle}>
          Catalog
        </h2>
        {rewards && rewards.length === 0 ? <p className={styles.meta}>No rewards yet — add one below.</p> : null}
        {rewards?.map((r) => (
          <div key={r.id} className={styles.card}>
            <div className={styles.cardMain}>
              <p className={styles.rewardName}>{r.name}</p>
              <p className={styles.meta}>
                {r.type} · costs {r.costCurrency}
              </p>
            </div>
            <button
              type="button"
              className={styles.buyBtn}
              disabled={balance < r.costCurrency || purchaseBusyId === r.id}
              onClick={() => void onPurchase(r.id)}
            >
              {purchaseBusyId === r.id ? '…' : 'Buy'}
            </button>
          </div>
        ))}
      </section>

      <section className={styles.section} aria-labelledby="add-heading">
        <h2 id="add-heading" className={styles.sectionTitle}>
          Add reward
        </h2>
        <form className={styles.form} onSubmit={(e) => void onCreateReward(e)}>
          <label>
            Name
            <input value={newName} onChange={(ev) => setNewName(ev.target.value)} maxLength={200} required />
          </label>
          <label>
            Type
            <select value={newType} onChange={(ev) => setNewType(ev.target.value as typeof newType)}>
              <option value="instant">instant</option>
              <option value="banked">banked</option>
              <option value="scheduled">scheduled</option>
            </select>
          </label>
          <label>
            Cost (currency)
            <input type="number" min={0} value={newCost} onChange={(ev) => setNewCost(Number(ev.target.value))} />
          </label>
          <button type="submit" className={styles.submit}>
            Save to catalog
          </button>
        </form>
      </section>

      <section className={styles.section} aria-labelledby="ledger-heading">
        <h2 id="ledger-heading" className={styles.sectionTitle}>
          Recent ledger
        </h2>
        <ul className={styles.ledgerList}>
          {entries.map((e) => (
            <li key={e.id} className={styles.ledgerRow}>
              <span>{formatLedgerLine(e)}</span>
              <span className={e.amount >= 0 ? styles.amountCredit : styles.amountDebit}>
                {e.amount >= 0 ? '+' : ''}
                {e.amount}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
