// api/donate.js — Donation save karo Firestore mein
// Browser seedha Firebase se baat nahi karta — sirf yeh server karta hai

const admin = require('firebase-admin');

// Firebase Admin SDK — sirf ek baar initialize hota hai
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:    process.env.FIREBASE_PROJECT_ID,
      clientEmail:  process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:   process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
  });
}

const db = admin.firestore();

module.exports = async (req, res) => {
  // CORS — aapki site se request allow karo
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, phone, email, amount, method, txn, msg, receiptNo, dateStr, timeStr } = req.body;

    // Basic validation
    if (!name || !phone || !email || !amount) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    await db.collection('donations').add({
      receiptNo,
      donorName:     name,
      donorEmail:    email,
      phone,
      amount:        Number(amount),
      method,
      transactionId: txn    || '',
      message:       msg    || '',
      dateStr,
      timeStr,
      createdAt:     admin.firestore.FieldValue.serverTimestamp(),
      status:        'Pending',
    });

    console.log('✅ Donation saved:', receiptNo);
    return res.status(200).json({ success: true, receiptNo });

  } catch (err) {
    console.error('❌ Donate API error:', err);
    return res.status(500).json({ error: err.message });
  }
};