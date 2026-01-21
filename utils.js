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

    // Main function to get random stickers for a pack
    getRandomStickers: function(count) {
        const stickers = [];

        // STEP 1: First card is guaranteed to be Badge, Kit, or Stadium from Championship/League One
        const firstCard = this.getGuaranteedSpecialCard();
        stickers.push(firstCard);

        // STEP 2: Fill remaining 4 cards with NON-Badge/Kit/Stadium stickers
        while (stickers.length < count) {
            const randomSticker = Math.floor(Math.random() * 692) + 1;

            // Avoid duplicates in the same pack
            if (stickers.includes(randomSticker)) {
                continue;
            }

            // Check if this sticker is a Badge/Kit/Stadium (we don't want more than one)
            const position = this.getStickerPositionInClub(randomSticker);

            // Only allow if it's NOT a Badge, Kit, or Stadium
            if (position !== "Badge" && position !== "Kit" && position !== "Stadium") {
                stickers.push(randomSticker);
            }
        }

        return stickers;
    },

    // Helper: Get position in club (Badge, Kit, Stadium, Player, or Special)
    getStickerPositionInClub: function(stickerNumber) {
        const category = this.getStickerCategory(stickerNumber);

        // Handle non-club categories
        if (category === "Magic Moments" || category === "ELITE" ||
            category === "Ones to Watch" || category === "Raised in the EFL") {
            return "Special";
        }

        if (category === "Championship") {
            let relativeNumber;
            if (stickerNumber <= 232) {
                relativeNumber = stickerNumber - 17;
            } else {
                relativeNumber = stickerNumber - 257;
            }

            const positionInSequence = relativeNumber % 18;

            if (positionInSequence === 0) return "Badge";
            if (positionInSequence === 1) return "Kit";
            if (positionInSequence === 8) return "Stadium";
            return "Player";
        }
        else if (category === "League One") {
            const relativeNumber = stickerNumber - 485;
            const positionInSequence = relativeNumber % 8;

            if (positionInSequence === 0) return "Badge";
            return "Player";
        }

        return "Unknown";
    },

    // Get a guaranteed Badge/Kit/Stadium card
    getGuaranteedSpecialCard: function() {
        // Array of all possible Badge/Kit/Stadium positions
        const specialCards = [];

        // Championship Part 1 (17-232): Badge, Kit, Stadium positions
        for (let i = 17; i <= 232; i++) {
            const position = this.getStickerPositionInClub(i);
            if (position === "Badge" || position === "Kit" || position === "Stadium") {
                specialCards.push(i);
            }
        }

        // Championship Part 2 (257-472): Badge, Kit, Stadium positions
        for (let i = 257; i <= 472; i++) {
            const position = this.getStickerPositionInClub(i);
            if (position === "Badge" || position === "Kit" || position === "Stadium") {
                specialCards.push(i);
            }
        }

        // League One (485-676): Badge positions only
        for (let i = 485; i <= 676; i++) {
            const position = this.getStickerPositionInClub(i);
            if (position === "Badge") {
                specialCards.push(i);
            }
        }

        // Pick a random special card
        return specialCards[Math.floor(Math.random() * specialCards.length)];
    },

    // Get category of sticker
    getStickerCategory: function(stickerNumber) {
        if (stickerNumber >= 1 && stickerNumber <= 16) {
            return "Magic Moments";
        } else if (stickerNumber >= 17 && stickerNumber <= 232) {
            return "Championship";
        } else if (stickerNumber >= 233 && stickerNumber <= 256) {
            return "ELITE";
        } else if (stickerNumber >= 257 && stickerNumber <= 472) {
            return "Championship";
        } else if (stickerNumber >= 473 && stickerNumber <= 484) {
            return "Ones to Watch";
        } else if (stickerNumber >= 485 && stickerNumber <= 676) {
            return "League One";
        } else if (stickerNumber >= 677 && stickerNumber <= 692) {
            return "Raised in the EFL";
        } else {
            return "Unknown";
        }
    },

    // Get sticker type (Badge, Kit, Stadium, Player, Special)
    getStickerType: function(stickerNumber) {
        const category = this.getStickerCategory(stickerNumber);

        // Non-club categories are Special
        if (category === "Magic Moments" || category === "ELITE" ||
            category === "Ones to Watch" || category === "Raised in the EFL") {
            return "Special";
        }

        if (category === "Championship") {
            let relativeNumber;
            if (stickerNumber <= 232) {
                relativeNumber = stickerNumber - 17;
            } else {
                relativeNumber = stickerNumber - 257;
            }

            const positionInSequence = relativeNumber % 18;

            switch(positionInSequence) {
                case 0: return "Badge";
                case 1: return "Kit";
                case 2: case 3: case 4: case 5: case 6: case 7: return "Player";
                case 8: return "Stadium";
                case 9: case 10: case 11: case 12: case 13: case 14: case 15: case 16: case 17: return "Player";
                default: return "Player";
            }
        }
        else if (category === "League One") {
            const relativeNumber = stickerNumber - 485;
            const positionInSequence = relativeNumber % 8;

            switch(positionInSequence) {
                case 0: return "Badge";
                case 1: case 2: case 3: case 4: case 5: case 6: case 7: return "Player";
                default: return "Player";
            }
        }

        return "Unknown";
    },

    // Get club name for Championship or League One stickers
    getStickerClub: function(stickerNumber) {
        const category = this.getStickerCategory(stickerNumber);

        if (category === "Championship") {
            let relativeNumber;
            let part;
            if (stickerNumber <= 232) {
                relativeNumber = stickerNumber - 17;
                part = 1;
            } else {
                relativeNumber = stickerNumber - 257;
                part = 2;
            }
            const clubIndex = Math.floor(relativeNumber / 18);
            return `Championship Club ${clubIndex + 1} (Part ${part})`;
        }
        else if (category === "League One") {
            const relativeNumber = stickerNumber - 485;
            const clubIndex = Math.floor(relativeNumber / 8);
            return `League One Club ${clubIndex + 1}`;
        }

        return "N/A";
    },

    // Get exact position (e.g., "Badge", "Player 1", "Stadium")
    getStickerPosition: function(stickerNumber) {
        const category = this.getStickerCategory(stickerNumber);
        const type = this.getStickerType(stickerNumber);

        if (type === "Special" || type === "Unknown") {
            return type;
        }

        if (category === "Championship") {
            let relativeNumber;
            if (stickerNumber <= 232) {
                relativeNumber = stickerNumber - 17;
            } else {
                relativeNumber = stickerNumber - 257;
            }

            const positionInSequence = relativeNumber % 18;

            if (positionInSequence === 0) return "Badge";
            if (positionInSequence === 1) return "Kit";
            if (positionInSequence === 8) return "Stadium";

            if (positionInSequence >= 2 && positionInSequence <= 7) {
                return `Player ${positionInSequence - 1}`;
            }
            if (positionInSequence >= 9 && positionInSequence <= 17) {
                return `Player ${positionInSequence - 2}`;
            }
        }
        else if (category === "League One") {
            const relativeNumber = stickerNumber - 485;
            const positionInSequence = relativeNumber % 8;

            if (positionInSequence === 0) return "Badge";
            if (positionInSequence >= 1 && positionInSequence <= 7) {
                return `Player ${positionInSequence}`;
            }
        }

        return "Unknown Position";
    },

    // Get section ID for filtering
    getStickerSection: function(stickerNumber) {
        if (stickerNumber >= 1 && stickerNumber <= 16) {
            return "magic-moments";
        } else if (stickerNumber >= 17 && stickerNumber <= 232) {
            return "championship-1";
        } else if (stickerNumber >= 233 && stickerNumber <= 256) {
            return "elite";
        } else if (stickerNumber >= 257 && stickerNumber <= 472) {
            return "championship-2";
        } else if (stickerNumber >= 473 && stickerNumber <= 484) {
            return "ones-to-watch";
        } else if (stickerNumber >= 485 && stickerNumber <= 676) {
            return "league-one";
        } else if (stickerNumber >= 677 && stickerNumber <= 692) {
            return "raised-efl";
        } else {
            return "unknown";
        }
    }
};