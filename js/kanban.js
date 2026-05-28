/* ==========================================================================
   KANBAN BOARD VIEW CONTROLLER
   Manages columns, tasks, drag-and-drop, modals, search, and priority filtering.
   ========================================================================== */



// Local Kanban State
const boardState = {
    data: null,
    searchQuery: '',
    priorityFilter: 'all'
};

// Modal Elements Cache
let modalOverlay;
let taskForm;
let modalTitle;
let taskIdInput;
let taskColIdInput;
let taskTitleInput;
let taskDescInput;
let taskPriorityInput;
let taskDateInput;
let boardContainerRef;

/**
 * Initializes and renders the Kanban board in the designated container.
 * @param {HTMLElement} container - Container element.
 */
var renderKanban = (container) => {
    boardContainerRef = container;
    
    // Load fresh data
    if (!boardState.data) {
        boardState.data = getBoardData();
    }
    
    // Render shell structure
    container.innerHTML = `
        <div class="kanban-view-header">
            <div>
                <h1 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 4px;">Tablero Kanban</h1>
                <p style="color: var(--text-secondary); font-size: 0.95rem;">Gestiona tus tareas arrastrándolas entre columnas.</p>
            </div>
            
            <div class="kanban-actions">
                <!-- Priority Filter -->
                <div class="filter-wrapper">
                    <label for="board-priority-filter">Prioridad:</label>
                    <select id="board-priority-filter" class="filter-select">
                        <option value="all" ${boardState.priorityFilter === 'all' ? 'selected' : ''}>Todos</option>
                        <option value="low" ${boardState.priorityFilter === 'low' ? 'selected' : ''}>Baja</option>
                        <option value="medium" ${boardState.priorityFilter === 'medium' ? 'selected' : ''}>Media</option>
                        <option value="high" ${boardState.priorityFilter === 'high' ? 'selected' : ''}>Alta</option>
                    </select>
                </div>
                
                <button class="btn btn-primary" id="add-column-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"></line><line x1="5" x2="19" y1="12" y2="12"></line></svg>
                    Añadir Columna
                </button>
            </div>
        </div>
        
        <!-- Board Horizontal Workspace -->
        <div class="kanban-board" id="kanban-board-workspace">
            <!-- Columns and cards rendered here dynamically -->
        </div>
    `;
    
    // Cache modal nodes
    initModalCache();
    
    // Render the board workspace (columns and cards)
    renderWorkspace();
    
    // Bind Event Listeners
    bindBoardEvents();
};

/**
 * Caches DOM nodes of the modal for faster lookups and bindings.
 */
const initModalCache = () => {
    modalOverlay = document.getElementById('modal-overlay');
    taskForm = document.getElementById('task-form');
    modalTitle = document.getElementById('modal-title');
    taskIdInput = document.getElementById('task-id');
    taskColIdInput = document.getElementById('task-column-id');
    taskTitleInput = document.getElementById('task-title-input');
    taskDescInput = document.getElementById('task-desc-input');
    taskPriorityInput = document.getElementById('task-priority-input');
    taskDateInput = document.getElementById('task-date-input');

    // Remove any previous submit listener to prevent multiple submissions
    const newForm = taskForm.cloneNode(true);
    taskForm.parentNode.replaceChild(newForm, taskForm);
    taskForm = newForm;

    // Cache updated modal elements
    taskIdInput = document.getElementById('task-id');
    taskColIdInput = document.getElementById('task-column-id');
    taskTitleInput = document.getElementById('task-title-input');
    taskDescInput = document.getElementById('task-desc-input');
    taskPriorityInput = document.getElementById('task-priority-input');
    taskDateInput = document.getElementById('task-date-input');

    taskForm.addEventListener('submit', handleTaskSubmit);

    // Modal close events
    const closeBtn = document.getElementById('modal-close');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    
    const closeModal = () => {
        modalOverlay.classList.remove('show');
    };

    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) closeModal();
    };
};

/**
 * Draws the active columns and filters/searches cards.
 */
