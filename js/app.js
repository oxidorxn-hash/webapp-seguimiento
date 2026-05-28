/* ==========================================================================
   VELOCE TRACKER MAIN APPLICATION ORCHESTRATOR
   Handles views, routing, theme switching, search, and global events.
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
        
        // Load initial view
        switchView(state.currentView);
    } catch (err) {
        console.error("Fallo en inicialización de Veloce Tracker:", err);
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
    // Check saved preference or system preference
    const savedTheme = localStorage.getItem('veloce_theme');
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
        localStorage.setItem('veloce_theme', 'dark');
    } else {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        textSpan.textContent = 'Modo Oscuro';
        localStorage.setItem('veloce_theme', 'light');
    }
};

// Date Header Badge Helper
const initDateTime = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    // Capitalize first letter
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
            
            // Update active state in nav sidebar
            buttons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            
            // Switch current view
            switchView(targetView);
            
            // Close mobile menu if open
            DOM.sidebar.classList.remove('mobile-open');
        });
    });
};

var switchView = (viewName) => {
    try {
        state.currentView = viewName;
        
        // Clear search value when changing views
        DOM.searchInput.value = '';
        
        // Transition out, load content, transition in
        DOM.appContent.style.animation = 'none';
        // Trigger reflow to restart animation
        void DOM.appContent.offsetWidth; 
        DOM.appContent.style.animation = 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
        
        if (viewName === 'dashboard') {
            // Hide global search container for dashboard
            DOM.searchContainer.classList.add('hidden');
            renderDashboard(DOM.appContent);
        } else if (viewName === 'kanban') {
            // Show global search container for Kanban
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
    
    // Close sidebar if user clicks outside of it on mobile
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
