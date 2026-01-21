// Utility functions - make them globally available
window.utils = {
    // Haptic feedback
    vibrate: function(duration = 10) {
        if ('vibrate' in navigator) {
            navigator.vibrate(duration);
        }
    },

    // Generate email from username
    generateEmailFromUsername: function(username) {
        return `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@sticker.game`;
    },

    // Setup image rotation
    setupImageRotation: function(img, stickerNum, cardBack) {
        img.onload = function() {
            if (this.naturalWidth > this.naturalHeight) {
                this.classList.add('landscape');
                if (cardBack) {
                    cardBack.classList.add('has-landscape');
                }
            }
        };
        img.onerror = function() {
            const parent = this.parentElement;
            parent.innerHTML = `<div style='font-size:60px;color:#333'>#${stickerNum}</div>`;
        };
    },

    // Get random stickers
    getRandomStickers: function(count) {
        const STICKERS_TOTAL = 700;
        const nums = Array.from({length: STICKERS_TOTAL}, (_, i) => i + 1);
        nums.sort(() => Math.random() - 0.5);
        return nums.slice(0, count);
    }
};