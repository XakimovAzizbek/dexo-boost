// home_reklama1.js

const BLOCK_ID = "int-31356"; // ← partner.adsgram.ai dan haqiqiy ID ni yozing!
const KUTISH_VAQTI = 30;

let AdController = null;

const statusText      = document.getElementById('status-text');
const loader          = document.getElementById('reklama-loader');
const progressBarWrap = document.getElementById('progress-bar-wrap');
const progressBar     = document.getElementById('progress-bar');
const debugText       = document.getElementById('debug-text');

function showDebug(msg) {
    console.log("[ADSGRAM]", msg);
    if (debugText) debugText.innerText = msg;
}

document.addEventListener('DOMContentLoaded', () => {
    // SDK yuklanishini kutish
    waitForAdsgram(0);
});

function waitForAdsgram(attempt) {
    if (attempt > 20) {
        showDebug("❌ AdsGram SDK 10 soniyada yuklanmadi.");
        return;
    }
    if (typeof window.Adsgram === 'undefined') {
        setTimeout(() => waitForAdsgram(attempt + 1), 500);
        return;
    }
    initAdsgram();
}

function initAdsgram() {
    try {
        AdController = window.Adsgram.init({
            blockId: BLOCK_ID,
            debug: true,                    // ✅ Ishlayotganida FALSE qiling
            debugBannerType: "RewardedVideo"
        });
        showDebug("✅ AdsGram tayyor!");
        showAd();
    } catch (e) {
        showDebug("❌ init xatoligi: " + e.message);
    }
}

async function showAd() {
    if (!AdController) {
        showDebug("❌ AdController yo'q");
        return;
    }

    statusText.innerText = "Reklama yuklanmoqda...";
    loader.style.display = "block";
    progressBarWrap.style.display = "none";
    progressBar.style.width = "0%";
    if (debugText) debugText.innerText = "";

    try {
        const result = await AdController.show();
        if (result && result.done) {
            statusText.innerText = "✅ Rahmat! Mukofot berildi.";
        } else {
            statusText.innerText = "⚠️ Reklama oxirigacha ko'rilmadi.";
        }
    } catch (error) {
        showDebug("❌ " + (error?.description || JSON.stringify(error)));
        statusText.innerText = "Reklama yuklanmadi.";
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
        progressBar.style.width = ((KUTISH_VAQTI - timeLeft) / KUTISH_VAQTI * 100) + "%";
        statusText.innerText = `Keyingi reklama: ${timeLeft} sek`;

        if (timeLeft <= 0) {
            clearInterval(interval);
            if (debugText) debugText.innerText = "";
            showAd();
        }
    }, 1000);
}
