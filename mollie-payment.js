// api/mollie-payment.js — Vercel Serverless Function
// Place ce fichier dans /api/mollie-payment.js de ton projet Vercel

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const MOLLIE_API_KEY = process.env.MOLLIE_API_KEY; // live_tjPJt5hrkby9tARBynkCpFVQhDaaDT

  try {
    const { amount, description, redirectUrl, cancelUrl } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }

    const mollieRes = await fetch('https://api.mollie.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MOLLIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: {
          currency: 'EUR',
          value: parseFloat(amount).toFixed(2),
        },
        description: description || 'InRoom · Service en chambre',
        redirectUrl: redirectUrl,
        cancelUrl: cancelUrl || redirectUrl,
        metadata: {
          source: 'inroom-app',
          description,
        },
        locale: 'fr_FR',
        method: ['creditcard', 'ideal', 'applepay', 'paypal'],
      }),
    });

    if (!mollieRes.ok) {
      const err = await mollieRes.json();
      console.error('Mollie API error:', err);
      return res.status(500).json({ error: 'Erreur Mollie', detail: err });
    }

    const payment = await mollieRes.json();

    return res.status(200).json({
      paymentId: payment.id,
      checkoutUrl: payment._links.checkout.href,
      status: payment.status,
    });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
