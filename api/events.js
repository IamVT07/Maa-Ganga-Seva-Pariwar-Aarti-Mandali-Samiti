// api/events.js — Calendar events Firestore se padhna
// Browser seedha Firebase se baat nahi karta — sirf yeh server karta hai

const admin = require('firebase-admin');

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const snapshot = await db.collection('events').orderBy('date').get();
    const events = {};

    snapshot.forEach(doc => {
      const ev = doc.data();
      if (!ev.date) return;
      if (!events[ev.date]) events[ev.date] = [];
      events[ev.date].push({
        id:    doc.id,
        title: ev.title,
        en:    ev.en,
        hi:    ev.hi,
      });
    });

    return res.status(200).json({ success: true, events });

  } catch (err) {
    console.error('❌ Events API error:', err);
    return res.status(500).json({ error: err.message });
  }
};