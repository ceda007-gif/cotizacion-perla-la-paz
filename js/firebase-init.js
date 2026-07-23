/* Hotel Perla — Firebase project wiring. Config values here are public
   client identifiers (not secrets); access is enforced by Firestore/Storage
   security rules tied to the admin's Firebase Auth account (see
   firestore.rules / storage.rules in this repo). */
(function () {
  var firebaseConfig = {
    apiKey: "TODO_API_KEY",
    authDomain: "TODO_PROJECT_ID.firebaseapp.com",
    projectId: "TODO_PROJECT_ID",
    storageBucket: "TODO_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "TODO_SENDER_ID",
    appId: "TODO_APP_ID"
  };
  firebase.initializeApp(firebaseConfig);
  window.PQ_ADMIN_EMAIL = 'ceda007@gmail.com';
  window.PQ_DB = firebase.firestore();
  window.PQ_AUTH = firebase.auth();
  window.PQ_STORAGE = firebase.storage();
})();
