// Firebase Konfiguratsiyasi
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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

const tg = window.Telegram.WebApp;
let userData = tg.initDataUnsafe.user;

// Telegramdan tashqarida test qilish uchun
if (!userData) {
    userData = { id: 123456789, first_name: "Test Bek" };
}

const userId = userData.id.toString();
let myBalance = 0;
let localTimerInterval = null;

// UI Elementlar
const myBalanceEl = document.getElementById('my-balance');
const auctionTitleEl = document.getElementById('auction-status-title');
const timerEl = document.getElementById('auction-timer');
const poolEl = document.getElementById('auction-pool');
const leaderEl = document.getElementById('auction-leader');
const startBtn = document.getElementById('start-btn');
const raiseGroup = document.getElementById('raise-group');
const raiseBtn = document.getElementById('raise-btn');

// 1. Foydalanuvchi balansini tinglash
db.ref(`users/${userId}`).on('value', (snapshot) => {
    if (snapshot.exists()) {
        myBalance = snapshot.val().balance;
        myBalanceEl.innerText = myBalance;
    }
});

// 2. Auksion holatini real vaqtda nazorat qilish
db.ref('auction').on('value', (snapshot) => {
    clearInterval(localTimerInterval);
    
    if (!snapshot.exists() || snapshot.val().status === "inactive") {
        // Auksion boshlanmagan holat
        auctionTitleEl.innerText = "Auksion Faol Emas";
        timerEl.innerText = "20:00";
        poolEl.innerText = "0";
        leaderEl.innerText = "Hech kim";
        
        startBtn.style.display = "block";
        raiseGroup.style.display = "none";
        return;
    }

    const data = snapshot.val();
    
    // Agar auksion faol bo'lsa UI yangilash
    auctionTitleEl.innerText = "🔥 Auksion Qizg'in Pallada!";
    poolEl.innerText = data.pool;
    leaderEl.innerText = `${data.lastBidderName} (${data.lastBid} Tanga)`;
    
    startBtn.style.display = "none";
    raiseGroup.style.display = "block";

    // Eng kamida tikish kerak bo'lgan summani belgilash (oxirgi tikilgandan +1)
    const nextMinBid = data.lastBid + 1;
    document.getElementById('bid-amount-input').value = nextMinBid;

    // Taymerni ishga tushirish
    startLocalTimer(data.endTime, data.lastBidderId, data.pool, data.lastBidderName);
});

// 3. Taymer hisoblash funksiyasi
function startLocalTimer(endTime, lastBidderId, currentPool, leaderName) {
    function updateTimer() {
        const now = new Date().getTime();
        const distance = endTime - now;

        if (distance <= 0) {
            clearInterval(localTimerInterval);
            timerEl.innerText = "00:00";
            auctionTitleEl.innerText = "⌛ Auksion Yakunlandi";
            raiseGroup.style.display = "none";
            
            // Faqat bir marta g'olibni taqdirlash mantig'i (server vazifasini zaxira qilish)
            finalizeAuction(lastBidderId, currentPool, leaderName);
            return;
        }

        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        timerEl.innerText = 
            (minutes < 10 ? "0" : "") + minutes + ":" + 
            (seconds < 10 ? "0" : "") + seconds;
    }
    
    updateTimer();
    localTimerInterval = setInterval(updateTimer, 1000);
}

// 4. Auksionni Boshlash (Minimal 1 tanga bilan)
startBtn.addEventListener('click', () => {
    if (myBalance < 1) {
        alert("Auksion boshlash uchun balansingizda kamida 1 tanga bo'lishi kerak!");
        return;
    }

    const startTime = new Date().getTime();
    const duration = 20 * 60 * 1000; // 20 minut msekunda
    const endTime = startTime + duration;

    // Balansdan yechish va auksionni ochish (Atomar Tranzaksiya)
    db.ref(`users/${userId}/balance`).transaction((currentBal) => {
        if (currentBal >= 1) {
            return currentBal - 1;
        }
    }, (error, committed) => {
        if (committed) {
            db.ref('auction').set({
                status: "active",
                startTime: startTime,
                endTime: endTime,
                pool: 1,
                lastBid: 1,
                lastBidderId: userId,
                lastBidderName: userData.first_name,
                finalized: false
            });
        }
    });
});

// 5. Garovni ko'tarish (+2 daqiqa qo'shish)
raiseBtn.addEventListener('click', () => {
    const nextBid = parseInt(document.getElementById('bid-amount-input').value);

    if (myBalance < nextBid) {
        alert("Balansingizda yetarli tanga yo'q!");
        return;
    }

    db.ref('auction').get().then((snapshot) => {
        if (!snapshot.exists() || snapshot.val().status !== "active") return;
        
        const data = snapshot.val();
        
        // Kimdir sizdan oldin tikib ulgurgan bo'lsa qaytadan tekshirish
        if (nextBid <= data.lastBid) {
            alert("Garov miqdori yangilandi, qaytadan urinib ko'ring.");
            return;
        }

        // Foydalanuvchi balansini kamaytirish
        db.ref(`users/${userId}/balance`).transaction((currentBal) => {
            if (currentBal >= nextBid) {
                return currentBal - nextBid;
            }
        }, (error, committed) => {
            if (committed) {
                // Yangi tugash vaqti: joriy qolgan vaqtga 2 minut qo'shish
                let currentEndTime = data.endTime;
                const now = new Date().getTime();
                
                // Agar vaqt allaqachon tugab borayotgan bo'lsa joriy vaqt ustiga qo'shadi
                if (currentEndTime < now) currentEndTime = now;
                const newEndTime = currentEndTime + (2 * 60 * 1000); // +2 minut

                // Auksion ma'lumotlarini yangilash
                db.ref('auction').update({
                    endTime: newEndTime,
                    pool: data.pool + nextBid,
                    lastBid: nextBid,
                    lastBidderId: userId,
                    lastBidderName: userData.first_name
                });
            }
        });
    });
});

// 6. G'olibga tangalarni topshirish
function finalizeAuction(winnerId, totalPool, winnerName) {
    db.ref('auction/finalized').transaction((finalized) => {
        if (finalized === false) {
            return true; // birinchi yuklangan klentda yopish
        }
    }, (error, committed) => {
        if (committed) {
            // G'olibning balansiga hamma tangalarni qo'shish
            db.ref(`users/${winnerId}/balance`).transaction((currentBal) => {
                return (currentBal || 0) + totalPool;
            }).then(() => {
                alert(`🎉 Auksion tugadi! G'olib: ${winnerName}. Bankdagi ${totalPool} tanga foydalanuvchiga berildi!`);
                
                // Auksion holatini tozalash
                db.ref('auction').set({
                    status: "inactive",
                    finalized: true
                });
            });
        }
    });
}

tg.ready();
tg.expand();
