// Firebase Konfiguratsiyasi (databaseURL albatta bo'lishi shart!)
const firebaseConfig = {
  apiKey: "AIzaSyCtxk7gcilx1Be8k44SQ32eio6EBmh8IVc",
  authDomain: "loyiha1-773ba.firebaseapp.com",
  projectId: "loyiha1-773ba",
  storageBucket: "loyiha1-773ba.firebasestorage.app",
  messagingSenderId: "612930407157",
  appId: "1:612930407157:web:b3662953f17056068f93bc",
  measurementId: "G-RTT7B8R4FM",
  databaseURL: "https://loyiha1-773ba-default-rtdb.firebaseio.com" // SIZDA SHU QATOR QALIB KETGAN EDI
};

// Firebaseni ishga tushirish
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const tg = window.Telegram.WebApp;
let userData = tg.initDataUnsafe.user;

// Test qilish uchun (Agar Telegramdan tashqarida ochilsa)
if (!userData) {
    userData = { id: 123456789, first_name: "Test Foydalanuvchi" };
}

async function initHome() {
    const userId = userData.id.toString();
    
    document.getElementById('user-name').innerText = userData.first_name;
    document.getElementById('user-id-text').innerText = "ID: " + userId;
    if (userData.photo_url) {
        document.getElementById('user-photo').src = userData.photo_url;
    }

    try {
        // Foydalanuvchini bazadan olish yoki yangi ochish
        const userRef = db.ref(`users/${userId}`);
        userRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                document.getElementById('balance-amount').innerText = snapshot.val().balance;
            } else {
                userRef.set({
                    telegramID: userId,
                    balance: 10, // Yangi kirgandagi sovg'a tanga
                    name: userData.first_name
                });
                document.getElementById('balance-amount').innerText = "10";
            }
        });

        // Faol vazifalar sonini aniqlash
        db.ref('tasks').on('value', (taskSnapshot) => {
            let activeCount = 0;
            if (taskSnapshot.exists()) {
                const tasks = taskSnapshot.val();
                for (const taskId in tasks) {
                    const task = tasks[taskId];
                    if (parseInt(task.completedCount) < parseInt(task.requiredSubs) && task.ownerId !== userId) {
                        activeCount++;
                    }
                }
            }
            document.getElementById('active-tasks-count').innerText = activeCount;
        });

    } catch (e) {
        console.error("Xatolik yuz berdi:", e);
    }
}

initHome();
tg.ready();
tg.expand();
