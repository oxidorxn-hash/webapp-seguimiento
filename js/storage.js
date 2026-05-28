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
            {
                id: 'col-backlog',
                title: 'Backlog Chores',
                color: '#64748b', // Slate
                tasks: [
                    {
                        id: 'task-1',
                        title: 'Limpieza a fondo del horno',
                        desc: 'Desengrasar y limpiar a fondo la cocina y el horno con productos biodegradables.',
                        priority: 'low',
                        date: formatDate(6),
                        category: 'Casa',
                        creator: { name: 'Javi', email: 'javi@oxiflow.com', picture: 'icon.svg' }
                    },
                    {
                        id: 'task-2',
                        title: 'Comprar alimento para los perros',
                        desc: 'Comprar saco de comida premium en la tienda de mascotas cercana.',
                        priority: 'medium',
                        date: formatDate(4),
                        category: 'Mascotas',
                        creator: { name: 'Oxi', email: 'oxi@oxiflow.com', picture: 'icon.svg' }
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
                        title: 'Hacer las compras del supermercado',
                        desc: 'Comprar frutas, verduras, lácteos y artículos de despensa semanal.',
                        priority: 'high',
                        date: formatDate(2),
                        category: 'Supermercado',
                        creator: { name: 'Javi', email: 'javi@oxiflow.com', picture: 'icon.svg' }
                    },
                    {
                        id: 'task-4',
                        title: 'Planificar menú semanal de almuerzos',
                        desc: 'Escribir las opciones saludables para cocinar durante la semana.',
                        priority: 'low',
                        date: formatDate(3),
                        category: 'Casa',
                        creator: { name: 'Oxi', email: 'oxi@oxiflow.com', picture: 'icon.svg' }
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
                        title: 'Lavar y ordenar la ropa blanca',
                        desc: 'Sábanas, toallas y fundas de almohada de la habitación principal.',
                        priority: 'high',
                        date: formatDate(1),
                        category: 'Casa',
                        creator: { name: 'Javi', email: 'javi@oxiflow.com', picture: 'icon.svg' }
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
                        title: 'Pagar alquiler y gastos comunes',
                        desc: 'Transferencia mensual realizada con éxito del presupuesto familiar.',
                        priority: 'high',
                        date: formatDate(-1),
                        category: 'Finanzas',
                        creator: { name: 'Oxi', email: 'oxi@oxiflow.com', picture: 'icon.svg' }
                    },
                    {
                        id: 'task-7',
                        title: 'Pasear a los perros y cepillarlos',
                        desc: 'Paseo largo de la tarde por el parque y cepillado diario.',
                        priority: 'medium',
                        date: formatDate(-2),
                        category: 'Mascotas',
                        creator: { name: 'Oxi', email: 'oxi@oxiflow.com', picture: 'icon.svg' }
                    }
                ]
            }
        ],
        expenses: [
            {
                id: 'exp-1',
                title: 'Compra semanal Jumbo',
                amount: 85.00,
                paidBy: 'oxi@oxiflow.com',
                date: formatDate(-2),
                category: 'Supermercado'
            },
            {
                id: 'exp-2',
                title: 'Vacunas Veterinario (Perro)',
                amount: 50.00,
                paidBy: 'javi@oxiflow.com',
                date: formatDate(-1),
                category: 'Mascotas'
            },
            {
                id: 'exp-3',
                title: 'Artículos de limpieza Hogar',
                amount: 15.00,
                paidBy: 'oxi@oxiflow.com',
                date: formatDate(0),
                category: 'Casa'
            }
        ]
    };
};

const getSeedLogs = () => {
    return [
        {
            id: 'log-1',
            text: 'Alquiler y gastos comunes pagados',
            colName: 'Completado',
            priority: 'high',
            date: new Date(Date.now() - 3600000 * 24).toLocaleString()
        },
        {
            id: 'log-2',
            text: 'Paseo de perros y cepillado realizado',
            colName: 'Completado',
            priority: 'medium',
            date: new Date(Date.now() - 3600000 * 12).toLocaleString()
        },
        {
            id: 'log-3',
            text: 'Comenzó el lavado de la ropa blanca',
            colName: 'En Progreso',
            priority: 'high',
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