const renderWorkspace = () => {
    const workspace = document.getElementById('kanban-board-workspace');
    if (!workspace) return;
    
    let html = '';
    
    boardState.data.columns.forEach(column => {
        // Filter cards in this column
        const filteredTasks = column.tasks.filter(task => {
            const matchesSearch = boardState.searchQuery === '' || 
                task.title.toLowerCase().includes(boardState.searchQuery) || 
                task.desc.toLowerCase().includes(boardState.searchQuery);
            
            const matchesPriority = boardState.priorityFilter === 'all' || 
                task.priority === boardState.priorityFilter;
                
            return matchesSearch && matchesPriority;
        });

        const colColor = column.color || '#6366f1';
        const colBorderColor = colColor + '35'; // ~20% opacity
        const colCountBg = colColor + '15'; // ~8% opacity
        const colCountBorder = colColor + '30'; // ~18% opacity
        const colGlowStyle = `border-top: 5px solid ${colColor}; border-color: ${colBorderColor}; box-shadow: 0 4px 20px -5px ${colColor}50;`;

        html += `
            <div class="kanban-column" data-col-id="${column.id}" style="${colGlowStyle}">
                <div class="column-header">
                    <div class="column-title-container">
                        <!-- Double click to edit title -->
                        <span class="column-title" title="Doble clic para renombrar" data-col-id="${column.id}">${escapeHTML(column.title)}</span>
                        <span class="column-count" style="background-color: ${colCountBg}; color: ${colColor}; border-color: ${colCountBorder};">${filteredTasks.length}</span>
                    </div>
                    
                    <div class="column-actions-dropdown">
                        <button class="column-actions-btn" aria-label="Acciones de columna">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                        </button>
                        <div class="dropdown-menu">
                            <button class="dropdown-item rename-col-btn" data-col-id="${column.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                                Renombrar
                            </button>
                            <button class="dropdown-item danger delete-col-btn" data-col-id="${column.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                Eliminar
                            </button>
                            <div class="dropdown-menu-divider"></div>
                            <div class="column-color-picker-section">
                                <span class="color-picker-title">Color de columna</span>
                                <div class="color-options-grid">
                                    ${['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b']
                                        .map(color => `<span class="color-dot ${column.color === color ? 'active' : ''}" style="background-color: ${color};" data-color="${color}" data-col-id="${column.id}"></span>`)
                                        .join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Cards Container -->
                <div class="column-cards-list" data-col-id="${column.id}">
                    ${
                        filteredTasks.length === 0 
                        ? `<div style="text-align: center; color: var(--text-secondary); font-size: 0.75rem; padding: 20px 0; border: 1.5px dashed var(--border-color); border-radius: var(--border-radius-md);" class="empty-col-msg">Suelta tareas aquí</div>`
                        : filteredTasks.map(task => renderTaskCard(task, column.id)).join('')
                    }
                </div>
                
                <!-- Add Task Button inside Column -->
                <button class="btn btn-secondary add-task-btn" style="margin-top: 14px; justify-content: center; padding: 8px 12px; font-size: 0.8rem;" data-col-id="${column.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"></line><line x1="5" x2="19" y1="12" y2="12"></line></svg>
                    Añadir Tarea
                </button>
            </div>
        `;
    });

    // Add extra card button at the end to create new columns easily
    html += `
        <div class="add-column-card" id="add-column-card-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="16"></line><line x1="8" x2="16" y1="12" y2="12"></line></svg>
            <span>Crear Columna</span>
        </div>
    `;

    workspace.innerHTML = html;
    
    // Rebind Drag and Drop and column interactions
    initDragAndDrop();
    bindColumnInteractions();
};

/**
 * Builds HTML code for an individual task card.
 * @param {Object} task - Task details.
 * @param {string} columnId - Parent column ID.
 */
const renderTaskCard = (task, columnId) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = task.date && task.date < todayStr && columnId !== 'col-completed';
    
    // Priority labels in Spanish
    const priorityLabels = { low: 'Baja', medium: 'Media', high: 'Alta' };
    
    // Format date beautifully
    let dateText = 'Sin fecha';
    if (task.date) {
        const parts = task.date.split('-');
        dateText = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    const col = boardState.data.columns.find(c => c.id === columnId);
    const colColor = col ? col.color || '#6366f1' : '#6366f1';

    return `
        <div class="kanban-card" draggable="true" data-task-id="${task.id}" data-col-id="${columnId}" style="border-left: 4px solid ${colColor};" onmouseenter="this.style.borderColor = '${colColor}'; this.style.boxShadow = '0 8px 20px -4px ${colColor}40'; this.style.transform = 'translateY(-2px)'" onmouseleave="this.style.borderColor = ''; this.style.boxShadow = ''; this.style.transform = ''">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="card-priority-indicator ${task.priority}" title="Prioridad ${priorityLabels[task.priority]}"></div>
                <div class="card-actions">
                    <button class="card-action-btn edit-task-btn" data-task-id="${task.id}" data-col-id="${columnId}" title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                    </button>
                    <button class="card-action-btn delete delete-task-btn" data-task-id="${task.id}" data-col-id="${columnId}" title="Eliminar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                </div>
            </div>
            <h4 class="card-title">${escapeHTML(task.title)}</h4>
            ${task.desc ? `<p class="card-desc">${escapeHTML(task.desc)}</p>` : ''}
            <div class="card-footer">
                <span class="card-date ${isOverdue ? 'overdue' : ''}" title="${isOverdue ? '¡Tarea atrasada!' : 'Fecha de entrega'}" style="font-weight: 500;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>
                    ${dateText}
                </span>
                <span style="font-size: 0.7rem; font-weight: 700; color: var(--priority-${task.priority}); text-transform: uppercase;">
                    ${priorityLabels[task.priority]}
                </span>
            </div>
        </div>
    `;
};

