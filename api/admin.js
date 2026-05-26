// api/admin.js — Admin panel ke liye:
// GET    /api/admin?action=donations   → pending donations padhna
// POST   /api/admin?action=approve     → donation approve karna
// DELETE /api/admin?action=reject      → donation reject karna
// POST   /api/admin?action=addEvent    → event add karna
// DELETE /api/admin?action=deleteEvent → event delete karna

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
  });
}

const db = admin.firestore();

function isAuthorized(req) {
  const token = req.headers['x-admin-token'];
  return token === process.env.ADMIN_PASSWORD;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized — wrong admin token' });
  }

  const action = req.query.action;

  try {

    // ── GET: Pending donations padhna — orderBy HATA DIYA, manually sort ──
    if (req.method === 'GET' && action === 'donations') {
      const snap = await db.collection('donations')
        .where('status', '==', 'Pending')
        .get();

      const donations = [];
      snap.forEach(doc => donations.push({ id: doc.id, ...doc.data() }));

      // Manually sort by createdAt — no Firestore index needed
      donations.sort((a, b) => {
        const aTime = a.createdAt?._seconds || a.createdAt?.seconds || 0;
        const bTime = b.createdAt?._seconds || b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      return res.status(200).json({ success: true, donations });
    }

    // ── POST: Donation approve karna ──
    if (req.method === 'POST' && action === 'approve') {
      const { donationId } = req.body;
      if (!donationId) return res.status(400).json({ error: 'donationId required' });

      await db.collection('donations').doc(donationId).update({
        status:     'Approved',
        approvedAt: new Date().toISOString(),
      });
      return res.status(200).json({ success: true });
    }

    // ── DELETE: Donation reject karna ──
    if (req.method === 'DELETE' && action === 'reject') {
      const { donationId } = req.body;
      if (!donationId) return res.status(400).json({ error: 'donationId required' });

      await db.collection('donations').doc(donationId).delete();
      return res.status(200).json({ success: true });
    }

    // ── POST: Event add karna ──
    if (req.method === 'POST' && action === 'addEvent') {
      const { date, title, en, hi } = req.body;
      if (!date || !title || !en) return res.status(400).json({ error: 'date, title, en required' });

      const docRef = await db.collection('events').add({
        date, title, en,
        hi:        hi || en,
        timestamp: new Date().toISOString(),
      });
      return res.status(200).json({ success: true, id: docRef.id });
    }

    // ── DELETE: Event delete karna ──
    if (req.method === 'DELETE' && action === 'deleteEvent') {
      const { eventId } = req.body;
      if (!eventId) return res.status(400).json({ error: 'eventId required' });

      await db.collection('events').doc(eventId).delete();
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Unknown action: ' + action });

  } catch (err) {
    console.error('❌ Admin API error:', err);
    return res.status(500).json({ error: err.message });
  }
};
