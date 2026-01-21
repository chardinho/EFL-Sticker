// Game logic module
window.game = {
    // Game state
    STICKERS_TOTAL: 692,
    coins: 100,
    packsOpened: 0,
    flippedCount: 0,
    packInProgress: false,
    userCollection: [],
    duplicates: {},

    // DOM elements
    stickerArea: document.getElementById('sticker-area'),
    coinsLabel: document.getElementById('coins'),
    packsLabel: document.getElementById('packs'),
    openPackBtn: document.getElementById('open-pack'),

    // Create initial save data
    createInitialSave: async function(userId) {
        const initialData = {
            id: userId,
            coins: 100,
            packs_opened: 0,
            collection: [],
            duplicates: {}
        };

        const { error } = await supabaseClient
            .from("saves")
            .upsert(initialData, { onConflict: 'id' });

        if (error) {
            console.error("Error creating initial save:", error);
            return false;
        }
        return true;
    },

    // Save game function
    saveGame: async function() {
        const { data: { user } } = await supabaseClient.auth.getUser();

        if (!user) {
            console.error("Cannot save: No user logged in");
            return false;
        }

        const data = {
            id: user.id,
            coins: this.coins,
            packs_opened: this.packsOpened,
            collection: this.userCollection,
            duplicates: this.duplicates,
            updated_at: new Date().toISOString()
        };

        console.log("Saving data:", data);

        const { error } = await supabaseClient
            .from("saves")
            .upsert(data, { onConflict: 'id' });

        if (error) {
            console.error("Save failed:", error);
            alert("Failed to save game: " + error.message);
            return false;
        } else {
            console.log("Game saved to cloud successfully");
            return true;
        }
    },

    // Load game from Supabase
    loadGame: async function() {
        const { data: { user } } = await supabaseClient.auth.getUser();

        if (!user) {
            window.auth.showAuthBox();
            return;
        }

        // Show logout button
        document.getElementById("logout-btn").style.display = "inline-block";

        // Load from Supabase
        const { data, error } = await supabaseClient
            .from("saves")
            .select("*")
            .eq("id", user.id)
            .single();

        if (error) {
            console.error("Load error:", error);

            // If no save exists, create one
            if (error.code === 'PGRST116') {
                console.log("No save found, creating initial save...");
                await this.createInitialSave(user.id);
            }
        } else if (data) {
            console.log("Loaded save data:", data);

            // Load game data
            this.coins = data.coins ?? 100;
            this.packsOpened = data.packs_opened ?? 0;

            // Clear and reload collections
            this.userCollection.length = 0;
            if (data.collection && Array.isArray(data.collection)) {
                this.userCollection.push(...data.collection);
            }

            // Clear and reload duplicates
            for (let key in this.duplicates) delete this.duplicates[key];
            if (data.duplicates && typeof data.duplicates === 'object') {
                Object.assign(this.duplicates, data.duplicates);
            }

            console.log("Loaded collection:", this.userCollection);
            console.log("Loaded duplicates:", this.duplicates);
        }

        // Update user display and labels
        await window.auth.updateUserDisplay();
        this.updateLabels();
    },

    // Coin flip game
    coinFlipGame: async function() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            alert("Please login first!");
            return;
        }

        if (this.coins < 10) {
            alert("Not enough coins! Need 10 coins to play.");
            return;
        }

        this.coins -= 10;
        const win = Math.random() < 0.75;

        if (win) {
            this.coins += 25;
            alert("You won 25 coins! 🎉");
        } else {
            alert("You lost 10 coins 😭");
        }

        this.updateLabels();
        await this.saveGame();
    },

    // Reset game
    resetGame: async function() {
        if (!confirm("Are you sure you want to reset your account? You'll lose all progress!")) {
            return;
        }

        this.coins = 100;
        this.packsOpened = 0;
        this.userCollection.length = 0;

        for (let key in this.duplicates) {
            delete this.duplicates[key];
        }

        this.updateLabels();
        this.stickerArea.innerHTML = '';

        this.openPackBtn.disabled = false;
        this.openPackBtn.classList.remove('disabled');
        this.openPackBtn.textContent = "🎁 OPEN PACK (5 Coins)";
        this.packInProgress = false;

        const saved = await this.saveGame();
        if (saved) {
            utils.vibrate(30);
            alert("Game reset successfully!");
        } else {
            alert("Failed to reset game!");
        }
    },

    // Update UI labels
    updateLabels: function() {
        this.coinsLabel.textContent = `💰 Coins: ${this.coins}`;
        this.packsLabel.textContent = `📦 Packs: ${this.packsOpened}`;
        this.openPackBtn.classList.toggle('disabled', this.coins < 5 || this.packInProgress);
    },

    // Open pack
    openPack: async function() {
        if (this.packInProgress) return;

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            alert("Please login first!");
            return;
        }

        if (this.coins < 5) {
            alert("Not enough coins!");
            return;
        }

        this.packInProgress = true;
        this.openPackBtn.disabled = true;
        this.openPackBtn.classList.add('disabled');
        this.flippedCount = 0;
        this.openPackBtn.textContent = "🔒 Flip all cards first";

        this.updateLabels();
        this.coins -= 5;
        this.packsOpened++;

        this.updateLabels();

        utils.vibrate(50);

        this.stickerArea.innerHTML = '';
        const stickers = utils.getRandomStickers(5);

        const centerX = this.stickerArea.offsetWidth / 2 - 80;
        const centerY = this.stickerArea.offsetHeight / 2 - 120;

        stickers.forEach((num, i) => {
            const card = document.createElement('div');
            card.className = 'sticker-card stacked';
            card.dataset.number = num;

            card.style.left = `${centerX + i * 2}px`;
            card.style.top = `${centerY + i * 2}px`;

            const img = document.createElement('img');
            img.src = `images/${num}.png`;
            img.alt = `Sticker #${num}`;

            card.innerHTML = `
                <div class="sticker-front">
                    <div class="card-number">#${num}</div>
                    <div class="card-category">${utils.getStickerCategory(num)}</div>
                </div>    
                <div class="sticker-back">
                    <div id="img-container-${num}"></div>
                    <div class="card-number">#${num}</div>
                </div>
            `;

            // Add this line after creating the card element:
            const category = utils.getStickerCategory(num).toLowerCase().replace(/ /g, '-');
            card.dataset.category = category;

            const cardBack = card.querySelector('.sticker-back');
            utils.setupImageRotation(img, num, cardBack);

            const imgContainer = card.querySelector(`#img-container-${num}`);
            imgContainer.appendChild(img);


            card.addEventListener('click', () => {
                if (!card.classList.contains('flipped')) {
                    card.classList.add('flipped');
                    utils.vibrate(15);

                    this.flippedCount++;

                    if (this.flippedCount === 5) {
                        this.packInProgress = false;

                        if (this.coins >= 5) {
                            this.openPackBtn.disabled = false;
                            this.openPackBtn.classList.remove('disabled');
                            this.openPackBtn.textContent = "🎁 OPEN PACK (5 Coins)";
                        } else {
                            this.openPackBtn.disabled = true;
                            this.openPackBtn.classList.add('disabled');
                            this.openPackBtn.textContent = "❌ Not enough coins";
                        }

                        this.updateLabels();
                    }
                } else {
                    // Display the flipped sticker in a modal
                    this.displayStickerModal(num);
                }
            });

            this.stickerArea.appendChild(card);

            // Add to collection or duplicates
            if (this.userCollection.includes(num)) {
                this.duplicates[num] = (this.duplicates[num] || 0) + 1;
                console.log(`Duplicate found: #${num}, total: ${this.duplicates[num]}`);
            } else {
                this.userCollection.push(num);
                console.log(`New sticker: #${num}, total collection: ${this.userCollection.length}`);
            }
        });

        // Animate cards spreading
        setTimeout(() => {
            const cards = document.querySelectorAll('.sticker-card');
            const areaWidth = this.stickerArea.offsetWidth;
            const areaHeight = this.stickerArea.offsetHeight;

            const isMobile = areaWidth < 600;
            const cardsPerRow = isMobile ? Math.min(3, cards.length) : 5;

            cards.forEach((card, i) => {
                card.classList.remove('stacked');
                card.classList.add('spread');

                const row = Math.floor(i / cardsPerRow);
                const col = i % cardsPerRow;

                const cardWidth = 160;
                const cardHeight = 240;
                const spacing = isMobile ? 10 : 20;

                const totalWidth = cardsPerRow * cardWidth + (cardsPerRow - 1) * spacing;
                const startX = (areaWidth - totalWidth) / 2;
                const startY = (areaHeight - cardHeight) / 2 - row * (cardHeight / 2);

                const finalX = startX + col * (cardWidth + spacing);
                const finalY = Math.max(10, startY + row * (cardHeight + spacing));

                card.style.left = `${finalX}px`;
                card.style.top = `${finalY}px`;
            });
        }, 300);

        // Save after opening pack
        const saved = await this.saveGame();
        if (!saved) {
            console.error("Failed to save after opening pack!");
        }
    },

