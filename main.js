// Main initialization script
document.addEventListener('DOMContentLoaded', async function() {
    // Wait for all scripts to load
    setTimeout(async function() {
        // Initialize auth listeners
        window.auth.initAuthListeners();

        // Initialize game listeners
        window.game.initGameListeners();

        // Always show auth box on initial load
        window.auth.showAuthBox();

        // Check if user is already logged in
        const user = await window.auth.checkAuth();
        if (user) {
            window.auth.hideAuthBox();
            await window.game.loadGame();
        }

        // Update labels
        window.game.updateLabels();
    }, 100); // Small delay to ensure all scripts are loaded

    // Modal close handlers - moved outside nested DOMContentLoaded
    const modal = document.getElementById('sticker-display-modal');

    // Close modal when clicking outside the content
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (modal && e.key === 'Escape' && modal.style.display === 'flex') {
            modal.style.display = 'none';
        }
    });
});