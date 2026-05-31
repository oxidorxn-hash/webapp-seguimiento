/* ==========================================================================
   STORAGE SERVICE
   Handles LocalStorage, seed data generation, and activity logging.
   ========================================================================== */

// Dynamic storage keys helpers
var getActiveUserSession = () => {
    const raw = localStorage.getItem('oxiflow_user_session');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
};

var getActiveStorageKey = () => {
    return 'oxiflow_kanban_data_shared';
};

var getActiveLogsKey = () => {
    return 'oxiflow_kanban_logs_shared';
};

// Helper to generate IDs
var generateId = () => 'id-' + Math.random().toString(36).substr(2, 9);

// Seed Data
const getSeedData = () => {
    const today = new Date();
    
    const formatDate = (daysOffset) => {
        const d = new Date(today);
        d.setDate(today.getDate() + daysOffset);
        return d.toISOString().split('T')[0];
    };

    return {
        columns: [
            { id: 'col-backlog', title: 'Backlog Chores', color: '#64748b', tasks: [] },
            { id: 'col-todo', title: 'Por Hacer', color: '#6366f1', tasks: [] },
            { id: 'col-inprogress', title: 'En Progreso', color: '#f59e0b', tasks: [] },
            { id: 'col-completed', title: 'Completado', color: '#10b981', tasks: [] }
        ],
        expenses: []
    };
};

const getSeedLogs = () => {
    return [];
};

/**
 * Loads current project state from LocalStorage or injects seeds.
 * @returns {Object} Application data object containing columns and tasks.
 */
var getBoardData = () => {
    const key = getActiveStorageKey();
    const rawData = localStorage.getItem(key);
    const seedData = getSeedData();
    
    if (!rawData) {
        saveBoardData(seedData);
        // Inject initial seed logs
        localStorage.setItem(getActiveLogsKey(), JSON.stringify(getSeedLogs()));
        return seedData;
    }
    try {
        const parsed = JSON.parse(rawData);
        // Validate that columns exists and is an array
        if (!parsed || !Array.isArray(parsed.columns) || parsed.columns.length === 0) {
            throw new Error("Estructura de columnas inválida");
        }
        // Ensure every column has ID, title and tasks array
        parsed.columns.forEach(col => {
            if (!col.id || !col.title || !Array.isArray(col.tasks)) {
                throw new Error("Columna o tareas mal formadas");
            }
        });
        return parsed;
    } catch (e) {
        console.warn('Datos corruptos detectados en localStorage. Restableciendo a valores iniciales seguros.', e);
        saveBoardData(seedData);
        localStorage.setItem(getActiveLogsKey(), JSON.stringify(getSeedLogs()));
        return seedData;
    }
};

/**
 * Saves current project state to LocalStorage.
 * @param {Object} data - Application data object.
 */
var saveBoardData = (data) => {
    const key = getActiveStorageKey();
    localStorage.setItem(key, JSON.stringify(data));
};

/**
 * Retrieves the activity logs list.
 * @returns {Array} List of activity logs.
 */
var getActivityLogs = () => {
    const key = getActiveLogsKey();
    const rawLogs = localStorage.getItem(key);
    if (!rawLogs) return [];
    try {
        return JSON.parse(rawLogs);
    } catch (e) {
        return [];
    }
};

/**
 * Logs a new activity.
 * @param {string} text - Description of the action.
 * @param {string} colName - Name of the related column.
 * @param {string} priority - Priority value ('low', 'medium', 'high').
 */
var addActivityLog = (text, colName = 'Tablero', priority = 'low') => {
    const logs = getActivityLogs();
    const newLog = {
        id: generateId(),
        text,
        colName,
        priority,
        date: new Date().toLocaleString()
    };
    
    // Add to beginning and cap at 10 items
    logs.unshift(newLog);
    if (logs.length > 10) logs.pop();
    
    const key = getActiveLogsKey();
    localStorage.setItem(key, JSON.stringify(logs));
};
