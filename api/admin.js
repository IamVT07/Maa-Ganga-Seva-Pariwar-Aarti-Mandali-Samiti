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
    // ── GET: Pending donations padhna ──
    if (req.method === 'GET' && action === 'donations') {
      const snap = await db.collection('donations')
        .where('status', '==', 'Pending')
        .get();

      const donations = [];
      snap.forEach(doc => donations.push({ id: doc.id, ...doc.data() }));

      donations.sort((a, b) => {
        const aTime = a.createdAt?._seconds || a.createdAt?.seconds || 0;
        const bTime = b.createdAt?._seconds || b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      return res.status(200).json({ success: true, donations });
    }

    // ── POST: Donation approve karna ──
    if (req.method === 'POST' && action === 'approve') {
      const { donationId, donationData } = req.body;
      if (!donationId) return res.status(400).json({ error: 'donationId required' });

      // 1. Database status update
      await db.collection('donations').doc(donationId).update({
        status:     'Approved',
        approvedAt: new Date().toISOString(),
      });

      // 2. EmailJS REST API hit (Pure Server Side)
      if (donationData && donationData.donorEmail) {
        const emailjsResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id:  process.env.EMAILJS_SERVICE_ID,
            template_id: process.env.EMAILJS_TEMPLATE_ID,
            user_id:     process.env.EMAILJS_PUBLIC_KEY,
            accessToken: process.env.EMAILJS_PRIVATE_KEY, 
            template_params: {
              donor_name:   donationData.donorName || 'Donor',
              donor_email:  donationData.donorEmail || '',
              receipt_no:   donationData.receiptNo || 'N/A',
              amount:       donationData.amount || '0',
              method:       donationData.method || 'N/A',
              date:         donationData.dateStr || new Date().toLocaleDateString('en-IN'),
              txn_id:       donationData.transactionId || 'N/A',
              message:      donationData.message || ''
            }
          })
        });

        if (!emailjsResponse.ok) {
          const errText = await emailjsResponse.text();
          console.error('❌ EmailJS Server Error:', errText);
        } else {
          console.log('✅ Thank you Email sent via Backend API');
        }
      }

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
