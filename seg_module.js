
// --- MODULE: REQUERIMIENTOS DE INFORMACION (SEG) ---
const REQ_KANBAN_STATES = ['OPEN', 'TO DO', 'ON-HOLD', 'DONE', 'CLOSED'];

window.renderSegModule = async function () {
    if (!state.selectedProject) {
        elements.moduleContent.innerHTML = '<div class="card"><h3>Atención</h3><p>Por favor, selecciona primero un proyecto desde el módulo PRJ.</p></div>';
        return;
    }

    elements.moduleContent.innerHTML = `
        ${renderPhaseHeader('Requerimiento de información (SEG)')}
    <div class="card">
        <div class="kanban-controls">
            <div style="flex-grow:1; display:flex; align-items:center; gap:10px">
                <label style="font-weight:700">Filtrar por Fase:</label>
                <select id="kanban-req-phase-filter" class="swal2-input" style="width:auto; margin:0; height:38px; font-size:0.9rem" onchange="state.reqKanbanFilter=this.value; window.loadRequerimientos()">
                    <option value="All" ${state.reqKanbanFilter === 'All' ? 'selected' : ''}>-- Todas las Fases --</option>
                    ${PROJECT_PHASES_LIST.map(p => `<option value="${p}" ${state.reqKanbanFilter === p ? 'selected' : ''}>${p}</option>`).join('')}
                </select>
            </div>
            ${hasPermission('seg', 'modify') ? `
                <button class="btn" style="width:auto; padding: 0.5rem 1.5rem;" onclick="openRequerimientoModal()">
                    <i class="fas fa-plus"></i> Nuevo Requerimiento
                </button>
                ` : ''}
        </div>

        <div class="kanban-container" style="grid-template-columns: repeat(5, minmax(280px, 1fr));">
            ${REQ_KANBAN_STATES.map(status => {
        const safeId = status.trim().toUpperCase().replace(/[\s-]/g, '');
        return `
                    <div class="kanban-column" data-status="${status}" ondragover="allowReqDrop(event)" ondrop="dropReq(event)" ondragenter="dragReqEnter(event)" ondragleave="dragReqLeave(event)">
                        <div class="column-header">${status}</div>
                        <div class="task-list" id="req-list-${safeId}">
                            <!-- Reqs will be rendered here -->
                        </div>
                    </div>`;
    }).join('')}
        </div>
    </div>
    `;

    window.loadRequerimientos();
}

window.loadRequerimientos = async function () {
    if (!supabaseClient || !state.selectedProject) return;
    const projId = parseInt(state.selectedProject.id);

    const { data: allReqs, error } = await supabaseClient
        .from('requerimientos')
        .select('*')
        .eq('project_id', projId);

    if (error) {
        console.error("Error loading reqs:", error);
        return;
    }

    const filterEl = document.getElementById('kanban-req-phase-filter');
    const phaseFilter = state.reqKanbanFilter || 'All';
    const boardReqs = (allReqs || []).filter(r => phaseFilter === 'All' || r.phase === phaseFilter);

    // Clear lists
    const lists = document.querySelectorAll('[id^="req-list-"]');
    lists.forEach(list => list.innerHTML = '');

    if (boardReqs && boardReqs.length > 0) {
        boardReqs.forEach(req => {
            if (!req.status) return;
            const safeId = req.status.trim().toUpperCase().replace(/[\s-]/g, '');
            const listId = `req-list-${safeId}`;
            const list = document.getElementById(listId);

            if (list) {
                const card = document.createElement('div');
                card.className = `kanban-card`;
                card.style.borderLeftColor = req.color || '#9b59b6';
                card.draggable = hasPermission('seg', 'modify');
                card.id = `req-${req.id}`;
                card.setAttribute('data-id', req.id);
                card.onclick = () => window.openRequerimientoModal(req.id);
                card.ondragstart = (e) => dragReq(e);

                const priorityClass = req.priority ? req.priority.toLowerCase() : 'medium';
                const initials = (req.assigned_to || '').substring(0, 2).toUpperCase() || '?';

                card.innerHTML = `
                    <div class="card-priority ${priorityClass}">${req.priority || 'Medium'}</div>
                    <div class="card-title">${req.title}</div>
                    <div class="card-footer">
                        <span class="card-due-date"><i class="far fa-clock"></i> ${req.due_date ? new Date(req.due_date).toLocaleDateString() : 'Sin fecha'}</span>
                        <div class="card-assignee" title="${req.assigned_to || 'Sin asignar'}">${initials}</div>
                    </div>
                `;
                list.appendChild(card);
            }
        });
    }
}

// DRAG AND DROP REQS
window.allowReqDrop = function(ev) {
    ev.preventDefault();
}

window.dragReq = function(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
    ev.dataTransfer.setData("type", "req");
    ev.target.classList.add('dragging');
}

window.dragReqEnter = function(ev) {
    ev.preventDefault();
    const col = ev.target.closest('.kanban-column');
    if (col) col.classList.add('drag-over');
}

window.dragReqLeave = function(ev) {
    const col = ev.target.closest('.kanban-column');
    if (col) col.classList.remove('drag-over');
}

