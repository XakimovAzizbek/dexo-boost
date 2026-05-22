// home_reklama1.js

// Adsgram reklamani sozlash (Sizning haqiqiy Block ID raqamingizni yozing)
const AdController = window.Adsgram.init({ blockId: "int-31118" });

const statusText = document.getElementById('status-text');
const loader = document.getElementById('reklama-loader');
const progressBarWrap = document.getElementById('progress-bar-wrap');
const progressBar = document.getElementById('progress-bar');

const KUTISH_VAQTI = 30; // Reklamalar orasidagi tanaffus (soniya)

// Sahifa yuklanishi bilan reklamani boshlash
window.addEventListener('DOMContentLoaded', () => {
    showAd();
});

// Reklamani ko'rsatish funksiyasi
async function showAd() {
    // Interfeysni yuklanish holatiga keltirish
    statusText.innerText = "Reklama tayyorlanmoqda...";
    loader.style.display = "block";
    progressBarWrap.style.style = "none";
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
            startTimer(); // Baribir qayta taymerni yoqamiz
        }
    } catch (error) {
        // Reklama topilmadi yoki yuklanishda xatolik (masalan, AdBlock yoquvchi bo'lsa)
        console.error("Adsgram xatoligi:", error);
        statusText.innerText = "Xatolik: Reklama yuklanmadi.";
        startTimer(); // Ma'lum vaqtdan keyin yana urinib ko'rish uchun taymerni boshlaymiz
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

        // Vizual chiziqni to'ldirib borish (foizda)
        const progressPercentage = ((KUTISH_VAQTI - timeLeft) / KUTISH_VAQTI) * 100;
        progressBar.style.width = progressPercentage + "%";

        if (timeLeft <= 0) {
            clearInterval(interval);
            showAd(); // Vaqt tugagach yana reklamani chaqiramiz (Tsikl doimiy aylanadi)
        }
    }, 1000);
}
