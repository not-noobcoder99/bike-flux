import { useEffect, useState } from 'react';
import client from '../api/client.js';

export default function Wallet() {
  const [card, setCard] = useState(null);
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [error, setError] = useState('');

  function refresh() {
    client.get('/wallet').then((res) => setCard(res.data));
    client.get('/wallet/transactions').then((res) => setTransactions(res.data));
    client.get('/wallet/plans').then((res) => setPlans(res.data));
    client.get('/wallet/subscriptions').then((res) => setSubscriptions(res.data));
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

  return (
    <div className="wallet-page">
      <h2>Wallet</h2>
      {card && <p>Balance: PKR {card.balance}</p>}
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleTopUp}>
        <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <button type="submit">Top Up</button>
      </form>

      <h3>Subscription Plans</h3>
      {hasActiveSub ? (
        <p>You already have an active subscription — cancel it below before subscribing to a new one.</p>
      ) : (
        <ul>
          {subscriptionPlans.map((p) => (
            <li key={p.plan_id}>
              {p.name} — PKR {p.monthly_price}/month
              {' '}
              <button type="button" onClick={() => handleSubscribe(p.plan_id)}>Subscribe</button>
            </li>
          ))}
          {subscriptionPlans.length === 0 && <li>No subscription plans available right now.</li>}
        </ul>
      )}

      <h3>My Subscriptions</h3>
      <ul>
        {subscriptions.map((s) => (
          <li key={s.subscription_id}>
            {s.plan_name} — {s.start_date} to {s.end_date} — {s.status}
            {s.status === 'active' && (
              <>
                {' '}
                <button type="button" className="btn-danger" onClick={() => handleCancel(s.subscription_id)}>Cancel</button>
              </>
            )}
          </li>
        ))}
        {subscriptions.length === 0 && <li>No subscriptions yet.</li>}
      </ul>

      <h3>Transactions</h3>
      <ul>
        {transactions.map((t) => (
          <li key={t.transaction_id}>
            {t.type} — PKR {t.amount} — {t.status} — {new Date(t.created_at).toLocaleString()}
          </li>
        ))}
        {transactions.length === 0 && <li>No transactions yet.</li>}
      </ul>
    </div>
  );
}