window.dropReq = async function(ev) {
    ev.preventDefault();
    const type = ev.dataTransfer.getData("type");
    if (type !== "req") return; // Prevent tasks from dropping here

    const id = ev.dataTransfer.getData("text");
    const card = document.getElementById(id);
    
    document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('drag-over'));
    if (card) card.classList.remove('dragging');

    const col = ev.target.closest('.kanban-column');
    if (col && card) {
        const newStatus = col.getAttribute('data-status');
        const reqId = card.getAttribute('data-id');
        
        // Optimistic UI update
        const list = col.querySelector('.task-list');
        list.appendChild(card);

        // DB update
        if (supabaseClient) {
            const { error } = await supabaseClient.from('requerimientos').update({ status: newStatus, updated_at: new Date() }).eq('id', reqId);
            if (error) {
                console.error("Error updating req status:", error);
                Toast.fire({ icon: 'error', title: 'Error al mover' });
                window.loadRequerimientos(); // Revert
            }
        }
    }
}

window.openRequerimientoModal = async function(reqId = null) {
    if (!supabaseClient || !state.selectedProject) return;

    let req = null;
    if (reqId) {
        const { data, error } = await supabaseClient.from('requerimientos').select('*').eq('id', reqId).single();
        if (!error) req = data;
    }

    const { value: formValues } = await Swal.fire({
        title: reqId ? 'Editar Requerimiento' : 'Nuevo Requerimiento',
        width: '480px',
        html: `
            <div style="text-align:left; font-size: 0.9rem;">
                <label style="font-weight:700">Título</label><input id="swal-req-title" class="swal2-input" style="width:100%; margin: 5px 0 10px 0; height: 35px;" placeholder="Título" value="${req?.title || ''}">
                <label style="font-weight:700">Descripción</label><textarea id="swal-req-desc" class="swal2-textarea" style="width:100%; margin: 5px 0 10px 0; height:60px; font-size: 0.85rem;" placeholder="Detalles">${req?.description || ''}</textarea>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px">
                    <div><label style="font-weight:700">Fase</label><select id="swal-req-phase" class="swal2-input" style="width:100%; height: 35px; margin: 5px 0;">${PROJECT_PHASES_LIST.map(p => `<option value="${p}" ${req?.phase === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
                    <div><label style="font-weight:700">Estado</label><select id="swal-req-status" class="swal2-input" style="width:100%; height: 35px; margin: 5px 0;">${REQ_KANBAN_STATES.map(s => `<option value="${s}" ${req?.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:5px">
                    <div><label style="font-weight:700">Solicitante</label><input id="swal-req-user" type="text" class="swal2-input" style="width:100%; height: 35px; margin: 5px 0;" placeholder="Email o Nombre" value="${req?.assigned_to || ''}"></div>
                    <div><label style="font-weight:700">Prioridad</label><select id="swal-req-priority" class="swal2-input" style="width:100%; height: 35px; margin: 5px 0;"><option value="Low" ${req?.priority === 'Low' ? 'selected' : ''}>Baja</option><option value="Medium" ${req?.priority === 'Medium' || !req ? 'selected' : ''}>Media</option><option value="High" ${req?.priority === 'High' ? 'selected' : ''}>Alta</option></select></div>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:5px">
                    <div><label style="font-weight:700">Fecha Límite</label><input id="swal-req-date" type="date" class="swal2-input" style="width:100%; height: 35px; margin: 5px 0;" value="${req?.due_date ? new Date(req.due_date).toISOString().split('T')[0] : ''}"></div>
                    <div><label style="font-weight:700">Color</label><input id="swal-req-color" type="color" class="swal2-input" style="width:100%; height:35px; padding:0; margin: 5px 0;" value="${req?.color || '#9b59b6'}"></div>
                </div>
            </div>
        `,
        showCancelButton: true,
        showDenyButton: !!reqId,
        confirmButtonText: reqId ? 'Guardar' : 'Crear',
        denyButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const titleEl = document.getElementById('swal-req-title');
            if (!titleEl.value) { Swal.showValidationMessage('El título es obligatorio'); return false; }
            return {
                title: titleEl.value,
                description: document.getElementById('swal-req-desc').value,
                phase: document.getElementById('swal-req-phase').value,
                status: document.getElementById('swal-req-status').value,
                assigned_to: document.getElementById('swal-req-user').value || null,
                priority: document.getElementById('swal-req-priority').value,
                due_date: document.getElementById('swal-req-date').value || null,
                color: document.getElementById('swal-req-color').value,
                project_id: parseInt(state.selectedProject.id),
                updated_at: new Date()
            };
        }
    });

    if (result.isConfirmed && result.value) {
        const formValues = result.value;
        if (reqId) {
            const { error } = await supabaseClient.from('requerimientos').update(formValues).eq('id', reqId);
            if (error) Swal.fire('Error', error.message, 'error');
            else { Toast.fire({ icon: 'success', title: 'Actualizado' }); window.loadRequerimientos(); }
        } else {
            const { error } = await supabaseClient.from('requerimientos').insert([formValues]);
            if (error) Swal.fire('Error', error.message, 'error');
            else { Toast.fire({ icon: 'success', title: 'Creado' }); window.loadRequerimientos(); }
        }
    } else if (result.isDenied && reqId) {
        const delConf = await Swal.fire({ title: '¿Eliminar?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' });
        if (delConf.isConfirmed) {
            const { error } = await supabaseClient.from('requerimientos').delete().eq('id', reqId);
            if (error) Swal.fire('Error', error.message, 'error');
            else { Toast.fire({ icon: 'success', title: 'Eliminado' }); window.loadRequerimientos(); }
        }
    }
}
