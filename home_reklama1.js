// home_reklama1.js

const BLOCK_ID     = "int-31356"; // ← partner.adsgram.ai dan HAQIQIY ID ni yozing!
const KUTISH_VAQTI = 30;

let AdController = null;
let timerInterval = null;

const statusText      = document.getElementById('status-text');
const loader          = document.getElementById('reklama-loader');
const progressBarWrap = document.getElementById('progress-bar-wrap');
const progressBar     = document.getElementById('progress-bar');
const debugText       = document.getElementById('debug-text');

function log(msg) {
    console.log('[ADSGRAM]', msg);
    if (debugText) debugText.innerText = msg;
}

document.addEventListener('DOMContentLoaded', () => {
    waitForSDK(0);
});

function waitForSDK(n) {
    if (n > 20) { 
        log("❌ AdsGram SDK 10s da yuklanmadi"); 
        statusText.innerText = "SDK yuklanmadi";
        return; 
    }
    if (typeof window.Adsgram === 'undefined') {
        setTimeout(() => waitForSDK(n + 1), 500);
        return;
    }
    startAdsgram();
}

function startAdsgram() {
    try {
        AdController = window.Adsgram.init({
            blockId: BLOCK_ID,
            debug: false,  // ✅ HAQIQIY reklama uchun FALSE
            debugBannerType: "RewardedVideo"
        });
        log("✅ AdsGram init muvaffaqiyatli!");
        showAd();
    } catch (e) {
        log("❌ init xatoligi: " + e.message);
        statusText.innerText = "Reklama xatoligi";
    }
}

async function showAd() {
    if (!AdController) { 
        log("❌ AdController yo'q"); 
        statusText.innerText = "AdController yo'q";
        return; 
    }

    statusText.innerText = "Reklama yuklanmoqda...";
    loader.style.display = "block";
    progressBarWrap.style.display = "none";
    if (debugText) debugText.innerText = "";

    try {
        const result = await AdController.show();
        if (result?.done) {
            statusText.innerText = "✅ Rahmat! Mukofot berildi.";
            log("✅ Reklama muvaffaqiyatli ko'rildi");
        } else {
            statusText.innerText = "⚠️ Reklama o'tkazib yuborildi.";
            log("⚠️ Reklama o'tkazib yuborildi");
        }
    } catch (err) {
        log("❌ " + (err?.description || JSON.stringify(err)));
        statusText.innerText = "Reklama yuklanmadi.";
    } finally {
        loader.style.display = "none";
        // ✅ Timer bu yerda ishga tushadi
        startTimer();
    }
}

function startTimer() {
    // Eski timerni tozalash
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    progressBarWrap.style.display = "block";
    let qolganVaqt = KUTISH_VAQTI;
    statusText.innerText = `Keyingi reklama: ${qolganVaqt} sek`;

    timerInterval = setInterval(() => {
        qolganVaqt--;
        
        // ✅ Progressni hisoblash
        const foiz = ((KUTISH_VAQTI - qolganVaqt) / KUTISH_VAQTI) * 100;
        progressBar.style.width = Math.min(foiz, 100) + "%";
        
        statusText.innerText = `Keyingi reklama: ${qolganVaqt} sek`;
        
        if (qolganVaqt <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            if (debugText) debugText.innerText = "";
            // ✅ Yangi reklamani ko'rsatish
            showAd();
        }
    }, 1000);
}