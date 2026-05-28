/* ==========================================================================
   OXIFLOW KANBAN MAIN APPLICATION ORCHESTRATOR
   Handles views, routing, theme switching, search, session, and global events.
   ========================================================================== */

// Application State
const state = {
    currentView: 'dashboard', // default view
    theme: 'dark'            // 'dark' or 'light'
};

// DOM Elements Cache
const DOM = {
    appContent: document.getElementById('app-content'),
    navDashboard: document.getElementById('nav-dashboard'),
    navKanban: document.getElementById('nav-kanban'),
    themeToggle: document.getElementById('theme-toggle'),
    mobileToggle: document.getElementById('mobile-toggle'),
    sidebar: document.getElementById('sidebar'),
    currentDate: document.getElementById('current-date'),
    searchInput: document.getElementById('search-input'),
    searchContainer: document.getElementById('global-search-container')
};

// Initialize Application
const init = () => {
    try {
        initTheme();
        initDateTime();
        initNavigation();
        initMobileMenu();
        initSearch();
        initGoogleLogin();   // Session & authentication flow
        initScopeSwitcher(); // Personal vs. Shared scopes switching
    } catch (err) {
        console.error("Fallo en inicialización de Oxiflow Kanban:", err);
        if (window.showAppError) {
            window.showAppError(err.message, err.stack || err.toString());
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Theme Management
const initTheme = () => {
    const savedTheme = localStorage.getItem('oxiflow_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    state.theme = savedTheme || (prefersDark ? 'dark' : 'light');
    applyTheme();

    DOM.themeToggle.addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        applyTheme();
    });
};

const applyTheme = () => {
    const textSpan = DOM.themeToggle.querySelector('.theme-toggle-text');
    
    if (state.theme === 'dark') {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        textSpan.textContent = 'Modo Claro';
        localStorage.setItem('oxiflow_theme', 'dark');
    } else {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        textSpan.textContent = 'Modo Oscuro';
        localStorage.setItem('oxiflow_theme', 'light');
    }
};

// Date Header Badge Helper
const initDateTime = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    let dateStr = today.toLocaleDateString('es-ES', options);
    dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    DOM.currentDate.textContent = dateStr;
};

// Single Page App Router
const initNavigation = () => {
    const buttons = [DOM.navDashboard, DOM.navKanban];
    
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const button = e.currentTarget;
            const targetView = button.getAttribute('data-view');
            
            if (targetView === state.currentView) return;
            
            buttons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            
            switchView(targetView);
            
            DOM.sidebar.classList.remove('mobile-open');
        });
    });
};

var switchView = (viewName) => {
    try {
        state.currentView = viewName;
        DOM.searchInput.value = '';
        
        DOM.appContent.style.animation = 'none';
        void DOM.appContent.offsetWidth; 
        DOM.appContent.style.animation = 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
        
        if (viewName === 'dashboard') {
            DOM.searchContainer.classList.add('hidden');
            renderDashboard(DOM.appContent);
        } else if (viewName === 'kanban') {
            DOM.searchContainer.classList.remove('hidden');
            renderKanban(DOM.appContent);
        }
    } catch (err) {
        console.error("Fallo en switchView:", err);
        if (window.showAppError) {
            window.showAppError(err.message, err.stack || err.toString());
        }
    }
};

// Mobile responsive drawer toggle
const initMobileMenu = () => {
    DOM.mobileToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.sidebar.classList.toggle('mobile-open');
    });
    
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            DOM.sidebar.classList.contains('mobile-open') && 
            !DOM.sidebar.contains(e.target) && 
            !DOM.mobileToggle.contains(e.target)) {
            DOM.sidebar.classList.remove('mobile-open');
        }
    });
};

// Global search handling
const initSearch = () => {
    DOM.searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (state.currentView === 'kanban') {
            handleKanbanSearch(query);
        }
    });
};

