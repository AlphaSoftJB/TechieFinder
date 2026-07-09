import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { apiErrorMessage } from '../lib/api';

type Outcome = 'checking' | 'success' | 'failed' | 'error';

export default function PaymentCallback() {
  const [outcome, setOutcome] = useState<Outcome>('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const reference = sessionStorage.getItem('techiefinder.pendingPaymentReference');
    sessionStorage.removeItem('techiefinder.pendingPaymentReference');

    if (!reference) {
      setOutcome('error');
      setMessage('No pending payment was found for this session.');
      return;
    }

    api
      .get(`/payments/verify/${reference}`)
      .then((res) => {
        setOutcome(res.data.status === 'SUCCESS' ? 'success' : 'failed');
      })
      .catch((err) => {
        setOutcome('error');
        setMessage(apiErrorMessage(err, 'Could not confirm this payment.'));
      });
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      {outcome === 'checking' && <p className="text-neutral-500">Confirming your payment...</p>}
      {outcome === 'success' && (
        <>
          <h1 className="text-2xl font-bold text-emerald-700">Payment successful</h1>
          <p className="mt-2 text-neutral-600">Your booking has been marked as paid.</p>
        </>
      )}
      {outcome === 'failed' && (
        <>
          <h1 className="text-2xl font-bold text-red-600">Payment not completed</h1>
          <p className="mt-2 text-neutral-600">You can try again from your dashboard.</p>
        </>
      )}
      {outcome === 'error' && (
        <>
          <h1 className="text-2xl font-bold text-red-600">Could not confirm payment</h1>
          <p className="mt-2 text-neutral-600">{message}</p>
        </>
      )}
      <Link to="/dashboard" className="mt-6 inline-block rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
        Back to Dashboard
      </Link>
    </div>
  );
}
