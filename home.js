const tg = window.Telegram.WebApp;
const userData = tg.initDataUnsafe.user;
const BASE_URL = "https://69b1056aadac80b427c3bc97.mockapi.io";

async function initHome() {
    if (userData) {
        const userId = userData.id.toString();
        
        // UI elementlarini to'ldirish
        document.getElementById('user-name').innerText = userData.first_name;
        document.getElementById('user-id-text').innerText = "ID: " + userId;
        if (userData.photo_url) {
            document.getElementById('user-photo').src = userData.photo_url;
        }

        // 1. Foydalanuvchi ma'lumotlarini MockAPI dan olish yoki yaratish
        try {
            const res = await fetch(`${BASE_URL}/users?telegramID=${userId}`);
            const users = await res.json();
            
            if (users.length > 0) {
                // Foydalanuvchi bor bo'lsa, balansini ko'rsatamiz
                document.getElementById('balance-amount').innerText = users[0].balance;
            } else {
                // Yangi foydalanuvchi bo'lsa, bazada yaratamiz
                const createRes = await fetch(`${BASE_URL}/users`, {
                    method: 'POST',
                    headers: {'content-type':'application/json'},
                    body: JSON.stringify({ 
                        telegramID: userId, 
                        balance: 0,
                        name: userData.first_name 
                    })
                });
                if(createRes.ok) document.getElementById('balance-amount').innerText = "0";
            }
        } catch (e) {
            console.error("Balansni yuklashda xato:", e);
        }

        // 2. Mavjud va faol vazifalar sonini hisoblash
        try {
            const taskRes = await fetch(`${BASE_URL}/tasks`);
            const tasks = await taskRes.json();
            
            /* Filtrlash shartlari:
               - completedCount < requiredSubs (Limitga yetmagan)
               - ownerId != userId (O'zi yaratmagan)
            */
            const activeTasks = tasks.filter(task => 
                parseInt(task.completedCount) < parseInt(task.requiredSubs) && 
                task.ownerId !== userId
            );

            document.getElementById('active-tasks-count').innerText = activeTasks.length;
        } catch (e) {
            console.error("Vazifalarni sanashda xato:", e);
            document.getElementById('active-tasks-count').innerText = "0";
        }
    } else {
        // Agar Telegram WebApp dan tashqarida ochilsa (test uchun)
        document.getElementById('user-name').innerText = "Mehmon";
        console.warn("Telegram WebApp ma'lumotlari topilmadi.");
    }
}

// Sahifa yuklanganda ishga tushirish
initHome();

// Telegram WebApp interfeysini tayyorlash
tg.ready();
tg.expand(); // Ilovani to'liq ekranga yoyish