// Replace the refreshAlbum function in game.js with this version
    refreshAlbum: function() {
        const grid = document.getElementById('album-grid');
        const countLabel = document.getElementById('album-count');
        grid.innerHTML = '';

        const collectedCount = this.userCollection.length;
        countLabel.textContent = `Collected ${collectedCount} / ${this.STICKERS_TOTAL} stickers`;

        for (let i = 1; i <= this.STICKERS_TOTAL; i++) {
            const slot = document.createElement('div');
            slot.className = 'album-slot';

            // Make collected stickers clickable
            if (this.userCollection.includes(i)) {
                const img = document.createElement('img');
                img.src = `images/${i}.png`;
                img.alt = `Sticker #${i}`;

                img.onload = function() {
                    if (this.naturalWidth > this.naturalHeight) {
                        this.classList.add('landscape');
                        slot.classList.add('has-landscape');
                    }
                };
                img.onerror = function() {
                    const parent = this.parentElement;
                    parent.innerHTML = `<div style='font-size:24px;color:#333'>#${i}</div>`;
                };

                slot.innerHTML = `<div class="slot-number">#${i}</div>`;
                slot.insertBefore(img, slot.firstChild);

                // Add click event to show sticker in modal
                slot.style.cursor = 'pointer';

                // Use a closure to capture the current value of i
                (function(stickerNum) {
                    slot.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        window.game.displayStickerModal(stickerNum);
                    });
                })(i);

                // Simplified hover effects for desktop
                slot.addEventListener('mouseenter', function() {
                    this.style.transform = 'scale(1.05)';
                    this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                });

                slot.addEventListener('mouseleave', function() {
                    this.style.transform = 'scale(1)';
                    this.style.boxShadow = 'none';
                });

                // Touch feedback for mobile
                slot.addEventListener('touchstart', function() {
                    this.style.transform = 'scale(0.95)';
                }, {passive: true});

                slot.addEventListener('touchend', function() {
                    this.style.transform = 'scale(1)';
                }, {passive: true});
            } else {
                slot.innerHTML = '?';
                slot.style.cursor = 'default';
            }

            grid.appendChild(slot);
        }
    },
    // Duplicates functions
    refreshDuplicates: function() {
        const grid = document.getElementById('duplicates-grid');
        grid.innerHTML = '';

        const duplicateKeys = Object.keys(this.duplicates);
        console.log("Refreshing duplicates, count:", duplicateKeys.length);

        if (duplicateKeys.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999; padding: 40px;">No duplicates yet!</p>';
            return;
        }

        duplicateKeys.forEach(key => {
            const i = parseInt(key);
            const count = this.duplicates[key];

            const slot = document.createElement('div');
            slot.className = 'duplicate-slot';
            slot.style.position = 'relative';

            const img = document.createElement('img');
            img.src = `images/${i}.png`;
            img.alt = `Sticker #${i}`;

            img.onload = function() {
                if (this.naturalWidth > this.naturalHeight) {
                    this.classList.add('landscape');
                    slot.classList.add('has-landscape');
                }
            };
            img.onerror = function() {
                const parent = this.parentElement;
                parent.innerHTML = `<div style='font-size:24px;color:#333'>#${i}</div><div style="position: absolute; top: 5px; right: 5px; background: #ff6b6b; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold;">×${count}</div>`;
            };

            slot.innerHTML = `
                <div class="slot-number">#${i}</div>
                <div style="position: absolute; top: 5px; right: 5px; background: #ff6b6b; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">×${count}</div>
            `;
            slot.insertBefore(img, slot.firstChild);
            grid.appendChild(slot);
        });
    },

    // Sell duplicates
    sellDuplicates: async function() {
        const duplicateKeys = Object.keys(this.duplicates);
        if (duplicateKeys.length === 0) {
            alert('No duplicates to sell!');
            return;
        }

        let totalDuplicates = 0;
        duplicateKeys.forEach(key => {
            totalDuplicates += this.duplicates[key];
        });

        this.coins += totalDuplicates;

        for (let key in this.duplicates) {
            delete this.duplicates[key];
        }

        this.updateLabels();
        this.refreshDuplicates();
        const saved = await this.saveGame();
        if (saved) {
            utils.vibrate(50);
            alert(`Sold ${totalDuplicates} duplicates for ${totalDuplicates} coins!`);
        } else {
            alert("Failed to save after selling duplicates!");
        }
    },

    // Initialize game event listeners
    initGameListeners: function() {
        this.openPackBtn.addEventListener('click', () => this.openPack());
        document.getElementById('save-btn').addEventListener('click', async () => {
            const saved = await this.saveGame();
            if (saved) {
                alert('Game saved successfully!');
            } else {
                alert('Failed to save game!');
            }
        });

        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('coin-flip').addEventListener('click', () => this.coinFlipGame());

        document.getElementById('album-btn').addEventListener('click', () => {
            document.getElementById('album').style.display = 'block';
            this.refreshAlbum();
            utils.vibrate(10);
        });

        document.getElementById('duplicates-btn').addEventListener('click', () => {
            document.getElementById('duplicates').style.display = 'block';
            this.refreshDuplicates();
            utils.vibrate(10);
        });

        document.getElementById('sell-duplicates').addEventListener('click', () => this.sellDuplicates());
    },

    // Display sticker modal
    displayStickerModal: function(stickerNum) {
        const modal = document.getElementById('sticker-display-modal');
        const imgContainer = document.getElementById('sticker-display-img-container');
        const numberDisplay = document.getElementById('sticker-display-number');
        const modalContent = modal.querySelector('.modal-content');

        if (!modal || !imgContainer || !numberDisplay) return;

        // Clear previous content and classes
        imgContainer.innerHTML = '';
        numberDisplay.textContent = `#${stickerNum}`;

        // Remove any existing category classes
        modalContent.className = 'modal-content';

        // Get the category and add it as a class
        const category = utils.getStickerCategory(stickerNum).toLowerCase().replace(/ /g, '-');
        modalContent.classList.add(`category-${category}`);

        // Create and setup the image
        const img = document.createElement('img');
        img.src = `images/${stickerNum}.png`;
        img.alt = `Sticker #${stickerNum}`;
        img.onload = function() {
            if (this.naturalWidth > this.naturalHeight) {
                this.classList.add('landscape');
            }
        };
        img.onerror = function() {
            imgContainer.innerHTML = `<div style='font-size: 60px; color: #333; text-align: center;'>#${stickerNum}</div>`;
        };

        imgContainer.appendChild(img);
        modal.style.display = 'flex';
        utils.vibrate(10);
    }
};
