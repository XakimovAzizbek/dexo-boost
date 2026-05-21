import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, onValue } from "firebase/database";

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

// Firebase-ni ishga tushirish
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Telegram WebApp obyektini olish
const tg = window.Telegram?.WebApp;

// Standart (Test) ma'lumotlar - Agar Telegram ichida ochilmasa ishlashi uchun
let userId = "123456789";
let userName = "Dexo Developer";

if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    tg.expand(); // Mini Appni to'liq ekranga ochish
    userId = tg.initDataUnsafe.user.id.toString();
    userName = tg.initDataUnsafe.user.first_name;
    if (tg.initDataUnsafe.user.photo_url) {
        document.getElementById("user-avatar").src = tg.initDataUnsafe.user.photo_url;
    }
}

// DOM elementlar
const userNameEl = document.getElementById("user-name");
const userBalanceEl = document.getElementById("user-balance");
const tasksListEl = document.getElementById("tasks-list");

userNameEl.textContent = userName;

// 1. Foydalanuvchi balansini Firebase'dan olish va real-vaqtda kuzatish
const userRef = ref(db, 'users/' + userId);

onValue(userRef, (snapshot) => {
    if (snapshot.exists()) {
        const data = snapshot.val();
        userBalanceEl.textContent = data.balance || 0;
    } else {
        // Yangi foydalanuvchi bo'lsa, bazaga yozish
        set(userRef, {
            username: userName,
            balance: 0
        });
        userBalanceEl.textContent = 0;
    }
});

// 2. Bazadan aktiv vazifalarni yuklash
const tasksRef = ref(db, 'tasks');
onValue(tasksRef, (snapshot) => {
    tasksListEl.innerHTML = ""; // Tozalash
    
    if (snapshot.exists()) {
        const tasks = snapshot.val();
        for (let taskId in tasks) {
            const task = tasks[taskId];
            
            // Vazifa dizayni elementini yaratish
            const taskCard = document.createElement("div");
            taskCard.className = "task-card";
            taskCard.innerHTML = `
                <div class="task-details">
                    <h4>${task.title}</h4>
                    <p>+${task.reward} DEXO</p>
                </div>
                <button class="task-btn" data-id="${taskId}" data-link="${task.link}" data-reward="${task.reward}">Bajarish</button>
            `;
            tasksListEl.appendChild(taskCard);
        }
        
        // Tugmalarga bosish hodisasini ulash
        initTaskButtons();
    } else {
        tasksListEl.innerHTML = `<div class="task-loading">Hozircha vazifalar mavjud emas!</div>`;
    }
});

// 3. Vazifani bajarish funksiyasi
function initTaskButtons() {
    const buttons = document.querySelectorAll(".task-btn");
    buttons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const link = e.target.getAttribute("data-link");
            const reward = parseInt(e.target.getAttribute("data-reward"));
            const taskId = e.target.getAttribute("data-id");

            // Kanal havolasini ochish
            if (tg) {
                tg.openTelegramLink(link);
            } else {
                window.open(link, "_blank");
            }

            // Real loyihada bot orqali tekshirish (Check) qilinadi. 
            // Hozircha bosganda balansga tanga qo'shadigan qilamiz:
            setTimeout(() => {
                const currentBalance = parseInt(userBalanceEl.textContent);
                set(ref(db, 'users/' + userId + '/balance'), currentBalance + reward);
                alert("Vazifa bajarildi! Balansga " + reward + " tanga qo'shildi.");
            }, 2000); 
        });
    });
}
