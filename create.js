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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const tg = window.Telegram.WebApp;
let userId = tg.initDataUnsafe.user?.id ? tg.initDataUnsafe.user.id.toString() : "123456789";
const BOT_TOKEN = "8756409847:AAF-MdVUIQSf0HaqavXESBvHZ6UV6lsg9rw";
let currentBalance = 0;

// Balansni real vaqtda eshitish
db.ref(`users/${userId}`).on('value', (snapshot) => {
    if(snapshot.exists()) {
        currentBalance = snapshot.val().balance;
        document.getElementById('balance-amount').innerText = currentBalance;
    }
});

document.getElementById('subs-count').addEventListener('input', (e) => {
    const count = parseInt(e.target.value) || 0;
    document.getElementById('total-price').innerText = `Jami xarajat: ${count * 4} tanga`;
});

document.getElementById('btn-create').addEventListener('click', async () => {
    const username = document.getElementById('channel-username').value.trim();
    const count = parseInt(document.getElementById('subs-count').value) || 0;
    const totalPrice = count * 4;

    if (!username.startsWith('@')) {
        tg.showAlert("Kanal username @ bilan boshlanishi shart (Masalan: @dexo_channel)!");
        return;
    }

    if (currentBalance < totalPrice) {
        tg.showAlert("Balansingizda mablag' yetarli emas!");
        return;
    }

    const btn = document.getElementById('btn-create');
    btn.disabled = true; btn.innerText = "Tekshirilmoqda...";

    try {
        // Bot adminligini tekshirish
        const checkUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${username}&user_id=${BOT_TOKEN.split(':')[0]}`;
        const checkRes = await fetch(checkUrl);
        const checkData = await checkRes.json();

        if (!checkData.ok || checkData.result.status !== 'administrator') {
            tg.showAlert("Bot bu kanalda admin emas yoki kanal xato kiritilgan! Avval botni kanalga admin qiling.");
            btn.disabled = false; btn.innerText = "Vazifani Joylash";
            return;
        }

        // Vazifani qo'shish
        const tasksRef = db.ref('tasks');
        const newTaskRef = tasksRef.push();
        await newTaskRef.set({
            id: newTaskRef.key,
            ownerId: userId,
            channel: username,
            requiredSubs: count,
            completedCount: 0
        });

        // Balansni ayirish
        await db.ref(`users/${userId}/balance`).set(currentBalance - totalPrice);

        tg.showAlert("Vazifa muvaffaqiyatli saqlandi!");
        window.location.href = "home.html";

    } catch (e) {
        tg.showAlert("Xatolik: Kanal topilmadi yoki bot admin emas.");
        btn.disabled = false; btn.innerText = "Vazifani Joylash";
    }
});
