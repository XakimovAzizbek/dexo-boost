const tg = window.Telegram.WebApp;
const userId = tg.initDataUnsafe.user?.id ? tg.initDataUnsafe.user.id.toString() : "0";
const BASE_URL = "https://69b1056aadac80b427c3bc97.mockapi.io";
const BOT_TOKEN = "8756409847:AAF-MdVUIQSf0HaqavXESBvHZ6UV6lsg9rw";

async function loadData() {
    const list = document.getElementById('tasks-list');
    const balanceEl = document.getElementById('balance-amount');
    
    try {
        // 1. Foydalanuvchi balansini yuklash
        const uRes = await fetch(`${BASE_URL}/users?telegramID=${userId}`);
        const uData = await uRes.json();
        if (uData.length > 0) {
            balanceEl.innerText = uData[0].balance;
        }

        // 2. Vazifalarni yuklash
        const res = await fetch(`${BASE_URL}/tasks`);
        const tasks = await res.json();
        list.innerHTML = "";

        if (!tasks || tasks.length === 0) {
            list.innerHTML = "<p style='text-align:center; color:#94a3b8;'>Hozircha vazifalar yo'q.</p>";
            return;
        }

        for (const task of tasks) {
            // O'zi yaratgan vazifani o'ziga ko'rsatmaslik
            if (task.ownerId === userId) continue;

            // Vazifa limiti tugagan bo'lsa o'chirish
            if (parseInt(task.completedCount) >= parseInt(task.requiredSubs)) {
                fetch(`${BASE_URL}/tasks/${task.id}`, { method: 'DELETE' });
                continue;
            }

            const div = document.createElement('div');
            div.className = "glass-card task-item";
            div.style.display = "flex";
            div.style.justifyContent = "space-between";
            div.style.alignItems = "center";
            
            div.innerHTML = `
                <div>
                    <b style="color:#3b82f6; display:block;">${task.channel}</b>
                    <p style="font-size:12px; color:#94a3b8;">Limit: ${task.completedCount}/${task.requiredSubs}</p>
                    <p style="font-size:12px; color:#22c55e;">Mukofot: 2 tanga</p>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <button class="task-btn" onclick="window.open('https://t.me/${task.channel.replace('@','')}')">OBUNA</button>
                    <button class="task-btn check-btn" id="btn-${task.id}" style="background:#22c55e;">TEKSHIRISH</button>
                </div>
            `;
            list.appendChild(div);

            document.getElementById(`btn-${task.id}`).onclick = () => verifyTask(task.id, task);
        }
        
        if (list.innerHTML === "") {
            list.innerHTML = "<p style='text-align:center; color:#94a3b8;'>Hozircha yangi vazifalar yo'q.</p>";
        }

    } catch (e) {
        console.error("Yuklashda xato:", e);
        list.innerHTML = "<p style='text-align:center; color:red;'>Ma'lumotlarni yuklashda xato yuz berdi.</p>";
    }
}

async function verifyTask(taskId, task) {
    const btn = document.getElementById(`btn-${taskId}`);
    const originalText = btn.innerText;
    btn.innerText = "⏳";
    btn.disabled = true;

    try {
        // 1. Bot kanalda adminligini va foydalanuvchi obunasini tekshirish
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${task.channel}&user_id=${userId}`;
        const res = await fetch(url);
        const data = await res.json();

        // Agar bot kanaldan chiqarib yuborilgan bo'lsal vazifani o'chiramiz
        if (!data.ok) {
            tg.showAlert("Xatolik: Bot kanalda admin emas! Vazifa bekor qilinadi.");
            await fetch(`${BASE_URL}/tasks/${taskId}`, { method: 'DELETE' });
            location.reload();
            return;
        }

        const status = data.result.status;
        if (['member', 'administrator', 'creator'].includes(status)) {
            // 2. Balansni oshirish
            const uRes = await fetch(`${BASE_URL}/users?telegramID=${userId}`);
            const users = await uRes.json();
            
            if (users.length > 0) {
                const newBalance = parseInt(users[0].balance) + 2;
                await fetch(`${BASE_URL}/users/${users[0].id}`, {
                    method: 'PUT',
                    headers: {'content-type':'application/json'},
                    body: JSON.stringify({ balance: newBalance })
                });

                // 3. Vazifa hisoblagichini oshirish
                await fetch(`${BASE_URL}/tasks/${taskId}`, {
                    method: 'PUT',
                    headers: {'content-type':'application/json'},
                    body: JSON.stringify({ completedCount: parseInt(task.completedCount) + 1 })
                });

                tg.showAlert("Barakalla! +2 tanga berildi.");
                location.reload();
            }
        } else {
            tg.showAlert("Siz hali kanalga a'zo emassiz!");
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

// Ishga tushirish
loadData();
tg.ready();