// Google GSI authentication logic and lock overlay control
const initGoogleLogin = () => {
    const loginOverlay = document.getElementById('login-overlay');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const gModal = document.getElementById('g-modal-overlay');
    const gCancelBtn = document.getElementById('g-cancel-btn');
    const gAccountItems = document.querySelectorAll('.g-account-item');

    const updateUserProfileUI = (user) => {
        const avatarEl = document.querySelector('.sidebar .user-profile .avatar');
        const nameEl = document.querySelector('.sidebar .user-profile .user-name');
        const roleEl = document.querySelector('.sidebar .user-profile .user-role');
        
        if (avatarEl && nameEl && roleEl) {
            if (user) {
                avatarEl.innerHTML = `<img src="${user.picture}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                nameEl.textContent = user.name;
                roleEl.textContent = user.email;
            } else {
                avatarEl.innerHTML = 'U';
                nameEl.textContent = 'Usuario Demo';
                roleEl.textContent = 'Administrador';
            }
        }
    };

    const session = getActiveUserSession();
    if (session) {
        loginOverlay.classList.add('hidden');
        updateUserProfileUI(session);
        switchView(state.currentView);
    } else {
        loginOverlay.classList.remove('hidden');
    }

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            gModal.classList.add('show');
        });
    }

    if (gCancelBtn) {
        gCancelBtn.addEventListener('click', () => {
            gModal.classList.remove('show');
        });
    }

    gAccountItems.forEach(item => {
        item.addEventListener('click', () => {
            const name = item.getAttribute('data-name');
            const email = item.getAttribute('data-email');
            const picture = item.getAttribute('data-picture');
            
            gModal.classList.remove('show');
            
            const originalContent = googleLoginBtn.innerHTML;
            googleLoginBtn.disabled = true;
            googleLoginBtn.innerHTML = `
                <svg class="animate-spin" style="width: 18px; height: 18px; margin-right: 8px; animation: rotateLogo 1s linear infinite;" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" style="opacity: 0.25;"></circle>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style="opacity: 0.75;"></path>
                </svg>
                Verificando cuenta Google...
            `;
            
            setTimeout(() => {
                const user = { name, email, picture };
                localStorage.setItem('oxiflow_user_session', JSON.stringify(user));
                
                googleLoginBtn.disabled = false;
                googleLoginBtn.innerHTML = originalContent;
                
                loginOverlay.classList.add('hidden');
                updateUserProfileUI(user);
                
                state.currentView = 'dashboard';
                switchView(state.currentView);
                addActivityLog(`Sesión iniciada con Google`, 'Tablero', 'low');
            }, 1200);
        });
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('¿Estás seguro de que deseas cerrar tu sesión en Oxiflow Kanban?')) {
                addActivityLog(`Sesión cerrada`, 'Tablero', 'low');
                localStorage.removeItem('oxiflow_user_session');
                updateUserProfileUI(null);
                loginOverlay.classList.remove('hidden');
                DOM.sidebar.classList.remove('mobile-open');
            }
        });
    }
};

// Scope switcher controls (Personal vs. Shared)
const initScopeSwitcher = () => {
    const scopePersonalBtn = document.getElementById('scope-personal-btn');
    const scopeSharedBtn = document.getElementById('scope-shared-btn');

    if (!scopePersonalBtn || !scopeSharedBtn) return;

    const savedScope = localStorage.getItem('oxiflow_active_scope') || 'personal';
    
    if (savedScope === 'shared') {
        scopePersonalBtn.classList.remove('active');
        scopeSharedBtn.classList.add('active');
    } else {
        scopePersonalBtn.classList.add('active');
        scopeSharedBtn.classList.remove('active');
    }

    const setScope = (scope) => {
        const currentScope = localStorage.getItem('oxiflow_active_scope') || 'personal';
        if (currentScope === scope) return;

        localStorage.setItem('oxiflow_active_scope', scope);
        if (scope === 'shared') {
            scopePersonalBtn.classList.remove('active');
            scopeSharedBtn.classList.add('active');
        } else {
            scopePersonalBtn.classList.add('active');
            scopeSharedBtn.classList.remove('active');
        }

        // Re-render current active view instantly with new data key
        switchView(state.currentView);
        addActivityLog(`Se cambió al tablero ${scope === 'shared' ? 'Compartido' : 'Personal'}`, 'Tablero', 'low');
    };

    scopePersonalBtn.addEventListener('click', () => setScope('personal'));
    scopeSharedBtn.addEventListener('click', () => setScope('shared'));
};