/**
 * Handles typing from the global search.
 * Called dynamically from app.js.
 * @param {string} query - Clean query.
 */
var handleKanbanSearch = (query) => {
    boardState.searchQuery = query;
    renderWorkspace();
};

/**
 * Event bindings for top bar and workspace creation.
 */
const bindBoardEvents = () => {
    const filterSelect = document.getElementById('board-priority-filter');
    const addColBtn = document.getElementById('add-column-btn');

    // Priority filter hook
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            boardState.priorityFilter = e.target.value;
            renderWorkspace();
        });
    }

    // Add Column hooks
    const createNewColumn = () => {
        const newColId = generateId();
        const newCol = {
            id: newColId,
            title: 'Nueva Columna',
            tasks: []
        };
        
        boardState.data.columns.push(newCol);
        saveBoardData(boardState.data);
        addActivityLog('Se añadió la columna "Nueva Columna"', 'Tablero', 'low');
        
        renderWorkspace();

        // Automatically trigger rename on the newly added column for premium feel
        setTimeout(() => {
            const titleEl = document.querySelector(`.column-title[data-col-id="${newColId}"]`);
            if (titleEl) triggerRenameInline(titleEl, newColId);
        }, 100);
    };

    if (addColBtn) addColBtn.onclick = createNewColumn;
    
    // Delegate workspace click for columns addition button
    document.addEventListener('click', (e) => {
        const addCardBtn = e.target.closest('#add-column-card-btn');
        if (addCardBtn) createNewColumn();
    });
};

/**
 * Column interaction events (renaming, dropdowns, card triggers, delete column).
 */
const bindColumnInteractions = () => {
    // 1. Column Actions Dropdown Toggle
    const dropdownBtns = document.querySelectorAll('.column-actions-btn');
    dropdownBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close other open menus
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                if (menu !== btn.nextElementSibling) menu.classList.remove('show');
            });
            btn.nextElementSibling.classList.toggle('show');
        });
    });

    // Close menus clicking anywhere
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.remove('show'));
    });

    // 1.5. Column Color Picker Dot click handler
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            const colId = dot.getAttribute('data-col-id');
            const color = dot.getAttribute('data-color');
            const col = boardState.data.columns.find(c => c.id === colId);
            if (col) {
                col.color = color;
                saveBoardData(boardState.data);
                addActivityLog(`Se cambió el color de la columna "${col.title}"`, col.title, 'low');
                renderWorkspace();
            }
        });
    });

    // 2. Rename Column from dropdown or double click
    document.querySelectorAll('.column-title').forEach(titleEl => {
        titleEl.addEventListener('dblclick', () => {
            const colId = titleEl.getAttribute('data-col-id');
            triggerRenameInline(titleEl, colId);
        });
    });

    document.querySelectorAll('.rename-col-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const colId = btn.getAttribute('data-col-id');
            const titleEl = document.querySelector(`.column-title[data-col-id="${colId}"]`);
            // Hide dropdown
            btn.closest('.dropdown-menu').classList.remove('show');
            triggerRenameInline(titleEl, colId);
        });
    });

    // 3. Delete Column
    document.querySelectorAll('.delete-col-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const colId = btn.getAttribute('data-col-id');
            const col = boardState.data.columns.find(c => c.id === colId);
            
            if (!col) return;

            // Warning if column contains tasks
            if (col.tasks.length > 0) {
                const confirmDelete = confirm(`La columna "${col.title}" contiene ${col.tasks.length} tareas. ¿Estás seguro de que deseas eliminarla? Todas sus tareas se perderán.`);
                if (!confirmDelete) return;
            }

            boardState.data.columns = boardState.data.columns.filter(c => c.id !== colId);
            saveBoardData(boardState.data);
            addActivityLog(`Se eliminó la columna "${col.title}"`, 'Tablero', 'high');
            
            renderWorkspace();
        });
    });

    // 4. Task actions delegates (Add Task, Edit Task, Delete Task)
    document.querySelectorAll('.add-task-btn').forEach(btn => {
        btn.onclick = () => {
            const colId = btn.getAttribute('data-col-id');
            openTaskModal(null, colId);
        };
    });

    document.querySelectorAll('.edit-task-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const taskId = btn.getAttribute('data-task-id');
            const colId = btn.getAttribute('data-col-id');
            openTaskModal(taskId, colId);
        };
    });

    document.querySelectorAll('.delete-task-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const taskId = btn.getAttribute('data-task-id');
            const colId = btn.getAttribute('data-col-id');
            
            const col = boardState.data.columns.find(c => c.id === colId);
            if (!col) return;
            
            const taskIndex = col.tasks.findIndex(t => t.id === taskId);
            if (taskIndex === -1) return;
            
            const task = col.tasks[taskIndex];
            
            if (confirm(`¿Estás seguro de eliminar la tarea "${task.title}"?`)) {
                col.tasks.splice(taskIndex, 1);
                saveBoardData(boardState.data);
                addActivityLog(`Se eliminó la tarea "${task.title}"`, col.title, task.priority);
                renderWorkspace();
            }
        };
    });
};

