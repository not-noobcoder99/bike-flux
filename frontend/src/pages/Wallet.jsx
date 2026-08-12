import { useEffect, useState } from 'react';
import client from '../api/client.js';
import {
  Wallet as WalletIcon, Plus, CreditCard, Crown, ArrowUpCircle, ArrowDownCircle,
  AlertCircle, XCircle, Receipt, Star
} from 'lucide-react';

export default function Wallet() {
  const [card, setCard] = useState(null);
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function refresh() {
    Promise.all([
      client.get('/wallet').then((res) => setCard(res.data)),
      client.get('/wallet/transactions').then((res) => setTransactions(res.data)),
      client.get('/wallet/plans').then((res) => setPlans(res.data)),
      client.get('/wallet/subscriptions').then((res) => setSubscriptions(res.data)),
    ]).finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleTopUp(e) {
    e.preventDefault();
    await client.post('/wallet/topup', { amount: Number(amount) });
    setAmount('');
    refresh();
  }

  async function handleSubscribe(plan_id) {
    setError('');
    try {
      await client.post('/wallet/subscriptions', { plan_id, months: 1 });
      refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to subscribe');
    }
  }

  async function handleCancel(subscription_id) {
    if (!window.confirm('Cancel this subscription?')) return;
    await client.patch(`/wallet/subscriptions/${subscription_id}/cancel`);
    refresh();
  }

  const subscriptionPlans = plans.filter((p) => p.is_subscription);
  const hasActiveSub = subscriptions.some((s) => s.status === 'active');

  if (loading) {
    return (
      <div className="spinner-page">
        <div className="spinner"></div>
        <span className="spinner-text">Loading wallet...</span>
      </div>
    );
  }

  function getTxnIcon(type) {
    if (['topup', 'refund'].includes(type)) return { icon: <ArrowUpCircle size={18} />, cls: 'credit' };
    return { icon: <ArrowDownCircle size={18} />, cls: 'debit' };
  }

  return (
    <div className="wallet-page fade-in">
      {/* Balance Card */}
      {card && (
        <div className="wallet-balance-card">
          <div className="wallet-balance-label">
            <CreditCard size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Available Balance
          </div>
          <div className="wallet-balance-amount">PKR {card.balance}</div>
        </div>
      )}

      {error && (
        <p className="error" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={16} /> {error}
        </p>
      )}

      {/* Top Up */}
      <form className="wallet-topup-form" onSubmit={handleTopUp}>
        <input
          type="number"
          placeholder="Enter amount to add"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          min="1"
        />
        <button type="submit">
          <Plus size={18} /> Top Up
        </button>
      </form>

      {/* Subscription Plans */}
      <div className="wallet-section">
        <h3><Crown size={20} /> Subscription Plans</h3>
        {hasActiveSub ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            You already have an active subscription — cancel it below before subscribing to a new one.
          </p>
        ) : subscriptionPlans.length === 0 ? (
          <div className="empty-state" style={{ padding: '1.5rem 0' }}>
            <Star size={32} />
            <p>No subscription plans available right now.</p>
          </div>
        ) : (
          <div className="plan-cards">
            {subscriptionPlans.map((p) => (
              <div key={p.plan_id} className="plan-card">
                <div className="plan-card-name">{p.name}</div>
                <div className="plan-card-price">
                  PKR {p.monthly_price} <span>/month</span>
                </div>
                <button type="button" onClick={() => handleSubscribe(p.plan_id)} style={{ marginTop: 'auto' }}>
                  <Crown size={16} /> Subscribe
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Subscriptions */}
      <div className="wallet-section">
        <h3><CreditCard size={20} /> My Subscriptions</h3>
        {subscriptions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>No subscriptions yet.</p>
        ) : (
          subscriptions.map((s) => (
            <div key={s.subscription_id} className="sub-card">
              <div className="sub-card-info">
                <div className="sub-card-name">{s.plan_name}</div>
                <div className="sub-card-dates">
                  {new Date(s.start_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })} — {new Date(s.end_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className={`badge badge-${s.status}`}>{s.status}</span>
                {s.status === 'active' && (
                  <button type="button" className="btn-danger btn-sm" onClick={() => handleCancel(s.subscription_id)}>
                    <XCircle size={14} /> Cancel
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Transactions */}
      <div className="wallet-section">
        <h3><Receipt size={20} /> Transactions</h3>
        {transactions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>No transactions yet.</p>
        ) : (
          <div>
            {transactions.map((t) => {
              const { icon, cls } = getTxnIcon(t.type);
              return (
                <div key={t.transaction_id} className="transaction-item">
                  <div className={`txn-icon ${cls}`}>{icon}</div>
                  <div className="txn-details">
                    <div className="txn-type">{t.type.replace('_', ' ')}</div>
                    <div className="txn-date">{new Date(t.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className={`txn-amount ${cls}`}>
                    {cls === 'credit' ? '+' : '−'} PKR {t.amount}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
