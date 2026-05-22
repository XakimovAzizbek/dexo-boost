const tg = window.Telegram.WebApp;
const userId = tg.initDataUnsafe.user?.id;
const BASE_URL = "https://69b1056aadac80b427c3bc97.mockapi.io";
const BOT_TOKEN = "8756409847:AAF-MdVUIQSf0HaqavXESBvHZ6UV6lsg9rw";

async function loadBalance() {
    if(!userId) return;
    const res = await fetch(`${BASE_URL}/users?telegramID=${userId}`);
    const data = await res.json();
    if(data.length > 0) document.getElementById('balance-amount').innerText = data[0].balance;
}
loadBalance();

document.getElementById('subs-count').addEventListener('input', (e) => {
    const count = e.target.value;
    document.getElementById('total-price').innerText = `Jami xarajat: ${count * 4} tanga`;
});

window.publishTask = async function() {
    const username = document.getElementById('channel-username').value.trim();
    const count = parseInt(document.getElementById('subs-count').value);
    const totalPrice = count * 4;

    if (!username.startsWith('@')) {
        tg.showAlert("Kanal username @ bilan boshlanishi shart!");
        return;
    }

    const btn = document.getElementById('btn-create');
    btn.disabled = true; btn.innerText = "Tekshirilmoqda...";

    try {
        // 1. Bot adminligini tekshirish
        const checkUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${username}&user_id=${BOT_TOKEN.split(':')[0]}`;
        const checkRes = await fetch(checkUrl);
        const checkData = await checkRes.json();

        if (!checkData.ok || checkData.result.status !== 'administrator') {
            tg.showAlert("Bot bu kanalda admin emas! Avval botni kanalga admin qiling.");
            btn.disabled = false; btn.innerText = "Vazifani Joylash";
            return;
        }

        // 2. Balansni tekshirish
        const uRes = await fetch(`${BASE_URL}/users?telegramID=${userId}`);
        const users = await uRes.json();
        
        if (users.length === 0 || users[0].balance < totalPrice) {
            tg.showAlert("Mablag' yetarli emas!");
            btn.disabled = false; btn.innerText = "Vazifani Joylash";
            return;
        }

        // 3. Vazifani yaratish
        await fetch(`${BASE_URL}/tasks`, {
            method: 'POST',
            headers: {'content-type':'application/json'},
            body: JSON.stringify({
                ownerId: userId.toString(),
                channel: username,
                requiredSubs: count,
                completedCount: 0
            })
        });

        // 4. Balansni yechish
        await fetch(`${BASE_URL}/users/${users[0].id}`, {
            method: 'PUT',
            headers: {'content-type':'application/json'},
            body: JSON.stringify({ balance: users[0].balance - totalPrice })
        });

        tg.showAlert("Vazifa muvaffaqiyatli joylandi!");
        window.location.href = "home.html";
    } catch (e) {
        tg.showAlert("Xatolik: Kanal topilmadi yoki bot admin emas.");
        btn.disabled = false; btn.innerText = "Vazifani Joylash";
    }
}
