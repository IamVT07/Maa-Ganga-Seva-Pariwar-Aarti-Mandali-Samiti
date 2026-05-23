/**
 * Configuration File for Maa Ganga Seva Pariwar Website
 * Update the values below with your actual Firebase credentials
 */

// Firebase Configuration - UPDATE WITH YOUR ACTUAL CREDENTIALS
const firebaseConfig = {
  apiKey: "AIzaSyCqT7OO0Nq24LreE3NB1EFRYUPoC0zOKZY",
  authDomain: "maa-ganga-seva.firebaseapp.com",
  projectId: "maa-ganga-seva",
  storageBucket: "maa-ganga-seva.firebasestorage.app",
  messagingSenderId: "863468452400",
  appId: "1:863468452400:web:7127c9827d72f973510bf5",
};

// Admin Credentials - UPDATE WITH YOUR SECURE PASSWORD
const ADMIN_PASSWORD = "GangaSeva2025"; // Change this to your secure password

// Export to window object for use in other files (IMPORTANT!)
window.firebaseConfig = firebaseConfig;
window.FIREBASE_CONFIG = firebaseConfig;
window.ADMIN_PASSWORD = ADMIN_PASSWORD;

window.EMAILJS_PUBLIC_KEY  = 'K3idHYU5pcTR5p0pi';   
window.EMAILJS_SERVICE_ID  = 'service_wf00osl';   
window.EMAILJS_TEMPLATE_ID = 'template_yvaze0t';

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { firebaseConfig, ADMIN_PASSWORD };
}
