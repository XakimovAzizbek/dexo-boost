// Firebase Konfiguratsiyasi (Loyiha ma'lumotlari)
const firebaseConfig = {
  apiKey: "AIzaSyCtxk7gcilx1Be8k44SQ32eio6EBmh8IVc",
  authDomain: "loyiha1-773ba.firebaseapp.com",
  projectId: "loyiha1-773ba",
  storageBucket: "loyiha1-773ba.firebasestorage.app",
  messagingSenderId: "612930407157",
  appId: "1:612930407157:web:b3662953f17056068f93bc",
  measurementId: "G-RTT7B8R4FM",
  databaseURL: "https://loyiha1-773ba-default-rtdb.firebaseio.com"
};

// Firebaseni ishga tushirish
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const tg = window.Telegram.WebApp;
let userData = tg.initDataUnsafe.user;

// Agar loyiha brauzerda test qilinayotgan bo'lsa (Telegramdan tashqarida)
if (!userData) {
    userData = { 
        id: 123456789, 
        first_name: "Test Foydalanuvchi", 
        username: "test_username",
        photo_url: "" 
    };
}

async function loadProfile() {
    const userId = userData.id.toString();
    
    // 1. UI elementlariga foydalanuvchi ma'lumotlarini o'rnatish
    document.getElementById('prof-name').innerText = userData.first_name;
    document.getElementById('prof-id').innerText = userId;
    
    // Usernameni tekshirish (ba'zi foydalanuvchilarda username bo'lmasligi mumkin)
    if (userData.username) {
        document.getElementById('prof-username').innerText = "@" + userData.username;
    } else {
        document.getElementById('prof-username').innerText = "@username_yoq";
    }

    // Profil rasmini o'rnatish
    if (userData.photo_url) {
        document.getElementById('prof-avatar').src = userData.photo_url;
    } else {
        // Agar rasmi bo'lmasa standart chiroyli rasm qo'yish
        document.getElementById('prof-avatar').src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(userData.first_name) + "&background=3b82f6&color=fff&size=128";
    }

    try {
        // 2. Realtime Databasedan balansni real vaqtda olish
        db.ref(`users/${userId}`).on('value', (snapshot) => {
            if (snapshot.exists()) {
                document.getElementById('prof-balance').innerText = snapshot.val().balance;
            } else {
                // Agar foydalanuvchi bazada hali yo'q bo'lsa (yangi kirgan bo'lsa)
                db.ref(`users/${userId}`).set({
                    telegramID: userId,
                    balance: 10,
                    name: userData.first_name
                });
                document.getElementById('prof-balance').innerText = "10";
            }
        });
    } catch (e) {
        console.error("Profil yuklanishida xatolik:", e);
    }
}

// Sahifani faollashtirish
loadProfile();
tg.ready();
tg.expand();
