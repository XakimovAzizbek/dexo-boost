// home_reklama1.js

const BLOCK_ID     = "int-31356"; // ← partner.adsgram.ai dan HAQIQIY ID ni yozing!
const KUTISH_VAQTI = 30;

let AdController = null;

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
    if (n > 20) { log("❌ AdsGram SDK 10s da yuklanmadi"); return; }
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
            debug: true,                     // ✅ Reklama ishlasa FALSE qiling
            debugBannerType: "RewardedVideo"
        });
        log("✅ AdsGram init muvaffaqiyatli!");
        showAd();
    } catch (e) {
        log("❌ init xatoligi: " + e.message);
    }
}

async function showAd() {
    if (!AdController) { log("❌ AdController yo'q"); return; }

    statusText.innerText = "Reklama yuklanmoqda...";
    loader.style.display = "block";
    progressBarWrap.style.display = "none";
    if (debugText) debugText.innerText = "";

    try {
        const result = await AdController.show();
        if (result?.done) {
            statusText.innerText = "✅ Rahmat! Mukofot berildi.";
        } else {
            statusText.innerText = "⚠️ Reklama o'tkazib yuborildi.";
        }
    } catch (err) {
        log("❌ " + (err?.description || JSON.stringify(err)));
        statusText.innerText = "Reklama yuklanmadi.";
    } finally {
        startTimer();
    }
}

function startTimer() {
    loader.style.display = "none";
    progressBarWrap.style.display = "block";
    let t = KUTISH_VAQTI;
    statusText.innerText = `Keyingi reklama: ${t} sek`;

    const iv = setInterval(() => {
        t--;
        progressBar.style.width = ((KUTISH_VAQTI - t) / KUTISH_VAQTI * 100) + "%";
        statusText.innerText = `Keyingi reklama: ${t} sek`;
        if (t <= 0) {
            clearInterval(iv);
            if (debugText) debugText.innerText = "";
            showAd();
        }
    }, 1000);
}