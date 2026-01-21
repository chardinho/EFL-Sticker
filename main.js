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
});