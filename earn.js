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

// 1. Balansni eshitish
db.ref(`users/${userId}`).on('value', (snapshot) => {
    if (snapshot.exists()) {
        currentBalance = snapshot.val().balance;
        document.getElementById('balance-amount').innerText = currentBalance;
    }
});

// 2. Vazifalarni eshitish va chiqarish
db.ref('tasks').on('value', (snapshot) => {
    const list = document.getElementById('tasks-list');
    list.innerHTML = "";

    if (!snapshot.exists()) {
        list.innerHTML = "<p style='text-align:center; color:#94a3b8;'>Hozircha vazifalar yo'q.</p>";
        return;
    }

    const tasks = snapshot.val();
    let hasTasks = false;

    for (const taskId in tasks) {
        const task = tasks[taskId];

        if (task.ownerId === userId) continue; // O'zi yaratganni ko'rsatmaslik
        if (parseInt(task.completedCount) >= parseInt(task.requiredSubs)) continue; // Limiti tugagan bo'lsa

        hasTasks = true;
        const div = document.createElement('div');
        div.className = "glass-card task-item";
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        div.style.alignItems = "center";
        div.style.marginTop = "10px";
        
        div.innerHTML = `
            <div style="text-align:left;">
                <b style="color:#3b82f6; display:block;">${task.channel}</b>
                <p style="font-size:12px; color:#94a3b8;">Bajarildi: ${task.completedCount}/${task.requiredSubs}</p>
                <p style="font-size:12px; color:#22c55e;">Mukofot: +2 tanga</p>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
                <button class="task-btn" onclick="window.open('https://t.me/${task.channel.replace('@','')}')">OBUNA</button>
                <button class="task-btn check-btn" id="btn-${taskId}" style="background:#22c55e;">TEKSHIRISH</button>
            </div>
        `;
        list.appendChild(div);

        document.getElementById(`btn-${taskId}`).onclick = () => verifyTask(taskId, task);
    }

    if (!hasTasks) {
        list.innerHTML = "<p style='text-align:center; color:#94a3b8;'>Hozircha yangi vazifalar yo'q.</p>";
    }
});

// 3. Obunani tekshirish funksiyasi
async function verifyTask(taskId, task) {
    const btn = document.getElementById(`btn-${taskId}`);
    btn.innerText = "⏳";
    btn.disabled = true;

    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${task.channel}&user_id=${userId}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.ok) {
            tg.showAlert("Kanal topilmadi yoki bot kanaldan chiqarilgan.");
            btn.innerText = "TEKSHIRISH";
            btn.disabled = false;
            return;
        }

        const status = data.result.status;
        if (['member', 'administrator', 'creator'].includes(status)) {
            // Balansni oshirish
            await db.ref(`users/${userId}/balance`).set(parseInt(currentBalance) + 2);
            // Vazifa sonini bittaga oshirish
            await db.ref(`tasks/${taskId}/completedCount`).set(parseInt(task.completedCount) + 1);

            tg.showAlert("Barakalla! Balansga 2 tanga qo'shildi.");
        } else {
            tg.showAlert("Siz hali kanalga a'zo bo'lmadingiz!");
            btn.innerText = "TEKSHIRISH";
            btn.disabled = false;
        }
    } catch (e) {
        tg.showAlert("Tekshirishda xato yuz berdi.");
        btn.innerText = "TEKSHIRISH";
        btn.disabled = false;
    }
}