/**
 * Swaps a column title span for an interactive input block.
 * @param {HTMLElement} titleEl - Title span element.
 * @param {string} colId - Target column ID.
 */
const triggerRenameInline = (titleEl, colId) => {
    const originalText = titleEl.textContent;
    const parent = titleEl.parentNode;
    
    // Create input
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalText;
    input.className = 'column-title-input';
    input.maxLength = 24;
    
    // Replace text span with input
    parent.replaceChild(input, titleEl);
    input.focus();
    input.select();
    
    const saveRename = () => {
        const newTitle = input.value.trim();
        
        if (newTitle && newTitle !== originalText) {
            const col = boardState.data.columns.find(c => c.id === colId);
            if (col) {
                col.title = newTitle;
                saveBoardData(boardState.data);
                addActivityLog(`Columna renombrada a "${newTitle}"`, newTitle, 'low');
            }
        }
        
        renderWorkspace();
    };

    // Save on Enter or Blur
    input.onblur = saveRename;
    input.onkeydown = (e) => {
        if (e.key === 'Enter') saveRename();
        if (e.key === 'Escape') renderWorkspace(); // cancel
    };
};

/**
 * Handles Task Modal setup and launch.
 * @param {string|null} taskId - ID of task if editing, null if creating.
 * @param {string} colId - ID of parent column.
 */
const openTaskModal = (taskId = null, colId) => {
    // Reset form
    taskForm.reset();
    
    taskIdInput.value = taskId || '';
    taskColIdInput.value = colId;
    
    // Get column title
    const col = boardState.data.columns.find(c => c.id === colId);
    const colTitle = col ? col.title : 'Columna';
    
    // Set current date as default limit for new tasks
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    taskDateInput.value = tomorrow.toISOString().split('T')[0];

    if (taskId) {
        // Edit Mode
        modalTitle.textContent = 'Editar Tarea';
        
        const task = col.tasks.find(t => t.id === taskId);
        if (task) {
            taskTitleInput.value = task.title;
            taskDescInput.value = task.desc || '';
            taskPriorityInput.value = task.priority;
            taskDateInput.value = task.date || '';
        }
    } else {
        // Create Mode
        modalTitle.textContent = `Añadir Tarea en "${colTitle}"`;
    }
    
    modalOverlay.classList.add('show');
    taskTitleInput.focus();
};

/**
 * Form submit handler for Task additions or edits.
 */
