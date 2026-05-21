import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, push } from "firebase/database";

// Firebase konfiguratsiyasi
const firebaseConfig = {
  apiKey: "AIzaSyAxZ-mSgJhuTdGcH3T4oJym3qjGso71keM",
  authDomain: "user1111-c84a0.firebaseapp.com",
  databaseURL: "https://user1111-c84a0-default-rtdb.firebaseio.com",
  projectId: "user1111-c84a0",
  storageBucket: "user1111-c84a0.firebasestorage.app",
  messagingSenderId: "901723757936",
  appId: "1:901723757936:web:c94a330b79916b6b0c03b5",
  measurementId: "G-W1WPZHRJX8"
};

// ALBATTA ALMASHTIRING: Telegram botingiz tokeni (Masalan: "123456789:ABCdefGh...")
const BOT_TOKEN = "8848931278:AAE4GIlvFbs7QB0Jdoq91RgqR8tU6eIDK9Y"; 

// Ilovani ishga tushirish
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const tg = window.Telegram?.WebApp;

let userId = "123456789"; // Default test ID
let currentBalance = 0;

if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    tg.expand();
    userId = tg.initDataUnsafe.user.id.toString();
}

// DOM Elementlari
const userBalanceEl = document.getElementById("user-balance");
const channelLinkInput = document.getElementById("channel-link");
const subCountInput = document.getElementById("sub-count");
const totalPriceEl = document.getElementById("total-price");
const submitBtn = document.getElementById("submit-btn");
const btnText = document.getElementById("btn-text");
const btnLoader = document.getElementById("btn-loader");

const COST_PER_SUB = 4; // 1 ta obunachi = 4 tanga

// 1. Foydalanuvchi balansini bazadan yuklash
const userRef = ref(db, 'users/' + userId);
get(userRef).then((snapshot) => {
    if (snapshot.exists()) {
        currentBalance = snapshot.val().balance || 0;
        userBalanceEl.textContent = currentBalance;
    }
});

// 2. Kiritish maydoniga son yozilganda narxni hisoblash
subCountInput.addEventListener("input", () => {
    const count = parseInt(subCountInput.value) || 0;
    const totalCost = count * COST_PER_SUB;
    totalPriceEl.textContent = totalCost + " DEXO";
});

// 3. Kanal username/link formatini tozalash (Masalan: @kanal_nomi yoki username ajratish)
function formatChannelChatId(inputStr) {
    let clean = inputStr.trim();
    if (clean.includes("t.me/")) {
        clean = "@" + clean.split("t.me/")[1].split("/")[0];
    }
    if (!clean.startsWith("@") && !clean.startsWith("-100")) {
        clean = "@" + clean;
    }
    return clean;
}

// 4. Bot kanalda admin ekanligini tekshirish funksiyasi (Telegram Bot API)
async function checkBotAdminStatus(chatId) {
    try {
        // getChatMember orqali botning o'z holatini tekshiramiz
        // Botning o'zini ID-sini aniqlash yoki shunchaki uning huquqini ko'rish uchun yuboriladi
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${chatId}&user_id=${BOT_TOKEN.split(':')[0]}`);
        const result = await response.json();
        
        if (result.ok) {
            const status = result.result.status;
            // Agar bot 'administrator' yoki 'creator' bo'lsa va post joylay olsa true qaytaradi
            if (status === "administrator" || status === "creator") {
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error("Bot adminligini tekshirishda xato:", error);
        return false;
    }
}

// 5. Forma topshirilganda vazifa yaratish jarayoni
submitBtn.addEventListener("click", async () => {
    const rawLink = channelLinkInput.value.trim();
    const subCount = parseInt(subCountInput.value) || 0;
    const totalCost = subCount * COST_PER_SUB;

    // Oddiy validatsiya
    if (!rawLink || subCount < 5) {
        alert("Iltimos, barcha maydonlarni to'g'ri to'ldiring (Minimal 5 ta obunachi)!");
        return;
    }

    if (currentBalance < totalCost) {
        alert("Mablag' yetarli emas! Sizga " + totalCost + " DEXO kerak, balansingizda esa " + currentBalance + " DEXO bor.");
        return;
    }

    // Yuklanish holatini yoqish
    submitBtn.disabled = true;
    btnText.textContent = "Tekshirilmoqda...";
    btnLoader.classList.remove("hidden");

    const formattedChatId = formatChannelChatId(rawLink);

    // Telegram Bot Adminligini tekshirish
    const isAdmin = await checkBotAdminStatus(formattedChatId);

    if (!isAdmin) {
        alert("Xatolik: Bot ushbu kanalda admin emas! Iltimos, avval botni kanalga qo'shib, admin huquqini bering.");
        // Yuklanish holatini o'chirish
        submitBtn.disabled = false;
        btnText.textContent = "Vazifa Yaratish";
        btnLoader.classList.add("hidden");
        return;
    }

    // Hamma shartlar bajarilganda: Balansni ayirish va Vazifani bazaga yozish
    const newBalance = currentBalance - totalCost;
    
    // 1. Foydalanuvchi balansini yangilash
    await set(ref(db, 'users/' + userId + '/balance'), newBalance);

    // 2. Yangi vazifani 'tasks' tuguniga qo'shish
    const tasksRef = ref(db, 'tasks');
    const newTaskRef = push(tasksRef);
    await set(newTaskRef, {
        title: `Kanalga obuna bo'ling: ${formattedChatId}`,
        link: rawLink.startsWith("http") ? rawLink : `https://t.me/${formattedChatId.replace("@", "")}`,
        chatId: formattedChatId,
        reward: 2, // Obunachiga beriladigan ulush (masalan 4 tadan 2 tasi unga)
        requiredSubs: subCount,
        currentSubs: 0,
        creatorId: userId
    });

    alert("Muvaffaqiyatli! Vazifa yaratildi va balansdan " + totalCost + " DEXO yechildi.");
    
    // Sahifani yangilash yoki Home sahifasiga o'tkazish
    window.location.href = "home.html";
});
