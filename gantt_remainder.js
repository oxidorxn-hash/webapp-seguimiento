            timeInput.addEventListener('blur', () => {
                const v = timeInput.value;
                const m = v.match(/^(\d{1,2}):?(\d{0,2})$/);
                if (!m) { timeInput.value = ''; return; }
                const h = parseInt(m[1], 10), mn = parseInt(m[2] || '0', 10);
                if (h > 23 || mn > 59) { timeInput.value = ''; return; }
                timeInput.value = `${String(h).padStart(2,'0')}:${String(mn).padStart(2,'0')}`;
            });

            if (isEdit) {
                overlay.querySelector('#evt-ical')?.addEventListener('click', () => downloadIcs(existing));
                overlay.querySelector('#evt-delete')?.addEventListener('click', () => {
                    if (confirm(`¿Eliminar "${existing.title}"?`)) {
                        const d = getBoardData();
                        d.events = (d.events || []).filter(ev => ev.id !== existing.id);
                        saveBoardData(d);
                        addActivityLog(`Evento eliminado: ${existing.title}`, 'Calendario', 'low');
                        closeOverlay();
                        if (calContainer) renderCalendar(calContainer);
                    }
                });
            }

            overlay.querySelector('#event-form').addEventListener('submit', e => {
                e.preventDefault();
                const title   = overlay.querySelector('#evt-title').value.trim();
                const date    = overlay.querySelector('#evt-date').value;
                const time    = overlay.querySelector('#evt-time').value;
                const address = overlay.querySelector('#evt-address').value.trim();
                const notes   = overlay.querySelector('#evt-notes').value.trim();
                if (!title || !date) return;

                const d = getBoardData();
                if (!d.events) d.events = [];
                if (isEdit) {
                    const idx = d.events.findIndex(ev => ev.id === existing.id);
                    if (idx >= 0) d.events[idx] = { ...d.events[idx], title, date, time, address, notes };
                    addActivityLog(`Evento editado: ${title}`, 'Calendario', 'low');
                } else {
                    d.events.push({ id: 'evt-' + generateId(), title, date, time, address, notes });
                    addActivityLog(`Evento creado: ${title}`, 'Calendario', 'low');
                }
                saveBoardData(d);
                closeOverlay();
                if (calContainer) renderCalendar(calContainer);
            });
        };

        var renderGantt = (container) => {
            const data = getBoardData();
            const year  = ganttState.currentYear;
            const month = ganttState.currentMonth;
            const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

            container.innerHTML = `
                <div class="timeline-container">
                    <div class="timeline-header">
                        <div>
                            <h1 style="font-size:1.8rem;font-weight:800;margin-bottom:4px;">Timeline de Tareas</h1>
                            <p style="color:var(--text-secondary);font-size:0.95rem;">Visualiza el progreso de las tareas a lo largo del mes.</p>
                        </div>
                        <div class="timeline-nav-controls">
                            <span class="timeline-month-title">${monthNames[month]} ${year}</span>
                            <div style="display:flex;gap:8px;">
                                <button class="btn btn-secondary" id="gantt-prev-btn" style="padding:8px 12px;border-radius:var(--border-radius-md);" aria-label="Mes anterior">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                </button>
                                <button class="btn btn-secondary" id="gantt-today-btn" style="padding:8px 16px;border-radius:var(--border-radius-md);font-size:0.85rem;">Hoy</button>
                                <button class="btn btn-secondary" id="gantt-next-btn" style="padding:8px 12px;border-radius:var(--border-radius-md);" aria-label="Mes siguiente">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="gantt-mini-summary" id="gantt-mini-summary"></div>

                    <div class="gantt-container">
                        <div class="gantt-scroll-canvas">
                            <div class="gantt-grid-table">
                                <div class="gantt-header-row" id="gantt-header-row"></div>
                                <div id="gantt-rows-container"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const summaryEl = document.getElementById('gantt-mini-summary');
            if (summaryEl) {
                const chips = data.columns.map(col => {
                    const color = col.color || '#6366f1';
                    return `<div class="gantt-summary-chip"><span class="gantt-summary-dot" style="background:${color};"></span><span>${escapeHTML(col.title)}</span><span class="gantt-summary-count">${col.tasks.length}</span></div>`;
                }).join('');
                const total = data.columns.reduce((s, c) => s + c.tasks.length, 0);
                summaryEl.innerHTML = chips + `<div class="gantt-summary-chip" style="margin-left:auto;"><span>Total</span><span class="gantt-summary-count">${total}</span></div>`;
            }

            renderGanttView(year, month, data);
            bindGanttInteractions();

            document.getElementById('gantt-prev-btn').onclick = () => {
                ganttState.currentMonth--;
                if (ganttState.currentMonth < 0) { ganttState.currentMonth = 11; ganttState.currentYear--; }
                renderGantt(container);
            };
            document.getElementById('gantt-next-btn').onclick = () => {
                ganttState.currentMonth++;
                if (ganttState.currentMonth > 11) { ganttState.currentMonth = 0; ganttState.currentYear++; }
                renderGantt(container);
            };
            document.getElementById('gantt-today-btn').onclick = () => {
                ganttState.currentYear = new Date().getFullYear();
                ganttState.currentMonth = new Date().getMonth();
                renderGantt(container);
            };
        };

        const renderGanttView = (year, month, data) => {
            const headerRow = document.getElementById('gantt-header-row');
            const rowsContainer = document.getElementById('gantt-rows-container');
            if (!headerRow || !rowsContainer) return;
        // --- 3.5 EXPENSES MODULE ---
        const EXPENSE_CATEGORIES = ['Supermercado', 'Casa', 'Mascotas', 'Finanzas', 'Ocio', 'Transporte', 'Salud', 'Otro'];
        
        const getCategoryColor = (cat) => {
            const map = {
                'Casa': '#a855f7', 'Supermercado': '#22c55e', 'Mascotas': '#f59e0b',
                'Finanzas': '#3b82f6', 'Trabajo': '#6366f1', 'Ocio': '#ec4899',
                'Transporte': '#14b8a6', 'Salud': '#ef4444', 'Otro': '#94a3b8'
            };
            return map[cat] || '#94a3b8';
        };

        const expensesState = { selectedMonth: null }; // 'YYYY-MM' or null = all

        var renderExpenses = (container) => {
            const data = getBoardData();
            // Remove legacy synthetic settlement entries from old mechanism
            if (data.expenses) {
                const cleaned = data.expenses.filter(e =>
                    !(e.concept === 'Liquidación de deuda' && !e.settled && e.category === 'Finanzas')
                );
                if (cleaned.length !== data.expenses.length) {
                    data.expenses = cleaned;
                    saveBoardData(data);
                }
            }
            const expenses = data.expenses || [];

            // Safe date formatter helper (avoids Invalid Date)
            const safeFmtDate = (dateStr) => {
                if (!dateStr) return '—';
                const parts = String(dateStr).split('-');
                if (parts.length !== 3) return dateStr;
                try {
                    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
                        .toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
                } catch { return dateStr; }
            };

            // Only unsettled expenses count toward balance
            const activeExpenses  = expenses.filter(e => !e.settled);
            const settledExpenses = expenses.filter(e =>  e.settled);

            const totals = { 'oxi@oxiflow.com': 0, 'javi@oxiflow.com': 0 };
            let grandTotal = 0;
            expenses.forEach(exp => {
                const amt = Math.round(parseFloat(exp.amount) || 0);
                if (totals[exp.paidBy] !== undefined) totals[exp.paidBy] += amt;
