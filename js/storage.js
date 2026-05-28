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
    const scope = localStorage.getItem('oxiflow_active_scope') || 'personal';
    if (scope === 'shared') {
        return 'oxiflow_kanban_data_shared';
    }
    const session = getActiveUserSession();
    if (session && session.email) {
        return `oxiflow_kanban_data_${session.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
    return 'oxiflow_kanban_data_default';
};

var getActiveLogsKey = () => {
    const scope = localStorage.getItem('oxiflow_active_scope') || 'personal';
    if (scope === 'shared') {
        return 'oxiflow_kanban_logs_shared';
    }
    const session = getActiveUserSession();
    if (session && session.email) {
        return `oxiflow_kanban_logs_${session.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
    return 'oxiflow_kanban_logs_default';
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
            {
                id: 'col-backlog',
                title: 'Backlog',
                color: '#64748b', // Slate
                tasks: [
                    {
                        id: 'task-1',
                        title: 'Investigar APIs de integración',
                        desc: 'Evaluar alternativas para conectar el servicio de notificaciones con la plataforma externa.',
                        priority: 'low',
                        date: formatDate(6)
                    },
                    {
                        id: 'task-2',
                        title: 'Reunión de kickoff con cliente',
                        desc: 'Definir el alcance final del proyecto y alinear expectativas técnicas.',
                        priority: 'medium',
                        date: formatDate(4)
                    }
                ]
            },
            {
                id: 'col-todo',
                title: 'Por Hacer',
                color: '#6366f1', // Indigo
                tasks: [
                    {
                        id: 'task-3',
                        title: 'Diseñar interfaz del Dashboard',
                        desc: 'Crear propuestas visuales premium en alta fidelidad utilizando el sistema de colores de la marca.',
                        priority: 'high',
                        date: formatDate(2)
                    },
                    {
                        id: 'task-4',
                        title: 'Escribir documentación del onboarding',
                        desc: 'Redactar los pasos iniciales para el ingreso de nuevos desarrolladores al repositorio.',
                        priority: 'low',
                        date: formatDate(3)
                    }
                ]
            },
            {
                id: 'col-inprogress',
                title: 'En Progreso',
                color: '#f59e0b', // Amber
                tasks: [
                    {
                        id: 'task-5',
                        title: 'Implementar Drag & Drop en Kanban',
                        desc: 'Utilizar el API nativo de HTML5 con efectos visuales fluidos, animaciones y soporte táctil.',
                        priority: 'high',
                        date: formatDate(1)
                    }
                ]
            },
            {
                id: 'col-completed',
                title: 'Completado',
                color: '#10b981', // Emerald
                tasks: [
                    {
                        id: 'task-6',
                        title: 'Configurar entorno de desarrollo',
                        desc: 'Instalar servidores locales, definir linters de código y verificar conexiones a base de datos.',
                        priority: 'medium',
                        date: formatDate(-1)
                    },
                    {
                        id: 'task-7',
                        title: 'Refactorizar variables de diseño CSS',
                        desc: 'Migrar estilos duros a variables CSS adaptables para facilitar el soporte de temas.',
                        priority: 'low',
                        date: formatDate(-2)
                    }
                ]
            }
        ]
    };
};

const getSeedLogs = () => {
    return [
        {
            id: 'log-1',
            text: 'Entorno de desarrollo configurado correctamente',
            colName: 'Completado',
            priority: 'medium',
            date: new Date(Date.now() - 3600000 * 24).toLocaleString()
        },
        {
            id: 'log-2',
            text: 'Comenzó el desarrollo del Drag & Drop para el Kanban',
            colName: 'En Progreso',
            priority: 'high',
            date: new Date(Date.now() - 3600000 * 4).toLocaleString()
        },
        {
            id: 'log-3',
            text: 'Se movió la tarea "Refactorizar variables de diseño" a completado',
            colName: 'Completado',
            priority: 'low',
            date: new Date(Date.now() - 3600000 * 2).toLocaleString()
        }
    ];
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
