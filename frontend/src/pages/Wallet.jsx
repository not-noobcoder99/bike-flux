import { useEffect, useState } from 'react';
import client from '../api/client.js';

export default function Wallet() {
  const [card, setCard] = useState(null);
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState([]);

  function refresh() {
    client.get('/wallet').then((res) => setCard(res.data));
    client.get('/wallet/transactions').then((res) => setTransactions(res.data));
  }

  useEffect(refresh, []);

  async function handleTopUp(e) {
    e.preventDefault();
    await client.post('/wallet/topup', { amount: Number(amount) });
    setAmount('');
    refresh();
  }

  return (
    <div className="wallet-page">
      <h2>Wallet</h2>
      {card && <p>Balance: PKR {card.balance}</p>}
      <form onSubmit={handleTopUp}>
        <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <button type="submit">Top Up</button>
      </form>

      <h3>Transactions</h3>
      <ul>
        {transactions.map((t) => (
          <li key={t.transaction_id}>
            {t.type} — PKR {t.amount} — {t.status} — {new Date(t.created_at).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
