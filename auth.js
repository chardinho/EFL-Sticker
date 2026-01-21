// Authentication module
window.auth = {
    // DOM elements
    authBox: document.getElementById("auth-box"),
    statusText: document.getElementById("auth-status"),
    logoutBtn: document.getElementById("logout-btn"),
    
    // Get current user's username
    getCurrentUsername: async function() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return null;

        const { data } = await supabaseClient
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();

        return data?.username || user.email?.split('@')[0] || 'User';
    },

    // Update header to show username
    updateUserDisplay: async function() {
        const username = await this.getCurrentUsername();
        if (username) {
            let welcomeElement = document.getElementById('welcome-message');
            
            if (!welcomeElement) {
                welcomeElement = document.createElement('div');
                welcomeElement.id = 'welcome-message';
                welcomeElement.style.cssText = `
                    font-weight: bold;
                    padding: 8px 12px;
                    background: white;
                    border-radius: 4px;
                    border: 1px solid #999;
                    min-width: 120px;
                    text-align: center;
                `;
                
                const packsDiv = document.getElementById('packs');
                if (packsDiv) {
                    packsDiv.parentNode.insertBefore(welcomeElement, packsDiv.nextSibling);
                }
            }
            
            welcomeElement.textContent = `👋 ${username}`;
        }
    },

    // Sign up with username
    signUpWithUsername: async function() {
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        if (!username || !password) {
            this.statusText.textContent = "Please enter username and password";
            this.statusText.style.color = "#ff6b6b";
            return;
        }

        if (username.length < 3) {
            this.statusText.textContent = "Username must be at least 3 characters";
            this.statusText.style.color = "#ff6b6b";
            return;
        }

        if (password.length < 6) {
            this.statusText.textContent = "Password must be at least 6 characters";
            this.statusText.style.color = "#ff6b6b";
            return;
        }

        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
            this.statusText.textContent = "Username can only contain letters, numbers, and underscores";
            this.statusText.style.color = "#ff6b6b";
            return;
        }

        this.statusText.textContent = "Creating account...";
        this.statusText.style.color = "#666";

        try {
            const email = utils.generateEmailFromUsername(username);
            
            // Check if username already exists
            const { data: existingUser } = await supabaseClient
                .from('profiles')
                .select('username')
                .eq('username', username)
                .single();

            if (existingUser) {
                this.statusText.textContent = "Username already taken!";
                this.statusText.style.color = "#ff6b6b";
                return;
            }

            // Sign up with Supabase
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username,
                        display_name: username
                    }
                }
            });

            if (error) {
                if (error.message.includes("already registered")) {
                    this.statusText.textContent = "Account already exists! Please login instead.";
                } else {
                    this.statusText.textContent = error.message;
                }
                this.statusText.style.color = "#ff6b6b";
                return;
            }

            // Create profile entry
            if (data.user) {
                const { error: profileError } = await supabaseClient
                    .from('profiles')
                    .upsert({
                        id: data.user.id,
                        username: username,
                        created_at: new Date().toISOString()
                    });

                if (profileError) {
                    this.statusText.textContent = "Error creating profile: " + profileError.message;
                    this.statusText.style.color = "#ff6b6b";
                    await supabaseClient.auth.signOut();
                    return;
                }

                // Create initial save data
                await window.game.createInitialSave(data.user.id);
                
                this.statusText.textContent = `Welcome ${username}! Account created successfully!`;
                this.statusText.style.color = "#32cd32";
                
                setTimeout(() => {
                    this.hideAuthBox();
                    window.game.loadGame();
                }, 1500);
            }
        } catch (err) {
            this.statusText.textContent = "Error: " + err.message;
            this.statusText.style.color = "#ff6b6b";
        }
    },

    // Login with username
    loginWithUsername: async function() {
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        if (!username || !password) {
            this.statusText.textContent = "Please enter username and password";
            this.statusText.style.color = "#ff6b6b";
            return;
        }

        this.statusText.textContent = "Logging in...";
        this.statusText.style.color = "#666";

        try {
            const { data: profileData, error: profileError } = await supabaseClient
                .from('profiles')
                .select('username')
                .eq('username', username)
                .single();

            if (profileError || !profileData) {
                this.statusText.textContent = "Username not found!";
                this.statusText.style.color = "#ff6b6b";
                return;
            }

            const email = utils.generateEmailFromUsername(username);
            
            const { error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                if (error.message.includes("Invalid login credentials")) {
                    this.statusText.textContent = "Incorrect password!";
                } else {
                    this.statusText.textContent = error.message;
                }
                this.statusText.style.color = "#ff6b6b";
            } else {
                this.statusText.textContent = `Welcome back ${username}!`;
                this.statusText.style.color = "#32cd32";
                
                setTimeout(() => {
                    this.hideAuthBox();
                    window.game.loadGame();
                }, 1000);
            }
        } catch (err) {
            this.statusText.textContent = "Error: " + err.message;
            this.statusText.style.color = "#ff6b6b";
        }
    },

    // Logout
    logout: async function() {
        await supabaseClient.auth.signOut();
        location.reload();
    },

    // Hide auth box
    hideAuthBox: function() {
        this.authBox.style.display = "none";
        document.body.classList.remove("locked");
    },

    // Show auth box
    showAuthBox: function() {
        this.authBox.style.display = "flex";
        document.body.classList.add("locked");
    },

    // Initialize auth event listeners
    initAuthListeners: function() {
        document.getElementById("login-btn").addEventListener("click", () => this.loginWithUsername());
        document.getElementById("signup-btn").addEventListener("click", () => this.signUpWithUsername());
        this.logoutBtn.addEventListener("click", () => this.logout());

        // Allow Enter key for login
        document.getElementById("username").addEventListener("keypress", (e) => {
            if (e.key === "Enter") this.loginWithUsername();
        });
        
        document.getElementById("password").addEventListener("keypress", (e) => {
            if (e.key === "Enter") this.loginWithUsername();
        });
    },

    // Check if user is authenticated
    checkAuth: async function() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        return user;
    }
};