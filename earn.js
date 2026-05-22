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
const BOT_TOKEN = "8848931278:AAE4GIlvFbs7QB0Jdoq91RgqR8tU6eIDK9Y";
let currentBalance = 0;

// 1. Balansni eshitish
db.ref(`users/${userId}`).on('value', (snapshot) => {
    if (snapshot.exists()) {
        currentBalance = snapshot.val().balance;
        document.getElementById('balance-amount').innerText = currentBalance;
    }
});

// 2. Vazifalarni real vaqtda yuklash va Chiqib ketganlarni avtomatik tekshirish
db.ref('tasks').on('value', (snapshot) => {
    const list = document.getElementById('tasks-list');
    list.innerHTML = "";
    
    // Sahifa yuklanganda obunadan chiqqanlarni tekshirish funksiyasini chaqiramiz
    checkUnsubscribedTasks();

    if (!snapshot.exists()) {
        list.innerHTML = "<p style='text-align:center; color:#94a3b8;'>Hozircha vazifalar yo'q.</p>";
        return;
    }

    const tasks = snapshot.val();
    let hasTasks = false;

    for (const taskId in tasks) {
        const task = tasks[taskId];

        // Foydalanuvchi o'zi yaratgan vazifani o'ziga ko'rsatmaslik
        if (task.ownerId === userId) continue;

        // Agar limit to'lgan bo'lsa ko'rsatmaslik
        if (parseInt(task.completedCount) >= parseInt(task.requiredSubs)) continue;

        hasTasks = true;

        const item = document.createElement('div');
        item.className = "glass-card task-item";
        item.innerHTML = `
            <div>
                <h4 style="font-size:15px; margin-bottom:4px;">Kanalga obuna bo'ling</h4>
                <p style="color:#94a3b8; font-size:12px;">${task.channel}</p>
                <span style="color:#f59e0b; font-size:12px; font-weight:700;">+2 Tanga</span>
            </div>
            <div style="display:flex; gap:8px;">
                <button class="task-btn" onclick="window.open('https://t.me/${task.channel.replace('@','')}', '_blank')">KIRISH</button>
                <button class="task-btn check-btn" id="btn-${taskId}">TEKSHIRISH</button>
            </div>
        `;
        list.appendChild(item);

        // Tekshirish tugmasiga hodisa biriktirish
        document.getElementById(`btn-${taskId}`).addEventListener('click', () => {
            verifyTask(taskId, task);
        });
    }

    if (!hasTasks) {
        list.innerHTML = "<p style='text-align:center; color:#94a3b8;'>Hozircha yangi vazifalar yo'q.</p>";
    }
});

// 3. Obunani tekshirish va 10 kunlik nazoratga olish funksiyasi
async function verifyTask(taskId, task) {
    const btn = document.getElementById(`btn-${taskId}`);
    const originalText = btn.innerText;
    btn.innerText = "⏳";
    btn.disabled = true;

    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${task.channel}&user_id=${userId}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.ok) {
            tg.showAlert("Kanal topilmadi yoki bot kanaldan chiqarilgan.");
            btn.innerText = originalText;
            btn.disabled = false;
            return;
        }

        const status = data.result.status;
        if (['member', 'administrator', 'creator'].includes(status)) {
            
            // Bir marta bajargan vazifasini qayta bajara olmaydigan qilish tekshiruvi
            const alreadyChecked = await db.ref(`unsub_checks/${userId}_${taskId}`).once('value');
            if(alreadyChecked.exists()) {
                tg.showAlert("Siz bu vazifani allaqachon bajargansiz!");
                btn.innerText = originalText;
                return;
            }

            // A. Balansni +2 tangaga oshirish
            await db.ref(`users/${userId}/balance`).set(parseInt(currentBalance) + 2);
            
            // B. Vazifa bajarilganlar sonini bittaga oshirish
            await db.ref(`tasks/${taskId}/completedCount`).set(parseInt(task.completedCount) + 1);

            // D. 10 kunlik nazorat bazasiga yozish
            // 10 kun = 10 kun * 24 soat * 60 daqiqa * 60 soniya * 1000 millisoniya
            const expireTime = Date.now() + (10 * 24 * 60 * 60 * 1000); 
            
            await db.ref(`unsub_checks/${userId}_${taskId}`).set({
                userId: userId,
                taskId: taskId,
                channel: task.channel,
                expireAt: expireTime
            });

            tg.showAlert("Barakalla! Balansga +2 tanga qo'shildi. Diqqat: 10 kun ichida kanaldan chiqsangiz -4 tanga jarima qo'llanadi!");
        } else {
            tg.showAlert("Siz hali kanalga a'zo bo'lmadingiz!");
            btn.innerText = originalText;
            btn.disabled = false;
        }
    } catch (e) {
        console.error("Tekshirishda xato:", e);
        tg.showAlert("Texnik xatolik yuz berdi.");
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// 4. Kanaldan chiqib ketganlarni avtomatik aniqlash va -4 tanga jarima solish
async function checkUnsubscribedTasks() {
    try {
        const snapshot = await db.ref('unsub_checks').once('value');
        if (!snapshot.exists()) return;

        const checks = snapshot.val();
        const now = Date.now();

        for (const checkId in checks) {
            const check = checks[checkId];
            
            // Faqat joriy foydalanuvchining nazoratdagi vazifalarini tekshiramiz
            if (check.userId !== userId) continue;

            // Bot orqali foydalanuvchining kanaldagi hozirgi holatini tekshiramiz
            const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${check.channel}&user_id=${userId}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.ok) {
                const currentStatus = data.result.status;
                
                // Agar foydalanuvchi chiqib ketgan bo'lsa ('left' yoki 'kicked')
                if (['left', 'kicked'].includes(currentStatus)) {
                    
                    // 1. Foydalanuvchidan 4 tanga ayiramiz (balans 0 dan tushib ketmasligini ta'minlaymiz)
                    let newBalance = parseInt(currentBalance) - 4;
                    if (newBalance < 0) newBalance = 0; 
                    
                    await db.ref(`users/${userId}/balance`).set(newBalance);
                    
                    // 2. Ushbu tekshirishni bazadan o'chiramiz (qayta jarima solmasligi uchun)
                    await db.ref(`unsub_checks/${checkId}`).remove();
                    
                    tg.showAlert(`⚠️ Ogohlantirish! Siz ${check.channel} kanalidan muddatidan oldin chiqib ketganingiz uchun hisobingizdan -4 tanga chegirib tashlandi!`);
                    break;
                }
            }

            // Agar 10 kunlik muddat muvaffaqiyatli tugagan bo'lsa va chiqmagan bo'lsa, nazoratdan o'chiramiz
            if (now > check.expireAt) {
                await db.ref(`unsub_checks/${checkId}`).remove();
            }
        }
    } catch (error) {
        console.error("Avto-tekshiruvda xatolik:", error);
    }
}

// Telegram WebApp sozlamalari
tg.ready();
tg.expand();
