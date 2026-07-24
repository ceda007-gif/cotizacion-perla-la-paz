/* Hotel Perla — Firebase project wiring. Config values here are public
   client identifiers (not secrets); access is enforced by Firestore/Storage
   security rules tied to the admin's Firebase Auth account (see
   firestore.rules / storage.rules in this repo). */
(function () {
  var firebaseConfig = {
    apiKey: "AIzaSyD83bXeSnJvmx2o6krI0rtMaehmttYbSfg",
    authDomain: "cotizacion-perla.firebaseapp.com",
    projectId: "cotizacion-perla",
    storageBucket: "cotizacion-perla.firebasestorage.app",
    messagingSenderId: "292765585191",
    appId: "1:292765585191:web:02d301bdb9c658c0622302"
  };
  firebase.initializeApp(firebaseConfig);
  window.PQ_ADMIN_EMAIL = 'ceda007@gmail.com';
  window.PQ_DB = firebase.firestore();
  window.PQ_AUTH = firebase.auth();
  window.PQ_STORAGE = firebase.storage();
})();