const handleTaskSubmit = (e) => {
    e.preventDefault();
    
    const taskId = taskIdInput.value;
    const colId = taskColIdInput.value;
    const title = taskTitleInput.value.trim();
    const desc = taskDescInput.value.trim();
    const priority = taskPriorityInput.value;
    const date = taskDateInput.value;
    
    const col = boardState.data.columns.find(c => c.id === colId);
    if (!col) return;
    
    if (taskId) {
        // UPDATE EXISTING TASK
        const task = col.tasks.find(t => t.id === taskId);
        if (task) {
            const oldTitle = task.title;
            task.title = title;
            task.desc = desc;
            task.priority = priority;
            task.date = date;
            
            addActivityLog(`Tarea actualizada: "${title}"`, col.title, priority);
        }
    } else {
        // CREATE NEW TASK
        const newTask = {
            id: generateId(),
            title,
            desc,
            priority,
            date
        };
        col.tasks.push(newTask);
        
        addActivityLog(`Tarea creada: "${title}"`, col.title, priority);
    }
    
    // Save state
    saveBoardData(boardState.data);
    
    // Close modal & refresh view
    modalOverlay.classList.remove('show');
    renderWorkspace();
};

// ==========================================================================
   NATIVE HTML5 DRAG AND DROP INTEGRATION
   ========================================================================== */
const initDragAndDrop = () => {
    const cards = document.querySelectorAll('.kanban-card');
    const lists = document.querySelectorAll('.column-cards-list');
    
    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            const taskId = card.getAttribute('data-task-id');
            const sourceColId = card.getAttribute('data-col-id');
            
            // Store details in event
            e.dataTransfer.setData('text/plain', JSON.stringify({ taskId, sourceColId }));
            e.dataTransfer.effectAllowed = 'move';
            
            // Visual style on drag
            setTimeout(() => card.classList.add('dragging'), 0);
        });
        
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            // Remove helper indicators
            document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('drag-over'));
        });
    });
    
    lists.forEach(list => {
        const colId = list.getAttribute('data-col-id');
        
        list.addEventListener('dragover', (e) => {
            e.preventDefault(); // Required to allow drop
            
            const draggingCard = document.querySelector('.dragging');
            if (!draggingCard) return;
            
            // Calculate where to drop (reordering within list)
            const afterElement = getDragAfterElement(list, e.clientY);
            if (afterElement == null) {
                list.appendChild(draggingCard);
            } else {
                list.insertBefore(draggingCard, afterElement);
            }
        });
        
        list.addEventListener('dragenter', (e) => {
            e.preventDefault();
            list.closest('.kanban-column').classList.add('drag-over');
        });
        
        list.addEventListener('dragleave', () => {
            list.closest('.kanban-column').classList.remove('drag-over');
        });
        
        list.addEventListener('drop', (e) => {
            e.preventDefault();
            list.closest('.kanban-column').classList.remove('drag-over');
            
            try {
                const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
                const { taskId, sourceColId } = dragData;
                
                // If dropped in the same column at the same position, handled by visual reordering
                const sourceCol = boardState.data.columns.find(c => c.id === sourceColId);
                const destCol = boardState.data.columns.find(c => c.id === colId);
                
                if (!sourceCol || !destCol) return;
                
                const taskIndex = sourceCol.tasks.findIndex(t => t.id === taskId);
                if (taskIndex === -1) return;
                
                const [task] = sourceCol.tasks.splice(taskIndex, 1);
                
                // Determine drop index based on current card order in DOM
                const cardElements = Array.from(list.querySelectorAll('.kanban-card:not(.dragging)'));
                const dropIndex = cardElements.indexOf(document.querySelector('.dragging'));
                
                if (dropIndex === -1 || dropIndex >= destCol.tasks.length) {
                    destCol.tasks.push(task);
                } else {
                    destCol.tasks.splice(dropIndex, 0, task);
                }
                
                // Save and Log
                saveBoardData(boardState.data);
                
                if (sourceColId !== colId) {
                    addActivityLog(`Se movió "${task.title}" a "${destCol.title}"`, destCol.title, task.priority);
                } else {
                    addActivityLog(`Se reordenó "${task.title}"`, destCol.title, task.priority);
                }
                
                // Re-render
                renderWorkspace();
                
            } catch (err) {
                console.error('Error al soltar tarjeta', err);
            }
        });
    });
};

/**
 * Returns the card element located directly after the current drag Y position.
 * Helps handle list reordering.
 * @param {HTMLElement} container - List container.
 * @param {number} y - Mouse Y client coordinate.
 */
const getDragAfterElement = (container, y) => {
    const draggableElements = Array.from(container.querySelectorAll('.kanban-card:not(.dragging)'));
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
};

// HTML escape helper
const escapeHTML = (str) => {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};
