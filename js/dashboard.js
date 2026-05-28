/* ==========================================================================
   DASHBOARD VIEW CONTROLLER
   Computes metrics, draws native custom SVGs, and renders the activity feed.
   ========================================================================== */



/**
 * Calculates metrics and builds the dashboard user interface inside the container.
 * @param {HTMLElement} container - The main container to render the view into.
 */
var renderDashboard = (container) => {
    const data = getBoardData();
    const logs = getActivityLogs();
    
    // 1. COMPUTE STATISTICS
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    let overdueTasks = 0;
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Identify completed column dynamically (by ID, text match, or falling back to the last column)
    let completedColId = '';
    const completedCol = data.columns.find(col => 
        col.id === 'col-completed' || 
        col.title.toLowerCase().includes('complet') || 
        col.title.toLowerCase().includes('hecho') || 
        col.title.toLowerCase().includes('done')
    );
    
    if (completedCol) {
        completedColId = completedCol.id;
    } else if (data.columns.length > 0) {
        completedColId = data.columns[data.columns.length - 1].id;
    }

    // Identify in-progress column dynamically
    let inProgressColId = '';
    const inProgressCol = data.columns.find(col => 
        col.id === 'col-inprogress' || 
        col.title.toLowerCase().includes('progres') || 
        col.title.toLowerCase().includes('proces') || 
        col.title.toLowerCase().includes('haciendo')
    );
    if (inProgressCol) {
        inProgressColId = inProgressCol.id;
    }

    // Traverse board to compute counts
    data.columns.forEach(column => {
        const count = column.tasks.length;
        totalTasks += count;
        
        if (column.id === completedColId) {
            completedTasks += count;
        } else if (column.id === inProgressColId) {
            inProgressTasks += count;
        }
        
        // Count overdue tasks (not in completed column, and date < today)
        if (column.id !== completedColId) {
            column.tasks.forEach(task => {
                if (task.date && task.date < todayStr) {
                    overdueTasks++;
                }
            });
        }
    });

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 2. GENERATE DYNAMIC GREETING
    const hour = new Date().getHours();
    let greeting = '¡Hola!';
    if (hour >= 6 && hour < 12) greeting = '¡Buenos días!';
    else if (hour >= 12 && hour < 20) greeting = '¡Buenas tardes!';
    else greeting = '¡Buenas noches!';

    // 3. BUILD INTERFACE LAYOUT
    let html = `
        <div class="dashboard-header-intro" style="margin-bottom: 28px;">
            <h1 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 4px;">${greeting}, Usuario</h1>
            <p style="color: var(--text-secondary); font-size: 0.95rem;">Aquí tienes el resumen y estado general de tus temas pendientes.</p>
        </div>

        <!-- Metric Cards Grid -->
        <div class="dashboard-grid">
            <div class="glass-panel metric-card">
                <div class="metric-icon-box accent">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                </div>
                <div class="metric-details">
                    <span class="metric-title">Total Tareas</span>
                    <span class="metric-value">${totalTasks}</span>
                </div>
            </div>
            
            <div class="glass-panel metric-card">
                <div class="metric-icon-box success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>
                </div>
                <div class="metric-details">
                    <span class="metric-title">Completadas</span>
                    <span class="metric-value">${completedTasks}</span>
                </div>
            </div>
            
            <div class="glass-panel metric-card">
                <div class="metric-icon-box warning">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                </div>
                <div class="metric-details">
                    <span class="metric-title">En Progreso</span>
                    <span class="metric-value">${inProgressTasks}</span>
                </div>
            </div>
            
            <div class="glass-panel metric-card">
                <div class="metric-icon-box danger">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>
                </div>
                <div class="metric-details">
                    <span class="metric-title">Atrasadas</span>
                    <span class="metric-value">${overdueTasks}</span>
                </div>
            </div>
        </div>

        <!-- Charts Section -->
        <div class="charts-row">
            <!-- Columns Task Bar Chart -->
            <div class="glass-panel chart-panel">
                <div class="chart-header">
                    <h3>Carga de Trabajo por Columna</h3>
                    <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 500;">Tareas por estado</span>
                </div>
                <div class="chart-container" id="bar-chart-container">
                    <!-- Dynamic Bars Loaded Here -->
                </div>
            </div>

            <!-- SVG Donut Progress Chart -->
            <div class="glass-panel chart-panel">
                <div class="chart-header">
                    <h3>Progreso General</h3>
                    <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 500;">Tasa de éxito</span>
                </div>
                <div class="chart-container">
                    <div class="svg-donut-container">
                        <svg class="donut-svg" width="160" height="160" viewBox="0 0 120 120">
                            <!-- Background Circle -->
                            <circle class="donut-ring" cx="60" cy="60" r="50" fill="transparent" stroke-width="10"></circle>
                            <!-- Animated Foreground Circle (circumference is 2 * pi * 50 = 314.16) -->
                            <circle class="donut-segment" cx="60" cy="60" r="50" fill="transparent" stroke-width="10" 
                                    stroke-dasharray="314.16" stroke-dashoffset="314.16" id="donut-progress-segment"
                                    stroke-linecap="round"></circle>
                        </svg>
                        <div class="donut-number">
                            <span class="donut-pct">${completionRate}%</span>
                            <span class="donut-label">Completado</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Activity Logs -->
        <div class="glass-panel recent-tasks-panel">
            <div class="chart-header" style="margin-bottom: 8px;">
                <h3>Actividad Reciente</h3>
                <button class="btn btn-secondary" id="go-to-board-btn" style="padding: 6px 12px; font-size: 0.8rem; border-radius: var(--border-radius-sm);">
                    Ir al Tablero
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" x2="19" y1="12" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
            </div>
            <div class="recent-tasks-list">
                ${
                    logs.length === 0 
                    ? `<div class="no-data-msg">No se han registrado actividades aún. Comienza a gestionar tareas en tu tablero kanban.</div>`
                    : logs.slice(0, 5).map(log => `
                        <div class="recent-task-item">
                            <div class="task-item-meta">
                                <span class="priority-dot ${log.priority || 'low'}"></span>
                                <div>
                                    <span class="task-item-title">${escapeHTML(log.text)}</span>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 16px;">
                                <span class="task-item-column">${escapeHTML(log.colName)}</span>
                                <span class="task-item-date">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                    ${log.date.split(' ')[1] || log.date}
                                </span>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
        </div>
    `;

    container.innerHTML = html;

    // 4. ANIMATE DONUT PROGRESS CHART
    setTimeout(() => {
        const segment = document.getElementById('donut-progress-segment');
        if (segment) {
            const circumference = 314.16;
            const offset = circumference - (completionRate / 100) * circumference;
            segment.style.strokeDashoffset = offset;
        }
    }, 100);

    // 5. DRAW WORKLOAD BAR CHART
    drawBarChart(data.columns);

    // 6. EVENT BINDING
    const goToBoardBtn = document.getElementById('go-to-board-btn');
    if (goToBoardBtn) {
        goToBoardBtn.addEventListener('click', () => {
            // Activate navigation for Kanban
            document.getElementById('nav-dashboard').classList.remove('active');
            document.getElementById('nav-kanban').classList.add('active');
            document.getElementById('nav-kanban').click();
        });
    }
};

/**
 * Generates custom workload bars representing the columns.
 * @param {Array} columns - List of Kanban columns.
 */
const drawBarChart = (columns) => {
    const chartContainer = document.getElementById('bar-chart-container');
    if (!chartContainer) return;

    if (columns.length === 0) {
        chartContainer.innerHTML = `<div class="no-data-msg">No hay columnas creadas.</div>`;
        return;
    }

    const maxTasks = Math.max(...columns.map(col => col.tasks.length), 0);
    
    let barChartHtml = `<div class="bar-chart">`;
    
    columns.forEach(col => {
        const taskCount = col.tasks.length;
        // Prevent division by zero if all columns are empty
        const heightPct = maxTasks > 0 ? (taskCount / maxTasks) * 80 : 0; // max height is 80% to leave room for labels
        
        barChartHtml += `
            <div class="chart-bar-wrapper">
                <div class="chart-bar" style="height: ${Math.max(heightPct, 3)}%;">
                    <div class="chart-bar-value">${taskCount} ${taskCount === 1 ? 'tarea' : 'tareas'}</div>
                </div>
                <div class="chart-bar-label" title="${escapeHTML(col.title)}">${escapeHTML(col.title)}</div>
            </div>
        `;
    });
    
    barChartHtml += `</div>`;
    chartContainer.innerHTML = barChartHtml;
};

// Quick helper to escape HTML and prevent injection issues
const escapeHTML = (str) => {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};
