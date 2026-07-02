// home_reklama1.js

const BLOCK_ID = "int-31356"; // ← O'ZGARTIRING: partner.adsgram.ai dan olingan haqiqiy ID
const KUTISH_VAQTI = 30;      // Reklamalar orasidagi tanaffus (soniya)

let AdController = null;

const statusText  = document.getElementById('status-text');
const loader      = document.getElementById('reklama-loader');
const progressBarWrap = document.getElementById('progress-bar-wrap');
const progressBar = document.getElementById('progress-bar');
const debugText   = document.getElementById('debug-text');

function showDebug(msg) {
    console.log("[ADSGRAM DEBUG]", msg);
    if (debugText) debugText.innerText = msg;
}

// Sahifa tayyor bo'lgach ishga tushir
document.addEventListener('DOMContentLoaded', () => {
    initAdsgram();
});

function initAdsgram() {
    // AdsGram SDK yuklanganmi?
    if (typeof window.Adsgram === 'undefined') {
        showDebug("❌ AdsGram SDK yuklanmadi. Internet aloqasini tekshiring.");
        setTimeout(initAdsgram, 500); // 0.5 sek kutib qayta urinish
        return;
    }

    try {
        AdController = window.Adsgram.init({
            blockId: BLOCK_ID,
            debug: true,          // ← Reklama ishlayotganidan keyin FALSE qiling
            debugBannerType: "RewardedVideo"
        });
        showDebug("✅ AdsGram tayyor. Reklama chaqirilmoqda...");
        showAd();
    } catch (e) {
        showDebug("❌ AdsGram init xatoligi: " + e.message);
    }
}

async function showAd() {
    if (!AdController) {
        showDebug("❌ AdController tayyor emas");
        return;
    }

    statusText.innerText = "Reklama yuklanmoqda...";
    loader.style.display = "block";
    progressBarWrap.style.display = "none";
    progressBar.style.width = "0%";

    try {
        showDebug("📡 AdController.show() chaqirilmoqda...");
        const result = await AdController.show();

        showDebug("✅ Reklama natijasi: done=" + result?.done);

        if (result && result.done) {
            statusText.innerText = "✅ Rahmat! Mukofot berildi.";
        } else {
            statusText.innerText = "⚠️ Reklama oxirigacha ko'rilmadi.";
        }
    } catch (error) {
        showDebug("❌ show() xatoligi: " + JSON.stringify(error));
        statusText.innerText = "Reklama topilmadi: " + (error?.description || "noma'lum xato");
    } finally {
        startTimer();
    }
}

function startTimer() {
    loader.style.display = "none";
    progressBarWrap.style.display = "block";

    let timeLeft = KUTISH_VAQTI;
    statusText.innerText = `Keyingi reklama: ${timeLeft} sek`;

    const interval = setInterval(() => {
        timeLeft--;
        const pct = ((KUTISH_VAQTI - timeLeft) / KUTISH_VAQTI) * 100;
        progressBar.style.width = pct + "%";
        statusText.innerText = `Keyingi reklama: ${timeLeft} sek`;

        if (timeLeft <= 0) {
            clearInterval(interval);
            if (debugText) debugText.innerText = "";
            showAd();
        }
    }, 1000);
}
