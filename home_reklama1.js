// home_reklama1.js

// Adsgram reklamani sozlash (Sizning haqiqiy Block ID raqamingizni yozing)
const AdController = window.Adsgram.init({ blockId: "int-31356" });

const statusText = document.getElementById('status-text');
const loader = document.getElementById('reklama-loader');
const progressBarWrap = document.getElementById('progress-bar-wrap');
const progressBar = document.getElementById('progress-bar');

const KUTISH_VAQTI = 30; // Reklamalar orasidagi tanaffus (soniya)

// Sahifa yuklanishi bilan darhol reklamani tekshirib ishga tushiramiz
window.addEventListener('DOMContentLoaded', () => {
    // Agar Adsgram yuklanib bo'lgan bo'ls darhol ko'rsatadi, aks holda 200ms kutib qayta urunadi
    checkAndShowAd();
});

function checkAndShowAd() {
    if (window.Adsgram) {
        showAd();
    } else {
        // Agar skript kechikayotgan bo'lsa, har 200 millisoniyada qayta tekshiradi
        setTimeout(checkAndShowAd, 200);
    }
}

// Reklamani ko'rsatish funksiyasi
async function showAd() {
    // Interfeysni yuklanish holatiga keltirish
    statusText.innerText = "Reklama ko'rsatilmoqda...";
    loader.style.display = "block";
    progressBarWrap.style.display = "none";
    progressBar.style.width = "0%";

    try {
        // Adsgramdan reklamani chaqiramiz va natijani kutamiz
        const result = await AdController.show();
        
        if (result && result.done) {
            // Reklama muvaffaqiyatli to'liq ko'rildi
            startTimer();
        } else {
            // Foydalanuvchi reklamani muddatidan oldin yopib yubordi
            statusText.innerText = "Reklama oxirigacha ko'rilmadi.";
            startTimer(); 
        }
    } catch (error) {
        // Agar reklama tarmog'ida muammo bo'lsa yoki AdBlock bo'lsa
        console.error("Adsgram xatoligi:", error);
        statusText.innerText = "Reklama topilmadi yoki yuklanmadi.";
        startTimer(); // Baribir 30 soniyadan keyin qayta urinib ko'rish uchun taymerni yoqamiz
    }
}

// 30 soniyalik taymerni boshqarish funksiyasi
function startTimer() {
    loader.style.display = "none";         // Aylana yuklanishni o'chiramiz
    progressBarWrap.style.display = "block"; // Chiziqli progressni yoqamiz
    
    let timeLeft = KUTISH_VAQTI;
    statusText.innerText = `Keyingi reklama: ${timeLeft} sek`;

    const interval = setInterval(() => {
        timeLeft--;
        statusText.innerText = `Keyingi reklama: ${timeLeft} sek`;

        // Vizual chiziqni foizda to'ldirib borish
        const progressPercentage = ((KUTISH_VAQTI - timeLeft) / KUTISH_VAQTI) * 100;
        progressBar.style.width = progressPercentage + "%";

        if (timeLeft <= 0) {
            clearInterval(interval);
            showAd(); // 30 soniya tugagach yana avtomatik reklamani ochadi
        }
    }, 1000);
}