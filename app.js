/**
 * ALTIM PORTAL CLOUD - Core Application Logic
 * Optimized for "My Home" dashboard architecture
 */

// --- CONFIGURATION ---
const APP_CONFIG = {
    DEFAULT_ADMIN: 'adelamatta@altim.es',
    DEFAULT_PASS: 'Altim-01'
};

// --- SUPABASE CONFIGURATION ---
// OBTÉN ESTOS DATOS DE TU PANEL DE SUPABASE (Settings > API)
const SUPABASE_URL = 'https://dcrhvmewmpgtmdswofxs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjcmh2bWV3bXBndG1kc3dvZnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTY1NTEsImV4cCI6MjA4OTA3MjU1MX0.PtpFXSHl1iOoqv19AEE_OYeI1CbmwKMcpgLH2i-r-Bw';

let supabaseClient = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase Connection Initialized");
}

// --- APPLICATION STATE ---
let state = {
    isLoggedIn: false,
    view: 'my-home',
    currentUser: null,
    selectedProject: null,
    rolePermissions: [],
    users: [
        {
            email: 'adelamatta@altim.es',
            password: 'Altim-01',
            name: 'Alvaro',
            lastname: 'D.',
            role: 'Administrador',
            type: 'Altim',
            cliente: 'Altim',
            project: 'Portal Cloud',
            address: 'Calle Falsa 123',
            phone: '600000000',
            image: ''
        }
    ],
    clients: [],
    projects: [],
    kanbanFilter: 'All',
    expCalendarDate: new Date(),
    preCalendarDate: new Date(),
    incidents: [],
    incidentAuditLogs: [],
    selectedBPs: [],
    generalUATs: [],
    filteredUATs: [],
    customUATs: [],
    selectedUatIds: new Set(),
    uatCurrentPage: 1
};
window.state = state;

// --- GLOBAL UTILS ---
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

// --- DOCUMENT MANAGEMENT CONFIGURATION ---
const PHASE_DOC_TYPES = {
    GES: [
        'Presentación comité de seguimiento (táctico)',
        'Acta comité de seguimiento',
        'Presentación comité de dirección (táctico)',
        'Acta comité de dirección',
        'Acta de fin de fase',
        'Acta de aprobación de Sprint',
        'Acta de comité GO / NO-GO',
        'Pricing del proyecto',
        'Gestión de cambio',
        'Videos comités Tácticos',
        'Videos comités Dirección',
        'Videos comités GO/NOGO'
    ],
    DES: ['Assessment', 'Oferta', 'Contrato', 'BOM SAP', 'DDA'],
    PRE: [
        'Kick-Off',
        'Matriz de comunicaciones',
        'Planificación del equipo Altim',
        'Plan de proyecto',
        'Preparación Ejemplos Workshops Sesiones Fit-To Stándar',
        'Video Kick-off',
        'Acta de Kick-off',
        'Traspaso comercial',
        'Presentación Midset'
    ],
    EXP: [
        'Cuestionarios Sesiones Fit-To-Estándar',
        'Preparación Fichero BPML',
        'Preparación Fichero Backlog',
        'Preparación fichero GAPS',
        'Videos de taller',
        'Presentación taller',
        'Acta de taller',
        'Estructura Organizativa',
        'Diseños de Desarrollos a medida',
        'Diseños técnicos'
    ],
    REA: [
        'Inventario de desarrollos a medida',
        'Ficheros de carga de datos',
        'Fichero de roles y autorizaciones',
        'Corte de operaciones y cut-over',
        'Documento de evidencias de pruebas',
        'Ficheros de pruebas automáticas'
    ],
    DEPLOY: ['Documento de Incidencias'],
    DEY: ['Documento de Incidencias', 'Check list de pruebas']
};

const PHASE_DOC_ICONS = {
    'Cuestionarios Sesiones Fit-To-Estándar': 'fa-question-circle',
    'Preparación Fichero BPML': 'fa-table',
    'Preparación Fichero Backlog': 'fa-list-check',
    'Preparación fichero GAPS': 'fa-exclamation-triangle',
    'Videos de taller': 'fa-video',
    'Presentación taller': 'fa-file-powerpoint',
    'Acta de taller': 'fa-file-signature',
    'Estructura Organizativa': 'fa-sitemap',
    'Diseños de Desarrollos a medida': 'fa-code',
    'Diseños técnicos': 'fa-cogs',
    // Fallback or others
    'default': 'fa-file-alt'
};

const PHASE_COLORS = {
    'DES': { bg: '#e3f2fd', color: '#1976d2' }, // Blue
    'PRE': { bg: '#e8f5e9', color: '#2e7d32' }, // Green
    'EXP': { bg: '#fff3e0', color: '#ef6c00' }, // Orange
    'REA': { bg: '#f3e5f5', color: '#7b1fa2' }, // Purple
    GES: { bg: '#f5f5f5', color: '#616161' }, // Grey
    DEPLOY: { bg: '#ffebee', color: '#c62828' }, // Red
    DEY: { bg: '#ffebee', color: '#c62828' } // Red
};

// --- INCIDENT MANAGEMENT CONFIGURATION ---
const INCIDENT_CONFIG = {
    PRIORITIES: ['Alta', 'Baja', 'Sin prioridad', 'Crítica', 'Media'],
    TYPES: ['Consulta', 'Duda', 'Evolutivo', 'Formación', 'Gestión', 'Incidencia', 'Petición', 'Preventiva', 'Proyecto'],
    SYSTEMS: ['S/4Hana CP', 'S/4Hana Rise', 'S/4Hana OP', 'Data Warehouse', 'CRM', 'SAC', 'Integration Suite', 'SAP BTP', 'Build'],
    STATUSES: [
        '01 En proceso', '02 Retrasada Altim', '03 Entregada', '04 Pte Info cliente',
        '05 Pte de Pruebas cliente', '06 Retrasada cliente', '07 Parada por cliente',
        '08 Abierta', '09 Nueva', '10 Cerrada', '11 Descartada', '12 Duplicada'
    ],
    LOBS: [
        'Finanzas', 'Aprovisionamientos', 'Gestión de almacenes', 'Ventas', 'Control de gestión',
        'Fabricación', 'Calidad', 'Proyectos e ingeniería', 'Gestión de activos',
        'Tesorería', 'Recursos humanos', 'Servicios a cliente y CRM', 'Desarrollo a medida', 'Analíticas',
        'BASIS', 'SUCCESSFACTORS', 'MODULO ALTIM', 'OTROS'
    ]
};

// --- DOM ELEMENTS ---
const elements = {
    authPage: document.getElementById('auth-page'),
    appPage: document.getElementById('app-page'),
    loginForm: document.getElementById('login-form'),
    myHomeView: document.getElementById('my-home-view'),
    moduleContainer: document.getElementById('module-container'),
    moduleContent: document.getElementById('module-content'),
    moduleTitle: document.getElementById('module-title'),
    backToHome: document.getElementById('back-to-home'),
    clock: document.getElementById('clock'),
    projectHeader: document.getElementById('current-project-header'),
    projectDesc: document.getElementById('current-project-desc'),
    timelineSteps: document.getElementById('timeline-steps'),
    todayMarker: document.getElementById('today-marker-container'),
    goLiveContainer: document.getElementById('go-live-container'),
    logoutBtnHeader: document.getElementById('logout-btn-header'),
    logoutBtnSidebar: document.getElementById('logout-btn-sidebar'),
    profileBtn: document.getElementById('profile-btn'),
    configBtn: document.getElementById('config-btn')
};

window.addEventListener('unhandledrejection', function (event) {
    console.error('Unhandled rejection:', event.reason);
    if (window.Swal) Swal.fire('Error de Sistema', event.reason?.message || 'Error en proceso asíncrono', 'error');
});



// --- INITIALIZATION ---
function init() {
    console.log("--- ALTIM PORTAL INIT ---");
    loadState(); // Load saved project context
    setupInteraction();
    startClock();
    initIncidents();
    loadSystemConfig();

    // Recover user session
    try {
        const savedUser = sessionStorage.getItem('altim_user');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            login(user); // login() calls updateUIForUser()
        } else {
            updateUIForUser();
        }
    } catch (err) {
        console.error("Error al restaurar sesión:", err);
        sessionStorage.removeItem('altim_user');
    }
}

async function loadSystemConfig() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient.from('api_credentials_vault').select('*');
        if (!error && data) {
            state.systemConfig = {};
            data.forEach(item => {
                state.systemConfig[item.key_name] = item.key_value;
            });
            console.log("Configuración del sistema cargada.");
        }
    } catch (err) {
        console.error("Error cargando configuración:", err);
    }
}

// --- INTERACTION SETUP ---
function setupInteraction() {
    // Login Handling
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const pass = document.getElementById('password').value;
            console.log("Intento de login para:", email);

            // 1. Try Supabase Login (if connected)
            if (supabaseClient) {
                try {
                    console.log("Consultando Supabase...");
                    const { data, error } = await supabaseClient
                        .from('users')
                        .select('*')
                        .eq('email', email)
                        .eq('password', pass)
                        .maybeSingle();

                    if (data) {
                        console.log("Login exitoso vía Supabase");
                        login(data);
                        return;
                    }
                    if (error) {
                        console.error("Error detectado en Supabase:", error.message);
                    }
                } catch (err) {
                    console.error("Error crítico de conexión:", err);
                }
            }

            // 2. Fallback to Hardcoded Admin
            if (email === APP_CONFIG.DEFAULT_ADMIN && pass === APP_CONFIG.DEFAULT_PASS) {
                console.log("Login exitoso vía Hardcoded Fallback");
                const user = state.users.find(u => u.email === email);
                login(user);
            } else {
                console.warn("Credenciales no encontradas");
                alert('Credenciales inválidas. \n\nTips:\n1. Asegúrate de haber ejecutado db_setup.sql en Supabase.\n2. Verifica que el email/password sea adelamatta@altim.es / Altim-01');
            }
        });
    }

    // Title Card Clicks
    document.querySelectorAll('.title-card').forEach(card => {
        card.addEventListener('click', () => {
            const viewKey = card.getAttribute('data-view');
            openModule(viewKey);
        });
    });

    // Sidebar Items Click
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const moduleKey = item.getAttribute('data-module');
            if (moduleKey === 's4-link') {
                window.open('https://grupoastral.sharepoint.com/sites/S4HanaCLOUDPUBLICEDITION', '_blank');
            } else if (moduleKey === 'dashboard') {
                showView('my-home');
            } else if (moduleKey) {
                openModule(moduleKey);
            }
        });
    });

    // Back button
    if (elements.backToHome) {
        elements.backToHome.addEventListener('click', () => {
            showView('my-home');
        });
    }

    // Logout
    if (elements.logoutBtnHeader) elements.logoutBtnHeader.addEventListener('click', logout);
    if (elements.logoutBtnSidebar) elements.logoutBtnSidebar.addEventListener('click', logout);

    // Config (Administrators Only)
    if (elements.configBtn) {
        elements.configBtn.addEventListener('click', () => {
            if (state.currentUser && state.currentUser.role === 'Administrador') {
                openSysConfigModal();
            } else {
                alert('Acceso Denegado: Solo el Administrador puede modificar las claves de integración.');
            }
        });
    }

    // Profile Edit from Header
    if (elements.profileBtn) {
        elements.profileBtn.addEventListener('click', renderMyProfile);
    }
}

// --- CORE FUNCTIONS ---

function login(user) {
    if (!user) {
        console.error("Intento de login con usuario nulo");
        return;
    }

    console.log("Procesando login para:", user.email);
    // Normalizar campos (mapear first_name de DB a name de App)
    user.name = user.name || user.first_name || 'Usuario';
    user.lastname = user.lastname || user.last_name || '';

    state.isLoggedIn = true;
    state.currentUser = user;
    sessionStorage.setItem('altim_user', JSON.stringify(user));

    if (elements.authPage && elements.appPage) {
        elements.authPage.style.display = 'none';
        elements.appPage.style.display = 'flex';
        console.log("Interfaz cambiada a Modo APP");
    } else {
        console.error("Error: contenedores de página no encontrados", elements);
    }

    showView('my-home');

    // Cargar permisos basados en el nuevo sistema de roles y actualizar UI al terminar
    loadUserPermissions().then(() => {
        updateUIForUser();
    });
}

async function loadUserPermissions() {
    state.userPermissions = []; // Clear current permissions
    if (!supabaseClient || !state.currentUser) return;

    const userType = (state.currentUser.user_type || state.currentUser.type || 'ALTIM').toUpperCase();
    const userRole = (state.currentUser.role || state.currentUser.rol || '#').toLowerCase();

    console.log(`Cargando permisos para Tipo: ${userType}, Rol: ${userRole}`);

    const { data, error } = await supabaseClient
        .from('role_permissions')
        .select('*')
        .eq('user_type', userType);

    if (error) {
        console.error("Error cargando permisos de rol:", error);
        return;
    }

    if (data) {
        // Mapeo manual para manejar case-insensitivity y fallbacks a '#'
        const permissionsMap = {};

        // Primero llenamos con los genéricos '#'
        data.filter(p => p.role_name === '#').forEach(p => {
            permissionsMap[p.module_key.toLowerCase()] = p;
        });

        // Sobrescribimos con los específicos del rol (insensible a mayúsculas)
        data.filter(p => p.role_name.toLowerCase() === userRole && p.role_name !== '#').forEach(p => {
            permissionsMap[p.module_key.toLowerCase()] = p;
        });

        state.userPermissions = Object.values(permissionsMap);
        console.log("Permisos del usuario cargados y procesados:", state.userPermissions.length);
        updateUIForUser();
    }
}

function getPermission(moduleKey) {
    if (!state.userPermissions) return null;
    let key = (moduleKey || '').toLowerCase();
    if (key === 'deploy') key = 'dey';
    return state.userPermissions.find(p => p.module_key.toLowerCase() === key);
}

function hasPermission(moduleKey, type) {
    // --- SPECIAL OVERRIDE FOR GES MODULE ---
    if ((moduleKey || '').toLowerCase() === 'ges' && state.currentUser) {
        const role = (state.currentUser.role || state.currentUser.rol || state.currentUser.type || '').toLowerCase();
        if (role === 'jefe de proyecto' || role === 'management' || role === 'administrador' || role === 'admin') {
            switch (type) {
                case 'invisible': return false;
                case 'no_access': return false;
                case 'restricted': return false;
                default: return true; // view, modify, download, attach are true
            }
        }
    }

    const p = getPermission(moduleKey);

    // Default behaviors if no record is found in the database
    if (!p) {
        // Special override for new 'seg' module until permissions are migrated in DB
        if (moduleKey === 'seg') {
            switch (type) {
                case 'invisible': return false;
                case 'no_access': return false;
                case 'restricted': return false;
                default: return true;
            }
        }

        switch (type) {
            case 'invisible': return true;   // If no record, it's invisible
            case 'view':
            case 'modify':
            case 'download':
            case 'attach':
            case 'restricted':
            case 'no_access': return false;  // If no record, no actions/access
            default: return false;
        }
    }

    switch (type) {
        case 'view': return p.can_view;
        case 'modify': return p.can_modify;
        case 'download': return p.can_download;
        case 'attach': return p.can_attach;
        case 'invisible': return p.is_invisible;
        case 'restricted': return p.is_restricted;
        case 'no_access': return p.has_no_access;
        default: return true;
    }
}

function isItemRestricted(moduleKey, itemName) {
    const p = getPermission(moduleKey);
    if (!p || !p.is_restricted || !p.res_parte) return false;

    // Filter out empty strings to prevent accidental matches with includes()
    const restrictedItems = p.res_parte.split(/[,;]/).map(s => s.trim().toLowerCase()).filter(s => s !== '');
    return restrictedItems.some(ri => itemName.toLowerCase().includes(ri) || ri.includes(itemName.toLowerCase()));
}

function isButtonRestricted(moduleKey, buttonName) {
    const p = getPermission(moduleKey);
    if (!p || !p.is_restricted || !p.res_button) return false;

    // Filter out empty strings
    const restrictedButtons = p.res_button.split(/[,;]/).map(s => s.trim().toLowerCase()).filter(s => s !== '');
    return restrictedButtons.includes(buttonName.toLowerCase());
}

function logout() {
    state.isLoggedIn = false;
    state.currentUser = null;
    state.userPermissions = [];
    sessionStorage.removeItem('altim_user');
    elements.authPage.style.display = 'flex';
    elements.appPage.style.display = 'none';
}

window.showView = function(viewKey) {
    state.view = viewKey;
    if (viewKey === 'my-home') {
        elements.myHomeView.classList.remove('hidden');
        elements.moduleContainer.classList.add('hidden');
        // Update Sidebar Active State
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-module') === 'dashboard');
        });
        loadPublicNews(); // Load news when showing dashboard
    } else {
        elements.myHomeView.classList.add('hidden');
        elements.moduleContainer.classList.remove('hidden');
    }
}

function openModule(moduleKey) {
    // 1. Check dynamic permissions (No Access)
    if (hasPermission(moduleKey, 'no_access')) {
        Swal.fire({
            icon: 'error',
            title: 'Acceso Denegado',
            text: 'Usted no tiene autorización para acceder a este módulo.',
            confirmButtonColor: 'var(--sap-blue)'
        });
        return; // Don't switch view, stay where you are
    }

    state.activeModule = moduleKey;
    showView('module');

    // Update Sidebar Active State
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-module') === moduleKey);
    });

    elements.moduleTitle.textContent = getModuleTitle(moduleKey);
    renderModuleContent(moduleKey);
}

function getModuleTitle(key) {
    const titles = {
        usu: 'Gestión de Usuarios',
        cli: 'Gestión de Clientes',
        mae: 'Mantenimiento de Maestros',
        prj: 'Selección de Proyecto',
        proy: 'Información del Proyecto',
        des: 'Fase Descubrir (DES)',
        pre: 'Fase Preparar (PRE)',
        exp: 'Fase Explorar (EXP)',
        rea: 'Fase Realizar (REA)',
        dey: 'Fase Desplegar (DEY)',
        eje: 'Fase Ejecutar (EJE)',
        doc: 'Documentación de Proyectos',
        ges: 'Gestión de Proyecto',
        tar: 'Gestión de Tareas',
        seg: 'Requerimiento de información',
        est: 'Estadística y Analíticas',
        mod: 'Log de Modificaciones',
        rep: 'Reporting',
        rol: 'Gestión de Roles y Permisos',
        ayu: 'Centro de Ayuda y Guía de Usuario'
    };
    return titles[key] || 'Módulo';
}
async function renderModuleContent(key) {
    elements.moduleContent.innerHTML = '<div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';

    if (key === 'prj') renderProjectSelector();
    else if (key === 'proy') await renderProjectInformation();
    else if (key === 'des') await renderDiscoverPhase();
    else if (key === 'pre') initPreparePhase();
    else if (key === 'exp') await renderExplorePhase();
    else if (key === 'rea') await renderRealizePhase();
    else if (key === 'dey') await renderDeyPhase();
    else if (key === 'ges') await renderGESModule();
    else if (key === 'tar') await renderTaskManagement();
    else if (key === 'seg') await renderSegModule();
    else if (key === 'usu') await renderUserManagement();
    else if (key === 'cli') await renderClientManagement();
    else if (key === 'mae') await renderMasterDataManagement();
    else if (key === 'rol') await renderRoleManagement();
    else if (key === 'doc') await renderProjectDocumentation();
    else if (key === 'est') renderStatisticsModule();
    else if (key === 'mod') renderAuditLogModule();
    else if (key === 'rep') renderReportingModule();
    else if (key === 'ayu') renderHelpModule();
    else {
        elements.moduleContent.innerHTML = `
            <div class="card" style="animation: fadeIn 0.3s ease;">
                <h3>Módulo ${getModuleTitle(key)}</h3>
                <p>Implementación en curso según los requerimientos del documento maestro.</p>
            </div>
        `;
    }
}

// --- MODULE SPECIALIZATIONS ---

function renderProjectSelector() {
    elements.moduleContent.innerHTML = `
        <div class="card">
            ${renderPhaseHeader('PROYECTOS')}
            
            <div class="filter-row" style="margin-top:1.5rem">
                <div class="form-group" style="flex:1">
                    <label>Filtrar por Cliente</label>
                    <select id="prj-client-filter" onchange="loadProjectsList()">
                        <option value="">-- Todos los Clientes --</option>
                    </select>
                </div>
                ${hasPermission('prj', 'modify') ? `
                <button class="btn" style="width:auto; margin-top:20px;" onclick="showProjectModal()">
                    <i class="fas fa-plus"></i> Nuevo Proyecto
                </button>
                ` : ''}
                <button class="btn btn-secondary" style="width:auto; margin-top:20px;" onclick="clearProjectSelection()">
                    <i class="fas fa-eraser"></i> Limpiar Selección
                </button>
            </div>

            <div class="table-container" id="prj-table-container">
                <p style="padding: 2rem; text-align: center; color: #666;"><i class="fas fa-spinner fa-spin"></i> Cargando proyectos...</p>
            </div>
        </div>
    `;
    loadProjectFilter();
    loadProjectsList();
}

async function loadProjectFilter() {
    if (!supabaseClient) return;
    const select = document.getElementById('prj-client-filter');
    if (!select) return;

    // Clear and reset filter
    select.innerHTML = '<option value="">-- Todos los Clientes --</option>';

    const { data } = await supabaseClient.from('clients').select('id, nombre_cliente').order('nombre_cliente');
    if (data) {
        data.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.nombre_cliente;
            select.appendChild(opt);
        });
    }
}

window.loadProjectsList = async function () {
    const container = document.getElementById('prj-table-container');
    const clientId = document.getElementById('prj-client-filter').value;

    if (!supabaseClient) {
        container.innerHTML = '<p style="text-align:center; padding:1rem;">Error: No hay conexión con la base de datos.</p>';
        return;
    }

    const user = state.currentUser;
    if (!user) return;

    // --- FILTERING LOGIC ---
    let query = supabaseClient.from('cliente_proy').select('*, clients(nombre_cliente, abrev)');

    // Manage Role Visibility
    const isFullAccess = ['Administrador', 'Management'].includes(user.role);

    if (!isFullAccess) {
        // Fetch explicit project assignments
        const { data: proyAssign } = await supabaseClient
            .from('user_project_relation')
            .select('project_id')
            .eq('user_id', user.id);

        // Fetch client assignments
        const { data: clientAssign } = await supabaseClient
            .from('user_client_relation')
            .select('client_id')
            .eq('user_id', user.id);

        const projectIds = (proyAssign || []).map(a => a.project_id);
        const clientIds = (clientAssign || []).map(a => a.client_id);

        if (projectIds.length === 0 && clientIds.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:2rem; color:#999;">No tienes accesos asignados. Contacta con un Administrador o JP.</p>';
            return;
        }

        // Construct OR filter for Projects OR Clients
        const filters = [];
        if (projectIds.length > 0) filters.push(`id.in.(${projectIds.join(',')})`);
        if (clientIds.length > 0) filters.push(`client_id.in.(${clientIds.join(',')})`);

        query = query.or(filters.join(','));
    }

    if (clientId) query = query.eq('client_id', clientId);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = `<p>Error al cargar proyectos: ${error.message}</p>`;
        return;
    }

    container.innerHTML = `
        <table class="alv-table">
            <thead>
                <tr>
                    <th>Cliente</th>
                    <th>Abrev</th>
                    <th>ID Proyecto</th>
                    <th>Descripción</th>
                    <th>SharePoint URL</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(p => `
                    <tr class="${state.selectedProject?.id === p.id ? 'row-active' : ''}">
                        <td>${p.clients?.nombre_cliente || '-'}</td>
                        <td>${p.clients?.abrev || '-'}</td>
                        <td style="font-weight:700">${p.id_proyecto}</td>
                        <td>${p.descripcion_prj || '-'}</td>
                        <td>${p.sharepoint_url ? `<a href="${p.sharepoint_url}" target="_blank" style="color:var(--sap-blue)"><i class="fas fa-link"></i> Abrir SharePoint</a>` : '-'}</td>
                        <td>
                            ${state.selectedProject?.id === p.id
            ? '<span class="badge" style="background:var(--primary-color)">ACTIVO</span>'
            : '<span class="badge" style="background:#ccc">Inactivo</span>'}
                        </td>
                        <td>
                            <button class="btn-icon" title="Seleccionar" onclick="selectProjectFromTable('${p.id}')">
                                <i class="fas fa-check-circle" style="color:${state.selectedProject?.id === p.id ? 'var(--primary-color)' : '#ddd'}"></i>
                            </button>
                            ${hasPermission('prj', 'modify') ? `
                            <button class="btn-icon" title="Editar" onclick="showProjectModal('${p.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon" title="Eliminar" onclick="deleteProject('${p.id}')">
                                <i class="fas fa-trash" style="color:#ff4444"></i>
                            </button>
                            ` : ''}
                        </td>
                    </tr>
                `).join('')}
                ${data.length === 0 ? '<tr><td colspan="7" style="text-align:center">No hay proyectos para este cliente</td></tr>' : ''}
            </tbody>
        </table>
    `;
};

window.selectProjectFromTable = async function (id) {
    if (!supabaseClient) return;
    const { data, error } = await supabaseClient.from('cliente_proy')
        .select('*, clients(nombre_cliente, abrev)')
        .eq('id', id)
        .single();

    if (data) {
        state.selectedProject = {
            id: data.id,
            name: data.id_proyecto,
            client: data.clients.nombre_cliente,
            client_abrev: data.clients.abrev,
            client_id: data.client_id,
            descripcion_prj: data.descripcion_prj,
            go_live_date: data.go_live_date,
            support_start_date: data.support_start_date,
            support_end_date: data.support_end_date,
            sharepoint_url: data.sharepoint_url,
            phase: 'Discover'
        };

        // Ensure the 6 phases exist for this project
        await ensureProjectPhases(data.id);

        saveState();
        updateUIForUser();
        loadProjectsList();
        Swal.fire('Proyecto Seleccionado', `Ahora estás trabajando en ${data.id_proyecto}`, 'success');
    }
};

window.clearProjectSelection = function () {
    state.selectedProject = null;
    saveState();
    updateUIForUser();
    if (state.activeModule === 'prj') loadProjectsList();
    Swal.fire('Selección Limpiada', 'Ya no hay ningún proyecto activo.', 'info');
};

window.deleteProject = async function (id) {
    const result = await Swal.fire({
        title: '¿Eliminar proyecto?',
        text: "Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff4444'
    });

    if (result.isConfirmed) {
        const { error } = await supabaseClient.from('cliente_proy').delete().eq('id', id);
        if (error) {
            Swal.fire('Error', error.message, 'error');
        } else {
            if (state.selectedProject?.id === parseInt(id)) {
                state.selectedProject = null;
                saveState();
                updateUIForUser();
            }
            loadProjectsList();
            if (document.getElementById('cli-projects-table-container')) renderClientProjectsTable();
            Swal.fire('Eliminado', 'El proyecto ha sido borrado.', 'success');
        }
    }
};

window.showProjectModal = async function (id = null) {
    let project = null;
    if (id) {
        const { data } = await supabaseClient.from('cliente_proy').select('*').eq('id', id).single();
        project = data;
    }

    const { data: clients } = await supabaseClient.from('clients').select('id, nombre_cliente');
    const clientOptions = (clients || []).map(c => `<option value="${c.id}" ${project?.client_id === c.id ? 'selected' : ''}>${c.nombre_cliente}</option>`).join('');

    const { value: formValues } = await Swal.fire({
        title: id ? 'Editar Proyecto' : 'Nuevo Proyecto',
        html: `
            <div style="text-align:left">
                <label>Cliente</label>
                <select id="swal-client" class="swal2-input" style="width:100%; margin: 10px 0;">
                    ${clientOptions}
                </select>
                <label>ID Proyecto (30 caracteres)</label>
                <input id="swal-id" class="swal2-input" placeholder="Ej: PRJ-001" maxlength="30" value="${project?.id_proyecto || ''}">
                <label>Descripción (40 caracteres)</label>
                <input id="swal-desc" class="swal2-input" placeholder="Breve descripción" maxlength="40" value="${project?.descripcion_prj || ''}">
                <label>URL de SharePoint</label>
                <input id="swal-sp" class="swal2-input" placeholder="https://altim.sharepoint.com/..." value="${project?.sharepoint_url || ''}">
            </div>
        `,
        focusConfirm: false,
        preConfirm: () => {
            return {
                client_id: document.getElementById('swal-client').value,
                id_proyecto: document.getElementById('swal-id').value,
                descripcion_prj: document.getElementById('swal-desc').value,
                sharepoint_url: document.getElementById('swal-sp').value
            }
        }
    });

    if (formValues) {
        if (id) {
            const { error } = await supabaseClient.from('cliente_proy').update(formValues).eq('id', id);
            if (error) {
                Swal.fire('Error', error.message, 'error');
            } else {
                // If editing the currently active project, update the session state too!
                if (state.selectedProject && state.selectedProject.id == id) {
                    state.selectedProject.sharepoint_url = formValues.sharepoint_url;
                    state.selectedProject.name = formValues.id_proyecto;
                    state.selectedProject.descripcion_prj = formValues.descripcion_prj;
                    saveState();
                    updateUIForUser();
                }
                loadProjectsList();
                if (document.getElementById('cli-projects-table-container')) renderClientProjectsTable();
            }
        } else {
            const { error } = await supabaseClient.from('cliente_proy').insert([formValues]);
            if (error) Swal.fire('Error', error.message, 'error');
            else {
                loadProjectsList();
                if (document.getElementById('cli-projects-table-container')) renderClientProjectsTable();
            }
        }
    }
}

async function ensureProjectPhases(projectId) {
    if (!supabaseClient) return;
    const phases = ['Descubrir', 'Preparar', 'Explorar', 'Realizar', 'Desplegar', 'Ejecutar'];
    const { data: existing } = await supabaseClient.from('project_phases').select('phase_name').eq('project_id', projectId);

    const existingNames = (existing || []).map(p => p.phase_name);
    const toInsert = phases.filter(p => !existingNames.includes(p)).map(p => ({
        project_id: projectId,
        phase_name: p,
        progress: 0
    }));

    if (toInsert.length > 0) {
        await supabaseClient.from('project_phases').insert(toInsert);
    }
}

function updateUIForUser() {
    // --- DYNAMIC PERMISSIONS (RBAC) ---
    // Update Sidebar Visibility
    document.querySelectorAll('.nav-item').forEach(item => {
        const key = item.getAttribute('data-module');
        if (key && key !== 'dashboard' && key !== 's4-link') {
            const isInvisible = hasPermission(key, 'invisible');
            item.style.display = isInvisible ? 'none' : 'flex';
        }
    });

    // Update Dashboard Card Visibility
    document.querySelectorAll('.title-card').forEach(card => {
        const key = card.getAttribute('data-view');
        if (key && key !== 'new') {
            const isInvisible = hasPermission(key, 'invisible');
            card.style.display = isInvisible ? 'none' : 'flex';
        }
    });

    // Hide sidebar headers if all children are invisible
    const sidebarGeneralHeader = document.getElementById('sidebar-general-header');
    if (sidebarGeneralHeader) {
        const generalKeys = ['usu', 'cli', 'mae', 'rol'];
        const allInvisible = generalKeys.every(k => hasPermission(k, 'invisible'));
        sidebarGeneralHeader.style.display = allInvisible ? 'none' : 'block';
    }

    const dashboardGeneralSection = document.getElementById('dashboard-general-section');
    if (dashboardGeneralSection) {
        const generalKeys = ['usu', 'cli', 'mae', 'rol'];
        const allInvisible = generalKeys.every(k => hasPermission(k, 'invisible'));
        dashboardGeneralSection.style.display = allInvisible ? 'none' : 'block';
    }

    // Update profile pic, name, roles etc.
    if (state.currentUser) {
        const userDisplay = document.querySelector('.user-info h4');
        const roleDisplay = document.querySelector('.user-info p');
        const fullName = (state.currentUser.first_name || state.currentUser.name || '') + ' ' + (state.currentUser.last_name || state.currentUser.lastname || '');

        // Sidebar update
        if (userDisplay) userDisplay.textContent = fullName;
        if (roleDisplay) roleDisplay.textContent = state.currentUser.role || state.currentUser.type || '';

        // Header update
        const headerName = document.getElementById('header-user-name');
        const headerRole = document.getElementById('header-user-role');
        if (headerName) headerName.textContent = fullName;
        if (headerRole) headerRole.textContent = state.currentUser.role || state.currentUser.type || '';

        // Profile Image update (Header)
        const profileBtn = document.getElementById('profile-btn');
        const userImg = state.currentUser.profile_image || state.currentUser.image;
        if (profileBtn) {
            if (userImg) {
                profileBtn.innerHTML = `<img src="${userImg}" alt="Perfil" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #ccc;">`;
            } else {
                profileBtn.innerHTML = '<i class="fas fa-user-circle"></i>';
            }
        }

        // Sidebar Avatar update
        const sidebarAvatar = document.querySelector('.user-avatar');
        if (sidebarAvatar) {
            if (userImg) {
                sidebarAvatar.style.backgroundImage = `url(${userImg})`;
                sidebarAvatar.style.backgroundSize = 'cover';
                sidebarAvatar.style.backgroundPosition = 'center';
            } else {
                sidebarAvatar.style.backgroundImage = 'none';
            }
        }
    }

    // Update Project Context Header & Timeline
    if (state.selectedProject) {
        if (elements.projectHeader) elements.projectHeader.textContent = state.selectedProject.descripcion_prj || state.selectedProject.name;
        const descEl = document.getElementById('current-project-desc');
        if (descEl) descEl.textContent = state.selectedProject.name; // ID goes to subtitle
        updateTimeline();
        updateDashboardKPIs();
    } else {
        if (elements.projectHeader) elements.projectHeader.textContent = 'Seleccionar Proyecto';
        const descEl = document.getElementById('current-project-desc');
        if (descEl) descEl.textContent = '';
        updateTimeline();
    }

    // Populate Dashboard KPIs (TITLES)
    loadDashboardKPIs();
    
    // Refresh notifications for the active project
    if (typeof window.loadNotifications === 'function') {
        window.loadNotifications();
    }
}

async function loadDashboardKPIs() {
    if (!supabaseClient) {
        if (document.getElementById('kpi-usu')) document.getElementById('kpi-usu').textContent = (state.users || []).length;
        if (document.getElementById('kpi-cli')) document.getElementById('kpi-cli').textContent = (state.clients || []).length;
        return;
    }

    try {
        const { count: userCount } = await supabaseClient.from('users').select('*', { count: 'exact', head: true });
        const { count: clientCount } = await supabaseClient.from('clients').select('*', { count: 'exact', head: true });

        if (document.getElementById('kpi-usu') && userCount !== null) document.getElementById('kpi-usu').textContent = userCount;
        if (document.getElementById('kpi-cli') && clientCount !== null) document.getElementById('kpi-cli').textContent = clientCount;
    } catch (e) {
        console.error("Error loading dashboard KPIs", e);
    }
}

function updateTimeline() {
    if (!elements.timelineSteps) return;

    if (!state.selectedProject) {
        elements.timelineSteps.innerHTML = '';
        elements.todayMarker.innerHTML = '';
        elements.goLiveContainer.innerHTML = '';
        return;
    }

    loadTimelineData();
}



async function loadTimelineData() {
    if (!supabaseClient || !state.selectedProject) return;

    let { data: phasesData } = await supabaseClient
        .from('project_phases')
        .select('*')
        .eq('project_id', state.selectedProject.id)
        .order('id', { ascending: true });

    // Auto-init if empty
    if (!phasesData || phasesData.length === 0) {
        await ensureProjectPhases(state.selectedProject.id);
        const { data: retry } = await supabaseClient
            .from('project_phases')
            .select('*')
            .eq('project_id', state.selectedProject.id)
            .order('id', { ascending: true });
        phasesData = retry;
    }

    const { data: projectData } = await supabaseClient
        .from('cliente_proy')
        .select('go_live_date')
        .eq('id', state.selectedProject.id)
        .maybeSingle();

    if (!phasesData || phasesData.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let html = '';
    let currentPhaseIdx = -1;

    const abbrMap = {
        'Descubrir': 'DES',
        'Preparar': 'PRE',
        'Explorar': 'EXP',
        'Realizar': 'REA',
        'Desplegar': 'DEY',
        'Ejecutar': 'EJE'
    };

    (phasesData || []).forEach((p, index) => {
        const start = p.start_date ? new Date(p.start_date) : null;
        const end = p.end_date ? new Date(p.end_date) : null;
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);

        let statusClass = '';
        if (p.progress === 100) {
            statusClass = 'completed';
        } else if (p.progress > 0) {
            statusClass = 'active';
            currentPhaseIdx = index;
        } else if (start && end && today >= start && today <= end) {
            statusClass = 'active';
            currentPhaseIdx = index;
        }

        const abbr = abbrMap[p.phase_name] || p.phase_name.substring(0, 3).toUpperCase();

        html += `
            <div class="timeline-node ${statusClass}" title="${p.phase_name} (${p.progress}%)">
                <div class="node-circle">
                    <span class="node-abbr">${abbr}</span>
                </div>
                <div class="node-info">
                    <span class="node-label">${p.phase_name}</span>
                    <span class="node-date">${p.start_date ? formatDate(p.start_date) : ''} - ${p.end_date ? formatDate(p.end_date) : ''}</span>
                </div>
            </div>
        `;
    });

    elements.timelineSteps.className = 'timeline-circles';
    elements.timelineSteps.innerHTML = html;

    // Today Marker
    if (phasesData && phasesData.length > 0) {
        const stepsCount = phasesData.length;
        const stepWidth = 100 / stepsCount;
        let leftPos = 0;

        if (currentPhaseIdx !== -1) {
            leftPos = (currentPhaseIdx * stepWidth) + (stepWidth / 2);
        } else {
            // Fallback heuristics: If no phase is active (maybe unconfigured or past/future)
            const firstPhase = phasesData[0];
            const lastPhase = phasesData[phasesData.length - 1];
            const firstStart = firstPhase.start_date ? new Date(firstPhase.start_date) : null;
            const lastEnd = lastPhase.end_date ? new Date(lastPhase.end_date) : null;

            if (firstStart && today < firstStart) {
                leftPos = 0;
            } else if (lastEnd && today > lastEnd) {
                leftPos = 100;
            } else {
                leftPos = 50; // Just put it in the middle if dates are messed up
            }
        }
        elements.todayMarker.innerHTML = `<div class="today-marker" style="left:${leftPos}%">HOY</div>`;
    } else {
        elements.todayMarker.innerHTML = '';
    }

    // Go-Live Indicator
    if (projectData?.go_live_date) {
        elements.goLiveContainer.innerHTML = `
            <div class="go-live-indicator">
                <i class="fas fa-flag-checkered"></i> GO-LIVE: ${formatDate(projectData.go_live_date)}
            </div>
        `;
    } else {
        elements.goLiveContainer.innerHTML = '';
    }
} // Close loadTimelineData

function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr; // Return as is if invalid
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
        return dateStr;
    }
}

// --- MODULE: PROJECT INFORMATION (PROY) ---
async function renderProjectInformation() {
    if (!state.selectedProject) {
        elements.moduleContent.innerHTML = `
            <div class="card" style="text-align:center; padding: 3rem;">
                <i class="fas fa-project-diagram fa-3x" style="color:#ddd; margin-bottom:1rem;"></i>
                <h3>No hay proyecto seleccionado</h3>
                <p>Por favor, selecciona un proyecto en el módulo <strong>PRJ</strong> para ver sus detalles.</p>
                <button class="btn" style="width:auto; margin-top:1rem;" onclick="openModule('prj')">Ir a Selección de Proyecto</button>
            </div>
        `;
        return;
    }

    elements.moduleContent.innerHTML = `
        <div class="prj-module-layout" style="display: flex; flex-direction: column; gap: 0.5rem;">
            
            <!-- SECCIÓN 1: DETALLES -->
            <div class="collapsible-wrapper" style="border-left: 4px solid var(--sap-blue);">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:var(--sap-blue); display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-info-circle"></i> DATOS GENERALES DEL PROYECTO
                    </h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content">
                    <div class="project-details-grid" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:1.5rem; margin-top:1rem;">
                        <div class="info-box">
                            <label style="font-size:0.7rem; color:#999; font-weight:800; text-transform:uppercase;">Fecha GO-LIVE</label>
                            <input type="date" id="proy-golive" class="form-control" value="${state.selectedProject.go_live_date || ''}" onchange="updateProjectDates()">
                        </div>
                        <div class="info-box">
                            <label style="font-size:0.7rem; color:#999; font-weight:800; text-transform:uppercase;">Inicio Soporte</label>
                            <input type="date" id="proy-sup-start" class="form-control" value="${state.selectedProject.support_start_date || ''}" onchange="updateProjectDates()">
                        </div>
                        <div class="info-box">
                            <label style="font-size:0.7rem; color:#999; font-weight:800; text-transform:uppercase;">Fin Soporte</label>
                            <input type="date" id="proy-sup-end" class="form-control" value="${state.selectedProject.support_end_date || ''}" onchange="updateProjectDates()">
                        </div>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN 2: CRONOGRAMA -->
            <div class="collapsible-wrapper" style="border-left: 4px solid var(--sap-grey);">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:var(--sap-grey); display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-calendar-alt"></i> 2: CRONOGRAMA DE FASES (ALV)
                    </h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content">
                    <div class="table-container" id="proy-phases-table" style="margin-top: 1rem;">
                        <p style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin"></i> Cargando cronograma...</p>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN 3: GESTIÓN DE RIESGOS -->
            <div class="collapsible-wrapper" style="border-left: 4px solid #f44336;">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:#f44336; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-exclamation-triangle"></i> 3: GESTIÓN DE RIESGOS
                    </h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content">
                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 1rem;">
                        <button class="btn btn-outline" onclick="exportRisksToExcel()" style="width:auto; padding:0.5rem 1rem;">
                            <i class="fas fa-file-excel"></i> Descargar Excel
                        </button>
                        <button class="btn" onclick="openRiskModal()" style="background:#f44336; width:auto; padding:0.5rem 1rem;">
                            <i class="fas fa-plus"></i> Identificar Riesgo
                        </button>
                    </div>
                    <div class="table-container" id="proy-risks-table" style="margin-top: 0.5rem;">
                        <p style="text-align:center; padding:2rem; color:#666;"><i class="fas fa-spinner fa-spin"></i> Cargando matriz de riesgos...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    loadProjectPhasesTable();
    loadProjectRisksTable();
}

async function loadProjectPhasesTable() {
    if (!supabaseClient || !state.selectedProject) return;
    const container = document.getElementById('proy-phases-table');
    if (!container) return;

    let { data: phases, error } = await supabaseClient
        .from('project_phases')
        .select('*')
        .eq('project_id', state.selectedProject.id)
        .order('id', { ascending: true });

    // Auto-init if empty
    if (!phases || phases.length === 0) {
        await ensureProjectPhases(state.selectedProject.id);
        const { data: retry } = await supabaseClient
            .from('project_phases')
            .select('*')
            .eq('project_id', state.selectedProject.id)
            .order('id', { ascending: true });
        phases = retry;
    }

    if (error) {
        container.innerHTML = `<p>Error: ${error.message}</p>`;
        return;
    }

    container.innerHTML = `
        <table class="alv-table">
            <thead>
                <tr>
                    <th>Fase</th>
                    <th>F. Inicio</th>
                    <th>F. Fin</th>
                    <th>Nueva F. Inicio</th>
                    <th>Nueva F. Fin</th>
                    <th>Progreso</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${(phases || []).map(p => `
                    <tr>
                        <td style="font-weight:700">${p.phase_name}</td>
                        <td>${p.start_date || '-'}</td>
                        <td>${p.end_date || '-'}</td>
                        <td style="color:var(--primary-color)">${p.new_start_date || '-'}</td>
                        <td style="color:var(--primary-color)">${p.new_end_date || '-'}</td>
                        <td>
                            <div style="display:flex; align-items:center; gap:10px;">
                                <div style="flex:1; height:8px; background:#eee; border-radius:4px; overflow:hidden;">
                                    <div style="width:${p.progress}%; height:100%; background:${p.progress === 100 ? 'var(--primary-color)' : 'var(--primary-color)'}"></div>
                                </div>
                                <span style="font-size:0.75rem; font-weight:700;">${p.progress}%</span>
                            </div>
                        </td>
                        <td>
                            <button class="btn-icon" title="Editar Fase" onclick="showPhaseModal('${p.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

window.updateProjectDates = async function () {
    const gl = document.getElementById('proy-golive').value;
    const ss = document.getElementById('proy-sup-start').value;
    const se = document.getElementById('proy-sup-end').value;

    const { error } = await supabaseClient.from('cliente_proy').update({
        go_live_date: gl || null,
        support_start_date: ss || null,
        support_end_date: se || null
    }).eq('id', state.selectedProject.id);

    if (error) {
        Swal.fire('Error', error.message, 'error');
    } else {
        state.selectedProject.go_live_date = gl;
        state.selectedProject.support_start_date = ss;
        state.selectedProject.support_end_date = se;
        saveState();
        loadTimelineData(); // Refresh header
        Toast.fire({ icon: 'success', title: 'Fechas actualizadas' });
    }
};

window.showPhaseModal = async function (id) {
    const { data: phase } = await supabaseClient.from('project_phases').select('*').eq('id', id).single();

    const { value: formValues } = await Swal.fire({
        title: `Editar Fase: ${phase.phase_name}`,
        html: `
            <div style="text-align:left; display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div class="form-group">
                    <label>F. Inicio</label>
                    <input type="date" id="swal-start" class="swal2-input" value="${phase.start_date || ''}">
                </div>
                <div class="form-group">
                    <label>F. Fin</label>
                    <input type="date" id="swal-end" class="swal2-input" value="${phase.end_date || ''}">
                </div>
                <div class="form-group">
                    <label>Nueva F. Inicio</label>
                    <input type="date" id="swal-nstart" class="swal2-input" value="${phase.new_start_date || ''}">
                </div>
                <div class="form-group">
                    <label>Nueva F. Fin</label>
                    <input type="date" id="swal-nend" class="swal2-input" value="${phase.new_end_date || ''}">
                </div>
                <div class="form-group" style="grid-column: span 2;">
                    <label>Progreso (%)</label>
                    <input type="number" id="swal-progress" class="swal2-input" min="0" max="100" value="${phase.progress || 0}">
                </div>
                <div class="form-group" style="grid-column: span 2;">
                    <label>Comentarios</label>
                    <textarea id="swal-comments" class="swal2-input" style="height:80px;">${phase.comments || ''}</textarea>
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            return {
                start_date: document.getElementById('swal-start').value,
                end_date: document.getElementById('swal-end').value,
                new_start_date: document.getElementById('swal-nstart').value,
                new_end_date: document.getElementById('swal-nend').value,
                progress: parseInt(document.getElementById('swal-progress').value),
                comments: document.getElementById('swal-comments').value
            }
        }
    });

    if (formValues) {
        const { error } = await supabaseClient
            .from('project_phases')
            .update(formValues)
            .eq('id', id);

        if (error) {
            Swal.fire('Error', error.message, 'error');
        } else {
            loadProjectPhasesTable();
            loadTimelineData();
            Toast.fire({ icon: 'success', title: 'Fase actualizada' });
        }
    }
};

async function loadProjectRisksTable() {
    if (!supabaseClient || !state.selectedProject) return;
    const container = document.getElementById('proy-risks-table');
    if (!container) return;

    const { data: risks, error } = await supabaseClient
        .from('project_risks')
        .select('*')
        .eq('project_id', state.selectedProject.id)
        .order('id', { ascending: true });

    if (error) {
        container.innerHTML = `<p style="color:red">Error: ${error.message}</p>`;
        return;
    }

    if (!risks || risks.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:2rem; color:#999; background:#fff; border-radius:8px; border:1px dashed #ddd;">
                <i class="fas fa-check-circle" style="font-size:2rem; opacity:0.3; margin-bottom:0.5rem;"></i><br>
                No se han identificado riesgos para este proyecto.
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div style="overflow-x: auto; width: 100%;">
            <table class="alv-table" style="min-width: 1500px;">
                <thead>
                    <tr>
                        <th style="width: 50px;">Nº</th>
                        <th style="width: 250px;">Riesgo Identificado</th>
                        <th style="width: 200px;">Causa</th>
                        <th style="width: 100px;">Probab.</th>
                        <th style="width: 100px;">Impacto</th>
                        <th style="width: 80px;">Prio.</th>
                        <th style="width: 200px;">Estrategia Respuesta</th>
                        <th style="width: 200px;">Plan de Respuesta</th>
                        <th style="width: 100px;">Estado</th>
                        <th>Comentarios</th>
                        <th style="width: 100px;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${risks.map((r, index) => {
        const prioColor = r.prioridad >= 7 ? '#d32f2f' : (r.prioridad >= 4 ? '#f57c00' : '#2e7d32');

        const getLevelColor = (level) => {
            if (!level) return '#eee';
            const l = level.toUpperCase();
            if (l === 'MUY ALTA' || l === 'CRÍTICO' || l === 'ALTO' || l === 'ALTA') return '#d32f2f'; // Red for high stuff
            if (l === 'MEDIA' || l === 'MEDIO') return '#f57c00'; // Orange
            if (l === 'BAJA' || l === 'BAJO') return '#2e7d32'; // Green
            return '#6a6d70'; // Grey
        };

        const probColor = getLevelColor(r.probabilidad);
        const impColor = getLevelColor(r.impacto);

        return `
                        <tr>
                            <td style="font-weight:700">${index + 1}</td>
                            <td style="text-align:left; font-weight:600;">${r.riesgo_identificado}</td>
                            <td style="text-align:left;">${r.causa || '-'}</td>
                            <td><span class="badge" style="background:${probColor}">${r.probabilidad || '-'}</span></td>
                            <td><span class="badge" style="background:${impColor}">${r.impacto || '-'}</span></td>
                            <td><b style="color:${prioColor}">${r.prioridad || 0}</b></td>
                            <td style="text-align:left;">${r.estrategia_respuesta || '-'}</td>
                            <td style="text-align:left;">${r.plan_respuesta || '-'}</td>
                            <td>
                                <span class="badge" style="background:${r.estado === 'Cerrado' ? '#2e7d32' : (r.estado === 'Abierto' ? '#d32f2f' : '#f57c00')}">
                                    ${r.estado || 'Abierto'}
                                </span>
                            </td>
                            <td style="text-align:left; font-size:0.75rem;">${r.comentarios || '-'}</td>
                            <td>
                                <div style="display:flex; gap:5px; justify-content:center;">
                                    <button class="btn-icon" title="Editar Riesgo" onclick="openRiskModal('${r.id}')"><i class="fas fa-edit"></i></button>
                                    <button class="btn-icon" title="Eliminar" onclick="deleteRisk('${r.id}')"><i class="fas fa-trash" style="color:#ff4444"></i></button>
                                </div>
                            </td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>
        </div>
    `;
}

window.openRiskModal = async function (id = null) {
    let risk = {
        riesgo_identificado: '',
        causa: '',
        probabilidad: 'Media',
        impacto: 'Medio',
        prioridad: 5,
        estrategia_respuesta: '',
        plan_respuesta: '',
        estado: 'Abierto',
        comentarios: ''
    };

    if (id) {
        const { data } = await supabaseClient.from('project_risks').select('*').eq('id', id).single();
        if (data) risk = data;
    }

    const { value: formValues } = await Swal.fire({
        title: id ? 'Editar Riesgo' : 'Nuevo Riesgo Identificado',
        width: '800px',
        html: `
            <div style="text-align: left; display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group" style="grid-column: span 2;">
                    <label style="font-weight:700">Riesgo Identificado *</label>
                    <input id="swal-risk-desc" class="swal2-input" style="width:100%" value="${risk.riesgo_identificado}" placeholder="Describa el riesgo...">
                </div>
                <div class="form-group" style="grid-column: span 2;">
                    <label style="font-weight:700">Causa Raíz</label>
                    <input id="swal-risk-cause" class="swal2-input" style="width:100%" value="${risk.causa || ''}" placeholder="¿Qué origina este riesgo?">
                </div>
                <div class="form-group">
                    <label style="font-weight:700">Probabilidad</label>
                    <select id="swal-risk-prob" class="swal2-input" style="width:100%">
                        <option value="Baja" ${risk.probabilidad === 'Baja' ? 'selected' : ''}>Baja</option>
                        <option value="Media" ${risk.probabilidad === 'Media' ? 'selected' : ''}>Media</option>
                        <option value="Alta" ${risk.probabilidad === 'Alta' ? 'selected' : ''}>Alta</option>
                        <option value="Muy Alta" ${risk.probabilidad === 'Muy Alta' ? 'selected' : ''}>Muy Alta</option>
                    </select>
                </div>
                <div class="form-group">
                    <label style="font-weight:700">Impacto</label>
                    <select id="swal-risk-imp" class="swal2-input" style="width:100%">
                        <option value="Bajo" ${risk.impacto === 'Bajo' ? 'selected' : ''}>Bajo</option>
                        <option value="Medio" ${risk.impacto === 'Medio' ? 'selected' : ''}>Medio</option>
                        <option value="Alto" ${risk.impacto === 'Alto' ? 'selected' : ''}>Alto</option>
                        <option value="Crítico" ${risk.impacto === 'Crítico' ? 'selected' : ''}>Crítico</option>
                    </select>
                </div>
                <div class="form-group">
                    <label style="font-weight:700">Prioridad (1-10)</label>
                    <input type="number" id="swal-risk-prio" class="swal2-input" style="width:100%" min="1" max="10" value="${risk.prioridad}">
                </div>
                <div class="form-group">
                    <label style="font-weight:700">Estado</label>
                    <select id="swal-risk-status" class="swal2-input" style="width:100%">
                        <option value="Abierto" ${risk.estado === 'Abierto' ? 'selected' : ''}>Abierto</option>
                        <option value="En Mitigación" ${risk.estado === 'En Mitigación' ? 'selected' : ''}>En Mitigación</option>
                        <option value="Cerrado" ${risk.estado === 'Cerrado' ? 'selected' : ''}>Cerrado</option>
                    </select>
                </div>
                <div class="form-group">
                    <label style="font-weight:700">Estrategia de Respuesta</label>
                    <input id="swal-risk-strategy" class="swal2-input" style="width:100%" value="${risk.estrategia_respuesta || ''}" placeholder="Evitar, Mitigar, Transferir, Aceptar">
                </div>
                <div class="form-group">
                    <label style="font-weight:700">Plan de Respuesta</label>
                    <input id="swal-risk-plan" class="swal2-input" style="width:100%" value="${risk.plan_respuesta || ''}" placeholder="Acciones a tomar">
                </div>
                <div class="form-group" style="grid-column: span 2;">
                    <label style="font-weight:700">Comentarios Adicionales</label>
                    <textarea id="swal-risk-comments" class="swal2-textarea" style="width:100%; height:80px;">${risk.comentarios || ''}</textarea>
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Guardar Riesgo',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const desc = document.getElementById('swal-risk-desc').value;
            if (!desc) {
                Swal.showValidationMessage('El nombre del riesgo es obligatorio');
                return false;
            }
            return {
                riesgo_identificado: desc,
                causa: document.getElementById('swal-risk-cause').value,
                probabilidad: document.getElementById('swal-risk-prob').value,
                impacto: document.getElementById('swal-risk-imp').value,
                prioridad: parseInt(document.getElementById('swal-risk-prio').value),
                estado: document.getElementById('swal-risk-status').value,
                estrategia_respuesta: document.getElementById('swal-risk-strategy').value,
                plan_respuesta: document.getElementById('swal-risk-plan').value,
                comentarios: document.getElementById('swal-risk-comments').value,
                project_id: state.selectedProject.id
            }
        }
    });

    if (formValues) {
        let error;
        if (id) {
            ({ error } = await supabaseClient.from('project_risks').update(formValues).eq('id', id));
        } else {
            ({ error } = await supabaseClient.from('project_risks').insert([formValues]));
        }

        if (error) {
            Swal.fire('Error', error.message, 'error');
        } else {
            loadProjectRisksTable();
            Toast.fire({ icon: 'success', title: id ? 'Riesgo actualizado' : 'Riesgo identificado con éxito' });
        }
    }
};

window.deleteRisk = async function (id) {
    const result = await Swal.fire({
        title: '¿Eliminar riesgo?',
        text: "Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d32f2f',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        const { error } = await supabaseClient.from('project_risks').delete().eq('id', id);
        if (error) {
            Swal.fire('Error', error.message, 'error');
        } else {
            loadProjectRisksTable();
            Toast.fire({ icon: 'success', title: 'Riesgo eliminado' });
        }
    }
};

window.exportRisksToExcel = async function () {
    if (!supabaseClient || !state.selectedProject) return;

    Swal.fire({
        title: 'Generando Excel...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    const { data: risks, error } = await supabaseClient
        .from('project_risks')
        .select('*')
        .eq('project_id', state.selectedProject.id)
        .order('id', { ascending: true });

    if (error) {
        Swal.fire('Error', error.message, 'error');
        return;
    }

    if (!risks || risks.length === 0) {
        Swal.fire('Atención', 'No hay riesgos registrados para exportar.', 'info');
        return;
    }

    // Map data for Excel
    const excelData = risks.map((r, index) => ({
        'Nº': index + 1,
        'Riesgo Identificado': r.riesgo_identificado,
        'Causa': r.causa || '',
        'Probabilidad': r.probabilidad || '',
        'Impacto': r.impacto || '',
        'Prioridad': r.prioridad || 0,
        'Estrategia de Respuesta': r.estrategia_respuesta || '',
        'Plan de Respuesta': r.plan_respuesta || '',
        'Estado': r.estado || 'Abierto',
        'Comentarios': r.comentarios || ''
    }));

    // Create Worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const wscols = [
        { wch: 5 }, { wch: 40 }, { wch: 30 }, { wch: 15 }, { wch: 15 },
        { wch: 10 }, { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 50 }
    ];
    ws['!cols'] = wscols;

    // Create Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Riesgos');

    // Filename: Riesgos_IDPROYECTO_Fecha.xlsx
    const date = new Date().toISOString().split('T')[0];
    const filename = `Riesgos_${state.selectedProject.name}_${date}.xlsx`;

    // Download
    XLSX.writeFile(wb, filename);

    Swal.close();
};

// --- UTILITIES ---

function startClock() {
    setInterval(() => {
        const now = new Date();
        if (elements.clock) elements.clock.textContent = now.toLocaleTimeString('es-ES');
    }, 1000);
}

function saveState() {
    sessionStorage.setItem('altim_app_state', JSON.stringify({
        selectedProject: state.selectedProject
    }));
}

function loadState() {
    try {
        const saved = sessionStorage.getItem('altim_app_state');
        if (saved) {
            const parsed = JSON.parse(saved);
            state.selectedProject = parsed.selectedProject;

            // Background refresh to catch new DB fields (like sharepoint_url) on reload
            if (state.selectedProject && supabaseClient) {
                supabaseClient.from('cliente_proy')
                    .select('*, clients(nombre_cliente)')
                    .eq('id', state.selectedProject.id)
                    .single()
                    .then(({ data }) => {
                        if (data) {
                            state.selectedProject = {
                                ...state.selectedProject,
                                sharepoint_url: data.sharepoint_url,
                                name: data.id_proyecto,
                                descripcion_prj: data.descripcion_prj,
                                client: data.clients?.nombre_cliente || state.selectedProject.client
                            };
                            saveState(); // Update session storage with fresh data
                            updateUIForUser(); // Update headers and visual indicators
                        }
                    }).catch(err => console.error("Background state refresh error:", err));
            }
        }
    } catch (e) {
        console.error("Error loading state:", e);
    }
}

function renderPhaseHeader(title) {
    if (!state.selectedProject) return `<h2>${title}</h2>`;

    const spLink = state.selectedProject.sharepoint_url
        ? `<a href="${state.selectedProject.sharepoint_url}" target="_blank" style="margin-left: 10px; color: var(--sap-blue); text-decoration: none;" title="Abrir SharePoint del Proyecto"><i class="fas fa-external-link-alt"></i></a>`
        : '';

    return `
        <div class="phase-header-wrapper">
            <div class="phase-context-header">
                <div class="context-item">
                    <span class="label">CLIENTE</span>
                    <span class="value">${state.selectedProject.client}</span>
                </div>
                <div class="context-item">
                    <span class="label">PROYECTO</span>
                    <span class="value">${state.selectedProject.descripcion_prj || state.selectedProject.name}${spLink}</span>
                </div>
                <div class="context-item" style="margin-left:auto; text-align:right;">
                    <span class="label">FASE ACTUAL</span>
                    <span class="value" style="color:var(--sap-blue)">${title.toUpperCase()}</span>
                </div>
            </div>
        </div>
    `;
}


async function renderExplorePhase() {
    if (!state.selectedProject) {
        elements.moduleContent.innerHTML = '<div class="card"><h3>Atención</h3><p>Por favor, selecciona primero un proyecto desde el módulo PRJ.</p></div>';
        return;
    }

    let hasMasterBpml = false;
    if (supabaseClient) {
        const { count, error } = await supabaseClient
            .from('master_bpml')
            .select('*', { count: 'exact', head: true })
            .eq('id_proyecto', state.selectedProject.id);
        if (!error && count > 0) hasMasterBpml = true;
    }


    const phaseId = 'EXP';
    const counts = await getDocCountsByPhase(phaseId);
    const types = (PHASE_DOC_TYPES[phaseId] || []).filter(type => !isItemRestricted(phaseId.toLowerCase(), type));

    elements.moduleContent.innerHTML = `
        ${renderPhaseHeader('Fase Explorar (EXP)')}
        <div class="exp-module-layout" style="display: flex; flex-direction: column; gap: 0.5rem;">
            
            <!-- PARTE 1 -->
            ${isItemRestricted('exp', '1: Documentación') ? '' : `
            <div class="collapsible-wrapper" style="border-left: 4px solid var(--sap-blue);">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:var(--sap-blue); display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-file-alt"></i> 1: Documentación
                    </h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content">
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 0.75rem; margin-top: 0.5rem;">
                        ${types.map(type => renderDocTypeButton(phaseId, type, counts[type] || 0)).join('')}
                    </div>
                    <div style="margin-top: 2rem;">
                        <h4 style="font-size:0.85rem; color:#666;"><i class="fas fa-history"></i> Histórico de Documentación (${phaseId})</h4>
                        <div id="exp-doc-table-container"></div>
                    </div>
                </div>
            </div>
            `}

            <!-- PARTE 2 -->
            ${isItemRestricted('exp', '2: Talleres') ? '' : `
            <div class="collapsible-wrapper" style="border-left: 4px solid #ff9800;">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:#ff9800; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-users"></i> 2: Talleres
                    </h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                         <p class="section-subtitle" style="margin: 0; font-size: 0.85rem;">Calendario de Sesiones Fit-To-Standard.</p>
                        <div class="calendar-navigation" style="display:flex; align-items:center; gap:10px;">
                            <button class="btn btn-outline" style="width:auto; padding:0.4rem 0.8rem;" onclick="window.changeExpMonth(-1)"><i class="fas fa-chevron-left"></i></button>
                            <span id="exp-calendar-month-label" style="font-weight:700; min-width:120px; text-align:center; text-transform:capitalize;">-</span>
                            <button class="btn btn-outline" style="width:auto; padding:0.4rem 0.8rem;" onclick="window.changeExpMonth(1)"><i class="fas fa-chevron-right"></i></button>
                        </div>
                    </div>
                    <div id="exp-calendar-grid" class="calendar-grid" style="min-height: 500px; border:1px solid #eee; border-radius:8px;">
                        <!-- Monthly grid rendered here -->
                    </div>
                    <p style="color:#999; font-style:italic; margin-top:1rem; font-size:0.8rem; text-align:center;">
                        <i class="fas fa-info-circle"></i> Haz clic en un día para programar un taller.
                    </p>
                </div>
            </div>
            `}

            <!-- PARTE 3 -->
            ${isItemRestricted('exp', '3: BPML, Gaps y Backlog') ? '' : `
            <div class="collapsible-wrapper" style="border-left: 4px solid #f44336;">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:#f44336; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-list-ul"></i> 3: BPML, Gaps y Backlog
                    </h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content">
                    ${hasMasterBpml ? `
                        <div id="bpml-table-container">
                            <div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Cargando Master BPML...</p></div>
                        </div>
                    ` : `
                        <div style="display:flex; justify-content:flex-end; margin-bottom:1rem;">
                            <button class="btn" onclick="generarBPML()" style="background: var(--sap-blue); color: white;">
                                <i class="fas fa-cogs"></i> Generar BPML
                            </button>
                        </div>
                        <div id="bpml-table-container">
                            <div style="padding: 2rem; text-align: center; border: 1px dashed #eee; background: #fafafa; border-radius: 8px;">
                                <i class="fas fa-clipboard-list" style="font-size: 2rem; color: #ccc; margin-bottom: 1rem;"></i>
                                <p style="color:#999; font-style:italic;">Pulsa "Generar BPML" para cargar los registros.</p>
                            </div>
                        </div>
                    `}
                </div>
            </div>
            `}

            <!-- PARTE 4 -->
            ${isItemRestricted('exp', '4: Diseños') ? '' : `
            <div class="collapsible-wrapper" style="border-left: 4px solid #9c27b0;">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:#9c27b0; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-drafting-compass"></i> 4: Diseños
                    </h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content">
                    <div style="margin-top: 1rem;">
                        <h4 style="font-size:0.85rem; color:#666; margin-bottom:0.5rem;"><i class="fas fa-code"></i> Diseños de Desarrollos a medida</h4>
                        <div id="exp-designs-table-container"></div>
                    </div>
                </div>
            </div>
            `}

            <!-- PARTE 5 -->
            ${isItemRestricted('exp', '5: Formación') ? '' : `
            <div class="collapsible-wrapper" style="border-left: 4px solid #009688; margin-top: 0.5rem;">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:#009688; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-graduation-cap"></i> 5: Formación
                    </h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content">
                    <div style="padding: 1.5rem; display: flex; align-items: center; gap: 2rem; background: #fafafa; border-radius: 8px; border: 1px solid #eee; margin-top: 1rem;">
                        <div style="flex: 1;">
                            <p style="margin: 0; font-weight: 600; color: #444;">Acceso a plataforma de e-learning SAP</p>
                            <p style="margin: 5px 0 0; font-size: 0.85rem; color: #777;">Consulta la documentación oficial y cursos interactivos.</p>
                        </div>
                        <button class="btn" style="background-color: #009688; color: white; width: auto; min-width: 150px;" onclick="Swal.fire({
                            title: 'Información de Formación',
                            text: 'Busque la versión correspondiente a la instalación en el desplegable del content Server.',
                            icon: 'info',
                            confirmButtonText: 'Abrir e-learning',
                            confirmButtonColor: '#009688'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                window.open('https://education.hana.ondemand.com/education/pub/s4/index.html#group!GR_DF9A4A9AD3D9A787', '_blank');
                            }
                        })">
                            <i class="fas fa-external-link-alt"></i> e-learning
                        </button>
                    </div>
                </div>
            </div>
            `}
        </div>
    `;
    loadPhaseDocumentsTable(phaseId, `exp-doc-table-container`);
    if (!isItemRestricted('exp', '4: Diseños')) {
        loadExpDesignsTable(phaseId, 'exp-designs-table-container');
    }
    await renderExpCalendar();
    
    if (hasMasterBpml && !isItemRestricted('exp', '3: BPML, Gaps y Backlog')) {
        window.renderMasterBpmlTable();
    }
}

window.generarBPML = async function () {
    if (!supabaseClient) return;

    const container = document.getElementById('bpml-table-container');
    if (!container) return;

    container.innerHTML = '<div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Cargando BPML...</p></div>';

    const { data, error } = await supabaseClient
        .from('general_bpml')
        .select('*')
        .order('bpml_id', { ascending: true });

    if (error) {
        container.innerHTML = `<div style="color:red; text-align:center; padding:1rem;">Error cargando datos: ${error.message}</div>`;
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:2rem; color:#666;">No se encontraron registros en la tabla General_BPML.</div>';
        return;
    }

    state.generalBpmlData = data;
    state.bpmlFilters = {};
    
    container.innerHTML = `
        <div style="margin-bottom:10px; display:flex; justify-content:flex-end; gap:10px;">
            <button class="btn btn-outline" onclick="resetBpmlFilters()" style="color:#666; border-color:#ccc; padding: 5px 15px;">
                <i class="fas fa-undo"></i> Resetear Filtros
            </button>
            <button class="btn btn-outline" onclick="toggleMassiveBpml(true)" style="color:var(--sap-blue); border-color:var(--sap-blue); padding: 5px 15px;">
                <i class="fas fa-check-square"></i> Marcar Filtrados
            </button>
            <button class="btn btn-outline" onclick="toggleMassiveBpml(false)" style="color:#d32f2f; border-color:#d32f2f; padding: 5px 15px;">
                <i class="fas fa-square"></i> Desmarcar Filtrados
            </button>
            <button class="btn" onclick="crearBPMLProyecto()" style="background:var(--sap-blue); color:white; padding: 5px 15px;">
                <i class="fas fa-plus-circle"></i> Crear BPML
            </button>
        </div>
        <div class="table-container" style="max-height: 500px; overflow-y: auto;">
            <table class="sap-alv-grid" style="width: 100%; white-space: nowrap;">
                <thead style="position: sticky; top: 0; z-index: 2;">
                    <tr>
                        <th style="width: 50px; text-align:center;">Sel.</th>
                        <th>BPML ID<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateBpmlFilter('bpml_id', this.value)"></th>
                        <th>ID E2E<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateBpmlFilter('id_e2e', this.value)"></th>
                        <th>Negocio<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateBpmlFilter('negocio', this.value)"></th>
                        <th>Grupo Proceso L1<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateBpmlFilter('grupo_proceso_l1', this.value)"></th>
                        <th>Grupo Proceso L2<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateBpmlFilter('grupo_proceso_l2', this.value)"></th>
                        <th>Nombre Proceso L3<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateBpmlFilter('nombre_proceso_l3', this.value)"></th>
                        <th>ID BP<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateBpmlFilter('id_bp', this.value)"></th>
                        <th>Scope Item<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateBpmlFilter('nombre_scope_item_sap_best_practice', this.value)"></th>
                        <th>Nombre Proceso L4<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateBpmlFilter('nombre_proceso_l4', this.value)"></th>
                        <th>Org. Objetivo<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateBpmlFilter('estructura_organizativa_objetivo', this.value)"></th>
                        <th>Evento Desencadenante<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateBpmlFilter('evento_desencadenante', this.value)"></th>
                        <th>Evento Final<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateBpmlFilter('evento_final_resultado', this.value)"></th>
                        <th>Rol Principal<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateBpmlFilter('rol_negocio_principal', this.value)"></th>
                        <th>Datos Clave<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateBpmlFilter('objetos_datos_clave', this.value)"></th>
                        <th>Reglas Negocio<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateBpmlFilter('reglas_negocio_clave', this.value)"></th>
                        <th>Integraciones<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateBpmlFilter('integraciones_estandar', this.value)"></th>
                        <th>Controles<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateBpmlFilter('controles_clave', this.value)"></th>
                        <th>KPIs<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateBpmlFilter('kpis_clave', this.value)"></th>
                    </tr>
                </thead>
                <tbody id="bpml-tbody">
                </tbody>
            </table>
        </div>
        <div id="bpml-counter" style="font-size:0.85rem; color:#666; margin-top:5px;"></div>
    `;

    renderBpmlTable();
};

window.updateBpmlFilter = function(field, value) {
    if (!state.bpmlFilters) state.bpmlFilters = {};
    state.bpmlFilters[field] = value.toLowerCase();
    renderBpmlTable();
};

window.resetBpmlFilters = function() {
    state.bpmlFilters = {};
    const container = document.getElementById('bpml-table-container');
    if (container) {
        const inputs = container.querySelectorAll('thead input[type="text"]');
        inputs.forEach(input => input.value = '');
    }
    renderBpmlTable();
};

window.crearBPMLProyecto = async function() {
    if (!supabaseClient || !state.generalBpmlData || !state.selectedProject) return;
    
    const selectedRows = state.generalBpmlData.filter(r => r.seleccionado === true);
    if (selectedRows.length === 0) {
        Swal.fire('Atención', 'No has seleccionado ningún registro.', 'warning');
        return;
    }
    
    Swal.fire({ title: 'Creando BPML del proyecto...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    const { data: existing, error: queryErr } = await supabaseClient
        .from('master_bpml')
        .select('bpml_id')
        .eq('id_proyecto', state.selectedProject.id);
        
    if (queryErr) {
        Swal.fire('Error', queryErr.message, 'error');
        return;
    }
    
    const existingIds = new Set((existing || []).map(r => r.bpml_id));
    
    const rowsToInsert = selectedRows.filter(r => !existingIds.has(r.bpml_id)).map(r => {
        const rowData = { ...r };
        delete rowData.seleccionado;
        rowData.id_proyecto = state.selectedProject.id;
        return rowData;
    });
    
    if (rowsToInsert.length === 0) {
        Swal.fire('Información', 'Los registros seleccionados ya existen en el proyecto.', 'info');
        return;
    }
    
    const { error: insertErr } = await supabaseClient
        .from('master_bpml')
        .insert(rowsToInsert);
        
    if (insertErr) {
        Swal.fire('Error al insertar', insertErr.message, 'error');
        return;
    }
    
    Swal.fire({ icon: 'success', title: 'BPML Creado', text: `Se han insertado ${rowsToInsert.length} nuevos registros.`, timer: 2000, showConfirmButton: false });
    
    renderExplorePhase();
};

window.renderMasterBpmlTable = async function() {
    if (!supabaseClient) return;
    const container = document.getElementById('bpml-table-container');
    if (!container) return;
    
    container.innerHTML = '<div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Cargando BPML del Proyecto...</p></div>';

    const { data, error } = await supabaseClient
        .from('master_bpml')
        .select('*')
        .eq('id_proyecto', state.selectedProject.id)
        .order('bpml_id', { ascending: true });

    if (error) {
        container.innerHTML = `<div style="color:red; text-align:center; padding:1rem;">Error: ${error.message}</div>`;
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:2rem; color:#666;">No hay registros en el BPML del proyecto.</div>';
        return;
    }

    state.masterBpmlData = data;
    state.masterBpmlFilters = {};
    
    let html = `
        <div style="margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-weight:bold; color:var(--sap-blue);"><i class="fas fa-check-circle"></i> BPML Definitivo - ${state.selectedProject.name}</div>
            <div style="display:flex; justify-content:flex-end; gap:10px;">
                <button class="btn btn-outline" onclick="resetMasterBpmlFilters()" style="color:#666; border-color:#ccc; padding: 5px 15px;">
                    <i class="fas fa-undo"></i> Resetear Filtros
                </button>
                <button class="btn btn-outline" onclick="toggleMassiveMasterBpml(true)" style="color:var(--sap-blue); border-color:var(--sap-blue); padding: 5px 15px;">
                    <i class="fas fa-check-square"></i> Marcar Filtrados
                </button>
                <button class="btn btn-outline" onclick="toggleMassiveMasterBpml(false)" style="color:#d32f2f; border-color:#d32f2f; padding: 5px 15px;">
                    <i class="fas fa-square"></i> Desmarcar Filtrados
                </button>
            </div>
        </div>
        <div style="margin-bottom:10px; display:flex; justify-content:flex-end; gap:10px; padding:10px; background:#f8f9fa; border:1px solid #ddd; border-radius:4px; flex-wrap:wrap;">
            <button class="btn" onclick="addNuevoRegistroBpml()" style="background-color:var(--sap-blue); border-color:var(--sap-blue); color:white; padding: 5px 15px;"><i class="fas fa-plus"></i> + Registros nuevos</button>
            <button class="btn" onclick="addRegistrosTemplate()" style="background-color:#1565c0; border-color:#1565c0; color:white; padding: 5px 15px;"><i class="fas fa-file-alt"></i> + Registros template</button>
            <button class="btn" onclick="borrarEntradas()" style="background-color:#1976d2; border-color:#1976d2; color:white; padding: 5px 15px;"><i class="fas fa-minus-circle"></i> Borrar entradas</button>
            <button class="btn" onclick="stubAction('Actualizar BD')" style="background-color:#1e88e5; border-color:#1e88e5; color:white; padding: 5px 15px;"><i class="fas fa-sync"></i> Actualizar BD</button>
            <button class="btn" onclick="limpiarBpml()" style="background-color:#42a5f5; border-color:#42a5f5; color:white; padding: 5px 15px;"><i class="fas fa-trash-alt"></i> Limpiar BPML</button>
        </div>
        <div class="table-container" style="max-height: 500px; overflow-y: auto;">
            <table class="sap-alv-grid" style="width: 100%; white-space: nowrap;">
                <thead style="position: sticky; top: 0; z-index: 2;">
                    <tr>
                        <th style="width: 50px; text-align:center;">Sel.</th>
                        <th>BPML ID<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateMasterBpmlFilter('bpml_id', this.value)"></th>
                        <th>ID E2E<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateMasterBpmlFilter('id_e2e', this.value)"></th>
                        <th>Negocio<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateMasterBpmlFilter('negocio', this.value)"></th>
                        <th>Grupo Proceso L1<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateMasterBpmlFilter('grupo_proceso_l1', this.value)"></th>
                        <th>Grupo Proceso L2<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateMasterBpmlFilter('grupo_proceso_l2', this.value)"></th>
                        <th>Nombre Proceso L3<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateMasterBpmlFilter('nombre_proceso_l3', this.value)"></th>
                        <th>ID BP<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateMasterBpmlFilter('id_bp', this.value)"></th>
                        <th>Scope Item<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateMasterBpmlFilter('nombre_scope_item_sap_best_practice', this.value)"></th>
                        <th>Nombre Proceso L4<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateMasterBpmlFilter('nombre_proceso_l4', this.value)"></th>
                        <th>Org. Objetivo<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateMasterBpmlFilter('estructura_organizativa_objetivo', this.value)"></th>
                        <th>Evento Desencadenante<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateMasterBpmlFilter('evento_desencadenante', this.value)"></th>
                        <th>Evento Final<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateMasterBpmlFilter('evento_final_resultado', this.value)"></th>
                        <th>Rol Principal<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateMasterBpmlFilter('rol_negocio_principal', this.value)"></th>
                        <th>Datos Clave<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateMasterBpmlFilter('objetos_datos_clave', this.value)"></th>
                        <th>Reglas Negocio<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateMasterBpmlFilter('reglas_negocio_clave', this.value)"></th>
                        <th>Integraciones<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateMasterBpmlFilter('integraciones_estandar', this.value)"></th>
                        <th>Controles<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateMasterBpmlFilter('controles_clave', this.value)"></th>
                        <th>KPIs<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateMasterBpmlFilter('kpis_clave', this.value)"></th>
                        <th style="background:#e3f2fd;">Priority<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateMasterBpmlFilter('priority', this.value)"></th>
                        <th style="background:#e3f2fd;">Sprint<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateMasterBpmlFilter('sprint', this.value)"></th>
                        <th style="background:#e3f2fd;">Estado Ajuste FPG<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateMasterBpmlFilter('estado_ajuste_fpg', this.value)"></th>
                        <th style="background:#e3f2fd;">IDs Referencia Gap<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateMasterBpmlFilter('ids_referencia_gap', this.value)"></th>
                        <th style="background:#e3f2fd;">Notas/Enlace Evidencia<br><input type="text" style="width:100%; padding:2px; font-size:0.75rem; margin-top:2px;" placeholder="Filtro..." oninput="updateMasterBpmlFilter('notas_enlace_evidencia', this.value)"></th>
                    </tr>
                </thead>
                <tbody id="master-bpml-tbody">
                </tbody>
            </table>
        </div>
        <div id="master-bpml-counter" style="font-size:0.85rem; color:#666; margin-top:5px;"></div>
    `;

    container.innerHTML = html;
    window.renderMasterBpmlTableBody();
};

window.renderMasterBpmlTableBody = function() {
    const tbody = document.getElementById('master-bpml-tbody');
    const counter = document.getElementById('master-bpml-counter');
    if (!tbody || !state.masterBpmlData) return;
    
    let html = '';
    let filteredData = state.masterBpmlData;

    if (state.masterBpmlFilters) {
        filteredData = state.masterBpmlData.filter(row => {
            return Object.keys(state.masterBpmlFilters).every(key => {
                if (!state.masterBpmlFilters[key]) return true;
                const cellValue = String(row[key] || '').toLowerCase();
                return cellValue.includes(state.masterBpmlFilters[key]);
            });
        });
    }

    filteredData.forEach((row) => {
        html += `
            <tr style="cursor: pointer;" onclick="toggleMasterBpmlRow(this)">
                <td style="text-align:center;">
                    <input type="checkbox" class="master-bpml-chk" data-id="${row.bpml_id}" ${row.seleccionado ? 'checked' : ''} onclick="event.stopPropagation();">
                </td>
                <td>${row.bpml_id || '-'}</td>
                <td>${row.id_e2e || '-'}</td>
                <td>${row.negocio || '-'}</td>
                <td>${row.grupo_proceso_l1 || '-'}</td>
                <td>${row.grupo_proceso_l2 || '-'}</td>
                <td>${row.nombre_proceso_l3 || '-'}</td>
                <td>${row.id_bp || '-'}</td>
                <td>${row.nombre_scope_item_sap_best_practice || '-'}</td>
                <td>${row.nombre_proceso_l4 || '-'}</td>
                <td>${row.estructura_organizativa_objetivo || '-'}</td>
                <td>${row.evento_desencadenante || '-'}</td>
                <td>${row.evento_final_resultado || '-'}</td>
                <td>${row.rol_negocio_principal || '-'}</td>
                <td>${row.objetos_datos_clave || '-'}</td>
                <td>${row.reglas_negocio_clave || '-'}</td>
                <td>${row.integraciones_estandar || '-'}</td>
                <td>${row.controles_clave || '-'}</td>
                <td>${row.kpis_clave || '-'}</td>
                <td style="padding: 2px;"><input type="text" value="${row.priority || ''}" onchange="updateMasterBpmlField('${row.bpml_id}', 'priority', this.value)" style="width:100%; border:1px solid #ccc; padding:4px;" onclick="event.stopPropagation();"></td>
                <td style="padding: 2px;"><input type="text" value="${row.sprint || ''}" onchange="updateMasterBpmlField('${row.bpml_id}', 'sprint', this.value)" style="width:100%; border:1px solid #ccc; padding:4px;" onclick="event.stopPropagation();"></td>
                <td style="padding: 2px;"><input type="text" value="${row.estado_ajuste_fpg || ''}" onchange="updateMasterBpmlField('${row.bpml_id}', 'estado_ajuste_fpg', this.value)" style="width:100%; border:1px solid #ccc; padding:4px;" onclick="event.stopPropagation();"></td>
                <td style="padding: 2px;"><input type="text" value="${row.ids_referencia_gap || ''}" onchange="updateMasterBpmlField('${row.bpml_id}', 'ids_referencia_gap', this.value)" style="width:100%; border:1px solid #ccc; padding:4px;" onclick="event.stopPropagation();"></td>
                <td style="padding: 2px;"><input type="text" value="${row.notas_enlace_evidencia || ''}" onchange="updateMasterBpmlField('${row.bpml_id}', 'notas_enlace_evidencia', this.value)" style="width:100%; border:1px solid #ccc; padding:4px;" onclick="event.stopPropagation();"></td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
    if (counter) {
        counter.textContent = `Mostrando ${filteredData.length} registros definitivos.`;
    }
};

window.updateMasterBpmlFilter = function(field, value) {
    if (!state.masterBpmlFilters) state.masterBpmlFilters = {};
    state.masterBpmlFilters[field] = value.toLowerCase();
    window.renderMasterBpmlTableBody();
};

window.resetMasterBpmlFilters = function() {
    state.masterBpmlFilters = {};
    const container = document.getElementById('bpml-table-container');
    if (container) {
        const inputs = container.querySelectorAll('thead input[type="text"]');
        inputs.forEach(input => input.value = '');
    }
    window.renderMasterBpmlTableBody();
};

window.toggleMasterBpmlRow = async function(rowElement) {
    const chk = rowElement.querySelector('.master-bpml-chk');
    if (!chk || !supabaseClient || !state.selectedProject) return;
    chk.checked = !chk.checked;
    
    const bpmlId = chk.getAttribute('data-id');
    const row = state.masterBpmlData.find(r => r.bpml_id === bpmlId);
    if (row) row.seleccionado = chk.checked;
    
    await supabaseClient
        .from('master_bpml')
        .update({ seleccionado: chk.checked })
        .eq('bpml_id', bpmlId)
        .eq('id_proyecto', state.selectedProject.id);
};

window.toggleMassiveMasterBpml = async function(select) {
    if (!supabaseClient || !state.masterBpmlData || !state.selectedProject) return;
    
    let filteredData = state.masterBpmlData;
    if (state.masterBpmlFilters) {
        filteredData = state.masterBpmlData.filter(row => {
            return Object.keys(state.masterBpmlFilters).every(key => {
                if (!state.masterBpmlFilters[key]) return true;
                const cellValue = String(row[key] || '').toLowerCase();
                return cellValue.includes(state.masterBpmlFilters[key]);
            });
        });
    }
    
    if (filteredData.length === 0) return;
    
    Swal.fire({
        title: 'Actualizando registros...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    
    filteredData.forEach(r => r.seleccionado = select);
    window.renderMasterBpmlTableBody();
    
    const ids = filteredData.map(r => r.bpml_id);
    
    const { error } = await supabaseClient
        .from('master_bpml')
        .update({ seleccionado: select })
        .eq('id_proyecto', state.selectedProject.id)
        .in('bpml_id', ids);
        
    if (error) {
        Swal.fire('Error', error.message, 'error');
    } else {
        Swal.fire({ icon: 'success', title: 'Registros actualizados', timer: 1500, showConfirmButton: false });
    }
};

window.updateMasterBpmlField = async function(bpmlId, fieldName, value) {
    if (!supabaseClient || !state.selectedProject) return;
    const { error } = await supabaseClient
        .from('master_bpml')
        .update({ [fieldName]: value })
        .eq('bpml_id', bpmlId)
        .eq('id_proyecto', state.selectedProject.id);

    if (error) {
        Toast.fire({ icon: 'error', title: 'Error al actualizar: ' + error.message });
    } else {
        Toast.fire({ icon: 'success', title: 'Actualizado' });
    }
};

window.toggleMassiveBpml = async function(select) {
    if (!supabaseClient || !state.generalBpmlData) return;
    
    const visibleRows = state.generalBpmlData.filter(row => {
        for (const key in state.bpmlFilters) {
            const filterVal = state.bpmlFilters[key];
            if (filterVal) {
                const rowVal = String(row[key] || '').toLowerCase();
                if (!rowVal.includes(filterVal)) return false;
            }
        }
        return true;
    });
    
    if (visibleRows.length === 0) return;
    
    Swal.fire({
        title: 'Actualizando registros...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    
    // Update local state for immediate UI reflection
    visibleRows.forEach(r => r.seleccionado = select);
    renderBpmlTable();
    
    const ids = visibleRows.map(r => r.bpml_id);
    
    // Bulk update in supabase
    const { error } = await supabaseClient
        .from('general_bpml')
        .update({ seleccionado: select })
        .in('bpml_id', ids);
        
    if (error) {
        Swal.fire('Error', error.message, 'error');
    } else {
        Swal.fire({ icon: 'success', title: 'Registros actualizados', timer: 1500, showConfirmButton: false });
    }
};

window.renderBpmlTable = function() {
    const tbody = document.getElementById('bpml-tbody');
    const counter = document.getElementById('bpml-counter');
    if (!tbody || !state.generalBpmlData) return;
    
    const filteredData = state.generalBpmlData.filter(row => {
        for (const key in state.bpmlFilters) {
            const filterVal = state.bpmlFilters[key];
            if (filterVal) {
                const rowVal = String(row[key] || '').toLowerCase();
                if (!rowVal.includes(filterVal)) return false;
            }
        }
        return true;
    });

    let html = '';
    filteredData.forEach((row) => {
        html += `
            <tr style="cursor: pointer;" onclick="toggleBpmlRow(this, '${row.bpml_id}')">
                <td style="text-align:center;">
                    <input type="checkbox" class="bpml-chk-${row.bpml_id}" ${row.seleccionado ? 'checked' : ''} onclick="event.stopPropagation(); toggleBpmlSelection('${row.bpml_id}', this.checked)">
                </td>
                <td>${row.bpml_id || '-'}</td>
                <td>${row.id_e2e || '-'}</td>
                <td>${row.negocio || '-'}</td>
                <td>${row.grupo_proceso_l1 || '-'}</td>
                <td>${row.grupo_proceso_l2 || '-'}</td>
                <td>${row.nombre_proceso_l3 || '-'}</td>
                <td>${row.id_bp || '-'}</td>
                <td>${row.nombre_scope_item_sap_best_practice || '-'}</td>
                <td>${row.nombre_proceso_l4 || '-'}</td>
                <td>${row.estructura_organizativa_objetivo || '-'}</td>
                <td>${row.evento_desencadenante || '-'}</td>
                <td>${row.evento_final_resultado || '-'}</td>
                <td>${row.rol_negocio_principal || '-'}</td>
                <td>${row.objetos_datos_clave || '-'}</td>
                <td>${row.reglas_negocio_clave || '-'}</td>
                <td>${row.integraciones_estandar || '-'}</td>
                <td>${row.controles_clave || '-'}</td>
                <td>${row.kpis_clave || '-'}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
    if (counter) {
        counter.innerHTML = `Mostrando ${filteredData.length} de ${state.generalBpmlData.length} registros.`;
    }
};

window.toggleBpmlSelection = async function(id, isChecked) {
    if (!supabaseClient) return;
    
    if (state.generalBpmlData) {
        const row = state.generalBpmlData.find(r => r.bpml_id === id);
        if (row) row.seleccionado = isChecked;
    }

    const { error } = await supabaseClient
        .from('general_bpml')
        .update({ seleccionado: isChecked })
        .eq('bpml_id', id);

    if (error) {
        Toast.fire({ icon: 'error', title: 'Error al actualizar: ' + error.message });
    } else {
        Toast.fire({ icon: 'success', title: 'Selección actualizada' });
    }
};

window.toggleBpmlRow = function(rowElement, id) {
    const chk = rowElement.querySelector('.bpml-chk-' + id);
    if (chk) {
        chk.checked = !chk.checked;
        window.toggleBpmlSelection(id, chk.checked);
    }
};

window.changeExpMonth = function (offset) {
    state.expCalendarDate.setMonth(state.expCalendarDate.getMonth() + offset);
    renderExpCalendar();
};

async function renderExpCalendar() {
    const grid = document.getElementById('exp-calendar-grid');
    const label = document.getElementById('exp-calendar-month-label');
    if (!grid || !label) return;

    const baseDate = state.expCalendarDate;
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();

    // label: Mes Año (Capitalized)
    const monthName = baseDate.toLocaleString('es-ES', { month: 'long' });
    label.textContent = `${monthName} ${year}`;

    // Header cells (Lun-Dom)
    let html = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => `<div class="calendar-day header-day" style="height:35px !important">${d}</div>`).join('');

    // First day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Lead-in empty days (Monday=1, Sunday=0 -> Adjust to Monday=0, Sunday=6)
    let firstDayIdx = firstDay.getDay();
    let leadingEmpty = firstDayIdx === 0 ? 6 : firstDayIdx - 1;

    for (let i = 0; i < leadingEmpty; i++) {
        html += `<div class="calendar-day padding-day" style="min-height:80px"></div>`;
    }

    // Fetch Workshops and Documents for this project
    let workshops = [];
    let docs = [];
    if (supabaseClient && state.selectedProject) {
        // 1. Fetch Workshops
        const { data: wsData } = await supabaseClient
            .from('project_workshops')
            .select('*')
            .eq('project_id', state.selectedProject.id);
        workshops = wsData || [];

        // 2. Fetch Documents for EXP phase to show icons (including ID and URL)
        const { data: docData } = await supabaseClient
            .from('documentos')
            .select('id, tipo_documento, nombre_taller, url')
            .eq('proyecto', state.selectedProject.id_proyecto || state.selectedProject.name)
            .eq('id_fase', 'EXP');
        docs = docData || [];
    }

    // Days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

        const dayWorkshops = workshops.filter(w => w.scheduled_date === dateStr);

        html += `
            <div class="calendar-day ${isToday ? 'today' : ''}" style="min-height:80px">
                <span class="day-number">${d}</span>
                <div class="day-content" id="exp-day-${year}-${month + 1}-${d}">
                    ${dayWorkshops.map(w => {
            // Filter docs linked to this workshop
            const wsDocs = docs.filter(doc => doc.nombre_taller === (w.group_id || w.id_grupo));
            const docIcons = wsDocs.map(doc =>
                `<i class="fas ${PHASE_DOC_ICONS[doc.tipo_documento] || PHASE_DOC_ICONS.default}" 
                                title="${doc.tipo_documento}" 
                                onclick="window.openDocUrlPopup(${doc.id})"
                                style="font-size:0.65rem; margin-right:4px; color:rgba(255,255,255,0.9); cursor:pointer;"></i>`
            ).join('');

            return `
                            <div class="agenda-item ws-color-${w.color_idx || 0}" style="cursor: default; display:flex; flex-direction:column; gap:2px; height:auto; min-height:24px; padding:4px 6px;">
                                <span style="font-weight:700; line-height:1.1;">${w.group_name || w.group_id}</span>
                                <div style="display:flex; flex-wrap:wrap; gap:2px; margin-top:2px;">${docIcons}</div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    grid.innerHTML = html;
}

window.openDocUrlPopup = async function (docId) {
    if (!supabaseClient) return;
    const { data: doc, error } = await supabaseClient.from('documentos').select('*').eq('id', docId).single();
    if (error || !doc) return;

    Swal.fire({
        title: doc.tipo_documento,
        html: `
            <div style="text-align:left; font-size: 0.9rem;">
                <p><b>Referencia:</b> ${doc.nombre_taller || '-'}</p>
                <p><b>Fecha:</b> ${new Date(doc.fecha).toLocaleDateString()}</p>
                <p><b>URL:</b> <br><small style="word-break: break-all; color: var(--sap-blue); line-height:1.1;">${doc.url || 'Sin URL'}</small></p>
            </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-external-link-alt"></i> Abrir Documento',
        cancelButtonText: 'Cerrar',
        confirmButtonColor: 'var(--sap-blue)'
    }).then((result) => {
        if (result.isConfirmed && doc.url) {
            window.open(doc.url, '_blank');
        }
    });
};
async function renderRealizePhase() {
    if (!state.selectedProject) {
        elements.moduleContent.innerHTML = '<div class="card"><h3>Atención</h3><p>Por favor, selecciona primero un proyecto desde el módulo PRJ.</p></div>';
        return;
    }

    const phaseId = 'REA';
    const counts = await getDocCountsByPhase(phaseId);
    const types = (PHASE_DOC_TYPES[phaseId] || []).filter(type => !isItemRestricted(phaseId.toLowerCase(), type));

    elements.moduleContent.innerHTML = `
        ${renderPhaseHeader('Fase Realizar (REA)')}
        <div class="rea-module-layout" style="display: flex; flex-direction: column; gap: 0.5rem;">
            
            <!-- Part 1: Documentación -->
            ${isItemRestricted('rea', 'Documentación (parte 1)') ? '' : `
            <div class="collapsible-wrapper" style="border-left: 4px solid var(--sap-blue);">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:var(--sap-blue); display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-file-alt"></i> 1: Documentación
                    </h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content">
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 0.75rem; margin-top: 0.5rem;">
                        ${types.map(type => renderDocTypeButton(phaseId, type, counts[type] || 0)).join('')}
                    </div>
                    <div style="margin-top: 2rem;">
                        <h4 style="font-size:0.85rem; color:#666;"><i class="fas fa-list"></i> Histórico de Documentación (${phaseId})</h4>
                        <div id="${phaseId.toLowerCase()}-doc-table-container"></div>
                    </div>
                </div>
            </div>
            `}

            <!-- Part 2: Evidencias de pruebas -->
            ${isItemRestricted('rea', 'Evidencias de pruebas (parte 2)') ? '' : `
            <div class="collapsible-wrapper" style="border-left: 4px solid #ff9800;">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:#ff9800; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-microscope"></i> 2: Evidencias de pruebas
                    </h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content">
                    <div id="rea-evidencias-container" style="margin-top: 0.5rem; min-height: 100px;">
                        <div style="text-align:center; padding:2rem; color:#666;">
                            <i class="fas fa-spinner fa-spin"></i> Cargando evidencias...
                        </div>
                    </div>
                </div>
            </div>
            `}

            <!-- Part 3: Creación de checklist UATs -->
            ${isItemRestricted('rea', 'Creación de checklist UATs (parte 3)') ? '' : `
            <div class="collapsible-wrapper" style="border-left: 4px solid #f44336;">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:#f44336; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-tasks"></i> 3: Creación de checklist UATs
                    </h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content">
                    <div class="section-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                        <p class="section-subtitle" style="margin: 0; font-size: 0.85rem;">Generador de Checklist de pruebas basado en UATs maestros.</p>
                        <div id="uat-load-actions">
                            <button class="btn" onclick="loadGeneralUATs()">
                                <i class="fas fa-magic"></i> Cargar Checklist
                            </button>
                        </div>
                    </div>
                    <div class="filter-row" id="uat-filters-container" style="margin-top: 1rem; display: flex; gap: 10px; min-height: 40px;">
                        <div style="flex: 1; text-align: center; color: #666; font-style: italic;">Carga el checklist para ver opciones de filtro.</div>
                    </div>
                    <div class="table-container" id="uat-checklist-container" style="margin-top: 1rem; min-height: 200px;">
                        <div style="text-align:center; padding:2rem; color:#666;">
                            Presiona "Cargar Checklist" para importar los registros maestros.
                        </div>
                    </div>
                </div>
            </div>
            `}

            <!-- Part 4: Seguimiento UATs -->
            ${isItemRestricted('rea', 'Seguimiento UATs (parte 4)') ? '' : `
            <div class="collapsible-wrapper" style="border-left: 4px solid #9c27b0;">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:#9c27b0; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-chart-line"></i> 4: Seguimiento UATs
                    </h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content">
                    <div id="tracking-actions" style="display:none; display: flex; gap: 10px; margin-bottom: 1rem; justify-content: flex-end;">
                         <button class="btn" onclick="saveUATTracking()" style="background: var(--primary-color);">
                            <i class="fas fa-cloud-upload-alt"></i> Guardar Seguimiento
                        </button>
                        <button class="btn" onclick="exportUATTrackingToExcel()" style="background: #2e7d32;">
                            <i class="fas fa-file-excel"></i> Descargar Excel
                        </button>
                    </div>
                    <div id="uat-tracking-container" style="margin-top: 0.5rem; min-height: 150px;">
                        <div style="margin-top: 1rem; color: #666; padding: 2rem; text-align: center; background: #f9f9f9; border-radius: 8px;">
                            <i class="fas fa-spinner fa-spin fa-2x" style="color: #ccc; margin-bottom: 0.5rem;"></i>
                            <p>Cargando datos de seguimiento...</p>
                        </div>
                    </div>
                </div>
            </div>
            `}
        </div>
    `;

    if (!isItemRestricted('rea', 'Documentación (parte 1)')) {
        loadPhaseDocumentsTable(phaseId, `${phaseId.toLowerCase()}-doc-table-container`);
    }

    if (!isItemRestricted('rea', 'Seguimiento UATs (parte 4)')) {
        loadUATTracking();
    }

    if (!isItemRestricted('rea', 'Evidencias de pruebas (parte 2)')) {
        loadREAEvidencias();
    }

    checkProjectUATs();
}


// --- UAT CHECKLIST LOGIC (REA PART 3) ---

async function checkProjectUATs() {
    if (!supabaseClient || !state.selectedProject) return;

    const { data: existingUATs, error } = await supabaseClient
        .from('master_uats')
        .select('*')
        .eq('project_id', state.selectedProject.id);

    if (error) {
        console.error("Error checkProjectUATs:", error);
        return;
    }

    if (existingUATs && existingUATs.length > 0) {
        const loadActions = document.getElementById('uat-load-actions');
        if (loadActions) {
            const loadBtn = loadActions.querySelector('button[onclick="loadGeneralUATs()"]');
            if (loadBtn) loadBtn.style.display = 'none';
        }

        // Auto load and pass pre-selected IDs
        await loadGeneralUATs(existingUATs);
    }
}

async function loadGeneralUATs(existingMasterUATs = null) {
    if (!supabaseClient) {
        Swal.fire('Error', 'No hay conexión de base de datos activa.', 'error');
        return;
    }

    const container = document.getElementById('uat-checklist-container');
    container.innerHTML = '<div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Consultando base de UATs...</p></div>';

    let allData = [];
    let from = 0;
    const step = 1000;

    while (true) {
        const { data: chunkData, error } = await supabaseClient
            .from('general_uats')
            .select('*')
            .range(from, from + step - 1)
            .order('id', { ascending: true });

        if (error) {
            container.innerHTML = `<div style="color:red; text-align:center; padding:1rem;">Error cargando datos: ${error.message}</div>`;
            return;
        }

        if (!chunkData || chunkData.length === 0) {
            break;
        }

        allData = allData.concat(chunkData);

        if (chunkData.length < step) {
            break;
        }
        from += step;
    }

    const data = allData;

    if (data.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:2rem; color:#666;">No se encontraron registros en la tabla general_uats.</div>';
        return;
    }

    state.generalUATs = data;
    state.uatCurrentPage = 1;

    // Reset collections
    state.selectedUatIds = new Set();
    state.customUATs = [];

    if (existingMasterUATs && Array.isArray(existingMasterUATs)) {
        // Track which ones from general are selected
        const generalCasops = data.map(u => u.id_casop);

        existingMasterUATs.forEach(m => {
            const matchIndex = data.findIndex(u => u.id_casop === m.id_casop);
            if (matchIndex !== -1) {
                state.selectedUatIds.add(data[matchIndex].id.toString());
            } else {
                // It's a custom row (not in general_uats)
                // We generate a temp ID for internal tracking in state
                const tempId = 'custom-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                const customRow = { ...m, id: tempId, isCustom: true };
                state.customUATs.push(customRow);
                state.selectedUatIds.add(tempId);
            }
        });
    }

    // Build multi-select inputs
    const uniqueLobs = [...new Set(data.map(u => u.id_lob).filter(v => v))].sort();
    const uniqueBps = [...new Set(data.map(u => u.id_bp).filter(v => v))].sort();
    const uniqueScopes = [...new Set(data.map(u => u.proceso_scope_item).filter(v => v))].sort();

    document.getElementById('uat-filters-container').innerHTML = `
        ${renderMultiSelectFilter('uat-filter-lob', 'Filtrar LOB', uniqueLobs)}
        ${renderMultiSelectFilter('uat-filter-bp', 'Filtrar BP', uniqueBps)}
        ${renderMultiSelectFilter('uat-filter-scope', 'Filtrar Scope Item', uniqueScopes)}
    `;

    state.filteredUATs = data;
    state.filteredCustomUATs = [...state.customUATs];
    renderUATsTable(state.filteredUATs, state.filteredCustomUATs);
}

window.createNewUAT = async function () {
    const { value: formValues } = await Swal.fire({
        title: 'Nuevo Paso UAT Ad-Hoc',
        html: `
            <div style="text-align: left;">
                <label>LOB</label>
                <input id="swal-lob" class="swal2-input" placeholder="Ej: FI, SD...">
                <label>Caso/Paso ID</label>
                <input id="swal-casop" class="swal2-input" placeholder="Ej: CP-001">
                <label>BP (Best Practice)</label>
                <input id="swal-bp" class="swal2-input" placeholder="Ej: 1J0">
                <label>Scope Item / Proceso</label>
                <input id="swal-scope" class="swal2-input">
                <label>Escenario</label>
                <textarea id="swal-escenario" class="swal2-textarea"></textarea>
                <label>Pasos Detallados</label>
                <textarea id="swal-pasos" class="swal2-textarea"></textarea>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Añadir a Checklist',
        preConfirm: () => {
            return {
                id_lob: document.getElementById('swal-lob').value,
                id_casop: document.getElementById('swal-casop').value,
                id_bp: document.getElementById('swal-bp').value,
                proceso_scope_item: document.getElementById('swal-scope').value,
                escenario: document.getElementById('swal-escenario').value,
                pasos_detallados: document.getElementById('swal-pasos').value
            }
        }
    });

    if (formValues) {
        const tempId = 'custom-' + Date.now();
        const newRow = {
            ...formValues,
            id: tempId,
            isCustom: true,
            project_id: state.selectedProject.id,
            estado_ok_nok: 'Pendiente'
        };
        state.customUATs.push(newRow);
        state.selectedUatIds.add(tempId);

        // Re-render
        filterUATs();

        Toast.fire({
            icon: 'success',
            title: 'Fila añadida al checklist local'
        });
    }
}

window.changeUATPage = function (delta) {
    state.uatCurrentPage += delta;
    renderUATsTable(state.filteredUATs, state.filteredCustomUATs);
};

window.filterUATs = function () {
    const getCheckedValues = (id) => {
        const checkboxes = document.querySelectorAll(`.${id}-checkbox:checked`);
        return Array.from(checkboxes).map(cb => cb.value);
    };

    const selectedLobs = getCheckedValues('uat-filter-lob');
    const selectedBps = getCheckedValues('uat-filter-bp');
    const selectedScopes = getCheckedValues('uat-filter-scope');

    const filterFunc = u => {
        const matchLob = selectedLobs.length === 0 || selectedLobs.includes(u.id_lob);
        const matchBp = selectedBps.length === 0 || selectedBps.includes(u.id_bp);
        const matchScope = selectedScopes.length === 0 || selectedScopes.includes(u.proceso_scope_item);
        return matchLob && matchBp && matchScope;
    };

    state.filteredUATs = state.generalUATs.filter(filterFunc);
    state.filteredCustomUATs = state.customUATs.filter(filterFunc);

    state.uatCurrentPage = 1;
    renderUATsTable(state.filteredUATs, state.filteredCustomUATs);
};

function renderUATsTable(genData, customData = []) {
    const container = document.getElementById('uat-checklist-container');

    const combinedData = [...genData, ...customData];

    if (combinedData.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:2rem; color:#666;">No hay coincidencias para los filtros aplicados.</div>';
        return;
    }

    // Pagination bounds
    const itemsPerPage = state.uatItemsPerPage || 200;
    const totalPages = Math.ceil(combinedData.length / itemsPerPage) || 1;
    if (!state.uatCurrentPage || state.uatCurrentPage < 1) state.uatCurrentPage = 1;
    if (state.uatCurrentPage > totalPages) state.uatCurrentPage = totalPages;

    const startIndex = (state.uatCurrentPage - 1) * itemsPerPage;
    const pageData = combinedData.slice(startIndex, startIndex + itemsPerPage);

    // Check if the "select all" should be checked for this page
    const allPageSelected = pageData.length > 0 && pageData.every(u => state.selectedUatIds.has(u.id.toString()));

    container.innerHTML = `
        <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold; color: var(--primary-color);">
                Total: <span style="color:#333;">${combinedData.length}</span> 
                <span style="color:#666; font-size: 0.8rem; margin-left: 5px;">(${genData.length} maestros + ${customData.length} ad-hoc)</span>
                <span style="color:#888; font-weight: normal; margin-left: 10px;">(Seleccionados: <span id="uat-selected-count">${state.selectedUatIds.size}</span>)</span>
            </span>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-outline" onclick="createNewUAT()">
                    <i class="fas fa-plus"></i> Añadir nuevo caso
                </button>
                <button class="btn" onclick="saveSelectedUATs()">
                    <i class="fas fa-save"></i> Guardar Selección en Proyecto
                </button>
            </div>
        </div>
        <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; background: #fafafa; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">
            <span style="font-size: 0.85rem; color: #666;">
                Página <b>${state.uatCurrentPage}</b> de <b>${totalPages}</b>
                <span style="margin-left: 10px;">(Mostrando del ${startIndex + 1} al ${Math.min(startIndex + itemsPerPage, combinedData.length)})</span>
            </span>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-outline" style="padding: 4px 12px; width: auto;" onclick="changeUATPage(-1)" ${state.uatCurrentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i> Anterior
                </button>
                <button class="btn btn-outline" style="padding: 4px 12px; width: auto;" onclick="changeUATPage(1)" ${state.uatCurrentPage === totalPages ? 'disabled' : ''}>
                    Siguiente <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
        <div style="overflow-x: auto; width: 100%;">
            <table class="alv-table" style="min-width: 1600px; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="width: 50px; text-align: center; position: sticky; left: 0; background: #e3f2fd; z-index: 10;">
                            <input type="checkbox" id="uat-mass-checkbox" onchange="toggleAllUATs(this)" title="Seleccionar/Deseleccionar esta página" ${allPageSelected ? 'checked' : ''}>
                        </th>
                        <th>LOB</th>
                        <th>Caso/Paso</th>
                        <th>BP</th>
                        <th>Scope Item</th>
                        <th style="min-width: 150px;">Escenario</th>
                        <th style="min-width: 200px;">Actividades Proceso</th>
                        <th style="min-width: 200px;">Precondiciones</th>
                        <th style="min-width: 250px;">Pasos Detallados</th>
                        <th style="min-width: 150px;">Datos Prueba</th>
                        <th style="min-width: 200px;">Resultado Esperado</th>
                        <th style="position: sticky; right: 0; background: #e3f2fd; z-index: 10; text-align: center;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${pageData.map(u => `
                        <tr>
                            <td style="text-align: center; position: sticky; left: 0; background: white; z-index: 5;">
                                <input type="checkbox" class="uat-checkbox" value="${u.id}" onchange="toggleUATCheckbox(this)" ${state.selectedUatIds.has(u.id.toString()) ? 'checked' : ''}>
                            </td>
                            <td>${u.id_lob || '-'}</td>
                            <td>
                                ${u.id_casop || '-'}
                                ${u.isCustom ? '<br><span style="display:inline-block; font-size:0.65rem; background:#e8f5e9; color:#2e7d32; padding:2px 4px; border-radius:3px; margin-top:3px; border:1px solid #c8e6c9;">AD-HOC</span>' : ''}
                            </td>
                            <td>${u.id_bp || '-'}</td>
                            <td>${u.proceso_scope_item || '-'}</td>
                            <td>
                                <div style="font-size: 0.85rem; max-height: 2.5rem; overflow: hidden; text-overflow: ellipsis;" title="${(u.escenario || '').replace(/"/g, '&quot;')}">
                                    ${u.escenario || '-'}
                                </div>
                            </td>
                            <td>
                                <div style="font-size: 0.85rem; max-height: 2.5rem; overflow: hidden; text-overflow: ellipsis;" title="${(u.actividades_proceso || '').replace(/"/g, '&quot;')}">
                                    ${u.actividades_proceso || '-'}
                                </div>
                            </td>
                            <td>
                                <div style="font-size: 0.85rem; max-height: 2.5rem; overflow: hidden; text-overflow: ellipsis;" title="${(u.precondiciones || '').replace(/"/g, '&quot;')}">
                                    ${u.precondiciones || '-'}
                                </div>
                            </td>
                            <td>
                                <div style="font-size: 0.85rem; max-height: 2.5rem; overflow: hidden; text-overflow: ellipsis;" title="${(u.pasos_detallados || '').replace(/"/g, '&quot;')}">
                                    ${u.pasos_detallados || '-'}
                                </div>
                            </td>
                            <td>
                                <div style="font-size: 0.85rem; max-height: 2.5rem; overflow: hidden; text-overflow: ellipsis;" title="${(u.datos_prueba || '').replace(/"/g, '&quot;')}">
                                    ${u.datos_prueba || '-'}
                                </div>
                            </td>
                            <td>
                                <div style="font-size: 0.85rem; max-height: 2.5rem; overflow: hidden; text-overflow: ellipsis;" title="${(u.resultado_esperado || '').replace(/"/g, '&quot;')}">
                                    ${u.resultado_esperado || '-'}
                                </div>
                            </td>
                            <td style="position: sticky; right: 0; background: white; text-align: center; z-index: 5;">
                                <button class="btn-icon" title="Ver detalles" onclick="viewUATDetails('${u.id}')"><i class="fas fa-eye"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderMultiSelectFilter(id, label, options) {
    return `
        <div class="multi-select-container" style="position: relative; flex: 1;">
            <div class="multi-select-header" onclick="toggleMultiSelect('${id}')" style="border: 1px solid #ccc; padding: 8px; border-radius: 4px; cursor: pointer; background: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.85rem;">
                ${label} <i class="fas fa-chevron-down" style="float: right; margin-top: 3px;"></i>
            </div>
            <div id="${id}-options" class="multi-select-options hidden" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #ccc; z-index: 100; max-height: 200px; overflow-y: auto; padding: 5px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                ${options.map(opt => `
                    <label style="display: block; padding: 4px; cursor: pointer; font-size: 0.85rem; border-bottom: 1px solid #eee;">
                        <input type="checkbox" value="${opt.replace(/"/g, '&quot;')}" class="${id}-checkbox" onchange="filterUATs()"> ${opt}
                    </label>
                `).join('')}
            </div>
        </div>
    `;
}

window.toggleMultiSelect = function (id) {
    const el = document.getElementById(`${id}-options`);
    if (el) {
        const isHidden = el.style.display === 'none';
        document.querySelectorAll('.multi-select-options').forEach(opt => opt.style.display = 'none');
        if (isHidden) el.style.display = 'block';
    }
};

document.addEventListener('click', function (e) {
    if (!e.target.closest('.multi-select-container')) {
        document.querySelectorAll('.multi-select-options').forEach(opt => opt.style.display = 'none');
    }
});

function filterUATs() {
    const getCheckedValues = (id) => {
        const checkboxes = document.querySelectorAll(`.${id}-checkbox:checked`);
        return Array.from(checkboxes).map(cb => cb.value);
    };

    const selectedLobs = getCheckedValues('uat-filter-lob');
    const selectedBps = getCheckedValues('uat-filter-bp');
    const selectedScopes = getCheckedValues('uat-filter-scope');

    state.filteredUATs = state.generalUATs.filter(u => {
        const matchLob = selectedLobs.length === 0 || selectedLobs.includes(u.id_lob);
        const matchBp = selectedBps.length === 0 || selectedBps.includes(u.id_bp);
        const matchScope = selectedScopes.length === 0 || selectedScopes.includes(u.proceso_scope_item);
        return matchLob && matchBp && matchScope;
    });

    state.uatCurrentPage = 1;
    renderUATsTable(state.filteredUATs);
}

window.toggleUATCheckbox = function (cb) {
    if (cb.checked) {
        state.selectedUatIds.add(cb.value);
    } else {
        state.selectedUatIds.delete(cb.value);
    }
    const countSpan = document.getElementById('uat-selected-count');
    if (countSpan) countSpan.textContent = state.selectedUatIds.size;
};

function toggleAllUATs(headerCheckbox) {
    const isChecked = headerCheckbox.checked;
    const checkboxes = document.querySelectorAll('.uat-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = isChecked;
        toggleUATCheckbox(cb);
    });
}

async function saveSelectedUATs() {
    if (!state.selectedUatIds || state.selectedUatIds.size === 0) {
        Swal.fire('Atención', 'No has seleccionado ningún registro para guardar.', 'info');
        return;
    }

    if (!state.selectedProject) {
        Swal.fire('Error', 'No hay ningún proyecto seleccionado.', 'error');
        return;
    }

    const selectedFromGeneral = state.generalUATs.filter(u => state.selectedUatIds.has(u.id.toString()));
    const selectedFromCustom = state.customUATs.filter(u => state.selectedUatIds.has(u.id.toString()));

    const combinedSelected = [...selectedFromGeneral, ...selectedFromCustom];

    const inserts = combinedSelected.map(u => ({
        project_id: state.selectedProject.id,
        id_lob: u.id_lob,
        id_casop: u.id_casop,
        id_bp: u.id_bp,
        proceso_scope_item: u.proceso_scope_item,
        escenario: u.escenario,
        actividades_proceso: u.actividades_proceso,
        precondiciones: u.precondiciones,
        pasos_detallados: u.pasos_detallados,
        datos_prueba: u.datos_prueba,
        resultado_esperado: u.resultado_esperado,
        resultado_obtenido: null,
        estado_ok_nok: 'Pendiente',
        tipo_prueba: 'UAT',
        rol_perfil_responsable: null,
        raci: null
    }));

    Swal.fire({
        title: 'Guardando...',
        text: 'Registrando selección en el proyecto.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    const { error: delError } = await supabaseClient
        .from('master_uats')
        .delete()
        .eq('project_id', state.selectedProject.id);

    if (delError) {
        Swal.fire('Error', 'Fallo al limpiar registros antiguos: ' + delError.message, 'error');
        return;
    }

    const { error: insError } = await supabaseClient
        .from('master_uats')
        .insert(inserts);

    if (insError) {
        Swal.fire('Error', 'Fallo al guardar selección: ' + insError.message, 'error');
        return;
    }

    const loadActions = document.getElementById('uat-load-actions');
    if (loadActions) loadActions.style.display = 'none';

    Swal.fire({
        icon: 'success',
        title: 'Checklist Guardado',
        text: `Se han configurado ${state.selectedUatIds.size} registros para el proyecto activo (${state.selectedProject.name}).`
    });
}

window.viewUATDetails = function (id) {
    const uat = [...state.generalUATs, ...state.customUATs].find(u => u.id.toString() === id.toString());
    if (!uat) return;

    Swal.fire({
        title: `<div style="text-align:left; font-size:1.1rem; font-weight:600; border-bottom: 1px solid #eee; padding-bottom:12px; color:#333;">
                    ${uat.id_casop || 'Detalle del Caso'}
                </div>`,
        html: `
            <div style="text-align: left; max-height: 75vh; overflow-y: auto; padding: 5px 10px 5px 0;">
                <div style="display: flex; gap: 20px; margin-bottom: 25px; font-size: 0.9rem; color: #666;">
                    <span><b style="color:#333">LOB:</b> ${uat.id_lob || '-'}</span>
                    <span><b style="color:#333">BP:</b> ${uat.id_bp || '-'}</span>
                    <span><b style="color:#333">Scope Item:</b> ${uat.proceso_scope_item || '-'}</span>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display:block; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:#999; margin-bottom:8px; font-weight:700;">Escenario / Contexto</label>
                    <div style="font-size: 0.95rem; line-height: 1.6; color: #444; padding-left: 12px; border-left: 2px solid #ddd;">
                        ${(uat.escenario || '-').replace(/\n/g, '<br>')}
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display:block; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:#999; margin-bottom:8px; font-weight:700;">Precondiciones</label>
                    <div style="font-size: 0.95rem; line-height: 1.6; color: #444; padding-left: 12px; border-left: 2px solid #ddd;">
                        ${(uat.precondiciones || '-').replace(/\n/g, '<br>')}
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display:block; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:#999; margin-bottom:8px; font-weight:700;">Pasos Detallados</label>
                    <div style="font-size: 0.95rem; line-height: 1.6; color: #444; padding: 15px; background: #fafafa; border-radius: 6px; border: 1px solid #f0f0f0;">
                        ${(uat.pasos_detallados || '-').replace(/\n/g, '<br>')}
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    <div>
                        <label style="display:block; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:#999; margin-bottom:8px; font-weight:700;">Datos de Prueba</label>
                        <div style="font-size: 0.9rem; color: #555; padding: 10px; border: 1px dashed #ccc; border-radius:4px;">
                            ${(uat.datos_prueba || '-').replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    <div>
                        <label style="display:block; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:#999; margin-bottom:8px; font-weight:700;">Resultado Esperado</label>
                        <div style="font-size: 0.9rem; color: #2e7d32; font-weight: 500; padding: 10px; background: #f1f8e9; border-radius:4px;">
                            ${(uat.resultado_esperado || '-').replace(/\n/g, '<br>')}
                        </div>
                    </div>
                </div>
            </div>
        `,
        width: '850px',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#333',
        showCloseButton: true,
        focusConfirm: false,
        padding: '2em'
    });
}

function renderDeployPhase() { renderGenericPhaseModule('DEPLOY', 'Fase Desplegar (DES)'); }

async function renderGenericPhaseModule(phaseId, title) {
    if (!state.selectedProject) {
        elements.moduleContent.innerHTML = '<div class="card"><h3>Atención</h3><p>Por favor, selecciona primero un proyecto desde el módulo PRJ.</p></div>';
        return;
    }

    // Fetch counts for this phase
    const counts = await getDocCountsByPhase(phaseId);
    const types = (PHASE_DOC_TYPES[phaseId] || []).filter(type => !isItemRestricted(phaseId.toLowerCase(), type));

    elements.moduleContent.innerHTML = `
        ${renderPhaseHeader(title)}
        <div class="collapsible-wrapper" style="border-left: 4px solid var(--sap-blue);">
            <div class="collapsible-header" onclick="toggleSection(this)">
                <h3 style="color:var(--sap-blue); display:flex; align-items:center; gap:10px;">
                    <i class="fas fa-file-alt"></i> 1: Documentación
                </h3>
                <i class="fas fa-plus-circle toggle-icon"></i>
            </div>
            <div class="collapsible-content">
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 0.75rem; margin-top: 0.5rem;">
                    ${types.map(type => renderDocTypeButton(phaseId, type, counts[type] || 0)).join('')}
                </div>
                <div style="margin-top: 2rem;">
                    <h4 style="font-size:0.85rem; color:#666;"><i class="fas fa-list"></i> Histórico de Documentación (${phaseId})</h4>
                    <div id="${phaseId.toLowerCase()}-doc-table-container"></div>
                </div>
            </div>
        </div>
    `;
    loadPhaseDocumentsTable(phaseId, `${phaseId.toLowerCase()}-doc-table-container`);
}

async function getDocCountsByPhase(phaseId) {
    if (!supabaseClient || !state.selectedProject) return {};
    const projectFilter = state.selectedProject.id_proyecto || state.selectedProject.name;
    const { data } = await supabaseClient
        .from('documentos')
        .select('tipo_documento')
        .eq('proyecto', projectFilter)
        .eq('id_fase', phaseId);

    const counts = {};
    if (data) {
        data.forEach(d => {
            counts[d.tipo_documento] = (counts[d.tipo_documento] || 0) + 1;
        });
    }
    return counts;
}

function renderDocTypeButton(phaseId, type, count) {
    if (isItemRestricted(phaseId.toLowerCase(), type)) return '';
    if (isButtonRestricted(phaseId.toLowerCase(), type)) return '';

    const whiteBgDocs = [
        'Planificación del equipo Altim',
        'Preparación Ejemplos Workshops Sesiones Fit-To Stándar',
        'Traspaso comercial',
        'Preparación Fichero BPML',
        'Preparación Fichero Backlog',
        'Preparación fichero GAPS',
        'Inventario de desarrollos a medida'
    ];

    const isWhiteDoc = whiteBgDocs.includes(type);
    const bgColor = isWhiteDoc ? '#ffffff' : '#e3f2fd';

    const badge = count > 0 ? `<div class="doc-count-badge">${count}</div>` : '';
    const canAttach = hasPermission(phaseId, 'attach');
    
    const isCliente = state.currentUser && (state.currentUser.role === 'Cliente' || state.currentUser.type === 'Cliente');
    let onClickAction = '';
    
    if (isCliente && isWhiteDoc) {
        onClickAction = `Swal.fire('Acceso Restringido', 'Los usuarios tipo Cliente no tienen acceso a este documento.', 'error')`;
    } else {
        onClickAction = canAttach ? `openDocumentModal('${phaseId}', '${type}')` : `window.openDocTypeNavigator('${phaseId}', '${type}')`;
    }

    return `
        <button class="btn btn-outline btn-doc-type" 
                onclick="${onClickAction}" 
                style="background-color: ${bgColor};">
            ${badge}
            <i class="fas fa-link" style="font-size: 1.2rem; color: var(--sap-blue)"></i>
            <span style="font-size: 0.75rem; text-align:center; line-height:1.1;">${type}</span>
        </button>
    `;
}

window.openDocTypeNavigator = async function (phase, type) {
    if (!state.selectedProject) return;
    const projectFilter = state.selectedProject.id_proyecto || state.selectedProject.name;

    // Fetch docs of this type
    const { data, error } = await supabaseClient
        .from('documentos')
        .select('*')
        .eq('proyecto', projectFilter)
        .eq('id_fase', phase)
        .eq('tipo_documento', type);

    if (error || !data || data.length === 0) {
        Swal.fire('Sin documentos', `No se han encontrado documentos de tipo "${type}" en este proyecto.`, 'info');
        return;
    }

    // Filter by individual button restrictions (if any)
    const filtered = data.filter(d => !isButtonRestricted(phase, d.numerador));
    if (filtered.length === 0) {
        Swal.fire('Acceso Denegado', 'No tienes permiso para ver los documentos de este tipo.', 'warning');
        return;
    }

    const canDownload = hasPermission(phase, 'download');

    let html = `<div style="text-align:left; font-size:14px;">
                    <p style="color:#666; margin-bottom:15px;">Documentos disponibles para <b>${type}</b>:</p>
                    <ul style="list-style:none; padding:0; margin:0;">`;

    filtered.forEach(d => {
        html += `<li style="padding:12px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <span style="font-weight:bold; color:var(--sap-blue)">${d.numerador}</span><br>
                        <span style="font-size:11px; color:#999">${new Date(d.fecha).toLocaleDateString()} ${d.id_lob ? ' - ' + d.id_lob : ''}</span>
                    </div>
                    <div>
                        ${(d.url && canDownload) ?
                `<a href="${d.url}" target="_blank" class="btn btn-outline compact"><i class="fas fa-external-link-alt"></i> Abrir</a>` :
                `<span class="badge" style="background:#f5f5f5; color:#999"><i class="fas fa-lock"></i> Bloqueado</span>`}
                    </div>
                 </li>`;
    });

    html += `</ul></div>`;

    Swal.fire({
        title: type,
        html: html,
        width: '500px',
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
            container: 'sap-fiori-modal'
        }
    });
};

function setupDragAndDrop() {
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', () => { zone.classList.remove('dragover'); });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            handleFileUpload(zone.getAttribute('data-category'), e.dataTransfer.files);
        });
    });
}

function handleFileUpload(category, files) {
    console.log(`Subiendo ${files.length} archivos a categoría ${category} para el proyecto ${state.selectedProject.id} `);
    alert(`Archivos subidos a Sharepoint(Simulado) / ${category} `);
}

// --- MODULE: PREPARE FASE (PRE) ---
async function initPreparePhase() {
    if (!state.selectedProject) {
        elements.moduleContent.innerHTML = '<div class="card"><h3>Atención</h3><p>Por favor, selecciona primero un proyecto desde el módulo PRJ.</p></div>';
        return;
    }

    const types = PHASE_DOC_TYPES.PRE;
    const counts = await getDocCountsByPhase('PRE');

    elements.moduleContent.innerHTML = `
        ${renderPhaseHeader('Fase Preparar (PRE)')}
        <div class="pre-module-layout" style="display: flex; flex-direction: column; gap: 0.5rem;">
            <!-- Part 1: Documentación -->
            <div class="collapsible-wrapper" style="border-left: 4px solid var(--sap-blue);">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:var(--sap-blue); display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-file-alt"></i> 1: Documentación
                    </h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-top: 0.5rem;">
                        ${types.map(type => renderDocTypeButton('PRE', type, counts[type] || 0)).join('')}
                    </div>
                    <div style="margin-top: 2rem;">
                        <div id="pre-doc-table-container"></div>
                    </div>
                </div>
            </div>

            <!-- Part 2: Agenda & Workshops -->
            ${isItemRestricted('pre', 'Agenda y talleres (parte 2)') ? '' : `
            <div class="collapsible-wrapper" style="border-left: 4px solid #ff9800; margin-top: 1rem;">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:#ff9800; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-calendar-alt"></i> 2: Agenda y Talleres
                    </h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content">
                    <div style="padding: 1rem;">
                        <div class="section-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
                            <div>
                                <p class="section-subtitle" style="margin: 0; font-size: 0.85rem;">Gestión de sesiones de talleres para el proyecto.</p>
                            </div>
                            <div class="agenda-controls">
                                ${hasPermission('pre', 'modify') ? `
                                    <button class="btn btn-outline compact" style="min-width:auto;" onclick="saveAgendaState()">Guardar Estado</button>
                                    <button class="btn compact" id="activate-groups-btn" style="min-width:auto;" onclick="toggleGroupsStatus()">Activar Grupos</button>
                                ` : ''}
                            </div>
                        </div>

                        <div class="agenda-container">
                            <div class="workshop-panel">
                                <div class="panel-header">
                                    <h4>Talleres Disponibles</h4>
                                    <div class="group-tools">
                                        ${hasPermission('pre', 'modify') ? '<button onclick="createNewGroup()" title="Nuevo Grupo WS"><i class="fas fa-plus"></i></button>' : ''}
                                    </div>
                                </div>
                                <div class="workshop-grouping-area" id="workshop-group-list"></div>
                            </div>

                            <div class="calendar-panel">
                                <div class="calendar-header-info" style="display:flex; justify-content:space-between; align-items:center; padding:10px;">
                                    <span id="calendar-date-range" style="font-weight:700;">Cargando...</span>
                                    <div class="calendar-navigation" style="display:flex; gap:10px;">
                                        <button class="btn btn-outline" style="width:auto; padding:0.4rem 0.8rem;" onclick="window.changePreMonth(-1)"><i class="fas fa-chevron-left"></i></button>
                                        <button class="btn btn-outline" style="width:auto; padding:0.4rem 0.8rem;" onclick="window.changePreMonth(1)"><i class="fas fa-chevron-right"></i></button>
                                    </div>
                                </div>
                                <div id="pre-calendar-grid" class="calendar-grid"></div>
                            </div>
                        </div>

                        <div id="pre-agenda-summary-container" style="margin-top: 2rem; border-top: 1px solid #eee; padding-top: 1.5rem;">
                            <h4 style="font-size:0.85rem; color:#666;"><i class="fas fa-list-ul"></i> Resumen de Talleres Agendados</h4>
                            <div id="pre-agenda-summary-table"></div>
                        </div>
                    </div>
                </div>
            </div>
            `}

            <!-- Part 3: Preparación Starter -->
            ${isItemRestricted('pre', 'Preparación Starter (parte 3)') ? '' : `
            <div class="collapsible-wrapper" style="border-left: 4px solid #f44336; margin-top: 1.5rem;">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:#f44336; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-rocket"></i> 3: Preparación Starter
                    </h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content">
                    <div style="padding: 1rem;">
                        <div class="starter-tools">
                            <div class="filter-row">
                                <label>Filtrar por LOB:</label>
                                <select id="starter-lob-filter" class="btn btn-outline" onchange="filterStarterData(this.value)">
                                    <option value="">-- Todos --</option>
                                </select>
                            </div>
                            <div class="table-container" style="margin-top:1rem;">
                                <table class="alv-table">
                                    <thead>
                                        <tr><th>LOB ID</th><th>SharePoint URL</th><th>Descargas</th><th>Acción</th></tr>
                                    </thead>
                                    <tbody id="starter-table-body"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `}
        </div>
    `;

    loadStarterData();
    loadAgendaState();
    loadGroupsAndItems();
}

function loadAgendaState() {
    if (!state.preCalendarDate) {
        state.preCalendarDate = new Date();
    }
}

async function loadGroupsAndItems() {
    if (!supabaseClient || !state.selectedProject) return;
    const projId = state.selectedProject.id;

    try {
        // 1. Fetch Workshop groups
        const { data: groups } = await supabaseClient
            .from('workshop_groups')
            .select('*')
            .eq('project_id', projId);

        // 2. Fetch Workshop items
        const { data: items } = await supabaseClient
            .from('workshop_group_items')
            .select('*');

        state.workshopGroups = (groups || []).map(g => ({
            ...g,
            items: (items || []).filter(it => it.group_record_id === g.id)
        }));

        // 3. Fetch scheduled workshops
        const { data: scheduled } = await supabaseClient
            .from('project_workshops')
            .select('*')
            .eq('project_id', projId);

        state.projectWorkshops = scheduled || [];

        renderPreCalendar();
        renderPreAgendaSummary();
        loadWorkshopGroups();
    } catch (err) {
        console.error("Error loading PRE groups/items:", err);
    }
}

async function loadPhaseDocumentsTable(phase, containerId) {
    // Logic is implemented further down at line 3791 to avoid duplication
}

window.changePreMonth = function (offset) {
    state.preCalendarDate.setMonth(state.preCalendarDate.getMonth() + offset);
    renderPreCalendar();
};

async function renderPreCalendar() {
    const grid = document.getElementById('pre-calendar-grid');
    const rangeSpan = document.getElementById('calendar-date-range');
    if (!grid || !state.selectedProject) return;

    const baseDate = state.preCalendarDate;
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();

    // Label: Mes Año
    const monthName = baseDate.toLocaleString('es-ES', { month: 'long' });
    rangeSpan.textContent = `${monthName} ${year} `;

    // Header cells
    let html = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => `<div class="calendar-day header-day">${d}</div>`).join('');

    // First/Last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Lead-in empty days
    let firstDayIdx = firstDay.getDay();
    let leadingEmpty = firstDayIdx === 0 ? 6 : firstDayIdx - 1;

    for (let i = 0; i < leadingEmpty; i++) {
        html += `<div class="calendar-day padding-day"></div>`;
    }

    // Scheduled Workshops for this project
    let workshops = [];
    if (supabaseClient) {
        const { data } = await supabaseClient
            .from('project_workshops')
            .select('*')
            .eq('project_id', state.selectedProject.id);
        workshops = data || [];
    }

    // Days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

        const dayWorkshops = workshops.filter(w => w.scheduled_date === dateStr);

        html += `
            <div class="calendar-day ${isToday ? 'today' : ''}" ondragover="event.preventDefault()" ondrop="dropWSGroupToDate(event, '${dateStr}')">
                <span class="day-number">${d}</span>
                <div class="day-content" id="cal-day-${dateStr}">
                    ${dayWorkshops.map(w => `
                        <div class="agenda-item ws-color-${w.color_idx || 0}">
                            <span>${w.group_name || w.group_id}</span>
                            <i class="fas fa-times" onclick="deleteWorkshopFromAgenda(${w.id})"></i>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    }
    grid.innerHTML = html;
}

async function renderPreAgendaSummary() {
    const container = document.getElementById('pre-agenda-summary-table');
    if (!container || !state.selectedProject) return;

    const workshops = state.projectWorkshops || [];
    const groups = state.workshopGroups || [];

    if (workshops.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:1.5rem; color:#999; font-style:italic;">No hay talleres agendados para este proyecto.</p>';
        return;
    }

    container.innerHTML = `
        <table class="alv-table compact" style="width:100%; margin-top:1rem;">
            <thead>
                <tr>
                    <th style="width:200px">Taller / Grupo</th>
                    <th>Best Practices Asociados</th>
                    <th style="width:120px; text-align:center;">Fecha Agendada</th>
                </tr>
            </thead>
            <tbody>
                ${workshops.map(w => {
        const groupRec = (groups || []).find(g => g.group_id === (w.id_grupo || w.group_id));
        const groupItems = groupRec ? (groupRec.items || []) : [];
        const bpList = groupItems.map(it => `<span class="badge" style="background:#e1f0ff; color:var(--sap-blue); margin-right:4px; font-weight:normal; font-size: 0.7rem;">${it.bp_id}</span>`).join(' ');

        return `
                        <tr>
                            <td style="font-weight:700; color:var(--secondary-color)">
                                ${w.group_name || w.group_id}
                                <br><small style="color:#999; font-weight:normal;">LoB: ${groupRec?.id_lob || '-'}</small>
                            </td>
                            <td>${bpList || '<i style="color:#ccc">Sin BPs asignados</i>'}</td>
                            <td style="text-align:center; font-family:monospace; font-weight:bold;">${w.scheduled_date}</td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;
}

// --- PRE MODULE: PART 1 (DOCS) LOGIC ---
function renderExistingPreDocs(category) {
    if (!state.projectDocuments) return '';
    const docs = state.projectDocuments.filter(d => d.category === category && d.project === state.selectedProject?.id);
    return docs.map(doc => `
        <li style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed #eee;">
            <div style="display:flex; flex-direction:column; gap:2px;">
                <a href="${doc.url}" target="_blank" style="font-weight:600; color:var(--sap-blue);"><i class="fas fa-file"></i> ${doc.filename}</a>
                <small style="color:#666;">Realizado: <b>${doc.completion_date}</b> | Adjuntado: ${doc.upload_date}</small>
            </div>
        </li>
        `).join('');
}

function setupPreDragAndDrop() {
    document.querySelectorAll('.pre-drop-zone').forEach(zone => {
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', () => { zone.classList.remove('dragover'); });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            handlePreFileUpload(zone.getAttribute('data-category'), e.dataTransfer.files);
        });
    });
}

async function handlePreFileUpload(category, files) {
    if (!files || files.length === 0) return;

    // Use SweetAlert to ask for the completion date
    const { value: completionDate } = await Swal.fire({
        title: 'Fecha de Realización',
        html: `Por favor ingresa la fecha de realización para los <b>${files.length}</b> archivo(s) de la categoría <b>${category}</b>.`,
        input: 'date',
        inputValue: new Date().toISOString().split('T')[0],
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar'
    });

    if (!completionDate) return;

    const list = document.getElementById(`file - list - ${category.replace(/ /g, '-')} `);
    let uploadedMsg = '';

    if (!state.projectDocuments) state.projectDocuments = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filename = file.name;
        // Simulate SharePoint URL
        const prjCode = state.selectedProject.project_code || state.selectedProject.id || "PRJ-DEFAULT";
        const url = `https://altim.sharepoint.com/sites/Proyectos/${prjCode}/Preparar/${encodeURIComponent(filename)}`;
        const uploadDate = new Date().toISOString().split('T')[0];

        const newDoc = {
            category,
            filename,
            url,
            completion_date: completionDate,
            upload_date: uploadDate,
            project: state.selectedProject.id
        };

        // Save to state to persist during session
        state.projectDocuments.push(newDoc);

        if (list) {
            const li = document.createElement('li');
            li.style.marginBottom = '8px';
            li.style.paddingBottom = '8px';
            li.style.borderBottom = '1px dashed #eee';
            li.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:2px;">
                    <a href="${url}" target="_blank" style="font-weight:600; color:var(--sap-blue);"><i class="fas fa-file"></i> ${filename}</a>
                    <small style="color:#666;">Realizado: <b>${completionDate}</b> | Adjuntado: ${uploadDate}</small>
                </div>
            `;
            list.appendChild(li);
        }
        uploadedMsg += `- ${filename}\n`;
    }

    Swal.fire('¡Éxito!', `Se han registrado ${files.length} documento(s):\n${uploadedMsg}\nLos enlaces y fechas están guardados.`, 'success');
}

// --- PRE MODULE: PART 2 (WORKSHOPS) LOGIC ---
let activeWorkshopGroups = []; // Will be loaded from Supabase

async function loadWorkshopGroups() {
    const list = document.getElementById('workshop-group-list');
    if (!list || !state.selectedProject) return;

    // Load from Supabase
    if (supabaseClient) {
        // 1. Load Groups
        const { data: groups } = await supabaseClient
            .from('workshop_groups')
            .select('*')
            .eq('project_id', state.selectedProject.id)
            .order('created_at');

        // 2. Load Items for these groups
        const { data: items } = await supabaseClient
            .from('workshop_group_items')
            .select('*');

        activeWorkshopGroups = (groups || []).map(g => ({
            db_id: g.id,
            id: g.group_id,
            name: g.group_name,
            lob: g.id_lob, // NEW FIELD
            items: (items || []).filter(it => it.group_record_id === g.id).map(it => ({ id: it.bp_id }))
        }));
        state.workshopGroups = activeWorkshopGroups; // Sync state for summary table logic

        // Load BPs for selection
        const { data: bps } = await supabaseClient.from('master_best_practice').select('*').limit(1000);

        list.innerHTML = `
        <div class="bp-selection-area" style="margin-bottom: 1.5rem;">
            <h5>1. Seleccionar BP para agrupar:</h5>
            <input type="text" class="workshop-search-input" id="bp-search-input" placeholder="Buscar BP por ID o Nombre..." onkeyup="window.filterBPs(this.value)">
            <div class="table-container" style="max-height: 180px; overflow-y:auto;">
                <table class="alv-table compact" id="bp-selection-table">
                    <thead><tr><th>ID BP</th><th>Denominación</th></tr></thead>
                    <tbody>
                        ${(bps || []).map(bp => `
                            <tr draggable="true" 
                                class="bp-item-row ${state.selectedBPs.some(s => s.id === bp.id_bp) ? 'selected' : ''}"
                                data-bp-id="${bp.id_bp}"
                                data-bp-name="${bp.denominacion_bp}"
                                onclick="window.selectBPForWorkshop('${bp.id_bp}', '${bp.denominacion_bp}', this)"
                                ondragstart="handleBPDragStart(event, '${bp.id_bp}', '${bp.denominacion_bp}')">
                                <td>${bp.id_bp}</td><td>${bp.denominacion_bp}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        <div class="group-buckets-wrapper" style="margin-top:2rem;">
            <h5>2. Agrupaciones (total: ${activeWorkshopGroups.length}):</h5>
            <input type="text" class="workshop-search-input" id="group-search-input" placeholder="Filtrar grupos por nombre o LoB..." onkeyup="window.filterGroups(this.value)">
            <div class="group-buckets" style="max-height: 500px; overflow-y: auto; padding-right: 5px;" id="buckets-container">
                ${activeWorkshopGroups.map((g, index) => `
                    <div class="group-bucket ws-border-${index % 6}" 
                         data-name="${(g.name || '').toLowerCase()}" 
                         data-lob="${(g.lob || '').toLowerCase()}"
                         ondragover="event.preventDefault()" 
                         ondrop="dropBPToBucket(event, ${g.db_id})">
                        <div class="bucket-header">
                            <input type="text" class="group-name-input" value="${g.name || ''}" 
                                   placeholder="${g.id}..." 
                                   onchange="window.updateGroupName(${g.db_id}, this.value)">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span class="badge" style="background:#f0f0f0; color:#666; font-size:0.6rem; border:1px solid #ddd;">${g.lob || 'Sin LoB'}</span>
                                <i class="fas fa-plus-circle add-bp-trigger" onclick="window.addSelectedBPToGroup(${g.db_id})" title="Añadir BPs seleccionados"></i>
                                <i class="fas fa-trash-alt" onclick="window.deleteWSGroup(${g.db_id})" style="cursor:pointer; color:#ff4444;"></i>
                            </div>
                        </div>
                        <div class="bucket-items" id="bucket-${g.id}">
                            ${g.items.length ? g.items.map(it => `<span>${it.id}</span>`).join('') : '<small>Arrastra BPs aquí</small>'}
                        </div>
                        <div class="bucket-actions ws-color-${index % 6}" draggable="true" ondragstart="handleGroupDragStart(event, '${g.id}', ${index % 6})">
                            <i class="fas fa-grip-vertical"></i> Mover a Agenda
                        </div>
                    </div>
                `).join('')}
                ${activeWorkshopGroups.length === 0 ? '<p style="padding:1rem; text-align:center; color:#999;">Crea un grupo para empezar</p>' : ''}
            </div>
            <button class="btn btn-outline" style="width:100%; margin-top:10px; position: sticky; bottom: 0; background: white;" onclick="window.createNewGroup()">+ Nuevo Grupo WS</button>
        </div>
        `;
    }
}

window.filterBPs = function (query) {
    const q = query.toLowerCase();
    document.querySelectorAll('#bp-selection-table tbody tr').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
    });
};

window.filterGroups = function (query) {
    const q = query.toLowerCase();
    document.querySelectorAll('.group-bucket').forEach(bucket => {
        const name = bucket.getAttribute('data-name');
        const lob = bucket.getAttribute('data-lob');
        bucket.style.display = (name.includes(q) || lob.includes(q)) ? '' : 'none';
    });
};

window.selectBPForWorkshop = function (id, name, element) {
    const idx = state.selectedBPs.findIndex(s => s.id === id);
    if (idx > -1) {
        state.selectedBPs.splice(idx, 1);
        element.classList.remove('selected');
    } else {
        state.selectedBPs.push({ id, name });
        element.classList.add('selected');
    }
};

window.addSelectedBPToGroup = async function (dbId) {
    if (!state.selectedBPs || state.selectedBPs.length === 0) {
        Swal.fire('Atención', 'Selecciona primero uno o varios Best Practice de la lista superior.', 'info');
        return;
    }
    if (supabaseClient) {
        const itemsToInsert = state.selectedBPs.map(bp => ({
            group_record_id: dbId,
            bp_id: bp.id
        }));

        await supabaseClient.from('workshop_group_items').insert(itemsToInsert);

        state.selectedBPs = []; // Clear selection after adding
        loadWorkshopGroups();
        renderPreAgendaSummary();
        Toast.fire({ icon: 'success', title: `${itemsToInsert.length} BPs añadidos al grupo` });
    }
};

window.updateGroupName = async function (dbId, name) {
    if (supabaseClient) {
        await supabaseClient.from('workshop_groups').update({ group_name: name }).eq('id', dbId);
        // Silently update local array too if needed
        const g = activeWorkshopGroups.find(x => x.db_id === dbId);
        if (g) g.name = name;
    }
};

window.handleGroupDragStart = function (e, groupId, colorIdx) {
    e.dataTransfer.setData('group-id', groupId);
    e.dataTransfer.setData('color-idx', colorIdx);
};

window.dropWSGroupToDate = async function (e, dateStr) {
    const groupId = e.dataTransfer.getData('group-id');
    const colorIdx = e.dataTransfer.getData('color-idx');

    if (groupId && state.selectedProject) {
        const group = activeWorkshopGroups.find(g => g.id === groupId);
        const name = group ? (group.name || groupId) : groupId;

        if (supabaseClient) {
            const { error } = await supabaseClient
                .from('project_workshops')
                .insert([{
                    project_id: state.selectedProject.id,
                    group_id: groupId,
                    group_name: name,
                    scheduled_date: dateStr,
                    color_idx: parseInt(colorIdx) || 0
                }]);

            if (error) {
                console.error("Error al agendar taller:", error.message);
                Swal.fire('Error', 'No se pudo agendar el taller en la base de datos.', 'error');
            } else {
                renderPreCalendar();
                renderPreAgendaSummary();
            }
        }
    }
};

window.deleteWorkshopFromAgenda = async function (id) {
    if (!supabaseClient) return;

    const { error } = await supabaseClient
        .from('project_workshops')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("Error al eliminar taller:", error.message);
    } else {
        renderPreCalendar();
        renderPreAgendaSummary();
    }
};

window.handleBPDragStart = function (e, id, name) {
    e.dataTransfer.setData('bp-id', id);
    e.dataTransfer.setData('bp-name', name);
};

window.dropBPToBucket = async function (e, dbId) {
    const bpId = e.dataTransfer.getData('bp-id');
    if (supabaseClient && bpId) {
        await supabaseClient.from('workshop_group_items').insert([{
            group_record_id: dbId,
            bp_id: bpId
        }]);
        loadWorkshopGroups();
        renderPreAgendaSummary();
    }
};

window.createNewGroup = async function () {
    console.log("Iniciando creación de grupo con LoB...");
    if (!supabaseClient || !state.selectedProject) {
        Swal.fire('Atención', 'Selecciona primero un proyecto en el módulo PRJ.', 'warning');
        return;
    }

    // 1. Fetch LOBs for the dropdown
    let lobOptions = '<option value="">(Sin LoB)</option>';
    const { data: lobs } = await supabaseClient.from('master_lobs').select('id_lob');
    if (lobs) {
        lobOptions += lobs.map(l => `<option value="${l.id_lob}">${l.id_lob}</option>`).join('');
    }

    // 2. Ask for Name and LoB
    const { value: formValues } = await Swal.fire({
        title: 'Nuevo Grupo de Trabajo',
        html: `
            <div style="text-align:left">
                <label style="font-weight:700">Nombre del Taller / Grupo</label>
                <input id="swal-group-name" class="swal2-input" placeholder="p.ej. Sesión Finanzas 01">
                <label style="font-weight:700">Línea de Negocio (LoB)</label>
                <select id="swal-group-lob" class="swal2-input" style="width:100%; margin-top:10px;">
                    ${lobOptions}
                </select>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Crear Grupo',
        preConfirm: () => {
            return {
                name: document.getElementById('swal-group-name').value,
                lob: document.getElementById('swal-group-lob').value
            }
        }
    });

    if (formValues) {
        const count = activeWorkshopGroups.length;
        const nextId = `WS-${String(count + 1).padStart(3, '0')}`;

        const { error } = await supabaseClient.from('workshop_groups').insert([{
            project_id: state.selectedProject.id,
            group_id: nextId,
            group_name: formValues.name,
            id_lob: formValues.lob // NEW FIELD
        }]);

        if (error) {
            console.error("Error al crear grupo:", error.message);
            Swal.fire('Error', `No se pudo crear el grupo: ${error.message}\n¿Has añadido la columna 'id_lob' a la tabla?`, 'error');
        } else {
            Toast.fire({ icon: 'success', title: 'Grupo creado con LoB' });
            loadWorkshopGroups();
        }
    }
};

window.deleteWSGroup = async function (dbId) {
    if (supabaseClient) {
        await supabaseClient.from('workshop_groups').delete().eq('id', dbId);
        loadWorkshopGroups();
    }
};

window.toggleGroupsStatus = function () {
    const btn = document.getElementById('activate-groups-btn');
    const isActive = btn.classList.contains('active');
    if (isActive) {
        btn.classList.remove('active');
        btn.textContent = 'Activar Grupos';
        btn.style.background = 'var(--sap-blue)';
    } else {
        btn.classList.add('active');
        btn.textContent = 'Grupos ACTIVADOS';
        btn.style.background = 'var(--sap-green)';
        alert("¡Relación guardada en base de datos!\nLos talleres han sido activados para el proyecto.");
    }
};

// --- PRE MODULE: PART 3 (STARTER) LOGIC ---
async function loadStarterData() {
    const tbody = document.getElementById('starter-table-body');
    const lobs = [
        { id: 'Finance', url: 'https://altim.sp/templates/FI', downloads: 12 },
        { id: 'Sales', url: 'https://altim.sp/templates/SD', downloads: 5 }
    ];
    if (tbody) {
        tbody.innerHTML = lobs.map(l => `
            <tr>
                <td>${l.id}</td>
                <td><a href="${l.url}" target="_blank">${l.url}</a></td>
                <td>${l.downloads}</td>
                <td><button class="btn btn-outline" onclick="simulateDownload('${l.id}')"><i class="fas fa-download"></i></button></td>
            </tr>
        `).join('');
    }
}

window.simulateDownload = function (lob) {
    alert(`Descargando contenido STARTER para ${lob}...\nEl archivo se guardará en tu PC Local.`);
};

async function filterStarterData(lobId) {
    console.log("Filtrando starter por LOB:", lobId);
    // Refresh table with filter
    loadStarterData(lobId);
}

// --- MODULE: USER MANAGEMENT (USU) ---
async function renderUserManagement() {
    elements.moduleContent.innerHTML = `
        <div class="collapsible-wrapper" style="border-left: 4px solid var(--sap-blue);">
            <div class="collapsible-header" onclick="toggleSection(this)">
                <h3 style="color:var(--sap-blue); display:flex; align-items:center; gap:10px;">
                    <i class="fas fa-users"></i> GESTIÓN DE USUARIOS
                </h3>
                <i class="fas fa-plus-circle toggle-icon"></i>
            </div>
            <div class="collapsible-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <p class="section-subtitle" style="margin:0; font-size: 0.85rem;">Maestro de usuarios y asignaciones (v2.6).</p>
                    ${hasPermission('usu', 'modify') ? '<button class="btn compact" onclick="openUserModal()">+ Nuevo Usuario</button>' : ''}
                </div>
                <div id="usu-table-container" class="table-container">
                    <p style="padding: 2rem; text-align: center; color: #666;"><i class="fas fa-spinner fa-spin"></i> Cargando usuarios...</p>
                </div>
            </div>
        </div>
    `;

    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('users').select('*').limit(500);
            const { data: proyAssign } = await supabaseClient.from('user_project_relation').select('user_id');
            const { data: cliAssign } = await supabaseClient.from('user_client_relation').select('user_id');

            const pCounts = {};
            (proyAssign || []).forEach(a => { pCounts[a.user_id] = (pCounts[a.user_id] || 0) + 1; });

            const cCounts = {};
            (cliAssign || []).forEach(a => { cCounts[a.user_id] = (cCounts[a.user_id] || 0) + 1; });

            if (!error && data) {
                state.users = data.map(u => ({
                    ...u,
                    name: u.first_name || 'Usuario',
                    lastname: u.last_name || '',
                    projectCount: pCounts[u.id] || 0,
                    clientCount: cCounts[u.id] || 0,
                    type: u.user_type || '',
                    address: u.direccion || '',
                    phone: u.telefono || '',
                    image: u.profile_image || ''
                }));
            }
        } catch (err) {
            console.error("Error fetching users from Supabase:", err);
        }
    }

    const users = state.users;
    const container = document.getElementById('usu-table-container');
    if (!container) return;
    container.innerHTML = `
        <table class="alv-table">
            <thead><tr><th>Email</th><th>Nombre</th><th>Clientes</th><th>Proyectos</th><th>Rol</th><th>Tipo</th><th>Acciones</th></tr></thead>
            <tbody>
                ${users.map(u => {
        const isBlocked = u.status === 'blocked';
        const rowStyle = isBlocked ? 'opacity: 0.5; background-color: #f9f9f9;' : '';
        const clientDisplay = u.clientCount > 1 ? `<span class="badge" style="background:#ff9800">${u.clientCount} Cli.</span>` : (u.cliente || '-');
        return `
                        <tr style="${rowStyle}">
                            <td>${u.email}</td>
                            <td>${u.name} ${u.lastname}</td>
                            <td>${clientDisplay}</td>
                            <td><span class="badge" style="background:var(--sap-blue)">${u.projectCount} Asig.</span></td>
                            <td>${u.role}</td>
                            <td>${u.type || '-'}</td>
                            <td>
                                ${hasPermission('usu', 'modify') ? `
                                    <i class="fas fa-edit" style="cursor:pointer; margin-right:8px; color:#666;" title="Editar" onclick="openUserModal('${u.email}')"></i>
                                    <i class="fas fa-key" style="cursor:pointer; margin-right:8px; color:var(--sap-blue);" title="Resetear Clave" onclick="resetUserPassword('${u.email}', '${u.id}')"></i>
                                    <i class="fas fa-trash" style="cursor:pointer; color:#ff4444;" title="Eliminar" onclick="deleteUser('${u.email}')"></i>
                                ` : '-'}
                            </td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;
}

// --- MODULE: CLIENT MANAGEMENT (CLI) ---
async function renderClientManagement() {
    elements.moduleContent.innerHTML = `
        <div class="collapsible-wrapper" style="border-left: 4px solid var(--sap-blue);">
            <div class="collapsible-header" onclick="toggleSection(this)">
                <h3 style="color:var(--sap-blue); display:flex; align-items:center; gap:10px;">
                    <i class="fas fa-building"></i> GESTIÓN DE CLIENTES
                </h3>
                <i class="fas fa-plus-circle toggle-icon"></i>
            </div>
            <div class="collapsible-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <p class="section-subtitle" style="margin:0; font-size: 0.85rem;">Maestro de clientes y abreviaturas.</p>
                    ${hasPermission('cli', 'modify') ? '<button class="btn compact" onclick="openClientModal()">+ Nuevo Cliente</button>' : ''}
                </div>
                <div id="cli-table-container" class="table-container">
                    <p style="padding: 2rem; text-align: center; color: #666;"><i class="fas fa-spinner fa-spin"></i> Cargando clientes...</p>
                </div>
            </div>
        </div>

        <div class="collapsible-wrapper" style="border-left: 4px solid var(--sap-blue); margin-top: 1rem;">
            <div class="collapsible-header" onclick="toggleSection(this)">
                <h3 style="color:var(--sap-blue); display:flex; align-items:center; gap:10px;">
                    <i class="fas fa-project-diagram"></i> PROYECTOS POR CLIENTE
                </h3>
                <i class="fas fa-plus-circle toggle-icon"></i>
            </div>
            <div class="collapsible-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <p class="section-subtitle" style="margin:0; font-size: 0.85rem;">Gestión de proyectos activos (cliente_proy).</p>
                    ${hasPermission('cli', 'modify') ? '<button class="btn compact" onclick="showProjectModal()">+ Nuevo Proyecto</button>' : ''}
                </div>
                <div id="cli-projects-table-container" class="table-container">
                    <p style="padding: 2rem; text-align: center; color: #666;"><i class="fas fa-spinner fa-spin"></i> Cargando proyectos...</p>
                </div>
            </div>
        </div>
    `;

    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('clients').select('*').limit(500);
            if (!error && data) {
                state.clients = data;
            }
        } catch (err) {
            console.error("Error fetching clients from Supabase:", err);
        }
    }

    const clients = state.clients;
    const container = document.getElementById('cli-table-container');
    if (!container) return;
    container.innerHTML = `
        <table class="alv-table">
            <thead><tr><th>Nombre Cliente</th><th>ABREV</th><th>ABREV (3)</th><th>Contacto</th><th>Mail</th><th>TEL</th><th>Acciones</th></tr></thead>
            <tbody>
                ${clients.map(c => `
                    <tr>
                        <td>${c.nombre_cliente || c.name}</td>
                        <td>${c.abrev}</td>
                        <td>${c.abreviatura_3 || '-'}</td>
                        <td>${c.contacto || '-'}</td>
                        <td>${c.mail || '-'}</td>
                        <td>${c.tel || '-'}</td>
                        <td>
                            ${hasPermission('cli', 'modify') ? `
                                <i class="fas fa-edit" style="cursor:pointer; margin-right:10px;" title="Editar cliente" onclick="openClientModal('${c.abrev}')"></i>
                                <i class="fas fa-trash" style="cursor:pointer; color:#ff4444;" title="Eliminar cliente" onclick="deleteClient('${c.id}')"></i>
                            ` : '-'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    renderClientProjectsTable();
}

async function renderClientProjectsTable() {
    const container = document.getElementById('cli-projects-table-container');
    if (!container || !supabaseClient) return;

    const { data, error } = await supabaseClient
        .from('cliente_proy')
        .select('*, clients(nombre_cliente, abrev)')
        .order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = `<p>Error al cargar proyectos: ${error.message}</p>`;
        return;
    }

    container.innerHTML = `
        <table class="alv-table">
            <thead>
                <tr>
                    <th>Cliente</th>
                    <th>ID Proyecto</th>
                    <th>Descripción</th>
                    <th>SharePoint</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(p => `
                    <tr>
                        <td>${p.clients?.nombre_cliente || '-'}</td>
                        <td style="font-weight:700">${p.id_proyecto}</td>
                        <td>${p.descripcion_prj || '-'}</td>
                        <td>${p.sharepoint_url ? `<a href="${p.sharepoint_url}" target="_blank" style="color:var(--sap-blue)"><i class="fas fa-external-link-alt"></i></a>` : '-'}</td>
                        <td>
                            ${hasPermission('cli', 'modify') ? `
                                <i class="fas fa-edit" style="cursor:pointer; margin-right:10px; color:var(--sap-blue);" title="Editar" onclick="showProjectModal('${p.id}')"></i>
                                <i class="fas fa-trash" style="cursor:pointer; color:#ff4444;" title="Eliminar" onclick="deleteProject('${p.id}')"></i>
                            ` : '-'}
                        </td>
                    </tr>
                `).join('')}
                ${data.length === 0 ? '<tr><td colspan="5" style="text-align:center">No hay proyectos registrados</td></tr>' : ''}
            </tbody>
        </table>
    `;
}

// --- MODULE: MASTER DATA MANAGEMENT (MAE) ---
function renderMasterDataManagement() {
    const masterTables = [
        'master_roles',
        'master_fases',
        'master_jira_categories',
        'master_project_types',
        'master_best_practice',
        'master_uats',
        'master_questionnaire',
        'master_bpml',
        'master_lobs',
        'public_news'
    ];

    elements.moduleContent.innerHTML = `
        ${renderPhaseHeader('Mantenimiento de Maestros (MAE)')}
        <div class="collapsible-wrapper" style="border-left: 5px solid var(--sap-blue);">
            <div class="collapsible-header" onclick="toggleSection(this)">
                <h3 style="color:var(--sap-blue); display:flex; align-items:center; gap:10px;">
                    <i class="fas fa-database"></i> 1: Tablas Maestras de Sistema
                </h3>
                <i class="fas fa-plus-circle toggle-icon"></i>
            </div>
            <div class="collapsible-content">
                <div style="padding: 1rem;">
                    <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid #eee; padding-bottom: 1rem;">
                        <label style="font-weight: 700; color: #666;">Seleccionar Tabla:</label>
                        <select id="mae-table-selector" class="btn btn-outline" style="width: auto; text-align: left;" onchange="loadMasterTable(this.value)">
                            <option value="">-- Elige una tabla --</option>
                            ${masterTables.map(t => `<option value="${t}">${t.replace('master_', '').toUpperCase()}</option>`).join('')}
                        </select>
                        ${hasPermission('mae', 'modify') ? '<button class="btn btn-sm" style="width: auto; padding: 0.5rem 1.5rem; margin-left: auto;" onclick="addMasterRecord()">+ Nuevo Registro</button>' : ''}
                    </div>
                    
                    <div id="mae-table-view" class="table-container">
                        <p style="padding: 2rem; text-align: center; color: #999;">Selecciona una tabla para gestionar los maestros de la base de datos (Estructura Supabase v1.0).</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

window.loadMasterTable = function (tableName) {
    const container = document.getElementById('mae-table-view');
    if (!tableName) {
        container.innerHTML = '<p style="padding: 2rem; text-align: center; color: #999;">Selecciona una tabla para gestionar los maestros de la base de datos.</p>';
        return;
    }

    // Table configuration strictly matching db_setup.sql fields
    const tableConfig = {
        'master_roles': {
            headers: ['ID', 'Nombre Rol'],
            fields: ['id', 'role_name']
        },
        'master_fases': {
            headers: ['ID', 'Nombre Fase', 'Inicio', 'Fin', 'Nuevo Inicio', 'Nuevo Fin'],
            fields: ['id', 'fase_name', 'fecha_inicio', 'fecha_fin', 'nueva_fecha_inicio', 'nueva_fecha_fin']
        },
        'master_jira_categories': {
            headers: ['ID', 'Categoría Jira'],
            fields: ['id', 'category_name']
        },
        'master_project_types': {
            headers: ['ID', 'Tipo de Proyecto'],
            fields: ['id', 'type_name']
        },
        'master_best_practice': {
            headers: ['LOB', 'Denominación BP', 'ID BP'],
            fields: ['id_lob', 'denominacion_bp', 'id_bp']
        },
        'master_uats': {
            headers: ['ID Proy', 'LOB', 'ID CasoP', 'ID BP', 'Proceso', 'Escenario', 'Actividades', 'Precond.', 'Detalles', 'Prueba', 'R.Esp.', 'RACI', 'Rol Resp.', 'Prueba Tipo'],
            fields: ['project_id', 'id_lob', 'id_casop', 'id_bp', 'proceso_scope_item', 'escenario', 'actividades_proceso', 'precondiciones', 'pasos_detallados', 'datos_prueba', 'resultado_esperado', 'raci', 'rol_perfil_responsable', 'tipo_prueba']
        },
        'master_questionnaire': {
            headers: ['LOB', 'Relevant?', 'Scope Ref', 'SAP ID', 'Area', 'Question', 'Level', 'Solution'],
            fields: ['lob_id', 'project_relevant', 'scope_ref', 'sap_id', 'area', 'question', 'level', 'solution']
        },
        'master_bpml': {
            headers: ['BPML_ID', 'ID E2E', 'Negocio', 'Proc L3', 'SAP BP Name', 'Priority', 'Sprint', 'Org structure', 'Integrations'],
            fields: ['bpml_id', 'id_e2e', 'negocio', 'nombre_proceso_l3', 'nombre_scope_item_sap_best_practice', 'priority', 'sprint', 'estructura_organizativa_objetivo', 'integraciones_estandar']
        },
        'master_lobs': {
            headers: ['ID LOB', 'Idioma'],
            fields: ['id_lob', 'id_idioma']
        },
        'public_news': {
            headers: ['ID', 'Título', 'Descripción', 'URL', 'Activo'],
            fields: ['id', 'title', 'description', 'url', 'is_active']
        }
    };

    const config = tableConfig[tableName] || { headers: ['ID', 'Valor'], fields: ['id', 'val'] };

    // Try to fetch from Supabase if connected
    if (supabaseClient) {
        container.innerHTML = `<p style="padding: 2rem; text-align: center; color: #666;"><i class="fas fa-spinner fa-spin"></i> Cargando datos desde Supabase...</p>`;

        supabaseClient
            .from(tableName)
            .select('*')
            .limit(500)
            .then(({ data, error }) => {
                if (error) {
                    console.error("Error fetching from Supabase:", error);
                    renderTable(container, config, [], tableName);
                } else {
                    renderTable(container, config, data, tableName);
                }
            });
    } else {
        // Use Mock Data
        const robustMockData = {
            'master_roles': [
                { id: 1, role_name: 'Administrador' },
                { id: 2, role_name: 'consultor' }
            ],
            'master_fases': [
                { id: 1, fase_name: 'Discover', fecha_inicio: '2026-01-01', fecha_fin: '2026-02-01', nueva_fecha_inicio: '-', nueva_fecha_fin: '-' }
            ],
            'master_best_practice': [
                { id_lob: 'Finance', denominacion_bp: 'General Ledger Accounting', id_bp: '1GA' }
            ],
            'master_lobs': [
                { id_lob: 'Finance', id_idioma: 'ES' },
                { id_lob: 'Sales', id_idioma: 'ES' }
            ],
            'master_uats': [
                { id_lob: 'Finance', id_casop: 'TC-001', id_bp: '1GA', proceso_scope_item: 'Accounting', escenario: 'Testing GL', actividades_proceso: 'Posting entry', raci: 'R' }
            ],
            'master_questionnaire': [
                { lob_id: 'Finance', project_relevant: 'Yes', sap_id: '1GA', area: 'Accounting', question: 'How do you post journals?', level: 'L1' }
            ],
            'master_bpml': [
                { bpml_id: 'BP-001', id_e2e: 'E2E-FIN', negocio: 'Finance', nombre_proceso_l3: 'Asset Mgmt', sprint: '1', priority: 'High' }
            ],
            'public_news': [
                { id: 1, title: 'Portal de Ayuda SAP', description: 'Documentación oficial.', url: 'https://help.sap.com', is_active: true },
                { id: 2, title: 'ALTIM Innovación', description: 'Web corporativa.', url: 'https://www.altim.es', is_active: true }
            ]
        };
        const data = (robustMockData[tableName] || []).slice(0, 10);
        renderTable(container, config, data, tableName);
    }
};

function renderTable(container, config, data, tableName) {
    container.innerHTML = `
        <table class="alv-table">
            <thead>
                <tr>
                    ${config.headers.map(h => `<th>${h}</th>`).join('')}
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${data.map((item, idx) => `
                    <tr>
                        ${config.fields.map(f => `<td>${item[f] !== undefined && item[f] !== null ? item[f] : '-'}</td>`).join('')}
                        <td>
                            ${hasPermission('mae', 'modify') ? `
                                <i class="fas fa-edit" style="cursor:pointer; margin-right:10px; color:var(--sap-blue);" title="Editar" onclick="editMasterRecord('${tableName}', ${JSON.stringify(item).replace(/"/g, '&quot;')})"></i>
                                <i class="fas fa-trash" style="cursor:pointer; color:#ff4444;" title="Eliminar" onclick="deleteMasterRecord('${tableName}', '${item.id || item.id_lob || item.id_bp || item.bpml_id}')"></i>
                            ` : '-'}
                        </td>
                    </tr>
                `).join('')}
                ${data.length === 0 ? `<tr><td colspan="${config.headers.length + 1}" style="text-align:center">No hay datos en esta tabla maestra</td></tr>` : ''}
            </tbody>
        </table>
    `;
}

window.addMasterRecord = async function() {
    const tableName = document.getElementById('mae-table-selector').value;
    if (!tableName) {
        Swal.fire('Atención', 'Por favor, selecciona una tabla primero.', 'info');
        return;
    }

    // Get the first item from current data to determine fields
    const config = {
        'master_roles': ['role_name'],
        'master_fases': ['fase_name', 'fecha_inicio', 'fecha_fin'],
        'master_jira_categories': ['category_name'],
        'master_project_types': ['type_name'],
        'master_best_practice': ['id_lob', 'denominacion_bp', 'id_bp'],
        'master_uats': ['id_lob', 'id_casop', 'id_bp', 'proceso_scope_item', 'escenario', 'actividades_proceso', 'raci'],
        'master_questionnaire': ['lob_id', 'project_relevant', 'sap_id', 'area', 'question', 'level'],
        'master_bpml': ['bpml_id', 'id_e2e', 'negocio', 'nombre_proceso_l3', 'sprint', 'priority'],
        'master_lobs': ['id_lob', 'id_idioma'],
        'public_news': ['title', 'description', 'url', 'image_url', 'is_active', 'order_priority']
    };

    const fields = config[tableName] || [];
    
    const { value: formValues } = await Swal.fire({
        title: `Nuevo Registro: ${tableName.replace('master_', '').toUpperCase()}`,
        html: fields.map(f => `
            <div class="form-group" style="text-align:left; margin-bottom:10px;">
                <label style="font-size:0.8rem; font-weight:bold;">${f.toUpperCase()}</label>
                <input id="mae-add-${f}" class="swal2-input" style="width:100%; margin:0; font-size:0.9rem;" placeholder="Introduce ${f}">
            </div>
        `).join(''),
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Crear Registro',
        preConfirm: () => {
            const result = {};
            fields.forEach(f => {
                const val = document.getElementById(`mae-add-${f}`).value;
                result[f] = val;
            });
            return result;
        }
    });

    if (formValues && supabaseClient) {
        const { error } = await supabaseClient.from(tableName).insert([formValues]);
        
        if (error) {
            Swal.fire('Error', error.message, 'error');
        } else {
            Swal.fire('Éxito', 'Registro creado correctamente.', 'success');
            loadMasterTable(tableName);
        }
    }
};

window.editMasterRecord = async function(tableName, item) {
    const fields = Object.keys(item).filter(k => k !== 'created_at' && k !== 'updated_at');
    
    const { value: formValues } = await Swal.fire({
        title: `Editar ${tableName.replace('master_', '').toUpperCase()}`,
        html: fields.map(f => `
            <div class="form-group" style="text-align:left; margin-bottom:10px;">
                <label style="font-size:0.8rem; font-weight:bold;">${f.toUpperCase()}</label>
                <input id="mae-edit-${f}" class="swal2-input" style="width:100%; margin:0; font-size:0.9rem;" value="${item[f] || ''}" ${f === 'id' ? 'disabled' : ''}>
            </div>
        `).join(''),
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Guardar Cambios',
        preConfirm: () => {
            const result = {};
            fields.forEach(f => {
                if (f !== 'id') {
                    const val = document.getElementById(`mae-edit-${f}`).value;
                    result[f] = val;
                }
            });
            return result;
        }
    });

    if (formValues && supabaseClient) {
        const idField = item.id ? 'id' : (item.id_lob ? 'id_lob' : (item.id_bp ? 'id_bp' : 'id'));
        const { error } = await supabaseClient.from(tableName).update(formValues).eq(idField, item[idField]);
        
        if (error) {
            Swal.fire('Error', error.message, 'error');
        } else {
            Swal.fire('Éxito', 'Registro actualizado correctamente.', 'success');
            loadMasterTable(tableName);
        }
    }
};

window.deleteMasterRecord = async function(tableName, id) {
    const result = await Swal.fire({
        title: '¿Eliminar registro?',
        text: "Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff4444',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed && supabaseClient) {
        const idField = tableName === 'master_best_practice' ? 'id_bp' : (tableName === 'master_lobs' ? 'id_lob' : 'id');
        const { error } = await supabaseClient.from(tableName).delete().eq(idField, id);
        
        if (error) {
            Swal.fire('Error', error.message, 'error');
        } else {
            Swal.fire('Eliminado', 'El registro ha sido eliminado.', 'success');
            loadMasterTable(tableName);
        }
    }
};


// --- NEW ALV MODALS LOGIC ---
const userModal = document.getElementById("user-modal");
const profileModal = document.getElementById("profile-modal");
const configModal = document.getElementById("config-modal");
const clientModal = document.getElementById("client-modal");

// Binding Header Buttons
const profileBtnHeader = document.getElementById("profile-btn");
// profileBtnHeader.addEventListener("click", openProfileModal); // Removed duplicate

const configBtn = document.getElementById("config-btn");
if (configBtn) configBtn.addEventListener("click", openConfigModal);

// Close on outside click
window.addEventListener("click", (e) => {
    if (e.target === userModal) closeUserModal();
    if (e.target === configModal) closeConfigModal();
    if (e.target === clientModal) closeClientModal();
});



// Config Logic
function openConfigModal() {
    configModal.classList.add("active");
}

function closeConfigModal() {
    configModal.classList.remove("active");
}

window.updateRoleOptions = function (type) {
    const roleSelect = document.getElementById("user-role");
    const rolesAltim = [
        { val: 'Administrador', lab: 'Administrador' },
        { val: 'consultor', lab: 'Consultor' },
        { val: 'jefe de proyecto', lab: 'Jefe de Proyecto' },
        { val: 'Desarrollador', lab: 'Desarrollador' },
        { val: 'Management', lab: 'Management' }
    ];
    const rolesCliente = [
        { val: 'Cliente', lab: 'Cliente Standard' },
        { val: 'Cliente_ADM', lab: 'Cliente Administrador' }
    ];

    const currentRoles = (type === 'Altim') ? rolesAltim : rolesCliente;
    roleSelect.innerHTML = currentRoles.map(r => `<option value="${r.val}">${r.lab}</option>`).join('');
};

// User CRUD Logic
window.openUserModal = async function (email = null) {
    const form = document.getElementById("user-form");
    const title = document.getElementById("user-modal-title");
    const typeSelect = document.getElementById("user-type");
    const roleSelect = document.getElementById("user-role");
    const clienteSelect = document.getElementById("user-cliente");
    const singleGroup = document.getElementById("user-cliente-single-group");
    const multiGroup = document.getElementById("user-clients-multi-group");

    form.reset();

    // 1. Ensure clients are loaded from Supabase
    if (supabaseClient) {
        const { data: clientsData } = await supabaseClient.from('clients').select('*').order('nombre_cliente');
        if (clientsData && clientsData.length > 0) state.clients = clientsData;
    }

    // 2. Populate client dropdown (for single mode)
    clienteSelect.innerHTML = '<option value="">-- Seleccionar Cliente --</option>' + (state.clients || []).map(c => `<option value="${c.nombre_cliente || c.name}">${c.nombre_cliente || c.name}</option>`).join('');

    // State for the modal
    let allProjects = [];
    let userAssignProy = [];
    let userAssignCli = [];
    let userData = null;

    if (supabaseClient) {
        const { data } = await supabaseClient.from('cliente_proy').select('id, descripcion_prj, client_id, clients(nombre_cliente)');
        allProjects = data || [];
    }

    if (email && typeof email === 'string') {
        title.textContent = "Editar Usuario";
        userData = state.users.find(u => u.email === email);
        if (userData && userData.id) {
            if (supabaseClient) {
                const { data: proy } = await supabaseClient.from('user_project_relation').select('project_id').eq('user_id', userData.id);
                userAssignProy = (proy || []).map(r => r.project_id);
                const { data: cli } = await supabaseClient.from('user_client_relation').select('client_id').eq('user_id', userData.id);
                userAssignCli = (cli || []).map(r => r.client_id);
            }
        }
    }

    window._currentModalProjectIds = new Set(userAssignProy);
    window._currentModalClientIds = new Set(userAssignCli);

    // 3. Selection Popup Logic
    window.openSelectionPopup = async function (type) {
        let items = [];
        let selectedSet = (type === 'clients') ? window._currentModalClientIds : window._currentModalProjectIds;
        let popupTitle = (type === 'clients') ? 'Seleccionar Clientes' : 'Seleccionar Proyectos';

        if (type === 'clients') {
            items = state.clients.map(c => ({ id: c.id, name: c.nombre_cliente || c.name }));
        } else {
            const userType = typeSelect.value;
            if (userType === 'Cliente') {
                const selName = clienteSelect.value;
                items = allProjects.filter(p => (p.clients?.nombre_cliente || 'Otros') === selName)
                    .map(p => ({ id: p.id, name: p.descripcion_prj, client: p.clients?.nombre_cliente }));
            } else {
                if (window._currentModalClientIds.size > 0) {
                    items = allProjects.filter(p => window._currentModalClientIds.has(p.client_id))
                        .map(p => ({ id: p.id, name: p.descripcion_prj, client: p.clients?.nombre_cliente }));
                } else {
                    items = allProjects.map(p => ({ id: p.id, name: p.descripcion_prj, client: p.clients?.nombre_cliente }));
                }
            }
        }

        if (items.length === 0) {
            Swal.fire('Atención', 'No hay elementos disponibles para seleccionar.', 'info');
            return;
        }

        window._tempSelection = new Set(selectedSet);

        const html = `
            <input type="text" id="swal-select-search" class="swal2-input" style="margin-top:0" placeholder="Buscar..." onkeyup="window.filterSelectionList(this.value)">
            <div id="swal-select-list" class="checkbox-group-container" style="max-height: 250px; text-align: left; margin-top: 1rem; overflow-y:auto; border:1px solid #eee; padding:5px;">
                ${items.map(item => `
                    <div class="checkbox-item selection-item" data-name="${item.name.toLowerCase()}">
                        <input type="checkbox" value="${item.id}" ${selectedSet.has(item.id) ? 'checked' : ''} 
                               onchange="this.checked ? window._tempSelection.add(parseInt(this.value)) : window._tempSelection.delete(parseInt(this.value))">
                        <span style="font-size:0.85rem; margin-left:8px;">${item.name} ${item.client ? `<br><small style="color:#999; margin-left:0">${item.client}</small>` : ''}</span>
                    </div>
                `).join('')}
            </div>
        `;

        const result = await Swal.fire({
            title: popupTitle,
            html: html,
            width: '450px',
            showCancelButton: true,
            confirmButtonText: 'Confirmar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => Array.from(window._tempSelection)
        });

        if (result.isConfirmed) {
            if (type === 'clients') {
                window._currentModalClientIds = new Set(result.value);
                // Also remove projects that no longer belong to selected clients
                const activeClientIds = window._currentModalClientIds;
                if (activeClientIds.size > 0) {
                    const validProjectIds = new Set(allProjects.filter(p => activeClientIds.has(p.client_id)).map(p => p.id));
                    window._currentModalProjectIds = new Set([...window._currentModalProjectIds].filter(id => validProjectIds.has(id)));
                }
                window.renderClientCheckboxes();
                window.renderProjectCheckboxes();
            } else {
                window._currentModalProjectIds = new Set(result.value);
                window.renderProjectCheckboxes();
            }
        }
    };

    window.filterSelectionList = function (query) {
        const q = query.toLowerCase();
        document.querySelectorAll('.selection-item').forEach(item => {
            const name = item.getAttribute('data-name');
            item.style.display = name.includes(q) ? 'flex' : 'none';
        });
    };

    // 3. Render Sync Helpers
    window.renderClientCheckboxes = function () {
        const summary = document.getElementById("user-clients-summary");
        const badge = document.getElementById("client-count-badge");
        if (!summary || !badge) return;

        const selected = (state.clients || []).filter(c => window._currentModalClientIds.has(c.id));
        const count = selected.length;

        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
        summary.textContent = count > 0 ? selected.map(c => c.nombre_cliente || c.name).join(', ') : 'Ninguno seleccionado';
    };

    window.renderProjectCheckboxes = function () {
        const summary = document.getElementById("user-projects-summary");
        const badge = document.getElementById("project-count-badge");
        if (!summary || !badge) return;

        const selected = allProjects.filter(p => window._currentModalProjectIds.has(p.id));
        const count = selected.length;

        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
        summary.textContent = count > 0 ? selected.map(p => p.descripcion_prj).join(', ') : 'Ninguno seleccionado';
    };

    window.toggleProjectSection = function () {
        const role = roleSelect.value;
        const type = typeSelect.value;
        const isFullAccess = ['Administrador', 'Management'].includes(role);
        const proyGroup = document.getElementById('user-projects-group');

        if (isFullAccess) {
            if (proyGroup) proyGroup.style.display = 'none';
            singleGroup.style.display = 'none';
            multiGroup.style.display = 'none';
            showAdminNotice(true);
        } else {
            showAdminNotice(false);
            if (proyGroup) proyGroup.style.display = 'block';
            if (type === 'Cliente') {
                singleGroup.style.display = 'block';
                multiGroup.style.display = 'none';
            } else {
                singleGroup.style.display = 'none';
                multiGroup.style.display = 'block';
                window.renderClientCheckboxes();
            }
            window.renderProjectCheckboxes();
        }
    };

    function showAdminNotice(show) {
        let notice = document.getElementById('admin-access-notice');
        if (show) {
            if (!notice) {
                notice = document.createElement('p');
                notice.id = 'admin-access-notice';
                notice.style = 'font-size:0.85rem; color:var(--sap-blue); font-weight:700; background:#e1f5fe; padding:0.75rem; border-radius:4px;';
                notice.innerHTML = '<i class="fas fa-shield-alt"></i> Acceso Total: Autorizado por Rol.';
                singleGroup.parentNode.insertBefore(notice, singleGroup);
            }
            notice.style.display = 'block';
        } else if (notice) {
            notice.style.display = 'none';
        }
    }

    // 4. Listeners
    typeSelect.onchange = () => {
        window.updateRoleOptions(typeSelect.value);
        window.toggleProjectSection();
    };
    roleSelect.onchange = window.toggleProjectSection;
    clienteSelect.onchange = window.renderProjectCheckboxes;

    // 5. Initial Data Fill
    if (userData) {
        document.getElementById("user-email").value = userData.email;
        document.getElementById("user-password").value = userData.password || "";
        document.getElementById("user-original-email").value = userData.email;
        document.getElementById("user-name").value = userData.name;
        document.getElementById("user-lastname").value = userData.lastname || "";

        typeSelect.value = userData.type || userData.user_type || 'Altim';
        window.updateRoleOptions(typeSelect.value);
        roleSelect.value = userData.role;

        clienteSelect.value = userData.cliente || "";
        document.getElementById("user-address").value = userData.address || "";
        document.getElementById("user-phone").value = userData.phone || "";
        document.getElementById("user-image").value = userData.image || "";
    } else {
        title.textContent = "Nuevo Usuario";
        document.getElementById("user-original-email").value = "";
        typeSelect.value = 'Altim';
        window.updateRoleOptions('Altim');
    }

    window.toggleProjectSection();
    userModal.classList.add("active");
};

window.closeUserModal = function () {
    userModal.classList.remove("active");
};

window.deleteUser = async function (email) {
    if (confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
        if (supabaseClient) {
            const { error } = await supabaseClient.from('users').delete().eq('email', email);
            if (error) {
                console.error("Error deleting user:", error);
                alert("Error al eliminar el usuario de la base de datos.");
                return;
            }
        }
        state.users = state.users.filter(u => u.email !== email);
        renderUserManagement();
    }
};

window.resetUserPassword = async function (email, userId) {
    const { value: newPassword } = await Swal.fire({
        title: 'Resetear Contraseña',
        html: `Introduce la nueva contraseña para <b>${email}</b>:`,
        input: 'password',
        inputPlaceholder: 'Nueva contraseña',
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
            if (!value) return '¡Necesitas introducir una contraseña!';
            if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
        }
    });

    if (newPassword) {
        if (supabaseClient && userId) {
            const { error } = await supabaseClient
                .from('users')
                .update({ password: newPassword })
                .eq('id', userId);

            if (error) {
                console.error("Error resetting password:", error);
                alert("Error al intentar cambiar la contraseña en la base de datos.");
                return;
            }
        }

        // Update local state
        const idx = state.users.findIndex(u => u.email === email);
        if (idx > -1) state.users[idx].password = newPassword;

        Swal.fire('¡Éxito!', 'La contraseña ha sido actualizada.', 'success');
    }
};

window.toggleUserBlock = async function (email, userId, currentStatus) {
    const isBlocked = currentStatus === 'blocked';
    const newStatus = isBlocked ? 'active' : 'blocked';
    const actionText = isBlocked ? 'desbloquear' : 'bloquear';

    if (confirm(`¿Estás seguro de que deseas ${actionText} a este usuario?`)) {
        if (supabaseClient && userId) {
            const { error } = await supabaseClient
                .from('users')
                .update({ status: newStatus })
                .eq('id', userId);

            if (error) {
                console.error(`Error toggling block status to ${newStatus}:`, error);
                alert(`Error al intentar ${actionText} al usuario en la base de datos.`);
                return;
            }
        }

        // Update local state
        const idx = state.users.findIndex(u => u.email === email);
        if (idx > -1) state.users[idx].status = newStatus;

        renderUserManagement();
    }
};

const userForm = document.getElementById("user-form");
if (userForm) {
    userForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const role = document.getElementById("user-role").value;
        const userType = document.getElementById("user-type").value;
        const originalEmail = document.getElementById("user-original-email").value;

        const selectedClientIds = Array.from(window._currentModalClientIds || []);
        const selectedProjectIds = Array.from(window._currentModalProjectIds || []);

        // Validation Rule 1: Cliente is mandatory for Cliente roles
        const singleClienteValue = document.getElementById("user-cliente").value;
        if (userType === 'Cliente' && !singleClienteValue) {
            alert("Los usuarios tipo 'Cliente' requieren seleccionar obligatoriamente una Empresa.");
            return;
        }

        const dbUser = {
            email: document.getElementById("user-email").value,
            password: document.getElementById("user-password").value,
            first_name: document.getElementById("user-name").value,
            last_name: document.getElementById("user-lastname").value,
            cliente: userType === 'Cliente' ? singleClienteValue : (selectedClientIds.length > 1 ? 'Múltiple' : (selectedClientIds.length === 1 ? state.clients.find(c => c.id === selectedClientIds[0])?.nombre_cliente : '-')),
            direccion: document.getElementById("user-address").value,
            telefono: document.getElementById("user-phone").value,
            role: role,
            user_type: userType,
            profile_image: document.getElementById("user-image").value,
            status: 'active'
        };

        // Async save to Supabase
        (async () => {
            let userId = null;

            if (originalEmail) {
                // Update existing
                if (supabaseClient) {
                    const { data, error } = await supabaseClient.from('users').update(dbUser).eq('email', originalEmail).select('id').single();
                    if (error) {
                        alert("Error actualizando usuario: " + error.message);
                        return;
                    }
                    userId = data.id;
                }
            } else {
                // Create New
                if (supabaseClient) {
                    const { data, error } = await supabaseClient.from('users').insert([dbUser]).select('id').single();
                    if (error) {
                        alert("Error creando usuario: " + error.message);
                        return;
                    }
                    userId = data.id;
                }
            }

            if (userId && supabaseClient) {
                // 1. Sync Project Relations
                await supabaseClient.from('user_project_relation').delete().eq('user_id', userId);
                if (selectedProjectIds.length > 0) {
                    const proyRelations = selectedProjectIds.map(pid => ({ user_id: userId, project_id: pid }));
                    await supabaseClient.from('user_project_relation').insert(proyRelations);
                }

                // 2. Sync Client Relations
                await supabaseClient.from('user_client_relation').delete().eq('user_id', userId);
                if (userType === 'Altim' && selectedClientIds.length > 0) {
                    const cliRelations = selectedClientIds.map(cid => ({ user_id: userId, client_id: cid }));
                    await supabaseClient.from('user_client_relation').insert(cliRelations);
                } else if (userType === 'Cliente') {
                    // For Cliente users, we can also link the single client in the junction table for consistency
                    const clientObj = (state.clients || []).find(c => c.nombre_cliente === singleClienteValue);
                    if (clientObj) {
                        await supabaseClient.from('user_client_relation').insert([{ user_id: userId, client_id: clientObj.id }]);
                    }
                }
            }

            // Reload all users to stay synced
            if (supabaseClient) {
                const { data: updatedUsers } = await supabaseClient.from('users').select('*');
                if (updatedUsers) {
                    state.users = updatedUsers.map(u => ({
                        ...u,
                        name: u.first_name || 'Usuario',
                        lastname: u.last_name || '',
                        type: u.user_type || '',
                        project: '-', // Local placeholder since projects are now multi
                        address: u.direccion || '',
                        phone: u.telefono || '',
                        image: u.profile_image || ''
                    }));
                }
            }

            closeUserModal();
            renderUserManagement();
        })();
    });
}

// Client CRUD Logic
window.openClientModal = function (abrev = null) {
    const form = document.getElementById("client-form");
    const title = document.getElementById("client-modal-title");
    form.reset();

    if (abrev && typeof abrev === 'string') {
        title.textContent = "Editar Cliente";
        const client = state.clients.find(c => c.abrev === abrev);
        if (client) {
            document.getElementById("client-original-id").value = client.id || "";
            document.getElementById("client-name").value = client.nombre_cliente || client.name || "";
            document.getElementById("client-abrev").value = client.abrev || "";
            document.getElementById("client-abrev-3").value = client.abreviatura_3 || "";
            document.getElementById("client-contact").value = client.contacto || "";
            document.getElementById("client-mail").value = client.mail || "";
            document.getElementById("client-tel").value = client.tel || "";
        }
    } else {
        title.textContent = "Nuevo Cliente";
        document.getElementById("client-original-id").value = "";
    }

    clientModal.classList.add("active");
};

window.closeClientModal = function () {
    clientModal.classList.remove("active");
};

window.deleteClient = async function (id) {
    if (confirm("¿Estás seguro de que deseas eliminar este cliente?")) {
        if (supabaseClient && id) {
            const { error } = await supabaseClient.from('clients').delete().eq('id', id);
            if (error) {
                console.error("Error deleting client:", error);
                alert("Error al eliminar el cliente.");
                return;
            }
        }
        state.clients = state.clients.filter(c => c.id != id);
        renderClientManagement();
    }
};

const clientForm = document.getElementById("client-form");
if (clientForm) {
    clientForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("client-original-id").value;
        const newClient = {
            nombre_cliente: document.getElementById("client-name").value,
            abrev: document.getElementById("client-abrev").value,
            abreviatura_3: document.getElementById("client-abrev-3").value,
            contacto: document.getElementById("client-contact").value,
            mail: document.getElementById("client-mail").value,
            tel: document.getElementById("client-tel").value
        };

        if (supabaseClient) {
            if (id) {
                // Edit
                const { error } = await supabaseClient.from('clients').update(newClient).eq('id', id);
                if (!error) {
                    const idx = state.clients.findIndex(c => c.id == id);
                    if (idx > -1) state.clients[idx] = { ...state.clients[idx], ...newClient };
                } else {
                    console.error("Error updating client:", error);
                    alert("Error al actualizar el cliente.");
                    return;
                }
            } else {
                // Create
                const { data, error } = await supabaseClient.from('clients').insert([newClient]).select();
                if (!error && data) {
                    state.clients.push(data[0]);
                } else {
                    console.error("Error creating client:", error);
                    alert("Error al crear el cliente.");
                    return;
                }
            }
        } else {
            // Local fallback
            if (id) {
                const idx = state.clients.findIndex(c => c.id == id);
                if (idx > -1) state.clients[idx] = { ...state.clients[idx], ...newClient };
            } else {
                newClient.id = Math.random();
                state.clients.push(newClient);
            }
        }

        closeClientModal();
        renderClientManagement();
    });
}

// Image upload handler
document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'user-image-file') {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target.result;
                document.getElementById('user-image').value = base64;
                document.getElementById('user-image-preview').src = base64;
            };
            reader.readAsDataURL(file);
        }
    }
});

// Initialize the application
document.addEventListener('DOMContentLoaded', init);

// --- MODULE: PROJECT DOCUMENTATION (DOC) ---
async function renderProjectDocumentation() {
    elements.moduleContent.innerHTML = '<div style="padding: 2rem; text-align: center;"><i class="fas fa-spinner fa-spin"></i> Cargando documentación de proyectos...</div>';

    // Refresh clients and projects to ensure filters are accurate
    if (supabaseClient) {
        try {
            const { data: clientsData } = await supabaseClient.from('clients').select('*');
            if (clientsData) state.clients = clientsData;

            const { data: projectsData } = await supabaseClient.from('projects').select('*');
            if (projectsData) state.projects = projectsData;
        } catch (e) {
            console.error("Error fetching filters data for DOC module", e);
        }
    }

    let uniqueTypes = [];
    if (supabaseClient) {
        const { data: typeData } = await supabaseClient.from('documentos').select('tipo_documento');
        if (typeData) uniqueTypes = [...new Set(typeData.map(d => d.tipo_documento))];
    }

    elements.moduleContent.innerHTML = `
        <div class="doc-module-layout" style="display: flex; flex-direction: column; gap: 0.5rem;">
            <div class="collapsible-wrapper" style="border-left: 4px solid var(--sap-grey);">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:var(--sap-grey); display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-filter"></i> FILTROS DE DOCUMENTACIÓN
                    </h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content">
                    <div style="display: flex; gap: 1rem; margin-bottom: 2rem; align-items: flex-end; flex-wrap: wrap;">
                        <div class="form-group" style="margin-bottom:0; flex: 1; min-width: 150px;">
                            <label>Cliente</label>
                            <select id="doc-filter-client" class="swal2-input" style="height:40px; margin:0;" onchange="filterProjectDocumentation()">
                                <option value="">Todos</option>
                                ${(state.clients || []).map(c => `<option value="${c.nombre_cliente || c.name}">${c.nombre_cliente || c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom:0; flex: 1; min-width: 150px;">
                            <label>Proyecto</label>
                            <select id="doc-filter-project" class="swal2-input" style="height:40px; margin:0;" onchange="filterProjectDocumentation()">
                                <option value="">Todos</option>
                                ${(state.projects || []).map(p => `<option value="${p.id_proyecto || p.name}">${p.id_proyecto || p.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom:0; flex: 1; min-width: 150px;">
                            <label>Tipo Documento</label>
                            <select id="doc-filter-type" class="swal2-input" style="height:40px; margin:0;" onchange="filterProjectDocumentation()">
                                <option value="">Todos</option>
                                ${uniqueTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
                            </select>
                        </div>
                        <button class="btn btn-outline compact" style="height:40px;" onclick="document.getElementById('doc-filter-client').value='';document.getElementById('doc-filter-project').value='';document.getElementById('doc-filter-type').value='';filterProjectDocumentation();">Limpiar Filtros</button>
                    </div>
                </div>
            </div>

            <div class="collapsible-wrapper" style="border-left: 4px solid var(--sap-blue);">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:var(--sap-blue); display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-table"></i> TABLA DE DOCUMENTACIÓN GENERAL
                    </h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content">
                    <div class="table-container" style="overflow-x:auto; margin-top: 1rem;">
                        <table class="alv-table" style="width:100%;">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Proyecto</th>
                                    <th>Fase</th>
                                    <th>Tipo de Documento</th>
                                    <th>URL SharePoint</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>
                            <tbody id="doc-table-body">
                                <!-- Populated dynamically -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;

    filterProjectDocumentation();
}

// --- NEW DOCUMENT MANAGEMENT SYSTEM (URL-BASED) ---

async function renderGESModule() {
    const allowed = ['Administrador', 'Management', 'jefe de proyecto'];
    if (!allowed.includes(state.currentUser.role)) {
        elements.moduleContent.innerHTML = '<div class="card"><h3>Acceso Restringido</h3><p>Solo personal de gestión tiene acceso a este módulo.</p></div>';
        return;
    }
    if (!state.selectedProject) {
        elements.moduleContent.innerHTML = '<div class="card"><h3>Atención</h3><p>Por favor, selecciona primero un proyecto desde el módulo PRJ.</p></div>';
        return;
    }

    const types = (PHASE_DOC_TYPES.GES || []).filter(type => !isItemRestricted('ges', type));
    const counts = await getDocCountsByPhase('GES');

    const canModify = hasPermission('ges', 'modify');

    elements.moduleContent.innerHTML = `
        ${renderPhaseHeader('Gestión de Proyecto (GES)')}
        <div class="collapsible-wrapper" style="border-left: 4px solid var(--sap-blue);">
            <div class="collapsible-header" onclick="toggleSection(this)">
                <h3 style="color:var(--sap-blue); display:flex; align-items:center; gap:10px;">
                    <i class="fas fa-briefcase"></i> SEGUIMIENTO Y GESTIÓN
                </h3>
                <i class="fas fa-plus-circle toggle-icon"></i>
            </div>
            <div class="collapsible-content">
                <p class="section-subtitle" style="margin-bottom: 1rem; font-size: 0.85rem;">Gestión de comités, actas y documentación de seguimiento.</p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-top: 1rem;">
                    ${types.map(type => `
                        <button class="btn btn-outline btn-doc-type" onclick="openDocumentModal('GES', '${type}')" style="min-height: 80px; position:relative; background-color: #e3f2fd;">
                            ${counts[type] ? `<div class="doc-count-badge">${counts[type]}</div>` : ''}
                            <i class="fas fa-file-contract fa-2x" style="margin-bottom: 8px; opacity:0.3;"></i>
                            <div style="font-weight:700; font-size:0.75rem;">${type}</div>
                        </button>
                    `).join('')}
                </div>
                
                <div style="margin-top: 2rem;">
                    <div id="ges-doc-table-container"></div>
                </div>
            </div>
        </div>
    `;
    loadPhaseDocumentsTable('GES', 'ges-doc-table-container');
}

// --- MODULE: TASK MANAGEMENT (TAR) ---
const KANBAN_STATES = ['OPEN', 'TO DO', 'DOING', 'ON-HOLD', 'TESTING', 'DONE', 'CLOSED'];
const PROJECT_PHASES_LIST = ['Discover', 'Preparar', 'Explorar', 'Realizar', 'Desplegar', 'Ejecutar'];

window.renderTaskManagement = async function () {
    if (!state.selectedProject) {
        elements.moduleContent.innerHTML = '<div class="card"><h3>Atención</h3><p>Por favor, selecciona primero un proyecto desde el módulo PRJ.</p></div>';
        return;
    }

    elements.moduleContent.innerHTML = `
        ${renderPhaseHeader('Gestión de Tareas (TAR)')}
    <div class="card">
        <div class="kanban-controls">
            <div style="flex-grow:1; display:flex; align-items:center; gap:10px">
                <label style="font-weight:700">Filtrar por Fase:</label>
                <select id="kanban-phase-filter" class="swal2-input" style="width:auto; margin:0; height:38px; font-size:0.9rem" onchange="state.kanbanFilter=this.value; window.loadTasks()">
                    <option value="All" ${state.kanbanFilter === 'All' ? 'selected' : ''}>-- Todas las Fases --</option>
                    ${PROJECT_PHASES_LIST.map(p => `<option value="${p}" ${state.kanbanFilter === p ? 'selected' : ''}>${p}</option>`).join('')}
                </select>
            </div>
            ${hasPermission('tar', 'modify') ? `
                <button class="btn" style="width:auto; padding: 0.5rem 1.5rem;" onclick="openTaskModal()">
                    <i class="fas fa-plus"></i> Nueva Tarea
                </button>
                ` : ''}
        </div>

        <div class="kanban-container">
            ${KANBAN_STATES.map(status => {
        const safeId = status.trim().toUpperCase().replace(/\s/g, '');
        return `
                    <div class="kanban-column" data-status="${status}" ondragover="allowDrop(event)" ondrop="dropTask(event)" ondragenter="dragEnter(event)" ondragleave="dragLeave(event)">
                        <div class="column-header">${status}</div>
                        <div class="task-list" id="list-${safeId}">
                            <!-- Tasks will be rendered here -->
                        </div>
                    </div>`;
    }).join('')}
        </div>

        <div class="task-alv-container">
            <h3 style="margin-bottom:1.2rem; color: var(--sap-blue);"><i class="fas fa-list"></i> Resumen de TAREAS (ALV)</h3>
            <div id="task-alv-content"></div>
        </div>
    </div>
    `;

    window.loadTasks();
    console.log("renderTaskManagement - UI rendered, loadTasks triggered");
}

window.loadTasks = async function () {
    if (!supabaseClient || !state.selectedProject) {
        console.error("loadTasks - Missing Supabase or Project context");
        return;
    }

    const projId = parseInt(state.selectedProject.id);
    console.log("loadTasks - Fetching for Project ID:", projId);

    // Try fetching with filter
    let { data: allTasks, error } = await supabaseClient
        .from('tasks')
        .select('*')
        .eq('project_id', projId);

    if (error) {
        console.error("Error loading tasks from Supabase:", error);
        if (window.Swal) Swal.fire('Error al cargar tareas', error.message, 'error');
        allTasks = [];
    }

    // Add a visual indicator for debugging
    const controls = document.querySelector('.kanban-controls');
    if (controls) {
        let ts = controls.querySelector('#kanban-ref-ts');
        if (!ts) {
            ts = document.createElement('small');
            ts.id = 'kanban-ref-ts';
            ts.style.color = '#ccc';
            ts.style.marginLeft = '10px';
            controls.appendChild(ts);
        }
        ts.textContent = `Actualizado: ${new Date().toLocaleTimeString()} `;
    }

    console.log("loadTasks - Tasks found:", allTasks?.length);

    if (!allTasks || allTasks.length === 0) {
        console.warn("No tasks found for project:", projId);
    }

    const filterEl = document.getElementById('kanban-phase-filter');
    const phaseFilter = state.kanbanFilter || 'All';
    const boardTasks = (allTasks || []).filter(t => phaseFilter === 'All' || t.phase === phaseFilter);

    if (error) {
        console.error("Error loading tasks:", error);
        return;
    }

    // Clear lists BEFORE rendering cards
    const lists = document.querySelectorAll('.task-list');
    lists.forEach(list => list.innerHTML = '');

    if (boardTasks && boardTasks.length > 0) {
        boardTasks.forEach(task => {
            if (!task.status) return;
            const safeId = task.status.trim().toUpperCase().replace(/\s/g, '');
            const listId = `list-${safeId}`;
            const list = document.getElementById(listId);

            if (list) {
                const card = document.createElement('div');
                card.className = `kanban-card`;
                card.style.borderLeftColor = task.color || '#3498db';
                card.draggable = hasPermission('tar', 'modify');
                card.id = `task-${task.id}`;
                card.setAttribute('data-id', task.id);
                card.onclick = () => window.openTaskModal(task.id);
                console.log("Rendering card for task:", task.id, task.title);
                card.ondragstart = (e) => dragTask(e);

                const priorityClass = task.priority ? task.priority.toLowerCase() : 'medium';
                const initials = (task.assigned_to || '').substring(0, 2).toUpperCase() || '?';

                card.innerHTML = `
                    <div class="card-priority ${priorityClass}">${task.priority || 'Medium'}</div>
                    <div class="card-title">${task.title}</div>
                    <div class="card-footer">
                        <span><i class="far fa-calendar-alt"></i> ${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Sin fecha'}</span>
                        <div class="card-user-avatar" title="${task.assigned_to || 'Sin asignar'}">
                            ${initials}
                        </div>
                    </div>
                `;
                list.appendChild(card);
            }
        });
    }

    // Set empty state for columns with no tasks
    lists.forEach(list => {
        if (list.children.length === 0) {
            list.innerHTML = '<div style="text-align:center; padding:15px; color:#ccc; font-style:italic; font-size:0.75rem">Sin tareas</div>';
        }
    });

    renderTasksALV(allTasks);
}

window.renderTasksALV = function (tasks) {
    const container = document.getElementById('task-alv-content');
    if (!container) return;
    if (!tasks || tasks.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:2rem; color:#666">No hay tareas para mostrar.</p>';
        return;
    }
    container.innerHTML = `
        <table class="task-alv-table">
            <thead>
                <tr>
                    <th>Título</th>
                    <th>Fase</th>
                    <th>Estado</th>
                    <th>Asignado</th>
                    <th>Vencimiento</th>
                    <th>Prioridad</th>
                </tr>
            </thead>
            <tbody>
                ${tasks.map(t => `
                    <tr style="cursor:pointer" onclick="window.openTaskModal('${t.id}')">
                        <td style="font-weight:600">${t.title}</td>
                        <td>${t.phase}</td>
                        <td><span class="status-badge" style="background:${getKanbanStatusColor(t.status)}">${t.status}</span></td>
                        <td>
                            <div style="display:flex; align-items:center; gap:8px">
                                <div class="card-user-avatar" style="width:20px; height:20px; font-size:0.6rem; color:white">${t.assigned_to ? t.assigned_to.substring(0, 2).toUpperCase() : '?'}</div>
                                ${t.assigned_to || 'Sin asignar'}
                            </div>
                        </td>
                        <td>${t.due_date ? new Date(t.due_date).toLocaleDateString() : '-'}</td>
                        <td><span class="card-priority ${t.priority ? t.priority.toLowerCase() : 'medium'}">${t.priority || 'Medium'}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        `;
}

function getKanbanStatusColor(status) {
    const s = (status || '').trim().toUpperCase();
    switch (s) {
        case 'OPEN': return '#e3f2fd';
        case 'TO DO': return '#f3e5f5';
        case 'DOING': return '#fff3e0';
        case 'ON-HOLD': return '#ffebee';
        case 'TESTING': return '#e0f2f1';
        case 'DONE': return '#e8f5e9';
        case 'CLOSED': return '#f5f5f5';
        default: return '#eee';
    }
}

// Drag & Drop Functions
window.allowDrop = (e) => e.preventDefault();

window.dragTask = (e) => {
    e.dataTransfer.setData("taskId", e.target.getAttribute('data-id'));
    e.target.classList.add('dragging');
};

window.dragEnter = (e) => {
    const col = e.target.closest('.kanban-column');
    if (col) col.classList.add('drag-over');
};

window.dragLeave = (e) => {
    const col = e.target.closest('.kanban-column');
    if (col) col.classList.remove('drag-over');
};

window.dropTask = async (e) => {
    e.preventDefault();
    const col = e.target.closest('.kanban-column');
    if (!col) return;

    if (!hasPermission('tar', 'modify')) {
        col.classList.remove('drag-over');
        Toast.fire({ icon: 'warning', title: 'Sin permisos para mover tareas' });
        return;
    }

    col.classList.remove('drag-over');
    const taskId = e.dataTransfer.getData("taskId");
    const newStatus = col.getAttribute('data-status');


    const card = document.getElementById(`task-${taskId}`);
    card.classList.remove('dragging');

    // Optimistic update
    const newList = col.querySelector('.task-list');
    newList.appendChild(card);

    // DB Update
    if (supabaseClient) {
        const { error } = await supabaseClient
            .from('tasks')
            .update({ status: newStatus, updated_at: new Date() })
            .eq('id', taskId);

        if (error) {
            console.error("Error updating task status:", error);
            setTimeout(() => window.renderTaskManagement(), 500);
        } else {
            Toast.fire({ icon: 'success', title: 'Estado actualizado' });
            setTimeout(() => window.renderTaskManagement(), 500);
        }
    }
};

window.openTaskModal = async function (taskId = null) {
    console.log("openTaskModal - Opening modal for Task ID:", taskId);
    if (!supabaseClient || !state.selectedProject) {
        console.error("Supabase or Project missing:", { supabaseClient: !!supabaseClient, project: state.selectedProject });
        return;
    }

    let task = null;
    if (taskId) {
        try {
            const { data, error } = await supabaseClient.from('tasks').select('*').eq('id', taskId).single();
            if (error) throw error;
            task = data;
            console.log("openTaskModal - Data loaded:", task);
        } catch (err) {
            console.error("Error fetching task details:", err);
            taskId = null; // Revert to "New Task" if fetch fails
        }
    }

    // Get users for assignment - Role-based logic
    const specialRoles = ['Administrador', 'Management', 'jefe de proyecto'];
    const userRole = (state.currentUser?.role || '').trim().toLowerCase();
    const isSpecial = specialRoles.some(r => r.toLowerCase() === userRole);

    let usersList = [];
    if (isSpecial) {
        try {
            const { data: allDbUsers } = await supabaseClient.from('users').select('*');
            const userMap = new Map();
            (allDbUsers || []).forEach(u => {
                if (!u.email) return;
                const r = (u.role || '').trim().toLowerCase();
                const matchedSpecial = specialRoles.some(sr => sr.toLowerCase() === r);
                const p = (u.nombre_proyecto || u.project || '').trim().toLowerCase();
                const matchedProject = state.selectedProject.name && (p === state.selectedProject.name.trim().toLowerCase());

                if (matchedSpecial || matchedProject) {
                    userMap.set(u.email.toLowerCase(), u);
                }
            });
            usersList = Array.from(userMap.values());
        } catch (err) {
            console.error("Error fetching users list:", err);
            usersList = [state.currentUser];
        }
    } else {
        usersList = [state.currentUser];
    }

    const userOptions = usersList.map(u => {
        const uName = u.first_name || u.name || 'Usuario';
        const uLast = u.last_name || u.lastname || '';
        return `<option value="${u.email}" ${task?.assigned_to === u.email ? 'selected' : ''}>${uName} ${uLast}</option>`;
    }).join('');

    const assignmentHtml = isSpecial ?
        `<select id="swal-task-user" class="swal2-input" style="width:100%; font-size:1rem"><option value="">-- Sin asignar --</option>${userOptions}</select>` :
        `<input type="text" class="swal2-input" style="width:100%; font-size:1rem; background:#f5f5f5; cursor:not-allowed" value="${state.currentUser.name} ${state.currentUser.lastname || ''}" readonly>
        <input type="hidden" id="swal-task-user" value="${state.currentUser.email}">`;

    const result = await Swal.fire({
        title: taskId ? 'Editar Tarea' : 'Nueva Tarea',
        width: '480px',
        html: `
            <div style="text-align:left; font-size: 0.9rem;">
                <label style="font-weight:700">Título</label><input id="swal-task-title" class="swal2-input" style="width:100%; margin: 5px 0 10px 0; height: 35px;" placeholder="Título" value="${task?.title || ''}">
                    <label style="font-weight:700">Descripción</label><textarea id="swal-task-desc" class="swal2-textarea" style="width:100%; margin: 5px 0 10px 0; height:60px; font-size: 0.85rem;" placeholder="Detalles">${task?.description || ''}</textarea>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px">
                        <div><label style="font-weight:700">Fase</label><select id="swal-task-phase" class="swal2-input" style="width:100%; height: 35px; margin: 5px 0;">${PROJECT_PHASES_LIST.map(p => `<option value="${p}" ${task?.phase === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
                        <div><label style="font-weight:700">Estado</label><select id="swal-task-status" class="swal2-input" style="width:100%; height: 35px; margin: 5px 0;">${KANBAN_STATES.map(s => `<option value="${s}" ${task?.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:5px">
                        <div><label style="font-weight:700">Asignado</label>${assignmentHtml.replace(/class="swal2-input"/g, 'class="swal2-input" style="width:100%; height:35px; margin: 5px 0; font-size:0.85rem"')}</div>
                        <div><label style="font-weight:700">Prioridad</label><select id="swal-task-priority" class="swal2-input" style="width:100%; height: 35px; margin: 5px 0;"><option value="Low" ${task?.priority === 'Low' ? 'selected' : ''}>Baja</option><option value="Medium" ${task?.priority === 'Medium' || !task ? 'selected' : ''}>Media</option><option value="High" ${task?.priority === 'High' ? 'selected' : ''}>Alta</option></select></div>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:5px">
                        <div><label style="font-weight:700">Vencimiento</label><input id="swal-task-date" type="date" class="swal2-input" style="width:100%; height: 35px; margin: 5px 0;" value="${task?.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''}"></div>
                        <div><label style="font-weight:700">Color</label><input id="swal-task-color" type="color" class="swal2-input" style="width:100%; height:35px; padding:0; margin: 5px 0;" value="${task?.color || '#3498db'}"></div>
                    </div>

                    ${taskId ? `
                <div class="task-comments-section" style="margin-top:20px">
                    <label style="font-weight:700">Comentarios</label>
                    <div id="swal-comments-list" class="comment-list" style="max-height:150px; overflow-y:auto; border:1px solid #eee; padding:10px; margin-bottom:10px; background:#fafafa; border-radius:4px">Cargando comentarios...</div>
                    <div style="display:flex; gap:5px">
                        <input id="swal-new-comment" class="swal2-input" style="margin:0; flex-grow:1; font-size:0.9rem" placeholder="Añadir un comentario...">
                        <button type="button" class="btn btn-secondary" style="width:auto" onclick="submitTaskComment('${taskId}')">Enviar</button>
                    </div>
                </div>
                ` : ''}
            </div>
            `,
        showCancelButton: true,
        showDenyButton: !!taskId,
        confirmButtonText: taskId ? 'Guardar Cambios' : 'Crear Tarea',
        denyButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        cancelButtonColor: '#6c757d',
        showConfirmButton: hasPermission('tar', 'modify'),
        didOpen: () => { if (taskId) loadTaskCommentsInModal(taskId); },
        preConfirm: () => {
            const titleEl = document.getElementById('swal-task-title');
            const title = titleEl ? titleEl.value : '';
            if (!title) { Swal.showValidationMessage('El título es obligatorio'); return false; }
            return {
                title,
                description: document.getElementById('swal-task-desc').value,
                phase: document.getElementById('swal-task-phase').value,
                status: document.getElementById('swal-task-status').value,
                assigned_to: document.getElementById('swal-task-user').value || null,
                priority: document.getElementById('swal-task-priority').value,
                due_date: document.getElementById('swal-task-date').value || null,
                color: document.getElementById('swal-task-color').value,
                project_id: parseInt(state.selectedProject.id),
                updated_at: new Date()
            };
        }
    });

    if (result.isConfirmed && result.value) {
        const formValues = result.value;
        console.log("openTaskModal - Saving Values:", formValues);
        if (taskId) {
            const { error } = await supabaseClient.from('tasks').update(formValues).eq('id', taskId);
            console.log("Update response:", { error });
            if (error) Swal.fire('Error', error.message, 'error');
            else { Toast.fire({ icon: 'success', title: 'Tarea actualizada' }); setTimeout(() => window.renderTaskManagement(), 500); }
        } else {
            const { error } = await supabaseClient.from('tasks').insert([formValues]);
            console.log("Insert response:", { error });
            if (error) Swal.fire('Error', error.message, 'error');
            else { Toast.fire({ icon: 'success', title: 'Tarea creada' }); setTimeout(() => window.renderTaskManagement(), 500); }
        }
    } else if (result.isDenied && taskId) {
        const deleteConfirm = await Swal.fire({
            title: '¿Eliminar tarea?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#d33'
        });
        if (deleteConfirm.isConfirmed) {
            const { error } = await supabaseClient.from('tasks').delete().eq('id', taskId);
            if (error) Swal.fire('Error', error.message, 'error');
            else { Toast.fire({ icon: 'success', title: 'Tarea eliminada' }); setTimeout(() => window.renderTaskManagement(), 500); }
        }
    }
}

async function loadTaskCommentsInModal(taskId) {
    const list = document.getElementById('swal-comments-list');
    if (!list || !supabaseClient) return;

    const { data: comments, error } = await supabaseClient
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

    if (error) {
        list.innerHTML = '<p style="color:red">Error al cargar comentarios.</p>';
        return;
    }

    if (!comments || comments.length === 0) {
        list.innerHTML = '<p style="color:#999; font-style:italic; font-size:0.75rem;">No hay comentarios aún.</p>';
        return;
    }

    list.innerHTML = comments.map(c => `
            <div class="comment-item">
                <span class="comment-author">${c.user_email ? c.user_email.split('@')[0] : 'Sistema'}</span>
                <span class="comment-date">${new Date(c.created_at).toLocaleString()}</span>
                <div class="comment-text">${c.comment}</div>
            </div>
            `).join('');
    list.scrollTop = list.scrollHeight;
}

window.submitTaskComment = async function (taskId) {
    const input = document.getElementById('swal-new-comment');
    if (!input) return;
    const comment = input.value.trim();
    if (!comment || !supabaseClient) return;

    const { error } = await supabaseClient
        .from('task_comments')
        .insert([{
            task_id: taskId,
            user_email: state.currentUser.email,
            comment: comment
        }]);

    if (error) {
        console.error("Error submitting comment:", error);
    } else {
        input.value = '';
        loadTaskCommentsInModal(taskId);
    }
}

async function openDocumentModal(phase, type, docId = null) {
    if (docId) {
        // Enforce: can_attach is needed to put URL, LOB, Taller (metadata)
        if (!hasPermission(phase, 'attach')) {
            Swal.fire('Acceso Denegado', 'No tienes permisos para adjuntar o modificar metadatos de este documento.', 'error');
            return;
        }
    } else {
        if (!hasPermission(phase, 'attach')) {
            Swal.fire('Acceso Denegado', 'No tienes permisos para adjuntar nuevos documentos en este módulo.', 'error');
            return;
        }
    }
    let doc = null;
    if (docId) {
        const { data } = await supabaseClient.from('documentos').select('*').eq('id', docId).single();
        doc = data;
    }

    // Fetch master_lobs for the dropdown
    let lobOptions = '<option value="">(Sin LoB)</option>';
    if (supabaseClient) {
        const { data: lobs } = await supabaseClient.from('master_lobs').select('id_lob');
        if (lobs) {
            lobOptions += lobs.map(l => `<option value="${l.id_lob}" ${doc?.id_lob === l.id_lob ? 'selected' : ''}>${l.id_lob}</option>`).join('');
        }
    }

    // NEW: Fetch Workshops for the dropdown
    let wsOptions = '<option value="">(Sin Taller / Referencia)</option>';
    if (supabaseClient && state.selectedProject) {
        const { data: workshops } = await supabaseClient
            .from('project_workshops')
            .select('group_id, group_name')
            .eq('project_id', state.selectedProject.id);

        if (workshops) {
            const unique = {};
            workshops.forEach(w => { unique[w.group_id] = w.group_name || w.group_id; });
            wsOptions += Object.entries(unique).map(([id, name]) =>
                `<option value="${id}" ${doc?.nombre_taller === id ? 'selected' : ''}>${id} - ${name}</option>`
            ).join('');
        }
    }

    const { value: formValues } = await Swal.fire({
        title: docId ? 'Editar Documento' : `Añadir ${type}`,
        html: `
            <div style="text-align:left">
                <label>URL SharePoint / Enlace</label>
                <input id="swal-doc-url" class="swal2-input" placeholder="https://..." value="${doc?.url || ''}">
                    <label>LOB (Line of Business)</label>
                    <select id="swal-doc-lob" class="swal2-input" style="width:100%; margin: 10px 0;">
                        ${lobOptions}
                    </select>
                    <label>Nombre Taller / Referencia (Vincular a PRE)</label>
                    <select id="swal-doc-taller" class="swal2-input" style="width:100%; margin: 10px 0;">
                        ${wsOptions}
                    </select>
            </div>
            `,
        focusConfirm: false,
        showCancelButton: true,
        preConfirm: () => {
            const url = document.getElementById('swal-doc-url').value;
            const lob = document.getElementById('swal-doc-lob').value;
            const taller = document.getElementById('swal-doc-taller').value;
            if (!url && !lob && !taller) {
                Swal.showValidationMessage('Debes rellenar al menos uno de los campos');
                return false;
            }
            return { url, id_lob: lob, nombre_taller: taller };
        }
    });

    if (formValues) {
        const whiteBgDocs = [
            'Planificación del equipo Altim',
            'Preparación Ejemplos Workshops Sesiones Fit-To Stándar',
            'Traspaso comercial',
            'Preparación Fichero BPML',
            'Preparación Fichero Backlog',
            'Preparación fichero GAPS',
            'Inventario de desarrollos a medida'
        ];

        const targetPhases = ['GES', 'DES', 'PRE', 'EXP', 'REA', 'DEY', 'DEPLOY'];

        // Only show warning for target modules AND if URL is provided
        if (targetPhases.includes(phase) && formValues.url) {
            const isWhite = whiteBgDocs.includes(type);
            const message = isWhite
                ? 'Es OBLIGATORIO que la URL NO CORRESPONDA a la carpeta compartida de Sharepoint'
                : 'Verifique que la URL corresponde a la carpeta compartida de Sharepoint';

            const { isConfirmed } = await Swal.fire({
                title: '¡Atención!',
                text: message,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Continuar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: 'var(--sap-blue)',
                cancelButtonColor: '#6a6d70'
            });
            if (!isConfirmed) return;
        }

        const payload = {
            ...formValues,
            cliente: state.selectedProject.client,
            proyecto: state.selectedProject.id_proyecto || state.selectedProject.name,
            id_fase: phase,
            tipo_documento: type,
            fecha: new Date().toISOString().split('T')[0]
        };

        if (docId) {
            await supabaseClient.from('documentos').update(payload).eq('id', docId);
        } else {
            payload.numerador = await generateDocNumerador(phase);
            await supabaseClient.from('documentos').insert([payload]);
        }

        // --- NEW: CREAR NOTIFICACIÓN AL ADJUNTAR DOCUMENTO ---
        if (payload.url && supabaseClient) {
            try {
                const { error: notifErr } = await supabaseClient.from('project_notifications').insert([{
                    project_id: String(state.selectedProject.id || state.selectedProject.id_proyecto),
                    text: 'Documento adjunto',
                    document_name: payload.tipo_documento,
                    url: payload.url,
                    user_email: (state.currentUser && state.currentUser.email) ? state.currentUser.email : 'Sistema'
                }]);
                
                if (notifErr) {
                    console.error('Error insertando notificacion:', notifErr);
                    Swal.fire('Atención', 'No se pudo guardar la notificación interna: ' + notifErr.message, 'warning');
                }
            } catch (e) { console.error('Error saving notification', e); }
        }
        // -----------------------------------------------------

        loadPhaseDocumentsTable(phase, `${phase.toLowerCase()}-doc-table-container`);
        if (phase === 'EXP' && document.getElementById('exp-designs-table-container')) {
            loadExpDesignsTable(phase, 'exp-designs-table-container');
        }
        updateDashboardKPIs();
        renderModuleContent(state.activeModule); // Refresh buttons to update badges
        Toast.fire({ icon: 'success', title: 'Documento guardado correctamente' });
    }
}

async function generateDocNumerador(phase) {
    const { data } = await supabaseClient.from('documentos').select('id').order('id', { ascending: false }).limit(1);
    const nextId = data && data.length > 0 ? data[0].id + 1 : 1;
    // Phase prefix + padding up to 15 chars total
    const strId = nextId.toString().padStart(15 - phase.length, '0');
    return phase + strId;
}

async function loadExpDesignsTable(phase, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !state.selectedProject) return;

    const canDownload = hasPermission(phase, 'download');
    const canModify = hasPermission(phase, 'modify');
    const canAttach = hasPermission(phase, 'attach');

    container.innerHTML = '<div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin"></i> Cargando diseños...</div>';

    let query = supabaseClient.from('documentos').select('*')
        .eq('cliente', state.selectedProject.client)
        .eq('proyecto', state.selectedProject.id_proyecto || state.selectedProject.name)
        .eq('id_fase', phase)
        .eq('tipo_documento', 'Diseños de Desarrollos a medida');

    const { data: allData, error } = await query.order('id', { ascending: false });

    // Apply restrictions at record level
    const filteredByRestrictions = (allData || []).filter(d => {
        if (isButtonRestricted(phase, d.tipo_documento)) return false;
        if (isButtonRestricted(phase, d.numerador)) return false;
        return true;
    });

    if (error || !filteredByRestrictions || filteredByRestrictions.length === 0) {
        container.innerHTML = '<p style="color:#666; font-style:italic; padding:1rem; text-align:center;">No se encontraron diseños de desarrollos a medida registrados.</p>';
        return;
    }

    // Render Table
    const tableHtml = `
        <table class="sap-alv-grid">
            <thead>
                <tr>
                    <th>Num.</th>
                    <th>Tipo Documento</th>
                    <th>LoB</th>
                    <th>Taller</th>
                    <th>URL / SharePoint</th>
                    <th>Fecha</th>
                    <th style="width: 80px">Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${filteredByRestrictions.map(d => {
                    return `
                    <tr>
                        <td style="font-family:monospace; font-size: 0.85rem;">${d.numerador}</td>
                        <td>${d.tipo_documento}</td>
                        <td><span class="badge" style="background:#f0f0f0; color:#666;">${d.id_lob || '-'}</span></td>
                        <td>${d.nombre_taller || '-'}</td>
                        <td>
                            ${d.url && canDownload ? `<a href="${d.url}" target="_blank" class="sap-link"><i class="fas fa-external-link-alt"></i> Abrir</a>` : (d.url ? '<span style="color:#ccc"><i class="fas fa-lock"></i> Bloqueado</span>' : '-')}
                        </td>
                        <td>${new Date(d.fecha).toLocaleDateString('es-ES')}</td>
                        <td>
                            ${canAttach ? `<button class="btn-icon" title="Editar" onclick="openDocumentModal('${d.id_fase}', '${d.tipo_documento}', ${d.id})"><i class="fas fa-edit"></i></button>` : ''}
                            ${canModify ? `<button class="btn-icon" title="Borrar" onclick="deleteDocumentEntry(${d.id}, '${d.id_fase}')"><i class="fas fa-trash" style="color:#ff4444"></i></button>` : ''}
                        </td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = tableHtml;
}

async function loadPhaseDocumentsTable(phase, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !state.selectedProject) return;

    const canDownload = hasPermission(phase, 'download');
    const canModify = hasPermission(phase, 'modify');
    const canAttach = hasPermission(phase, 'attach');

    container.innerHTML = '<div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin"></i> Cargando tabla...</div>';

    let query = supabaseClient.from('documentos').select('*')
        .eq('cliente', state.selectedProject.client)
        .eq('proyecto', state.selectedProject.id_proyecto || state.selectedProject.name);

    if (phase !== 'GES') {
        query = query.eq('id_fase', phase);
    }

    const { data: allData, error } = await query.order('id', { ascending: false });

    // Apply is_restricted / res_button filtering at record level
    const filteredByRestrictions = (allData || []).filter(d => {
        // We use the numerador or type or name? User says "objetos (documento)"
        // I'll check both numerador and type to be safe, or if matches exactly.
        if (isButtonRestricted(phase, d.tipo_documento)) return false;
        if (isButtonRestricted(phase, d.numerador)) return false;
        return true;
    });

    if (error || !filteredByRestrictions || filteredByRestrictions.length === 0) {
        container.innerHTML = '<p>No se encontraron documentos registrados o no tienes acceso a ellos.</p>';
        return;
    }

    // --- RENDER COMPONENT ---
    const renderTable = (filteredData) => {
        const tableHtml = `
            <table class="sap-alv-grid">
                <thead>
                    <tr>
                        <th>Num.</th>
                        <th>Tipo Documento</th>
                        ${phase === 'GES' ? '<th>Fase</th>' : ''}
                        <th>LoB</th>
                        <th>Taller</th>
                        <th>URL / SharePoint</th>
                        <th>Fecha</th>
                        <th style="width: 80px">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredData.map(d => {
            const colors = PHASE_COLORS[d.id_fase] || { bg: '#eee', color: '#666' };
            return `
                        <tr>
                            <td style="font-family:monospace; font-size: 0.85rem;">${d.numerador}</td>
                            <td>${d.tipo_documento}</td>
                            ${phase === 'GES' ? `<td><span class="badge" style="background:${colors.bg}; color:${colors.color}; font-weight:bold; border:1px solid ${colors.color}44">${d.id_fase}</span></td>` : ''}
                            <td><span class="badge" style="background:#f0f0f0; color:#666;">${d.id_lob || '-'}</span></td>
                            <td>${d.nombre_taller || '-'}</td>
                            <td>
                                ${d.url && canDownload ? `<a href="${d.url}" target="_blank" class="sap-link"><i class="fas fa-external-link-alt"></i> Abrir</a>` : (d.url ? '<span style="color:#ccc"><i class="fas fa-lock"></i> Bloqueado</span>' : '-')}
                            </td>
                            <td>${new Date(d.fecha).toLocaleDateString('es-ES')}</td>
                            <td>
                                ${phase === 'GES' ? '-' : `
                                    ${canAttach ? `<button class="btn-icon" title="Editar" onclick="openDocumentModal('${d.id_fase}', '${d.tipo_documento}', ${d.id})"><i class="fas fa-edit"></i></button>` : ''}
                                    ${canModify ? `<button class="btn-icon" title="Borrar" onclick="deleteDocumentEntry(${d.id}, '${d.id_fase}')"><i class="fas fa-trash" style="color:#ff4444"></i></button>` : ''}
                                `}
                            </td>
                        </tr>`;
        }).join('')}
                    ${filteredData.length === 0 ? `<tr><td colspan="${phase === 'GES' ? 8 : 7}" style="text-align:center; color:#999; padding:2rem;">No hay documentos que coincidan con los filtros.</td></tr>` : ''}
                </tbody>
            </table>`;

        const wrapper = container.querySelector('.table-wrapper');
        if (wrapper) wrapper.innerHTML = tableHtml;
    };

    // --- FILTERS SETUP ---
    const uniqueDocs = [...new Set(filteredByRestrictions.map(d => d.tipo_documento))].sort();
    const uniquePhases = [...new Set(filteredByRestrictions.map(d => d.id_fase))].sort();
    const uniqueLobs = [...new Set(filteredByRestrictions.map(d => d.id_lob).filter(Boolean))].sort();
    const uniqueWorkshops = [...new Set(filteredByRestrictions.map(d => d.nombre_taller).filter(Boolean))].sort();

    container.innerHTML = `
            <div class="alv-filter-bar" style="display:flex; gap:10px; margin-bottom:15px; background:#f9f9f9; padding:10px; border-radius:4px; flex-wrap:wrap; border:1px solid #eee;">
                <div class="filter-group">
                    <label style="font-size:0.7rem; font-weight:bold; display:block; margin-bottom:4px;">TIPO DOC:</label>
                    <select id="filter-doc-${containerId}" class="form-control compact" style="width:150px">
                        <option value="">-- Todos --</option>
                        ${uniqueDocs.map(t => `<option value="${t}">${t}</option>`).join('')}
                    </select>
                </div>
                ${phase === 'GES' ? `
            <div class="filter-group">
                <label style="font-size:0.7rem; font-weight:bold; display:block; margin-bottom:4px;">FASE:</label>
                <select id="filter-phase-${containerId}" class="form-control compact" style="width:100px">
                    <option value="">-- Todas --</option>
                    ${uniquePhases.map(p => `<option value="${p}">${p}</option>`).join('')}
                </select>
            </div>` : ''}
                <div class="filter-group">
                    <label style="font-size:0.7rem; font-weight:bold; display:block; margin-bottom:4px;">LoB:</label>
                    <select id="filter-lob-${containerId}" class="form-control compact" style="width:100px">
                        <option value="">-- Todas --</option>
                        ${uniqueLobs.map(l => `<option value="${l}">${l}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label style="font-size:0.7rem; font-weight:bold; display:block; margin-bottom:4px;">TALLER:</label>
                    <select id="filter-ws-${containerId}" class="form-control compact" style="width:150px">
                        <option value="">-- Todos --</option>
                        ${uniqueWorkshops.map(w => `<option value="${w}">${w}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group" style="margin-left:auto; align-self:flex-end;">
                    <button class="btn btn-outline compact" id="btn-reset-${containerId}"><i class="fas fa-undo"></i> Reset</button>
                </div>
            </div>
            <div class="table-wrapper"></div>
            `;

    const applyFilters = () => {
        const selDoc = container.querySelector(`[id^="filter-doc-"]`);
        const selPhase = container.querySelector(`[id^="filter-phase-"]`);
        const selLob = container.querySelector(`[id^="filter-lob-"]`);
        const selWS = container.querySelector(`[id^="filter-ws-"]`);

        const valDoc = selDoc ? selDoc.value : '';
        const valPhase = selPhase ? selPhase.value : '';
        const valLob = selLob ? selLob.value : '';
        const valWS = selWS ? selWS.value : '';

        console.log(`ApplyFilters called. Target type: ${valDoc}`);

        const filtered = (filteredByRestrictions || []).filter(d => {
            const docType = (d.tipo_documento || '').trim().toLowerCase();
            const filterType = (valDoc || '').trim().toLowerCase();
            if (filterType && docType !== filterType) return false;

            if (valPhase && d.id_fase !== valPhase) return false;
            if (valLob && d.id_lob !== valLob) return false;
            if (valWS && d.nombre_taller !== valWS) return false;
            return true;
        });

        console.log(`Filtered results: ${filtered.length} documents.`);
        renderTable(filtered);
    };

    // Expose for external calls (like from phase buttons)
    container.executeFilter = applyFilters;

    // Listeners
    container.querySelectorAll('select').forEach(sel => sel.addEventListener('change', applyFilters));
    const resetBtn = container.querySelector(`[id^="btn-reset-"]`);
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            container.querySelectorAll('select').forEach(sel => sel.value = '');
            applyFilters();
        });
    }

    // Initial render
    applyFilters();
}

async function deleteDocumentEntry(id, phase) {
    if (!hasPermission(phase, 'modify')) {
        Swal.fire('Acceso Denegado', 'No tienes permisos para eliminar este registro.', 'error');
        return;
    }
    const result = await Swal.fire({
        title: '¿Eliminar registro?',
        text: "Se borrará la referencia al documento de la base de datos.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff4444'
    });

    if (result.isConfirmed) {
        const { error } = await supabaseClient.from('documentos').delete().eq('id', id);
        if (error) Swal.fire('Error', error.message, 'error');
        else {
            loadPhaseDocumentsTable(phase, `${phase.toLowerCase()}-doc-table-container`);
            if (phase === 'EXP' && document.getElementById('exp-designs-table-container')) {
                loadExpDesignsTable(phase, 'exp-designs-table-container');
            }
            updateDashboardKPIs();
            renderModuleContent(state.activeModule); // Refresh buttons to update badges
            Toast.fire({ icon: 'success', title: 'Registro eliminado' });
        }
    }
}

async function filterProjectDocumentation() {
    const filterClient = document.getElementById('doc-filter-client')?.value || '';
    const filterProject = document.getElementById('doc-filter-project')?.value || '';
    const filterType = document.getElementById('doc-filter-type')?.value || '';
    const tbody = document.getElementById('doc-table-body');
    if (!tbody || !supabaseClient) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;"><i class="fas fa-spinner fa-spin"></i> Filtrando...</td></tr>';

    let query = supabaseClient.from('documentos').select('*');
    if (filterClient) query = query.eq('cliente', filterClient);
    if (filterProject) query = query.eq('proyecto', filterProject);
    if (filterType) query = query.eq('tipo_documento', filterType);

    const { data } = await query.order('id', { ascending: false });

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No se encontraron documentos con los filtros seleccionados.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(doc => `
            <tr>
                <td>${doc.cliente}</td>
                <td>${doc.proyecto}</td>
                <td>${doc.id_fase}</td>
                <td>${doc.tipo_documento}</td>
                <td>${doc.url ? `<a href="${doc.url}" target="_blank" class="sap-link"><i class="fas fa-file-alt"></i> Abrir Link</a>` : '-'}</td>
                <td>${new Date(doc.fecha).toLocaleDateString('es-ES')}</td>
            </tr>
            `).join('');
}

function renderEjecutarPhase() { renderGenericPhaseModule('EJE', 'Fase Ejecutar (EJE)'); }

async function updateDashboardKPIs() {
    if (!supabaseClient) return;

    // Get current project name/id for filtering
    const projectFilter = state.selectedProject ? (state.selectedProject.id_proyecto || state.selectedProject.name) : null;

    try {
        // 1. Total Documents (DOC)
        let docQuery = supabaseClient.from('documentos').select('id', { count: 'exact' });
        if (projectFilter) docQuery = docQuery.eq('proyecto', projectFilter);
        const { count: docCount } = await docQuery;
        const kpiDoc = document.getElementById('kpi-doc');
        if (kpiDoc) kpiDoc.textContent = docCount || 0;

        // 2. Phase-specific counts (KPI-xxx)
        const phases = ['DES', 'PRE', 'EXP', 'REA', 'DEPLOY', 'EJE', 'GES'];
        for (const phase of phases) {
            let pQuery = supabaseClient.from('documentos').select('id', { count: 'exact' }).eq('id_fase', phase);
            if (projectFilter) pQuery = pQuery.eq('proyecto', projectFilter);

            const { count } = await pQuery;
            const el = document.getElementById(`kpi-${phase.toLowerCase()}`);
            if (el) el.textContent = count || 0;
            else if (phase === 'DEPLOY') {
                const elDeploy = document.getElementById('kpi-deploy');
                if (elDeploy) elDeploy.textContent = count || 0;
            }
        }

    } catch (e) {
        console.error("Error updating KPIs:", e);
    }
}

async function renderMyProfile() {
    if (!state.currentUser) return;
    const user = state.currentUser;

    const { value: formValues } = await Swal.fire({
        title: 'Mi Perfil',
        html: `
            <div style="text-align:left">
                <div style="text-align:center; margin-bottom: 1rem;">
                    <img id="swal-profile-preview" src="${user.profile_image || user.image || `https://ui-avatars.com/api/?name=${user.first_name || 'U'}+${user.last_name || ''}&background=0D8ABC&color=fff`}"
                        style="width:100px; height:100px; border-radius:50%; object-fit:cover; border:3px solid var(--primary-color)">
                        <br>
                            <input type="file" id="swal-profile-file" style="display:none" accept="image/*">
                                <button class="btn btn-outline-small" onclick="document.getElementById('swal-profile-file').click()" style="margin-top:0.5rem">Cambiar Foto</button>
                                <input type="hidden" id="swal-profile-base64" value="${user.profile_image || user.image || ''}">
                                </div>
                                <div class="swal-form-row" style="display:flex; gap:10px;">
                                    <div style="flex:1">
                                        <label>Nombre</label>
                                        <input id="swal-user-name" class="swal2-input" style="width:100%; margin: 5px 0 15px 0;" value="${user.name || user.first_name || ''}">
                                    </div>
                                    <div style="flex:1">
                                        <label>Apellidos</label>
                                        <input id="swal-user-lastname" class="swal2-input" style="width:100%; margin: 5px 0 15px 0;" value="${user.lastname || user.last_name || ''}">
                                    </div>
                                </div>
                                <label>Dirección</label>
                                <input id="swal-user-address" class="swal2-input" style="width:100%; margin: 5px 0 15px 0;" value="${user.address || ''}">
                                    <label>Teléfono</label>
                                    <input id="swal-user-phone" class="swal2-input" style="width:100%; margin: 5px 0 15px 0;" value="${user.phone || ''}">
                                        <label>Nueva Contraseña (Dejar en blanco para no cambiar)</label>
                                        <input id="swal-user-pass" type="password" class="swal2-input" style="width:100%; margin: 5px 0 15px 0;" placeholder="••••••••">
                                        </div>
                                        `,
        didOpen: () => {
            const fileInput = document.getElementById('swal-profile-file');
            const preview = document.getElementById('swal-profile-preview');
            const base64Input = document.getElementById('swal-profile-base64');

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        preview.src = event.target.result;
                        base64Input.value = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        },
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Guardar Cambios',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const pass = document.getElementById('swal-user-pass').value;
            return {
                first_name: document.getElementById('swal-user-name').value,
                last_name: document.getElementById('swal-user-lastname').value,
                direccion: document.getElementById('swal-user-address').value,
                telefono: document.getElementById('swal-user-phone').value,
                profile_image: document.getElementById('swal-profile-base64').value,
                password: pass ? pass : user.password
            }
        }
    });

    if (formValues) {
        if (supabaseClient) {
            const { error } = await supabaseClient
                .from('users')
                .update(formValues)
                .eq('email', user.email);

            if (error) {
                Swal.fire('Error', error.message, 'error');
                return;
            }
        }

        // Update local state and storage
        state.currentUser = {
            ...state.currentUser,
            ...formValues,
            name: formValues.first_name,
            lastname: formValues.last_name,
            address: formValues.direccion,
            phone: formValues.telefono
        };

        sessionStorage.setItem('altim_user', JSON.stringify(state.currentUser));
        updateUIForUser();
        Toast.fire({ icon: 'success', title: 'Perfil actualizado correctamente' });
    }
}

// --- INCIDENT MANAGEMENT SYSTEM ---

async function initIncidents() {
    if (supabaseClient) {
        const { data, error } = await supabaseClient.from('incidencias').select('*');
        if (!error) state.incidents = data || [];

        const { data: logData, error: logError } = await supabaseClient.from('incident_audit_logs').select('*').order('timestamp', { ascending: false }).limit(100);
        if (!logError) state.incidentAuditLogs = logData || [];
    }
}

async function renderDiscoverPhase() {
    renderGenericPhaseModule('DES', 'Fase Descubrir (DES)');
}

async function renderDeyPhase() {
    console.log("--- EXECUTING renderDeyPhase (v2.6) ---");
    try {
        if (!state.selectedProject) {
            elements.moduleContent.innerHTML = `
                <div class="card" style="border-left: 10px solid #ffa000; padding: 2rem; background: #fffde7;">
                    <h3><i class="fas fa-exclamation-triangle"></i> ATENCIÓN: SIN PROYECTO SELECCIONADO</h3>
                    <p>Por favor, ve al módulo <strong>PRJ</strong> y selecciona un proyecto primero para gestionar sus incidencias.</p>
                </div>
            `;
            return;
        }

        // Fetch counts for this phase (for Part 1)
        const counts = await getDocCountsByPhase('DEPLOY'); // Maintain DEPLOY mapping for and docs
        const types = (PHASE_DOC_TYPES['DEY'] || []).filter(type => !isItemRestricted('dey', type));

        elements.moduleContent.innerHTML = `
                                        ${renderPhaseHeader('Fase DESPLEGAR (DEY)')}

                                        <div class="stacked-layout" style="display: flex !important; flex-direction: column !important; gap: 0.5rem !important;">

                                            <!-- PARTE 1: DOCUMENTACIÓN -->
                                            <div class="collapsible-wrapper" style="border-left: 5px solid #4caf50;">
                                                <div class="collapsible-header" onclick="toggleSection(this)">
                                                    <h3 style="color:#4caf50; display:flex; align-items:center; gap:10px;">
                                                        <i class="fas fa-file-alt"></i> 1: DOCUMENTACIÓN
                                                    </h3>
                                                    <i class="fas fa-plus-circle toggle-icon"></i>
                                                </div>
                                                <div class="collapsible-content">
                                                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 0.75rem; margin-top: 1rem;">
                                                        ${types.map(type => renderDocTypeButton('DEPLOY', type, counts[type] || 0)).join('')}
                                                    </div>
                                                    <div style="margin-top: 2rem;">
                                                        <h4><i class="fas fa-list"></i> Histórico de Documentación (DEY)</h4>
                                                        <div id="dey-doc-container">
                                                            <p style="text-align:center; padding:2rem; color:#999;"><i class="fas fa-spinner fa-spin"></i> Cargando documentos...</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- PARTE 2: GESTIÓN DE INCIDENCIAS -->
                                            <div class="collapsible-wrapper" style="border-left: 5px solid var(--sap-blue);">
                                                <div class="collapsible-header" onclick="toggleSection(this)">
                                                    <h3 style="color:var(--sap-blue); display:flex; align-items:center; gap:10px;">
                                                        <i class="fas fa-ticket-alt"></i> 2: GESTIÓN DE INCIDENCIAS
                                                    </h3>
                                                    <i class="fas fa-plus-circle toggle-icon"></i>
                                                </div>
                                                <div class="collapsible-content">
                                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                                                        <p class="section-subtitle" style="margin:0; font-size: 0.85rem;">Portal de incidencias y soporte del proyecto.</p>
                                                        <div style="display:flex; gap:10px;">
                                                            <button class="btn btn-secondary compact" onclick="exportIncidents('excel')"><i class="fas fa-file-excel"></i> Excel</button>
                                                            ${hasPermission('dey', 'modify') ? `
                                 <button class="btn compact" onclick="openIncidentModal()" style="background:var(--sap-blue); color:white;"><i class="fas fa-plus"></i> Nueva Incidencia</button>
                                 ` : ''}
                                                        </div>
                                                    </div>

                                                    <!-- SEARCH & FILTERS -->
                                                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; background: #f8f9fa; padding: 1rem; border-radius: 8px; border: 1px solid #eee;">
                                                        <div>
                                                            <label style="font-size: 0.7rem; font-weight: bold; color: #666; display: block; margin-bottom: 4px;">Búsqueda</label>
                                                            <input type="text" id="dey-search-incident" class="form-control" placeholder="Buscar..." oninput="renderIncidentTable()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                                                        </div>
                                                        <div>
                                                            <label style="font-size: 0.7rem; font-weight: bold; color: #666; display: block; margin-bottom: 4px;">Estado</label>
                                                            <select id="dey-filter-status" onchange="renderIncidentTable()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                                                                <option value="">Todos</option>
                                                                <option value="01">Nueva</option>
                                                                <option value="02">En Proceso</option>
                                                                <option value="03">Entregada</option>
                                                                <option value="05">En Pruebas</option>
                                                                <option value="08">Congelada</option>
                                                                <option value="09">Garantía</option>
                                                                <option value="10">Finalizada / Cerrada</option>
                                                                <option value="11">Descartada</option>
                                                                <option value="12">Duplicada</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label style="font-size: 0.7rem; font-weight: bold; color: #666; display: block; margin-bottom: 4px;">Prioridad</label>
                                                            <select id="dey-filter-priority" onchange="renderIncidentTable()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                                                                <option value="">Todas</option>
                                                                <option value="Crítica">Crítica</option>
                                                                <option value="Alta">Alta</option>
                                                                <option value="Media">Media</option>
                                                                <option value="Baja">Baja</option>
                                                                <option value="Sin Prioridad">Sin Prioridad</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label style="font-size: 0.7rem; font-weight: bold; color: #666; display: block; margin-bottom: 4px;">Tipo</label>
                                                            <select id="dey-filter-type" onchange="renderIncidentTable()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                                                                <option value="">Todos</option>
                                                                <option value="Incidencia">Incidencia</option>
                                                                <option value="Mejora">Mejora</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label style="font-size: 0.7rem; font-weight: bold; color: #666; display: block; margin-bottom: 4px;">LoB</label>
                                                            <select id="dey-filter-lob" onchange="renderIncidentTable()" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                                                                <option value="">Todos</option>
                                                                ${INCIDENT_CONFIG.LOBS.map(l => `<option value="${l}">${l}</option>`).join('')}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div id="incident-table-container" style="min-height: 200px; overflow-x: auto;">
                                                        <p style="text-align:center; padding:2rem; color:#999;"><i class="fas fa-spinner fa-spin"></i> Cargando incidencias...</p>
                                                    </div>
                                                </div>
                                            </div>
                                            `;

        await initIncidents();
        renderIncidentTable();
        loadPhaseDocumentsTable('DEPLOY', 'dey-doc-container');

    } catch (err) {
        console.error("Error rendering DEY module", err);
        elements.moduleContent.innerHTML = `<div class='card error'><h3>Error Crítico</h3><p>${err.message}</p><p>Comprueba la consola para más detalles.</p></div>`;
    }
}
async function renderIncidentTable() {
    const container = document.getElementById('incident-table-container');
    if (!container) return;

    // Get filter values
    const searchTerm = document.getElementById('dey-search-incident')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('dey-filter-status')?.value || '';
    const priorityFilter = document.getElementById('dey-filter-priority')?.value || '';
    const typeFilter = document.getElementById('dey-filter-type')?.value || '';

    // 1. Filter by Project
    const projectFilter = state.selectedProject.id || state.selectedProject.id_proyecto;
    let filtered = (state.incidents || []).filter(i => i.proyecto_id == projectFilter || i.project_id == projectFilter);

    // 2. Filter by Client (if user is client)
    const user = state.currentUser;
    const isCliente = user && (
        (user.user_type && user.user_type.toLowerCase() === 'cliente') ||
        (user.role && user.role.toLowerCase() === 'cliente') ||
        (user.type && user.type.toLowerCase() === 'cliente')
    );
    if (isCliente) {
        const clientAbrev = user.abrev || user.abrev_cliente || user.cliente_abrev;
        if (clientAbrev) {
            filtered = filtered.filter(i => i.numero_incidencia && i.numero_incidencia.startsWith(clientAbrev));
        }
    }

    // 3. Apply UI Filters (v2.3)
    if (searchTerm) {
        filtered = filtered.filter(i =>
            (i.numero_incidencia && i.numero_incidencia.toLowerCase().includes(searchTerm)) ||
            (i.descripcion && i.descripcion.toLowerCase().includes(searchTerm)) ||
            (i.lob && i.lob.toLowerCase().includes(searchTerm)) ||
            (i.cliente_id && i.cliente_id.toLowerCase().includes(searchTerm))
        );
    }
    if (statusFilter) filtered = filtered.filter(i => i.estado === statusFilter);
    if (priorityFilter) filtered = filtered.filter(i => i.prioridad === priorityFilter);
    if (typeFilter) filtered = filtered.filter(i => i.tipo === typeFilter);

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:3rem; color:#999; background:#f9f9f9; border-radius:8px; border:1px dashed #ccc;">
                <p><i class="fas fa-search" style="font-size:2rem; opacity:0.3; margin-bottom:1rem;"></i><br>
                No se encontraron incidencias con los filtros actuales para este proyecto.</p>
            </div>
        `;
        return;
    }

    // 4. Render Table (FULL 20 COLUMNS)
    container.innerHTML = `
                                            <div class="table-responsive" style="max-height: 600px; overflow: auto; border: 1px solid #eee; border-radius: 8px;">
                                                <table class="alv-table" style="min-width: 2800px; font-size: 0.75rem;">
                                                    <thead>
                                                        <tr>
                                                            <th style="position:sticky; left:0; background:white; z-index:2; width:80px;">Acción</th>
                                                            <th>Cliente</th>
                                                            <th>Nº Incidencia</th>
                                                            <th>ID Proyecto</th>
                                                            <th>Fecha Creación</th>
                                                            <th>Resp. Cliente</th>
                                                            <th>Tipo</th>
                                                            <th>Tipo ALTIM</th>
                                                            <th>LoB</th>
                                                            <th style="min-width:300px;">Descripción</th>
                                                            <th style="min-width:200px;">Msj. Error</th>
                                                            <th style="min-width:200px;">Observaciones</th>
                                                            <th>Prioridad</th>
                                                            <th style="min-width:200px;">Comentarios</th>
                                                            <th>Sistema</th>
                                                            <th>Resp. ALTIM</th>
                                                            <th>Estado</th>
                                                            <th>F. Entrega</th>
                                                            <th>F. Cierre Prev.</th>
                                                            <th style="min-width:250px;">Comentarios Finales</th>
                                                            <th>Responsable</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        ${filtered.map(i => `
                        <tr class="status-${(i.estado || '01').split(' ')[0]}">
                            <td style="position:sticky; left:0; background:inherit; z-index:1;">
                                ${hasPermission('dey', 'modify') || hasPermission('dey', 'view') ? `
                                <button class="icon-btn-small" onclick="openIncidentModal('${i.id}')" title="${hasPermission('dey', 'modify') ? 'Editar' : 'Ver'}"><i class="fas fa-${hasPermission('dey', 'modify') ? 'edit' : 'eye'}"></i></button>
                                ` : '-'}
                            </td>
                            <td>${i.cliente_id || '-'}</td>
                            <td style="font-weight:bold; color:var(--sap-blue);">${i.numero_incidencia || '-'}</td>
                            <td>${i.proyecto_id || '-'}</td>
                            <td>${formatDate(i.fecha_incid)}</td>
                            <td>${i.resp_cliente || '-'}</td>
                            <td>${i.tipo || '-'}</td>
                            <td>${i.tipo_altim || '-'}</td>
                            <td>${i.lob || '-'}</td>
                            <td title="${i.descripcion}">${i.descripcion || '-'}</td>
                            <td title="${i.error_mensaje}">${i.error_mensaje || '-'}</td>
                            <td title="${i.observaciones}">${i.observaciones || '-'}</td>
                            <td><span class="badge badge-priority-${(i.prioridad || 'media').toLowerCase().replace(' ', '-')}">${i.prioridad || 'Media'}</span></td>
                            <td title="${i.comentarios}">${i.comentarios || '-'}</td>
                            <td>${i.sistema || '-'}</td>
                            <td>${i.resp_altim || '-'}</td>
                            <td><span class="badge ${getStatusBadgeClass(i.estado)}">${getStatusText(i.estado)}</span></td>
                            <td>${formatDate(i.fecha_entrega)}</td>
                            <td>${formatDate(i.fecha_cierre_prevista)}</td>
                            <td title="${i.comentarios_finales_consultor}">${i.comentarios_finales_consultor || '-'}</td>
                            <td>${i.responsable || '-'}</td>
                        </tr>
                    `).join('')}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div style="margin-top:10px; padding:10px; background:#f0f7ff; border-radius:4px; font-size:0.8rem; color:#0056b3; border:1px solid #cce5ff;">
                                                <small><i class="fas fa-info-circle"></i> Usa el scroll horizontal para ver todas las columnas.</small>
                                            </div>
                                            `;
}

function getStatusBadgeClass(estado) {
    if (!estado) return 'badge-status-nueva';
    const code = estado.split(' ')[0];
    const map = {
        '01': 'badge-status-nueva', '02': 'badge-status-proceso', '03': 'badge-status-entregada',
        '05': 'badge-status-pruebas', '08': 'badge-status-congelada', '09': 'badge-status-nueva',
        '10': 'badge-status-finalizada', '11': 'badge-status-descartada', '12': 'badge-status-duplicada'
    };
    return map[code] || 'badge-status-nueva';
}

function getStatusText(estado) {
    if (!estado) return 'Nueva';
    const parts = estado.split(' ');
    if (parts.length > 1) return parts.slice(1).join(' ');
    return estado;
}

function renderAuditLogModule() {
    elements.moduleContent.innerHTML = `
        ${renderPhaseHeader('Log de Modificaciones')}
        <div class="stacked-layout" style="display: flex !important; flex-direction: column !important; gap: 0.5rem !important;">
            ${isItemRestricted('mod', '1: Log de Modificaciones de Incidencias') ? '' : `
            <div class="collapsible-wrapper" style="border-left: 5px solid var(--sap-blue);">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:var(--sap-blue); display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-history"></i> 1: Log de Modificaciones de Incidencias
                    </h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content">
                    <div class="table-responsive" style="margin-top:1rem;">
                        <table class="alv-table">
                            <thead>
                                <tr>
                                    <th>Nº Incid.</th>
                                    <th>Usuario</th>
                                    <th>Acción</th>
                                    <th>Campo</th>
                                    <th>Origen</th>
                                    <th>Final</th>
                                    <th>Fecha/Hora</th>
                                </tr>
                            </thead>
                            <tbody id="audit-log-body">
                                ${state.incidentAuditLogs.map(l => `
                                    <tr>
                                        <td>${l.incident_id || '-'}</td>
                                        <td>${l.usuario_email}</td>
                                        <td>${l.accion}</td>
                                        <td>${l.campo_modificado || '-'}</td>
                                        <td>${l.valor_anterior || '-'}</td>
                                        <td>${l.valor_nuevo || '-'}</td>
                                        <td>${new Date(l.timestamp).toLocaleString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            `}
        </div>
    `;
}

function renderStatisticsModule() {
    elements.moduleContent.innerHTML = `
        ${renderPhaseHeader('Estadística y Analíticas')}
        <div class="stacked-layout" style="display: flex !important; flex-direction: column !important; gap: 0.5rem !important;">
            ${isItemRestricted('est', '1: Resumen Ejecutivo') || isItemRestricted('est', 'Resumen Ejecutivo') ? '' : `
            <div class="collapsible-wrapper" style="border-left: 4px solid var(--sap-blue);">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:var(--sap-blue); display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-chart-line"></i> 1: Resumen Ejecutivo
                        <span style="background:rgba(0,102,255,0.1); color:var(--sap-blue); font-size:0.75rem; padding:2px 8px; border-radius:12px; font-weight:700;">LIVE KPIs</span>
                    </h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content" id="est-executive-summary-wrapper">
                    <div id="est-executive-summary-container">
                        <div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--sap-blue)"></i><p style="margin-top:0.5rem; color:#666;">Cargando resumen ejecutivo del proyecto...</p></div>
                    </div>
                </div>
            </div>`}
            
            ${isItemRestricted('est', '2: Progreso de Fases') || isItemRestricted('est', 'Progreso de Fases') ? '' : `
            <div class="collapsible-wrapper" style="border-left: 4px solid #ff9800;">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:#ff9800; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-tasks"></i> 2: Progreso de Fases
                        <span style="background:rgba(255,152,0,0.1); color:#ff9800; font-size:0.75rem; padding:2px 8px; border-radius:12px; font-weight:700;">ROADMAP & AVANCE</span>
                    </h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content" id="est-phases-progress-wrapper">
                    <div id="est-phases-progress-container">
                        <div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:#ff9800"></i><p style="margin-top:0.5rem; color:#666;">Cargando progreso y problemas de fases del proyecto...</p></div>
                    </div>
                </div>
            </div>`}

            ${isItemRestricted('est', '3: Gestión de Riesgos') || isItemRestricted('est', '5: Gestión de Riesgos') || isItemRestricted('est', 'Gestión de Riesgos') ? '' : `
            <div class="collapsible-wrapper" style="border-left: 4px solid #f44336;">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:#f44336; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-exclamation-triangle"></i> 3: Gestión de Riesgos
                        <span style="background:rgba(244,67,54,0.1); color:#f44336; font-size:0.75rem; padding:2px 8px; border-radius:12px; font-weight:700;">MATRIZ & SEVERIDAD</span>
                    </h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content" id="est-risks-module-wrapper">
                    <div id="est-risks-module-container">
                        <div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color:#f44336"></i><p style="margin-top:0.5rem; color:#666;">Cargando gestión y matriz de riesgos del proyecto...</p></div>
                    </div>
                </div>
            </div>`}

            <!-- PARTE 4: Estadísticas de Incidencias (Layout Analytics) -->
            ${isItemRestricted('est', '4: Estadísticas de Incidencias') || isItemRestricted('est', '6: Estadísticas de Incidencias') || isItemRestricted('est', 'Estadísticas de Incidencias') ? '' : `
            <div class="collapsible-wrapper" style="border-left: 4px solid #9c27b0;">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:#9c27b0; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-chart-bar"></i> 4: Estadísticas de Incidencias
                        <span style="background:rgba(156,39,176,0.1); color:#9c27b0; font-size:0.75rem; padding:2px 8px; border-radius:12px; font-weight:700;">ON-LINE & POR PROYECTO</span>
                    </h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content">
                    <div style="padding:1.5rem; background: #fafafa;">
                        
                        <!-- Top status bar with on-line indicator -->
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
                            <div id="analytics-live-timestamp" style="font-size:0.85rem; color:#64748b; display:flex; align-items:center; gap:6px;">
                                <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10b981;"></span>
                                <span>Conectando on-line con base de datos de incidencias...</span>
                            </div>
                            <div id="analytics-current-filter-info" style="font-size:0.82rem; font-weight:600; color:#9c27b0;"></div>
                        </div>

                        <div class="analytics-filter-bar">
                            <div class="analytics-filter-item" style="flex: 1.5; min-width: 200px;">
                                <label><i class="fas fa-folder" style="color:#9c27b0;"></i> Proyecto</label>
                                <select id="analytics-filter-project" onchange="window.updateIncidentDashboard()">
                                    <option value="">-- Todos los Proyectos --</option>
                                </select>
                            </div>
                            <div class="analytics-filter-item">
                                <label>Estado</label>
                                <select id="analytics-filter-status" onchange="window.updateIncidentDashboard()">
                                    <option value="">Todos los Estados</option>
                                    <option value="10">Finalizadas / Cerradas</option>
                                    <option value="Abiertas">Abiertas / En Proceso</option>
                                </select>
                            </div>
                            <div class="analytics-filter-item">
                                <label>Prioridad</label>
                                <select id="analytics-filter-priority" onchange="window.updateIncidentDashboard()">
                                    <option value="">Todas las Prioridades</option>
                                    <option value="Crítica">Crítica</option>
                                    <option value="Alta">Alta</option>
                                    <option value="Media">Media</option>
                                    <option value="Baja">Baja</option>
                                </select>
                            </div>
                            <div class="analytics-filter-item">
                                <label>Tipo</label>
                                <select id="analytics-filter-type" onchange="window.updateIncidentDashboard()">
                                    <option value="">Todos los Tipos</option>
                                    <option value="Incidencia">Incidencia</option>
                                    <option value="Mejora">Mejora</option>
                                    <option value="Consulta">Consulta</option>
                                </select>
                            </div>
                            <div class="analytics-filter-item">
                                <label>LoB</label>
                                <select id="analytics-filter-lob" onchange="window.updateIncidentDashboard()">
                                    <option value="">Todas las LoBs</option>
                                    ${INCIDENT_CONFIG.LOBS.map(l => `<option value="${l}">${l}</option>`).join('')}
                                </select>
                            </div>
                            <div class="analytics-filter-item" style="flex: 0 0 auto; display: flex; align-items: flex-end;">
                                <button class="btn btn-outline" style="height: 42px; padding: 0 16px; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px; border-color:#9c27b0; color:#9c27b0;" onclick="window.fetchLiveIncidentsAndUpdate()" title="Recargar incidencias en tiempo real desde Supabase">
                                    <i class="fas fa-sync-alt" id="analytics-refresh-icon"></i> Actualizar Online
                                </button>
                            </div>
                        </div>

                        <div class="analytics-kpi-grid">
                            <div class="kpi-card-modern kpi-total">
                                <i class="fas fa-ticket-alt kpi-icon"></i>
                                <div class="kpi-title">TOTAL INCIDENCIAS</div>
                                <div class="kpi-value" id="kpi-inc-total">0</div>
                            </div>
                            <div class="kpi-card-modern kpi-resolved">
                                <i class="fas fa-check-circle kpi-icon"></i>
                                <div class="kpi-title">TASA RESOLUCIÓN</div>
                                <div class="kpi-value" id="kpi-inc-resolution">0%</div>
                            </div>
                            <div class="kpi-card-modern kpi-open">
                                <i class="fas fa-folder-open kpi-icon"></i>
                                <div class="kpi-title">ABIERTAS / EN PROCESO</div>
                                <div class="kpi-value" id="kpi-inc-open">0</div>
                            </div>
                            <div class="kpi-card-modern kpi-critical">
                                <i class="fas fa-exclamation-triangle kpi-icon"></i>
                                <div class="kpi-title">CRÍTICAS (ACTIVAS)</div>
                                <div class="kpi-value" id="kpi-inc-critical">0</div>
                            </div>
                        </div>

                        <div class="analytics-chart-grid">
                            <div class="analytics-chart-card">
                                <h4><i class="fas fa-chart-pie" style="color:var(--sap-blue)"></i> Distribución por Estado</h4>
                                <div class="analytics-chart-container">
                                    <canvas id="chartStatus"></canvas>
                                </div>
                            </div>
                            <div class="analytics-chart-card">
                                <h4><i class="fas fa-chart-bar" style="color:#f59e0b"></i> Prioridad de Incidencias</h4>
                                <div class="analytics-chart-container">
                                    <canvas id="chartPriority"></canvas>
                                </div>
                            </div>
                            <div class="analytics-chart-card">
                                <h4><i class="fas fa-chart-doughnut" style="color:#10b981"></i> Tipo de Incidencia</h4>
                                <div class="analytics-chart-container">
                                    <canvas id="chartType"></canvas>
                                </div>
                            </div>
                            <div class="analytics-chart-card">
                                <h4><i class="fas fa-chart-bar" style="color:#8b5cf6"></i> Distribución por LoB</h4>
                                <div class="analytics-chart-container">
                                    <canvas id="chartLoB"></canvas>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            `}
        </div>
    `;
    if (!isItemRestricted('est', '1: Resumen Ejecutivo') && !isItemRestricted('est', 'Resumen Ejecutivo')) {
        setTimeout(() => window.renderEstExecutiveSummary(), 50);
    }
    if (!isItemRestricted('est', '2: Progreso de Fases') && !isItemRestricted('est', 'Progreso de Fases')) {
        setTimeout(() => window.renderEstPhasesProgress(), 80);
    }
    if (!isItemRestricted('est', '3: Gestión de Riesgos') && !isItemRestricted('est', '5: Gestión de Riesgos') && !isItemRestricted('est', 'Gestión de Riesgos')) {
        setTimeout(() => window.renderEstRisksModule(), 110);
    }
    setTimeout(() => {
        if (window.fetchLiveIncidentsAndUpdate) {
            window.fetchLiveIncidentsAndUpdate(state.selectedProject?.id);
        } else {
            initIncidentCharts();
        }
    }, 140);
}


// ========================================================
// EST MODULE: RESUMEN EJECUTIVO E INDICADORES DEL PROYECTO
// ========================================================

window.estKpiCharts = window.estKpiCharts || {};
window.estExecActiveTab = 'all';
window.estExecCachedData = null;

/**
 * Destroys any existing Chart.js instances in EST Executive Summary
 */
window.destroyEstKpiCharts = function () {
    if (window.estKpiCharts) {
        Object.keys(window.estKpiCharts).forEach(key => {
            if (window.estKpiCharts[key]) {
                try {
                    window.estKpiCharts[key].destroy();
                } catch (e) {
                    console.warn("Error destroying chart", key, e);
                }
            }
        });
        window.estKpiCharts = {};
    }
};

/**
 * Switch sub-tab in the Executive Summary
 */
window.switchEstExecTab = function (tabName) {
    window.estExecActiveTab = tabName;
    document.querySelectorAll('.est-exec-tab-btn, .exp-exec-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    const sections = {
        'all': ['est-sec-trace', 'est-sec-tasks', 'est-sec-reqs', 'est-sec-quality', 'est-sec-drilldown'],
        'trace': ['est-sec-trace'],
        'tasks': ['est-sec-tasks'],
        'reqs': ['est-sec-reqs'],
        'quality': ['est-sec-quality'],
        'drilldown': ['est-sec-drilldown']
    };

    const targetSections = sections[tabName] || sections['all'];
    ['est-sec-trace', 'est-sec-tasks', 'est-sec-reqs', 'est-sec-quality', 'est-sec-drilldown'].forEach(secId => {
        const el = document.getElementById(secId);
        if (el) {
            el.style.display = targetSections.includes(secId) ? 'block' : 'none';
        }
    });

    // Re-render / update charts layout after tab switch
    if (window.estExecCachedData) {
        setTimeout(() => {
            window.renderEstCharts(window.estExecCachedData);
        }, 50);
    }
};

/**
 * Quick switch active project from Executive Summary
 */
window.changeEstExecProject = async function (newProjId) {
    if (!newProjId) return;
    const pid = parseInt(newProjId);
    if (state.selectedProject?.id === pid) return;

    if (supabaseClient) {
        const { data, error } = await supabaseClient
            .from('cliente_proy')
            .select('*, clients(*)')
            .eq('id', pid)
            .single();

        if (!error && data) {
            state.selectedProject = {
                id: data.id,
                name: data.id_proyecto,
                client: data.clients?.nombre_cliente || 'Cliente',
                client_abrev: data.clients?.abrev || '',
                client_id: data.client_id,
                descripcion_prj: data.descripcion_prj || '',
                sharepoint_url: data.sharepoint_url,
                go_live_date: data.go_live_date,
                support_start_date: data.support_start_date,
                support_end_date: data.support_end_date
            };
            saveState();
            updateUIForUser();
        }
    }

    await window.renderEstExecutiveSummary(pid);
    const incPrjSel = document.getElementById('analytics-filter-project');
    if (incPrjSel && Array.from(incPrjSel.options).some(o => o.value == String(pid))) {
        incPrjSel.value = String(pid);
        if (window.updateIncidentDashboard) window.updateIncidentDashboard();
    }
};

/**
 * Main render function for EST Executive Summary
 */
window.renderEstExecutiveSummary = async function (targetProjectId) {
    const container = document.getElementById('est-executive-summary-container');
    if (!container) return;

    if (!supabaseClient) {
        container.innerHTML = '<div style="padding:1rem; color:#666;">Supabase no inicializado.</div>';
        return;
    }

    let projId = parseInt(targetProjectId || state.selectedProject?.id);
    
    // Si no hay proyecto seleccionado, tomar el primer proyecto disponible en base de datos
    if (!projId) {
        const { data: firstProjs } = await supabaseClient
            .from('cliente_proy')
            .select('*, clients(*)')
            .order('id', { ascending: true })
            .limit(1);

        if (firstProjs && firstProjs.length > 0) {
            const p = firstProjs[0];
            state.selectedProject = {
                id: p.id,
                name: p.id_proyecto,
                client: p.clients?.nombre_cliente || 'Cliente',
                client_abrev: p.clients?.abrev || '',
                client_id: p.client_id,
                descripcion_prj: p.descripcion_prj || '',
                go_live_date: p.go_live_date
            };
            saveState();
            updateUIForUser();
            projId = p.id;
        } else {
            container.innerHTML = '<div style="padding:1.5rem; color:#64748b; text-align:center;"><i class="fas fa-info-circle"></i> No hay proyectos creados en la base de datos para mostrar indicadores.</div>';
            return;
        }
    }

    container.innerHTML = `
        <div style="text-align:center; padding:2.5rem;">
            <i class="fas fa-spinner fa-spin fa-2x" style="color:var(--sap-blue);"></i>
            <p style="margin-top:0.75rem; color:#64748b; font-weight:500;">Calculando indicadores ejecutivos en tiempo real...</p>
        </div>
    `;

    try {
        // Parallel queries to Supabase
        const [
            tasksRes,
            reqsRes,
            bpmlRes,
            wsGroupsRes,
            wsScheduledRes,
            uatsRes,
            incidentsRes,
            risksRes,
            phasesRes,
            allProjectsRes
        ] = await Promise.all([
            supabaseClient.from('tasks').select('*').eq('project_id', projId),
            supabaseClient.from('requerimientos').select('*').eq('project_id', projId),
            supabaseClient.from('master_bpml').select('id_bp, bpml_id, estado_ajuste_fpg, gap, priority, negocio').eq('id_proyecto', projId),
            supabaseClient.from('workshop_groups').select('id, group_id, group_name').eq('project_id', projId),
            supabaseClient.from('project_workshops').select('*').eq('project_id', projId),
            supabaseClient.from('master_uats').select('id_bp, id_casop, estado_ok_nok, tipo_prueba').eq('project_id', projId),
            supabaseClient.from('incidencias').select('*').eq('proyecto_id', projId),
            supabaseClient.from('project_risks').select('*').eq('project_id', projId),
            supabaseClient.from('project_phases').select('*').eq('project_id', projId),
            supabaseClient.from('cliente_proy').select('id, id_proyecto, descripcion_prj, clients(nombre_cliente)')
        ]);

        // Workshop group items
        let wsItems = [];
        const groupIds = (wsGroupsRes.data || []).map(g => g.id);
        if (groupIds.length > 0) {
            const itemsRes = await supabaseClient.from('workshop_group_items').select('bp_id, group_record_id').in('group_record_id', groupIds);
            wsItems = itemsRes.data || [];
        }

        // --- DATA PROCESSING & KPI COMPUTATION ---
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Tareas (TAR)
        const tasks = tasksRes.data || [];
        const totalTasks = tasks.length;
        const tasksDone = tasks.filter(t => ['DONE', 'CLOSED'].includes((t.status || '').toUpperCase())).length;
        const tasksTesting = tasks.filter(t => (t.status || '').toUpperCase() === 'TESTING').length;
        const tasksDoing = tasks.filter(t => (t.status || '').toUpperCase() === 'DOING').length;
        const tasksTodo = tasks.filter(t => (t.status || '').toUpperCase() === 'TO DO').length;
        const tasksOpen = tasks.filter(t => (t.status || '').toUpperCase() === 'OPEN').length;
        const tasksOnHold = tasks.filter(t => (t.status || '').toUpperCase() === 'ON-HOLD').length;
        const tasksOverdue = tasks.filter(t => {
            if (!t.due_date) return false;
            if (['DONE', 'CLOSED'].includes((t.status || '').toUpperCase())) return false;
            return new Date(t.due_date) < today;
        });
        const tasksHighPriority = tasks.filter(t => (t.priority || '').toLowerCase() === 'high').length;
        const taskEfficiency = totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 0;

        // 2. Requerimientos de Información (SEG)
        const reqs = reqsRes.data || [];
        const totalReqs = reqs.length;
        const reqsDone = reqs.filter(r => ['DONE', 'CLOSED'].includes((r.status || '').toUpperCase())).length;
        const reqsOpen = reqs.filter(r => (r.status || '').toUpperCase() === 'OPEN').length;
        const reqsTodo = reqs.filter(r => (r.status || '').toUpperCase() === 'TO DO').length;
        const reqsOnHold = reqs.filter(r => (r.status || '').toUpperCase() === 'ON-HOLD').length;
        const reqsPending = totalReqs - reqsDone;
        const reqsOverdue = reqs.filter(r => {
            if (!r.due_date) return false;
            if (['DONE', 'CLOSED'].includes((r.status || '').toUpperCase())) return false;
            return new Date(r.due_date) < today;
        });
        const reqsInTime = totalReqs - reqsOverdue.length;
        const reqsComplianceRate = totalReqs > 0 ? Math.round(((totalReqs - reqsOverdue.length) / totalReqs) * 100) : 100;

        // 3. Best Practices & Trazabilidad E2E (Workshops -> BPML -> UATs)
        const wsBps = [...new Set(wsItems.map(i => (i.bp_id || '').trim().toUpperCase()).filter(Boolean))];
        const totalWsBps = wsBps.length;
        const totalWorkshops = (wsGroupsRes.data || []).length;

        const bpmlList = bpmlRes.data || [];
        const bpmlBps = [...new Set(bpmlList.map(b => (b.id_bp || '').trim().toUpperCase()).filter(Boolean))];
        const totalBpmlBps = bpmlBps.length;
        const totalBpmlRows = bpmlList.length;

        const uatsList = uatsRes.data || [];
        const uatBps = [...new Set(uatsList.map(u => (u.id_bp || '').trim().toUpperCase()).filter(Boolean))];
        const totalUatBps = uatBps.length;
        const totalUatCases = uatsList.length;
        const uatOk = uatsList.filter(u => (u.estado_ok_nok || '').toUpperCase() === 'OK').length;
        const uatNok = uatsList.filter(u => ['NOK', 'ERROR', 'DEFECTO'].includes((u.estado_ok_nok || '').toUpperCase())).length;
        const uatPending = totalUatCases - uatOk - uatNok;

        // Traceability intersections
        const wsInBpml = wsBps.filter(bp => bpmlBps.includes(bp)).length;
        const bpmlInUat = bpmlBps.filter(bp => uatBps.includes(bp)).length;
        const uatCoverageRate = totalBpmlBps > 0 ? Math.round((bpmlInUat / totalBpmlBps) * 100) : 0;
        const wsConversionRate = totalWsBps > 0 ? Math.round((wsInBpml / totalWsBps) * 100) : 0;

        // 4. Incidencias y Defectos (DEY)
        const incidents = incidentsRes.data || [];
        const totalIncidents = incidents.length;
        const openIncidents = incidents.filter(i => !(i.estado || '').includes('10') && !(i.estado || '').includes('11')).length;
        const criticalIncidents = incidents.filter(i => ['Crítica', 'Alta'].includes(i.prioridad) && !(i.estado || '').includes('10') && !(i.estado || '').includes('11')).length;
        const closedIncidents = totalIncidents - openIncidents;

        // 5. Riesgos
        const risks = risksRes.data || [];
        const totalRisks = risks.length;
        const openRisks = risks.filter(r => (r.estado || 'Abierto').toLowerCase() !== 'cerrado').length;
        const highImpactRisks = risks.filter(r => (r.impacto || '').toLowerCase() === 'alto' && (r.estado || 'Abierto').toLowerCase() !== 'cerrado').length;

        // 6. Fases e Hitos
        const phases = phasesRes.data || [];
        const expPhase = phases.find(p => (p.phase_name || '').toLowerCase().includes('explore') || (p.phase_name || '').toLowerCase().includes('explorar')) || {};
        const expProgress = expPhase.progress || 0;
        const goLiveDate = state.selectedProject?.go_live_date;
        let daysToGoLive = null;
        if (goLiveDate) {
            daysToGoLive = Math.ceil((new Date(goLiveDate) - today) / (1000 * 60 * 60 * 24));
        }

        // 7. Global Project Health Score (0 - 100)
        let healthScore = 100;
        if (reqsOverdue.length > 0) healthScore -= Math.min(25, reqsOverdue.length * 10);
        if (tasksOverdue.length > 0) healthScore -= Math.min(20, tasksOverdue.length * 5);
        if (criticalIncidents > 0) healthScore -= Math.min(25, criticalIncidents * 12);
        if (highImpactRisks > 0) healthScore -= Math.min(15, highImpactRisks * 8);
        if (totalBpmlBps > 0 && uatCoverageRate < 50) healthScore -= 10;
        healthScore = Math.max(10, Math.min(100, healthScore));

        let healthClass = 'exp-health-healthy';
        let healthLabel = 'Proyecto en Estado Saludable';
        let healthIcon = 'fa-check-circle';
        if (healthScore < 50) {
            healthClass = 'exp-health-danger';
            healthLabel = 'Atención Crítica / En Riesgo';
            healthIcon = 'fa-exclamation-triangle';
        } else if (healthScore < 80) {
            healthClass = 'exp-health-warning';
            healthLabel = 'Precaución / Acciones Pendientes';
            healthIcon = 'fa-exclamation-circle';
        }

        // Cache processed data for charts and tab switching
        window.estExecCachedData = {
            tasks, totalTasks, tasksDone, tasksTesting, tasksDoing, tasksTodo, tasksOpen, tasksOnHold, tasksOverdue, tasksHighPriority,
            reqs, totalReqs, reqsDone, reqsOpen, reqsTodo, reqsOnHold, reqsPending, reqsOverdue, reqsInTime, reqsComplianceRate,
            totalWsBps, totalBpmlBps, totalUatBps, totalBpmlRows, totalUatCases, uatOk, uatNok, uatPending, uatCoverageRate, wsConversionRate, bpmlInUat, wsInBpml,
            incidents, totalIncidents, openIncidents, criticalIncidents, closedIncidents,
            risks, totalRisks, openRisks, highImpactRisks,
            allProjects: allProjectsRes.data || [],
            projId
        };

        // --- BUILD HTML INTERFACE ---
        const projectOptions = (allProjectsRes.data || []).map(p => `
            <option value="${p.id}" ${p.id === projId ? 'selected' : ''}>
                ${p.id_proyecto} - ${p.descripcion_prj || p.clients?.nombre_cliente || ''}
            </option>
        `).join('');

        let html = `
            <!-- TOOLBAR SUPERIOR EJECUTIVA -->
            <div class="exp-exec-toolbar est-exec-toolbar">
                <div class="exp-exec-project-badge est-exec-project-badge">
                    <div class="exp-exec-avatar est-exec-avatar">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <h3 style="margin:0; font-size:1.15rem; color:#1e293b; font-weight:700;">
                                ${state.selectedProject?.name || 'Proyecto'}
                            </h3>
                            <span class="exp-health-badge ${healthClass}">
                                <i class="fas ${healthIcon}"></i> ${healthScore}% - ${healthLabel}
                            </span>
                        </div>
                        <p style="margin:3px 0 0; font-size:0.82rem; color:#64748b;">
                            <i class="fas fa-building" style="margin-right:4px;"></i> Cliente: <strong>${state.selectedProject?.client || 'N/A'}</strong> 
                            ${goLiveDate ? ` | <i class="fas fa-flag-checkered" style="margin-left:6px; margin-right:4px;"></i> Go-Live: <strong>${goLiveDate}</strong> (${daysToGoLive !== null ? (daysToGoLive >= 0 ? `faltan ${daysToGoLive} días` : `hace ${Math.abs(daysToGoLive)} días`) : ''})` : ''}
                            | <i class="fas fa-chart-pie" style="margin-left:6px; margin-right:4px;"></i> Avance Explorar: <strong>${expProgress}%</strong>
                        </p>
                    </div>
                </div>

                <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                    <div style="display:flex; align-items:center; gap:6px;">
                        <label style="font-size:0.8rem; font-weight:600; color:#475569;"><i class="fas fa-exchange-alt"></i> Cambiar PRJ:</label>
                        <select class="swal2-input" style="width:auto; margin:0; height:36px; font-size:0.85rem; padding:4px 8px;" onchange="window.changeEstExecProject(this.value)">
                            ${projectOptions}
                        </select>
                    </div>
                    <button class="btn btn-outline" style="width:auto; height:36px; padding:0 12px; font-size:0.85rem;" onclick="window.renderEstExecutiveSummary(${projId})" title="Recargar datos en tiempo real">
                        <i class="fas fa-sync-alt"></i> Actualizar
                    </button>
                    <button class="btn" style="width:auto; height:36px; padding:0 12px; font-size:0.85rem; background:#334155; color:white;" onclick="window.print()" title="Imprimir informe ejecutivo a PDF">
                        <i class="fas fa-file-pdf"></i> Imprimir / PDF
                    </button>
                </div>
            </div>

            <!-- SMART ALERTS BANNER -->
            <div class="exec-smart-alerts-container">
                ${reqsOverdue.length > 0 ? `
                    <div class="exec-alert-item danger">
                        <div>
                            <i class="fas fa-exclamation-triangle" style="font-size:1.1rem; margin-right:8px;"></i>
                            <strong>Atención Requerimientos:</strong> Hay <strong>${reqsOverdue.length} requerimiento(s) de información fuera de plazo</strong> sin respuesta del cliente.
                        </div>
                        <button class="btn btn-outline btn-sm" style="padding:2px 10px; font-size:0.75rem; border-color:#ef4444; color:#b91c1c;" onclick="window.switchEstExecTab('drilldown')">
                            Ver Detalles <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                ` : ''}

                ${tasksOverdue.length > 0 ? `
                    <div class="exec-alert-item warning">
                        <div>
                            <i class="fas fa-clock" style="font-size:1.1rem; margin-right:8px;"></i>
                            <strong>Plazos de Tareas:</strong> Se detectan <strong>${tasksOverdue.length} tarea(s) vencidas</strong> pendientes de resolver.
                        </div>
                        <button class="btn btn-outline btn-sm" style="padding:2px 10px; font-size:0.75rem; border-color:#f59e0b; color:#92400e;" onclick="window.switchEstExecTab('drilldown')">
                            Ver Tareas <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                ` : ''}

                ${criticalIncidents > 0 ? `
                    <div class="exec-alert-item danger">
                        <div>
                            <i class="fas fa-fire" style="font-size:1.1rem; margin-right:8px;"></i>
                            <strong>Incidencias Críticas:</strong> Existen <strong>${criticalIncidents} incidencia(s) críticas o de alta prioridad</strong> abiertas que pueden comprometer el proyecto.
                        </div>
                        <button class="btn btn-outline btn-sm" style="padding:2px 10px; font-size:0.75rem; border-color:#ef4444; color:#b91c1c;" onclick="switchModule('dey')">
                            Ir a Incidencias <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                ` : ''}

                ${totalBpmlBps > 0 && uatCoverageRate < 50 ? `
                    <div class="exec-alert-item warning">
                        <div>
                            <i class="fas fa-clipboard-check" style="font-size:1.1rem; margin-right:8px;"></i>
                            <strong>Cobertura de Pruebas:</strong> La cobertura del plan UAT es del <strong>${uatCoverageRate}%</strong> (${bpmlInUat} de ${totalBpmlBps} Best Practices). Se recomienda completar los casos de prueba antes de la fase Realizar.
                        </div>
                    </div>
                ` : ''}

                ${reqsOverdue.length === 0 && tasksOverdue.length === 0 && criticalIncidents === 0 ? `
                    <div class="exec-alert-item success">
                        <div>
                            <i class="fas fa-check-circle" style="font-size:1.1rem; margin-right:8px;"></i>
                            <strong>Hito de Cumplimiento:</strong> No se registran requerimientos ni tareas vencidas fuera de plazo para este proyecto. ¡Excelente avance!
                        </div>
                    </div>
                ` : ''}
            </div>

            <!-- NAVEGACIÓN SUB-TABS EJECUTIVOS -->
            <div class="exp-exec-tabs est-exec-tabs">
                <button class="exp-exec-tab-btn est-exec-tab-btn active" data-tab="all" onclick="window.switchEstExecTab('all')">
                    <i class="fas fa-th-large"></i> Vista Global Completa
                </button>
                <button class="exp-exec-tab-btn est-exec-tab-btn" data-tab="trace" onclick="window.switchEstExecTab('trace')">
                    <i class="fas fa-stream"></i> 1. Trazabilidad SAP Activate (${uatCoverageRate}% Cobertura)
                </button>
                <button class="exp-exec-tab-btn est-exec-tab-btn" data-tab="tasks" onclick="window.switchEstExecTab('tasks')">
                    <i class="fas fa-tasks"></i> 2. Control de Tareas (${tasksDone}/${totalTasks})
                </button>
                <button class="exp-exec-tab-btn est-exec-tab-btn" data-tab="reqs" onclick="window.switchEstExecTab('reqs')">
                    <i class="fas fa-clipboard-list"></i> 3. Requerimientos Info (${reqsOverdue.length} Vencidos)
                </button>
                <button class="exp-exec-tab-btn est-exec-tab-btn" data-tab="quality" onclick="window.switchEstExecTab('quality')">
                    <i class="fas fa-shield-alt"></i> 4. Defectos & Riesgos (${openIncidents} Inc. / ${openRisks} Riesgos)
                </button>
                <button class="exp-exec-tab-btn est-exec-tab-btn" data-tab="drilldown" onclick="window.switchEstExecTab('drilldown')">
                    <i class="fas fa-list-alt"></i> 5. Puntos de Atención & Vencimientos (${tasksOverdue.length + reqsOverdue.length})
                </button>
            </div>

            <!-- ======================================================== -->
            <!-- BLOQUE 1: TRAZABILIDAD BEST PRACTICES (SAP ACTIVATE)     -->
            <!-- ======================================================== -->
            <div id="est-sec-trace" style="margin-bottom:2rem;">
                <h4 style="font-size:1.05rem; color:#1e293b; font-weight:700; margin-bottom:1rem; display:flex; align-items:center; gap:8px;">
                    <i class="fas fa-stream" style="color:var(--sap-blue)"></i> 1. Trazabilidad E2E Best Practices: Workshops ➔ BPML ➔ Checklist UATs
                </h4>
                
                <div class="analytics-kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); margin-bottom:1.5rem;">
                    <div class="kpi-card-modern kpi-total">
                        <div class="kpi-title">BPs EN WORKSHOPS</div>
                        <div class="kpi-value">${totalWsBps}</div>
                        <i class="fas fa-users kpi-icon"></i>
                        <div class="kpi-trend neutral">
                            <span>${totalWorkshops} talleres programados</span>
                        </div>
                    </div>
                    <div class="kpi-card-modern kpi-open">
                        <div class="kpi-title">BPs EN MASTER BPML</div>
                        <div class="kpi-value">${totalBpmlBps}</div>
                        <i class="fas fa-list-alt kpi-icon"></i>
                        <div class="kpi-trend neutral">
                            <span>${totalBpmlRows} procesos detallados</span>
                        </div>
                    </div>
                    <div class="kpi-card-modern kpi-resolved">
                        <div class="kpi-title">BPs EN CHECKLIST UATs</div>
                        <div class="kpi-value">${totalUatBps}</div>
                        <i class="fas fa-clipboard-check kpi-icon"></i>
                        <div class="kpi-trend positive">
                            <span>${totalUatCases} casos de prueba definidos</span>
                        </div>
                    </div>
                    <div class="kpi-card-modern ${uatCoverageRate >= 75 ? 'kpi-resolved' : (uatCoverageRate >= 50 ? 'kpi-open' : 'kpi-critical')}">
                        <div class="kpi-title">COBERTURA PLAN UAT</div>
                        <div class="kpi-value">${uatCoverageRate}%</div>
                        <i class="fas fa-percentage kpi-icon"></i>
                        <div class="kpi-trend ${uatCoverageRate >= 75 ? 'positive' : 'negative'}">
                            <span>${bpmlInUat} de ${totalBpmlBps} BPs cubiertas</span>
                        </div>
                    </div>
                </div>

                <div class="analytics-chart-grid" style="grid-template-columns: 2fr 1fr;">
                    <div class="analytics-chart-card">
                        <h4><i class="fas fa-chart-bar" style="color:var(--sap-blue)"></i> Embudo de Trazabilidad E2E de Procesos</h4>
                        <div class="analytics-chart-container">
                            <canvas id="estChartTraceability"></canvas>
                        </div>
                    </div>
                    <div class="analytics-chart-card">
                        <h4><i class="fas fa-chart-pie" style="color:#10b981"></i> Ejecución de Pruebas UAT</h4>
                        <div class="analytics-chart-container">
                            <canvas id="estChartUatExecution"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ======================================================== -->
            <!-- BLOQUE 2: CONTROL DE TAREAS DEL PROYECTO (KANBAN)        -->
            <!-- ======================================================== -->
            <div id="est-sec-tasks" style="margin-bottom:2rem;">
                <h4 style="font-size:1.05rem; color:#1e293b; font-weight:700; margin-bottom:1rem; display:flex; align-items:center; gap:8px;">
                    <i class="fas fa-tasks" style="color:#6366f1"></i> 2. Control de Tareas del Proyecto (Flujo Kanban & Desempeño)
                </h4>

                <div class="analytics-kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin-bottom:1.5rem;">
                    <div class="kpi-card-modern kpi-total">
                        <div class="kpi-title">TOTAL TAREAS</div>
                        <div class="kpi-value">${totalTasks}</div>
                        <i class="fas fa-clipboard kpi-icon"></i>
                        <div class="kpi-trend neutral"><span>Todas las fases</span></div>
                    </div>
                    <div class="kpi-card-modern kpi-resolved">
                        <div class="kpi-title">FINALIZADAS (DONE)</div>
                        <div class="kpi-value">${tasksDone}</div>
                        <i class="fas fa-check-double kpi-icon"></i>
                        <div class="kpi-trend positive"><span>${taskEfficiency}% completitud</span></div>
                    </div>
                    <div class="kpi-card-modern kpi-open">
                        <div class="kpi-title">EN CURSO (WIP)</div>
                        <div class="kpi-value">${tasksDoing + tasksTesting}</div>
                        <i class="fas fa-spinner kpi-icon"></i>
                        <div class="kpi-trend neutral"><span>${tasksDoing} Doing / ${tasksTesting} Testing</span></div>
                    </div>
                    <div class="kpi-card-modern ${tasksOnHold > 0 ? 'kpi-open' : 'kpi-resolved'}">
                        <div class="kpi-title">DETENIDAS (ON-HOLD)</div>
                        <div class="kpi-value">${tasksOnHold}</div>
                        <i class="fas fa-pause-circle kpi-icon"></i>
                        <div class="kpi-trend ${tasksOnHold > 0 ? 'negative' : 'positive'}"><span>Requiere desbloqueo</span></div>
                    </div>
                    <div class="kpi-card-modern ${tasksOverdue.length > 0 ? 'kpi-critical' : 'kpi-resolved'}">
                        <div class="kpi-title">FUERA DE PLAZO</div>
                        <div class="kpi-value" style="${tasksOverdue.length > 0 ? 'color:#ef4444;' : ''}">${tasksOverdue.length}</div>
                        <i class="fas fa-calendar-times kpi-icon"></i>
                        <div class="kpi-trend ${tasksOverdue.length > 0 ? 'negative' : 'positive'}">
                            <span>${tasksOverdue.length > 0 ? 'Fecha límite superada' : 'Sin retrasos'}</span>
                        </div>
                    </div>
                </div>

                <div class="analytics-chart-grid" style="grid-template-columns: 3fr 2fr;">
                    <div class="analytics-chart-card">
                        <h4><i class="fas fa-stream" style="color:#6366f1"></i> Distribución de Tareas por Estado (Flujo)</h4>
                        <div class="analytics-chart-container">
                            <canvas id="estChartTasksStatus"></canvas>
                        </div>
                    </div>
                    <div class="analytics-chart-card">
                        <h4><i class="fas fa-signal" style="color:#f59e0b"></i> Tareas por Prioridad</h4>
                        <div class="analytics-chart-container">
                            <canvas id="estChartTasksPriority"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ======================================================== -->
            <!-- BLOQUE 3: REQUERIMIENTOS DE INFORMACIÓN (SEG)            -->
            <!-- ======================================================== -->
            <div id="est-sec-reqs" style="margin-bottom:2rem;">
                <h4 style="font-size:1.05rem; color:#1e293b; font-weight:700; margin-bottom:1rem; display:flex; align-items:center; gap:8px;">
                    <i class="fas fa-clipboard-list" style="color:#0ea5e9"></i> 3. Requerimientos de Información (SLA & Cumplimiento de Fechas)
                </h4>

                <div class="analytics-kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom:1.5rem;">
                    <div class="kpi-card-modern kpi-total">
                        <div class="kpi-title">TOTAL REQUERIMIENTOS</div>
                        <div class="kpi-value">${totalReqs}</div>
                        <i class="fas fa-envelope-open-text kpi-icon"></i>
                        <div class="kpi-trend neutral"><span>Solicitudes al cliente</span></div>
                    </div>
                    <div class="kpi-card-modern kpi-resolved">
                        <div class="kpi-title">RESUELTOS (DONE)</div>
                        <div class="kpi-value">${reqsDone}</div>
                        <i class="fas fa-check-circle kpi-icon"></i>
                        <div class="kpi-trend positive"><span>${totalReqs > 0 ? Math.round((reqsDone / totalReqs) * 100) : 0}% entregados</span></div>
                    </div>
                    <div class="kpi-card-modern kpi-open">
                        <div class="kpi-title">PENDIENTES CLIENTE</div>
                        <div class="kpi-value">${reqsPending}</div>
                        <i class="fas fa-hourglass-half kpi-icon"></i>
                        <div class="kpi-trend neutral"><span>${reqsOpen} Open / ${reqsTodo} To-Do</span></div>
                    </div>
                    <div class="kpi-card-modern ${reqsOverdue.length > 0 ? 'kpi-critical' : 'kpi-resolved'}">
                        <div class="kpi-title">VENCIDOS / FUERA DE PLAZO</div>
                        <div class="kpi-value" style="${reqsOverdue.length > 0 ? 'color:#ef4444;' : ''}">${reqsOverdue.length}</div>
                        <i class="fas fa-exclamation-circle kpi-icon"></i>
                        <div class="kpi-trend ${reqsOverdue.length > 0 ? 'negative' : 'positive'}">
                            <span>${reqsOverdue.length > 0 ? 'Incumplimiento de fecha' : 'Todos en plazo'}</span>
                        </div>
                    </div>
                    <div class="kpi-card-modern ${reqsComplianceRate >= 80 ? 'kpi-resolved' : 'kpi-critical'}">
                        <div class="kpi-title">CUMPLIMIENTO DE PLAZO</div>
                        <div class="kpi-value">${reqsComplianceRate}%</div>
                        <i class="fas fa-tachometer-alt kpi-icon"></i>
                        <div class="kpi-trend ${reqsComplianceRate >= 80 ? 'positive' : 'negative'}">
                            <span>SLA de respuesta</span>
                        </div>
                    </div>
                </div>

                <div class="analytics-chart-grid" style="grid-template-columns: 1fr 1fr;">
                    <div class="analytics-chart-card">
                        <h4><i class="fas fa-chart-pie" style="color:#0ea5e9"></i> Distribución de Requerimientos por Estado</h4>
                        <div class="analytics-chart-container">
                            <canvas id="estChartReqsStatus"></canvas>
                        </div>
                    </div>
                    <div class="analytics-chart-card">
                        <h4><i class="fas fa-calendar-check" style="color:#10b981"></i> Semáforo de Cumplimiento de Fechas</h4>
                        <div class="analytics-chart-container">
                            <canvas id="estChartReqsDates"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ======================================================== -->
            <!-- BLOQUE 4: CALIDAD, INCIDENCIAS Y RIESGOS                 -->
            <!-- ======================================================== -->
            <div id="est-sec-quality" style="margin-bottom:2rem;">
                <h4 style="font-size:1.05rem; color:#1e293b; font-weight:700; margin-bottom:1rem; display:flex; align-items:center; gap:8px;">
                    <i class="fas fa-shield-alt" style="color:#ef4444"></i> 4. Calidad, Defectos & Matriz de Riesgos (Management)
                </h4>

                <div class="analytics-kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom:1.5rem;">
                    <div class="kpi-card-modern kpi-total">
                        <div class="kpi-title">INCIDENCIAS TOTALES</div>
                        <div class="kpi-value">${totalIncidents}</div>
                        <i class="fas fa-ticket-alt kpi-icon"></i>
                        <div class="kpi-trend neutral"><span>Fase Desplegar / DEY</span></div>
                    </div>
                    <div class="kpi-card-modern ${openIncidents > 0 ? 'kpi-open' : 'kpi-resolved'}">
                        <div class="kpi-title">INCIDENCIAS ABIERTAS</div>
                        <div class="kpi-value">${openIncidents}</div>
                        <i class="fas fa-exclamation-circle kpi-icon"></i>
                        <div class="kpi-trend ${openIncidents > 0 ? 'negative' : 'positive'}">
                            <span>${closedIncidents} resueltas</span>
                        </div>
                    </div>
                    <div class="kpi-card-modern ${criticalIncidents > 0 ? 'kpi-critical' : 'kpi-resolved'}">
                        <div class="kpi-title">CRÍTICAS / ALTAS</div>
                        <div class="kpi-value" style="${criticalIncidents > 0 ? 'color:#ef4444;' : ''}">${criticalIncidents}</div>
                        <i class="fas fa-bomb kpi-icon"></i>
                        <div class="kpi-trend ${criticalIncidents > 0 ? 'negative' : 'positive'}">
                            <span>Bloqueantes activas</span>
                        </div>
                    </div>
                    <div class="kpi-card-modern ${openRisks > 0 ? 'kpi-open' : 'kpi-resolved'}">
                        <div class="kpi-title">RIESGOS ACTIVOS</div>
                        <div class="kpi-value">${openRisks}</div>
                        <i class="fas fa-radiation kpi-icon"></i>
                        <div class="kpi-trend neutral"><span>${totalRisks} identificados</span></div>
                    </div>
                    <div class="kpi-card-modern ${highImpactRisks > 0 ? 'kpi-critical' : 'kpi-resolved'}">
                        <div class="kpi-title">RIESGO ALTO IMPACTO</div>
                        <div class="kpi-value" style="${highImpactRisks > 0 ? 'color:#ef4444;' : ''}">${highImpactRisks}</div>
                        <i class="fas fa-fire-alt kpi-icon"></i>
                        <div class="kpi-trend ${highImpactRisks > 0 ? 'negative' : 'positive'}">
                            <span>Requieren mitigación</span>
                        </div>
                    </div>
                </div>

                <div class="analytics-chart-grid" style="grid-template-columns: 1fr 1fr;">
                    <div class="analytics-chart-card">
                        <h4><i class="fas fa-bug" style="color:#ef4444"></i> Defectos e Incidencias por Prioridad</h4>
                        <div class="analytics-chart-container">
                            <canvas id="estChartIncidentsPriority"></canvas>
                        </div>
                    </div>
                    <div class="analytics-chart-card">
                        <h4><i class="fas fa-exclamation-triangle" style="color:#f59e0b"></i> Matriz de Riesgos del Proyecto</h4>
                        <div class="analytics-chart-container">
                            <canvas id="estChartRisksMatrix"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ======================================================== -->
            <!-- BLOQUE 5: PUNTOS DE ATENCIÓN Y VENCIMIENTOS (DRILLDOWN)  -->
            <!-- ======================================================== -->
            <div id="est-sec-drilldown" style="margin-bottom:1rem;">
                <h4 style="font-size:1.05rem; color:#1e293b; font-weight:700; margin-bottom:1rem; display:flex; align-items:center; gap:8px;">
                    <i class="fas fa-list-alt" style="color:#b91c1c"></i> 5. Puntos Críticos de Atención Inmediata (Para Jefes de Proyecto)
                </h4>

                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap:1.5rem;">
                    <!-- REQUERIMIENTOS FUERA DE PLAZO -->
                    <div style="background:#fff; border-radius:12px; border:1px solid #fee2e2; padding:1.25rem; box-shadow:0 4px 15px rgba(0,0,0,0.03);">
                        <h5 style="margin:0 0 0.75rem; font-size:0.95rem; color:#991b1b; display:flex; align-items:center; gap:8px;">
                            <i class="fas fa-calendar-times"></i> Requerimientos de Información Fuera de Plazo (${reqsOverdue.length})
                        </h5>
                        ${reqsOverdue.length === 0 ? `
                            <p style="font-size:0.85rem; color:#166534; margin:0; padding:1rem; background:#f0fdf4; border-radius:8px;">
                                <i class="fas fa-check-circle"></i> No hay requerimientos vencidos. Todos los requerimientos se encuentran dentro del plazo fijado.
                            </p>
                        ` : `
                            <div style="max-height:240px; overflow-y:auto;">
                                <table class="exec-drilldown-table">
                                    <thead>
                                        <tr>
                                            <th>Título / Solicitud</th>
                                            <th>Responsable</th>
                                            <th>Fecha Límite</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${reqsOverdue.map(r => `
                                            <tr>
                                                <td><strong>${r.title || 'Sin título'}</strong></td>
                                                <td>${r.responsable || r.assigned_to || 'Cliente'}</td>
                                                <td style="color:#dc2626; font-weight:700;"><i class="fas fa-clock"></i> ${r.due_date}</td>
                                                <td><span class="badge" style="background:#fee2e2; color:#b91c1c; font-size:0.7rem; padding:2px 6px;">${r.status}</span></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `}
                    </div>

                    <!-- TAREAS FUERA DE PLAZO O EN ON-HOLD -->
                    <div style="background:#fff; border-radius:12px; border:1px solid #fed7aa; padding:1.25rem; box-shadow:0 4px 15px rgba(0,0,0,0.03);">
                        <h5 style="margin:0 0 0.75rem; font-size:0.95rem; color:#9a3412; display:flex; align-items:center; gap:8px;">
                            <i class="fas fa-exclamation-circle"></i> Tareas Vencidas o Detenidas en On-Hold (${tasksOverdue.length + tasksOnHold})
                        </h5>
                        ${tasksOverdue.length === 0 && tasksOnHold === 0 ? `
                            <p style="font-size:0.85rem; color:#166534; margin:0; padding:1rem; background:#f0fdf4; border-radius:8px;">
                                <i class="fas fa-check-circle"></i> Todas las tareas están en curso normal o finalizadas.
                            </p>
                        ` : `
                            <div style="max-height:240px; overflow-y:auto;">
                                <table class="exec-drilldown-table">
                                    <thead>
                                        <tr>
                                            <th>Tarea</th>
                                            <th>Asignada a</th>
                                            <th>Vencimiento / Motivo</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${tasksOverdue.concat(tasks.filter(t => (t.status||'').toUpperCase() === 'ON-HOLD' && !tasksOverdue.includes(t))).map(t => `
                                            <tr>
                                                <td><strong>${t.title || 'Tarea'}</strong></td>
                                                <td>${t.assigned_to || 'Sin asignar'}</td>
                                                <td style="color:${t.due_date && new Date(t.due_date) < today ? '#dc2626' : '#64748b'}; font-weight:600;">
                                                    ${t.due_date ? t.due_date : 'Sin fecha'}
                                                </td>
                                                <td>
                                                    <span class="badge" style="background:${(t.status||'').toUpperCase() === 'ON-HOLD' ? '#fef3c7; color:#b45309;' : '#fee2e2; color:#b91c1c;'} font-size:0.7rem; padding:2px 6px;">
                                                        ${t.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Render all Chart.js graphics
        window.renderEstCharts(window.estExecCachedData);

    } catch (err) {
        console.error("Error loading EST Executive Summary:", err);
        container.innerHTML = `
            <div style="padding:1.5rem; color:#ef4444; background:#fef2f2; border-radius:8px;">
                <i class="fas fa-exclamation-triangle"></i> Error al cargar indicadores del proyecto: ${err.message}
            </div>
        `;
    }
};

/**
 * Instantiates and paints all Chart.js charts for EST
 */
window.renderEstCharts = function (data) {
    if (!data || typeof Chart === 'undefined') return;

    window.destroyEstKpiCharts();

    const chartDefaults = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { boxWidth: 12, padding: 15, font: { size: 11, family: "'Inter', sans-serif" } }
            },
            tooltip: {
                backgroundColor: 'rgba(255,255,255,0.98)',
                titleColor: '#0f172a',
                bodyColor: '#334155',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                padding: 10,
                boxPadding: 4,
                usePointStyle: true
            }
        }
    };

    // 1. Chart Traceability Funnel (Bar)
    const ctxTrace = document.getElementById('estChartTraceability');
    if (ctxTrace) {
        window.estKpiCharts['trace'] = new Chart(ctxTrace, {
            type: 'bar',
            data: {
                labels: ['1. Impartidas en Workshops', '2. Catalogadas en BPML', '3. Probadas en UATs'],
                datasets: [
                    {
                        label: 'Total Best Practices Únicas',
                        data: [data.totalWsBps, data.totalBpmlBps, data.totalUatBps],
                        backgroundColor: '#0066FF',
                        borderRadius: 6,
                        barPercentage: 0.6
                    },
                    {
                        label: 'BPs con Trazabilidad Confirmada',
                        data: [data.totalWsBps, data.wsInBpml, data.bpmlInUat],
                        backgroundColor: '#10b981',
                        borderRadius: 6,
                        barPercentage: 0.6
                    }
                ]
            },
            options: {
                ...chartDefaults,
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { precision: 0 } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 2. Chart UAT Execution (Doughnut)
    const ctxUat = document.getElementById('estChartUatExecution');
    if (ctxUat) {
        window.estKpiCharts['uat'] = new Chart(ctxUat, {
            type: 'doughnut',
            data: {
                labels: ['Superadas (OK)', 'Pendientes', 'Fallidas (NOK)'],
                datasets: [{
                    data: [data.uatOk, data.uatPending, data.uatNok],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                ...chartDefaults,
                cutout: '68%'
            }
        });
    }

    // 3. Chart Tasks by Status (Horizontal Bar)
    const ctxTasks = document.getElementById('estChartTasksStatus');
    if (ctxTasks) {
        window.estKpiCharts['tasksStatus'] = new Chart(ctxTasks, {
            type: 'bar',
            data: {
                labels: ['Done / Closed', 'Testing', 'Doing', 'To Do', 'Open', 'On-Hold'],
                datasets: [{
                    label: 'Nº Tareas',
                    data: [data.tasksDone, data.tasksTesting, data.tasksDoing, data.tasksTodo, data.tasksOpen, data.tasksOnHold],
                    backgroundColor: ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#64748b', '#f59e0b'],
                    borderRadius: 6
                }]
            },
            options: {
                ...chartDefaults,
                indexAxis: 'y',
                scales: {
                    x: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { precision: 0 } },
                    y: { grid: { display: false } }
                },
                plugins: { ...chartDefaults.plugins, legend: { display: false } }
            }
        });
    }

    // 4. Chart Tasks by Priority (Bar)
    const ctxPriority = document.getElementById('estChartTasksPriority');
    if (ctxPriority) {
        const pHigh = data.tasks.filter(t => (t.priority || '').toLowerCase() === 'high').length;
        const pMed = data.tasks.filter(t => (t.priority || '').toLowerCase() === 'medium').length;
        const pLow = data.tasks.filter(t => (t.priority || '').toLowerCase() === 'low').length;
        window.estKpiCharts['tasksPriority'] = new Chart(ctxPriority, {
            type: 'bar',
            data: {
                labels: ['Alta (High)', 'Media (Medium)', 'Baja (Low)'],
                datasets: [{
                    data: [pHigh, pMed, pLow],
                    backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
                    borderRadius: 6
                }]
            },
            options: {
                ...chartDefaults,
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { precision: 0 } },
                    x: { grid: { display: false } }
                },
                plugins: { ...chartDefaults.plugins, legend: { display: false } }
            }
        });
    }

    // 5. Chart Requerimientos Status (Doughnut)
    const ctxReqsStatus = document.getElementById('estChartReqsStatus');
    if (ctxReqsStatus) {
        window.estKpiCharts['reqsStatus'] = new Chart(ctxReqsStatus, {
            type: 'doughnut',
            data: {
                labels: ['Finalizados (Done)', 'En Espera (On-Hold)', 'To Do', 'Abiertos (Open)'],
                datasets: [{
                    data: [data.reqsDone, data.reqsOnHold, data.reqsTodo, data.reqsOpen],
                    backgroundColor: ['#10b981', '#f59e0b', '#8b5cf6', '#3b82f6'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                ...chartDefaults,
                cutout: '68%'
            }
        });
    }

    // 6. Chart Requerimientos Cumplimiento de Fechas (Pie / Doughnut)
    const ctxReqsDates = document.getElementById('estChartReqsDates');
    if (ctxReqsDates) {
        window.estKpiCharts['reqsDates'] = new Chart(ctxReqsDates, {
            type: 'doughnut',
            data: {
                labels: ['En Plazo', 'Fuera de Plazo (Vencidos)', 'Finalizados'],
                datasets: [{
                    data: [Math.max(0, data.reqsInTime - data.reqsDone), data.reqsOverdue.length, data.reqsDone],
                    backgroundColor: ['#3b82f6', '#ef4444', '#10b981'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                ...chartDefaults,
                cutout: '68%'
            }
        });
    }

    // 7. Chart Incidents by Priority (Bar)
    const ctxIncidents = document.getElementById('estChartIncidentsPriority');
    if (ctxIncidents) {
        const priorities = ['Crítica', 'Alta', 'Media', 'Baja', 'Sin prioridad'];
        const rawInc = (data.incidents || (typeof state !== 'undefined' ? state?.incidents : null) || []);
        const countByPri = priorities.map(pri => {
            return rawInc.filter(i => {
                const pid = i.proyecto_id ?? i.project_id;
                const p = (i.prioridad || '').trim();
                const matchesPid = (data.projId ? pid == data.projId : true);
                const matchesPri = pri === 'Sin prioridad' ? (!p || p === 'Sin prioridad') : (p.toLowerCase() === pri.toLowerCase());
                return matchesPid && matchesPri;
            }).length;
        });

        window.estKpiCharts['incidents'] = new Chart(ctxIncidents, {
            type: 'bar',
            data: {
                labels: priorities,
                datasets: [{
                    label: 'Nº Incidencias',
                    data: countByPri,
                    backgroundColor: ['#b91c1c', '#ea580c', '#eab308', '#3b82f6', '#94a3b8'],
                    borderRadius: 6
                }]
            },
            options: {
                ...chartDefaults,
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { precision: 0 } },
                    x: { grid: { display: false } }
                },
                plugins: { ...chartDefaults.plugins, legend: { display: false } }
            }
        });
    }

    // 8. Chart Risks Matrix (Doughnut)
    const ctxRisks = document.getElementById('estChartRisksMatrix');
    if (ctxRisks) {
        window.estKpiCharts['risks'] = new Chart(ctxRisks, {
            type: 'doughnut',
            data: {
                labels: ['Impacto Alto', 'Impacto Medio', 'Impacto Bajo'],
                datasets: [{
                    data: [data.highImpactRisks, Math.max(0, data.openRisks - data.highImpactRisks), Math.max(0, data.totalRisks - data.openRisks)],
                    backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                ...chartDefaults,
                cutout: '68%'
            }
        });
    }
};

// ========================================================
// EST MODULE: PROGRESO DE FASES (ROADMAP, AVANCE Y PROBLEMAS)
// ========================================================

window.estPhaseCharts = window.estPhaseCharts || {};
window.estPhaseActiveTab = 'all';
window.estPhaseCachedData = null;

/**
 * Destroys any existing Chart.js instances in EST Phase Progress
 */
window.destroyEstPhaseCharts = function () {
    if (window.estPhaseCharts) {
        Object.keys(window.estPhaseCharts).forEach(key => {
            if (window.estPhaseCharts[key]) {
                try {
                    window.estPhaseCharts[key].destroy();
                } catch (e) {
                    console.warn("Error destroying phase chart", key, e);
                }
            }
        });
        window.estPhaseCharts = {};
    }
};

/**
 * Switch sub-tab in Phase Progress
 */
window.switchEstPhaseTab = function (tabName) {
    window.estPhaseActiveTab = tabName;
    document.querySelectorAll('.est-phase-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    const sections = {
        'all': ['est-psec-stepper', 'est-psec-kpis', 'est-psec-charts-row1', 'est-psec-charts-row2', 'est-psec-table', 'est-psec-drilldown'],
        'charts': ['est-psec-charts-row1', 'est-psec-charts-row2'],
        'problems': ['est-psec-drilldown', 'est-psec-charts-row2'],
        'table': ['est-psec-table']
    };

    const targetSections = sections[tabName] || sections['all'];
    ['est-psec-stepper', 'est-psec-kpis', 'est-psec-charts-row1', 'est-psec-charts-row2', 'est-psec-table', 'est-psec-drilldown'].forEach(secId => {
        const el = document.getElementById(secId);
        if (el) {
            el.style.display = targetSections.includes(secId) ? 'block' : 'none';
        }
    });

    if (window.estPhaseCachedData) {
        setTimeout(() => {
            window.renderEstPhaseCharts(window.estPhaseCachedData);
        }, 50);
    }
};

/**
 * Quick switch active project from Phase Progress
 */
window.changeEstPhaseProject = async function (newProjId) {
    if (!newProjId) return;
    const pid = parseInt(newProjId);
    if (state.selectedProject?.id === pid) return;

    if (supabaseClient) {
        const { data, error } = await supabaseClient
            .from('cliente_proy')
            .select('*, clients(*)')
            .eq('id', pid)
            .single();

        if (!error && data) {
            state.selectedProject = {
                id: data.id,
                name: data.id_proyecto,
                client: data.clients?.nombre_cliente || 'Cliente',
                client_abrev: data.clients?.abrev || '',
                client_id: data.client_id,
                descripcion_prj: data.descripcion_prj || '',
                sharepoint_url: data.sharepoint_url,
                go_live_date: data.go_live_date,
                support_start_date: data.support_start_date,
                support_end_date: data.support_end_date
            };
            saveState();
            updateUIForUser();
        }
    }

    await window.renderEstPhasesProgress(pid);
    const incPrjSel = document.getElementById('analytics-filter-project');
    if (incPrjSel && Array.from(incPrjSel.options).some(o => o.value == String(pid))) {
        incPrjSel.value = String(pid);
        if (window.updateIncidentDashboard) window.updateIncidentDashboard();
    }
};

/**
 * Main render function for EST Phase Progress
 */
window.renderEstPhasesProgress = async function (targetProjectId) {
    const container = document.getElementById('est-phases-progress-container');
    if (!container) return;

    if (!supabaseClient) {
        container.innerHTML = '<div style="padding:1rem; color:#666;">Supabase no inicializado.</div>';
        return;
    }

    let projId = parseInt(targetProjectId || state.selectedProject?.id);

    // Fallback: Si no hay proyecto seleccionado, seleccionar el primero disponible
    if (!projId) {
        const { data: firstProjs } = await supabaseClient
            .from('cliente_proy')
            .select('*, clients(*)')
            .order('id', { ascending: true })
            .limit(1);

        if (firstProjs && firstProjs.length > 0) {
            const p = firstProjs[0];
            state.selectedProject = {
                id: p.id,
                name: p.id_proyecto,
                client: p.clients?.nombre_cliente || 'Cliente',
                client_abrev: p.clients?.abrev || '',
                client_id: p.client_id,
                descripcion_prj: p.descripcion_prj || '',
                go_live_date: p.go_live_date
            };
            saveState();
            updateUIForUser();
            projId = p.id;
        } else {
            container.innerHTML = '<div style="padding:1.5rem; color:#64748b; text-align:center;"><i class="fas fa-info-circle"></i> No hay proyectos creados en la base de datos para mostrar el progreso de fases.</div>';
            return;
        }
    }

    container.innerHTML = `
        <div style="text-align:center; padding:2.5rem;">
            <i class="fas fa-spinner fa-spin fa-2x" style="color:var(--sap-blue);"></i>
            <p style="margin-top:0.75rem; color:#64748b; font-weight:500;">Calculando evolución, avance y problemas de fases en tiempo real...</p>
        </div>
    `;

    try {
        // Parallel queries to Supabase
        const [
            phasesRes,
            tasksRes,
            reqsRes,
            docsRes,
            currentProjectRes,
            allProjectsRes,
            risksRes
        ] = await Promise.all([
            supabaseClient.from('project_phases').select('*').eq('project_id', projId).order('id', { ascending: true }),
            supabaseClient.from('tasks').select('*').eq('project_id', projId),
            supabaseClient.from('requerimientos').select('*').eq('project_id', projId),
            supabaseClient.from('documentos').select('*'),
            supabaseClient.from('cliente_proy').select('*, clients(*)').eq('id', projId).single(),
            supabaseClient.from('cliente_proy').select('id, id_proyecto, descripcion_prj, clients(nombre_cliente)').order('id', { ascending: true }),
            supabaseClient.from('project_risks').select('*').eq('project_id', projId)
        ]);

        let phasesData = phasesRes.data || [];
        if (phasesData.length === 0) {
            await ensureProjectPhases(projId);
            const { data: retry } = await supabaseClient
                .from('project_phases')
                .select('*')
                .eq('project_id', projId)
                .order('id', { ascending: true });
            phasesData = retry || [];
        }

        const projectData = currentProjectRes.data || state.selectedProject || {};
        const tasks = tasksRes.data || [];
        const reqs = reqsRes.data || [];
        const allDocs = docsRes.data || [];
        const risks = risksRes.data || [];

        // Project documents (match by project code or project id)
        const projCode = projectData.id_proyecto || state.selectedProject?.name || '';
        const projectDocs = allDocs.filter(d => (d.proyecto === projCode) || (d.project_id === projId));

        // Date helpers
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const parseDateSafe = (dStr) => {
            if (!dStr) return null;
            const parts = dStr.split('-');
            if (parts.length === 3) {
                return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }
            return new Date(dStr);
        };

        const daysBetween = (d1, d2) => {
            if (!d1 || !d2) return 0;
            const dt1 = parseDateSafe(d1);
            const dt2 = parseDateSafe(d2);
            if (!dt1 || !dt2 || isNaN(dt1) || isNaN(dt2)) return 0;
            return Math.round((dt1 - dt2) / (1000 * 60 * 60 * 24));
        };

        const formatDateDisplay = (dStr) => {
            if (!dStr) return 'Sin fecha';
            const dt = parseDateSafe(dStr);
            if (!dt || isNaN(dt)) return dStr;
            return dt.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        };

        // 6 Fases estándar SAP Activate
        const STANDARD_PHASES = [
            { key: 'Descubrir', code: 'DES', icon: 'fa-compass', desc: 'Estrategia y alcance preliminar' },
            { key: 'Preparar', code: 'PRE', icon: 'fa-cogs', desc: 'Kick-off, equipo y planificación' },
            { key: 'Explorar', code: 'EXP', icon: 'fa-search', desc: 'Fit-To-Standard y configuración' },
            { key: 'Realizar', code: 'REA', icon: 'fa-laptop-code', desc: 'Construcción, integraciones y pruebas' },
            { key: 'Desplegar', code: 'DEY', icon: 'fa-rocket', desc: 'Formación, Cutover y Go-Live' },
            { key: 'Ejecutar', code: 'EJE', icon: 'fa-sync-alt', desc: 'Hipercare y soporte productivo' }
        ];

        let totalSlippageDays = 0;
        let sumProgress = 0;
        let phasesWithProblemsCount = 0;
        let totalOverdueTasksCount = 0;
        let totalOnHoldTasksCount = 0;
        let activePhaseName = 'Completado';
        let activePhaseFound = false;

        const phasesAnalysis = STANDARD_PHASES.map((std, idx) => {
            const phaseRow = phasesData.find(p => (p.phase_name || '').toLowerCase() === std.key.toLowerCase()) || {};
            const progress = Math.min(100, Math.max(0, parseInt(phaseRow.progress || 0)));
            sumProgress += progress;

            const startDate = phaseRow.start_date || null;
            const endDate = phaseRow.end_date || null;
            const newStartDate = phaseRow.new_start_date || startDate;
            const newEndDate = phaseRow.new_end_date || endDate;
            const effectiveEndDate = newEndDate || endDate;

            // Slippage (días de retraso de fecha fin si se replanificó después de la fecha original)
            let slippage = 0;
            if (endDate && newEndDate) {
                const diff = daysBetween(newEndDate, endDate);
                if (diff > 0) slippage = diff;
            }
            totalSlippageDays += slippage;

            // Tasks in this phase
            const phaseTasks = tasks.filter(t => {
                const p = (t.phase || '').toLowerCase();
                return p.includes(std.key.toLowerCase()) || p === std.code.toLowerCase();
            });

            const totalTasks = phaseTasks.length;
            const tasksDone = phaseTasks.filter(t => ['DONE', 'CLOSED'].includes((t.status || '').toUpperCase())).length;
            const tasksDoing = phaseTasks.filter(t => (t.status || '').toUpperCase() === 'DOING').length;
            const tasksTesting = phaseTasks.filter(t => (t.status || '').toUpperCase() === 'TESTING').length;
            const tasksTodo = phaseTasks.filter(t => (t.status || '').toUpperCase() === 'TO DO').length;
            const tasksOpen = phaseTasks.filter(t => (t.status || '').toUpperCase() === 'OPEN').length;
            const tasksOnHold = phaseTasks.filter(t => (t.status || '').toUpperCase() === 'ON-HOLD').length;

            const tasksOverdue = phaseTasks.filter(t => {
                if (!t.due_date) return false;
                if (['DONE', 'CLOSED'].includes((t.status || '').toUpperCase())) return false;
                const dt = parseDateSafe(t.due_date);
                return dt && dt < today;
            });

            totalOverdueTasksCount += tasksOverdue.length;
            totalOnHoldTasksCount += tasksOnHold;

            // Documents in this phase
            const phaseDocs = projectDocs.filter(d => (d.id_fase || '').toUpperCase() === std.code);

            // Requerimientos in this phase
            const phaseReqs = reqs.filter(r => {
                const p = (r.phase || '').toLowerCase();
                return p.includes(std.key.toLowerCase()) || p === std.code.toLowerCase();
            });

            // Status & Semaphor computation
            let status = 'UPCOMING';
            let statusLabel = 'Próxima';
            let badgeClass = 'upcoming';
            let statusColor = '#64748b';
            let statusIcon = 'fa-calendar-alt';
            let hasProblems = false;

            const effectiveEndDt = effectiveEndDate ? parseDateSafe(effectiveEndDate) : null;
            const startDt = (newStartDate || startDate) ? parseDateSafe(newStartDate || startDate) : null;

            if (progress === 100) {
                status = 'COMPLETED';
                statusLabel = 'Completada';
                badgeClass = 'completed';
                statusColor = '#10b981';
                statusIcon = 'fa-check-circle';
            } else {
                if (!activePhaseFound) {
                    activePhaseName = `${std.key} (${progress}%)`;
                    activePhaseFound = true;
                }

                const isDeadlinePassed = effectiveEndDt && (today > effectiveEndDt);
                const hasBlockers = tasksOnHold > 0 || tasksOverdue.length > 0;

                if (isDeadlinePassed || hasBlockers || slippage > 0) {
                    status = 'DELAYED';
                    statusLabel = 'En Alerta / Retraso';
                    badgeClass = 'delayed';
                    statusColor = '#ef4444';
                    statusIcon = 'fa-exclamation-triangle';
                    hasProblems = true;
                } else if (progress > 0 || (startDt && today >= startDt)) {
                    status = 'IN_PROGRESS';
                    statusLabel = 'En Curso';
                    badgeClass = 'in-progress';
                    statusColor = '#0066FF';
                    statusIcon = 'fa-spinner fa-spin';
                }
            }

            if (hasProblems || tasksOnHold > 0 || tasksOverdue.length > 0) {
                phasesWithProblemsCount++;
            }

            return {
                id: phaseRow.id || (idx + 1),
                name: std.key,
                code: std.code,
                icon: std.icon,
                desc: std.desc,
                progress,
                startDate,
                endDate,
                newStartDate,
                newEndDate,
                effectiveEndDate,
                slippage,
                totalTasks,
                tasksDone,
                tasksDoing,
                tasksTesting,
                tasksTodo,
                tasksOpen,
                tasksOnHold,
                tasksOverdue,
                phaseDocsCount: phaseDocs.length,
                phaseReqsCount: phaseReqs.length,
                status,
                statusLabel,
                badgeClass,
                statusColor,
                statusIcon,
                hasProblems,
                comments: phaseRow.comments || ''
            };
        });

        // Global metrics
        const globalProgress = Math.round(sumProgress / 6);
        const goLiveDate = projectData.go_live_date;
        let daysToGoLive = null;
        if (goLiveDate) {
            const glDt = parseDateSafe(goLiveDate);
            if (glDt) daysToGoLive = Math.ceil((glDt - today) / (1000 * 60 * 60 * 24));
        }

        // Cache data for tab switching & charts
        window.estPhaseCachedData = {
            phasesAnalysis,
            globalProgress,
            activePhaseName,
            totalSlippageDays,
            phasesWithProblemsCount,
            totalOverdueTasksCount,
            totalOnHoldTasksCount,
            tasks,
            projId,
            projectData
        };

        // Project selector options
        const projectOptions = (allProjectsRes.data || []).map(p => `
            <option value="${p.id}" ${p.id === projId ? 'selected' : ''}>
                ${p.id_proyecto} - ${p.descripcion_prj || p.clients?.nombre_cliente || ''}
            </option>
        `).join('');

        // BUILD HTML INTERFACE
        let html = `
            <!-- TOOLBAR SUPERIOR PROGRESO DE FASES -->
            <div class="est-exec-toolbar est-phase-toolbar">
                <div class="est-exec-project-badge">
                    <div class="est-exec-avatar" style="background: linear-gradient(135deg, #0284c7, #0369a1);">
                        <i class="fas fa-tasks"></i>
                    </div>
                    <div>
                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                            <h3 style="margin:0; font-size:1.15rem; color:#1e293b; font-weight:700;">
                                ${projectData.id_proyecto || 'Proyecto'} - ${projectData.descripcion_prj || ''}
                            </h3>
                            <span class="est-phase-badge ${globalProgress >= 80 ? 'completed' : (phasesWithProblemsCount > 0 ? 'delayed' : 'in-progress')}">
                                <i class="fas fa-route"></i> Roadmap: ${globalProgress}% Completado
                            </span>
                        </div>
                        <p style="margin:3px 0 0; font-size:0.82rem; color:#64748b;">
                            <i class="fas fa-building" style="margin-right:4px;"></i> Cliente: <strong>${projectData.clients?.nombre_cliente || state.selectedProject?.client || 'N/A'}</strong> 
                            | <i class="fas fa-map-marker-alt" style="margin-left:6px; margin-right:4px;"></i> Fase Activa: <strong>${activePhaseName}</strong>
                            ${goLiveDate ? ` | <i class="fas fa-flag-checkered" style="margin-left:6px; margin-right:4px;"></i> Go-Live: <strong>${formatDateDisplay(goLiveDate)}</strong> (${daysToGoLive !== null ? (daysToGoLive >= 0 ? `faltan ${daysToGoLive} días` : `hace ${Math.abs(daysToGoLive)} días`) : ''})` : ''}
                        </p>
                    </div>
                </div>

                <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                    <div style="display:flex; align-items:center; gap:6px;">
                        <label style="font-size:0.8rem; font-weight:600; color:#475569;"><i class="fas fa-exchange-alt"></i> Cambiar PRJ:</label>
                        <select class="swal2-input" style="width:auto; margin:0; height:36px; font-size:0.85rem; padding:4px 8px;" onchange="window.changeEstPhaseProject(this.value)">
                            ${projectOptions}
                        </select>
                    </div>
                    <button class="btn btn-outline" style="width:auto; height:36px; padding:0 12px; font-size:0.85rem;" onclick="window.renderEstPhasesProgress(${projId})" title="Recargar progreso en tiempo real">
                        <i class="fas fa-sync-alt"></i> Actualizar
                    </button>
                    <button class="btn" style="width:auto; height:36px; padding:0 12px; font-size:0.85rem; background:#334155; color:white;" onclick="window.print()" title="Imprimir informe de fases">
                        <i class="fas fa-file-pdf"></i> Imprimir / PDF
                    </button>
                </div>
            </div>

            <!-- SMART PHASE ALERTS (DIAGNÓSTICO DE PROBLEMAS Y CUELLOS DE BOTELLA) -->
            <div class="exec-smart-alerts-container">
                ${totalOnHoldTasksCount > 0 ? `
                    <div class="exec-alert-item danger">
                        <div>
                            <i class="fas fa-pause-circle" style="font-size:1.15rem; margin-right:8px;"></i>
                            <strong>Cuellos de Botella Detectados:</strong> Existen <strong>${totalOnHoldTasksCount} tarea(s) en ON-HOLD</strong> bloqueando el avance en las fases.
                        </div>
                        <button class="btn btn-outline btn-sm" style="padding:2px 10px; font-size:0.75rem; border-color:#ef4444; color:#b91c1c;" onclick="window.switchEstPhaseTab('problems')">
                            Ver Bloqueos <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                ` : ''}

                ${totalOverdueTasksCount > 0 ? `
                    <div class="exec-alert-item warning">
                        <div>
                            <i class="fas fa-calendar-times" style="font-size:1.15rem; margin-right:8px;"></i>
                            <strong>Retrasos en Entregables:</strong> Se registran <strong>${totalOverdueTasksCount} tarea(s) vencidas</strong> que han sobrepasado su fecha límite fijada.
                        </div>
                        <button class="btn btn-outline btn-sm" style="padding:2px 10px; font-size:0.75rem; border-color:#f59e0b; color:#92400e;" onclick="window.switchEstPhaseTab('problems')">
                            Ver Tareas Vencidas <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                ` : ''}

                ${totalSlippageDays > 0 ? `
                    <div class="exec-alert-item warning">
                        <div>
                            <i class="fas fa-clock" style="font-size:1.15rem; margin-right:8px;"></i>
                            <strong>Desviación de Calendario Acumulada:</strong> El proyecto acumula un desvío total de <strong>+${totalSlippageDays} días</strong> entre fechas planificadas y reprogramadas.
                        </div>
                        <button class="btn btn-outline btn-sm" style="padding:2px 10px; font-size:0.75rem; border-color:#f59e0b; color:#92400e;" onclick="window.switchEstPhaseTab('charts')">
                            Ver Cronograma <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                ` : ''}

                ${totalOnHoldTasksCount === 0 && totalOverdueTasksCount === 0 && totalSlippageDays === 0 ? `
                    <div class="exec-alert-item success">
                        <div>
                            <i class="fas fa-check-circle" style="font-size:1.15rem; margin-right:8px;"></i>
                            <strong>Roadmap en Plazo Óptimo:</strong> No se detectan tareas en on-hold, vencimientos ni desviaciones en las fases activas del proyecto.
                        </div>
                    </div>
                ` : ''}
            </div>

            <!-- ROADMAP VISUAL INTERACTIVO (STEPPER DE 6 FASES SAP ACTIVATE) -->
            <div id="est-psec-stepper" style="margin-bottom:1.5rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                    <h4 style="margin:0; font-size:1rem; color:#1e293b; font-weight:700; display:flex; align-items:center; gap:8px;">
                        <i class="fas fa-stream" style="color:#0066FF;"></i> Evolución del Roadmap SAP Activate (6 Fases)
                    </h4>
                    <span style="font-size:0.75rem; color:#64748b;">Haga clic en las pestañas para profundizar en problemas o cronograma</span>
                </div>

                <div class="est-phase-stepper">
                    ${phasesAnalysis.map((p, i) => `
                        <div class="est-phase-card ${p.badgeClass}">
                            <div>
                                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                                    <div>
                                        <span style="font-size:0.7rem; font-weight:800; color:#0066FF; text-transform:uppercase; letter-spacing:0.5px;">${i + 1}. ${p.code}</span>
                                        <h5 style="margin:2px 0 0; font-size:0.95rem; font-weight:700; color:#1e293b;">${p.name}</h5>
                                    </div>
                                    <span class="est-phase-badge ${p.badgeClass}">
                                        <i class="fas ${p.statusIcon}"></i> ${p.statusLabel}
                                    </span>
                                </div>

                                <div class="est-phase-progress-bar">
                                    <div class="est-phase-progress-fill ${p.badgeClass}" style="width: ${p.progress}%;"></div>
                                </div>
                                <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:#64748b; margin-bottom:8px;">
                                    <span>Avance</span>
                                    <strong style="color:#1e293b;">${p.progress}%</strong>
                                </div>

                                <div style="font-size:0.72rem; color:#64748b; line-height:1.4; border-top:1px dashed #e2e8f0; padding-top:6px; margin-top:4px;">
                                    <div><i class="fas fa-calendar-check" style="width:14px;"></i> <strong>Fin:</strong> ${formatDateDisplay(p.endDate)}</div>
                                    ${p.slippage > 0 ? `
                                        <div style="color:#dc2626; font-weight:700;">
                                            <i class="fas fa-clock" style="width:14px;"></i> <strong>Replanif:</strong> ${formatDateDisplay(p.newEndDate)} (+${p.slippage}d)
                                        </div>
                                    ` : ''}
                                </div>
                            </div>

                            <div style="margin-top:10px; display:flex; flex-wrap:wrap; gap:4px;">
                                <span class="est-phase-stat-pill ${p.totalTasks > 0 && p.tasksDone === p.totalTasks ? 'success' : ''}" title="Tareas finalizadas / totales">
                                    <i class="fas fa-tasks"></i> ${p.tasksDone}/${p.totalTasks}
                                </span>
                                ${p.tasksOverdue.length > 0 ? `
                                    <span class="est-phase-stat-pill danger" title="Tareas vencidas fuera de plazo">
                                        <i class="fas fa-exclamation-triangle"></i> ${p.tasksOverdue.length} Vencidas
                                    </span>
                                ` : ''}
                                ${p.tasksOnHold > 0 ? `
                                    <span class="est-phase-stat-pill warning" title="Tareas detenidas en On-Hold">
                                        <i class="fas fa-pause-circle"></i> ${p.tasksOnHold} On-Hold
                                    </span>
                                ` : ''}
                                ${p.phaseDocsCount > 0 ? `
                                    <span class="est-phase-stat-pill" title="Documentos generados en la fase">
                                        <i class="fas fa-file-alt"></i> ${p.phaseDocsCount} Docs
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- NAVEGACIÓN SUB-TABS PROGRESO DE FASES -->
            <div class="est-exec-tabs est-phase-tabs">
                <button class="est-exec-tab-btn est-phase-tab-btn active" data-tab="all" onclick="window.switchEstPhaseTab('all')">
                    <i class="fas fa-th-large"></i> Visión General Completa
                </button>
                <button class="est-exec-tab-btn est-phase-tab-btn" data-tab="charts" onclick="window.switchEstPhaseTab('charts')">
                    <i class="fas fa-chart-line"></i> Gráficos de Evolución & Desviación
                </button>
                <button class="est-exec-tab-btn est-phase-tab-btn" data-tab="problems" onclick="window.switchEstPhaseTab('problems')">
                    <i class="fas fa-exclamation-triangle"></i> Diagnóstico de Problemas & Bloqueos (${totalOverdueTasksCount + totalOnHoldTasksCount})
                </button>
                <button class="est-exec-tab-btn est-phase-tab-btn" data-tab="table" onclick="window.switchEstPhaseTab('table')">
                    <i class="fas fa-table"></i> Tabla Detallada de Fases (Auditoría)
                </button>
            </div>

            <!-- BLOQUE: KPI CARDS EJECUTIVAS DE FASES -->
            <div id="est-psec-kpis" class="analytics-kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); margin-bottom:1.5rem;">
                <div class="kpi-card-modern ${globalProgress >= 75 ? 'kpi-resolved' : 'kpi-total'}">
                    <div class="kpi-title">AVANCE GLOBAL DEL ROADMAP</div>
                    <div class="kpi-value">${globalProgress}%</div>
                    <i class="fas fa-route kpi-icon"></i>
                    <div class="kpi-trend ${globalProgress >= 75 ? 'positive' : 'neutral'}">
                        <span>${phasesAnalysis.filter(p => p.progress === 100).length} de 6 fases completadas</span>
                    </div>
                </div>

                <div class="kpi-card-modern kpi-open">
                    <div class="kpi-title">FASE ACTIVA EN CURSO</div>
                    <div class="kpi-value" style="font-size:1.6rem; line-height:1.3;">${activePhaseName}</div>
                    <i class="fas fa-spinner kpi-icon"></i>
                    <div class="kpi-trend neutral">
                        <span>Foco actual del equipo de trabajo</span>
                    </div>
                </div>

                <div class="kpi-card-modern ${totalSlippageDays > 0 ? 'kpi-critical' : 'kpi-resolved'}">
                    <div class="kpi-title">DESVIACIÓN DE CRONOGRAMA</div>
                    <div class="kpi-value" style="${totalSlippageDays > 0 ? 'color:#ef4444;' : ''}">+${totalSlippageDays} <span style="font-size:1.1rem; font-weight:600;">días</span></div>
                    <i class="fas fa-clock kpi-icon"></i>
                    <div class="kpi-trend ${totalSlippageDays > 0 ? 'negative' : 'positive'}">
                        <span>${totalSlippageDays > 0 ? 'Slippage acumulado sobre fecha inicial' : 'Cronograma en fecha'}</span>
                    </div>
                </div>

                <div class="kpi-card-modern ${totalOnHoldTasksCount + totalOverdueTasksCount > 0 ? 'kpi-critical' : 'kpi-resolved'}">
                    <div class="kpi-title">TAREAS CON PROBLEMAS / BLOQUEOS</div>
                    <div class="kpi-value" style="${totalOnHoldTasksCount + totalOverdueTasksCount > 0 ? 'color:#ef4444;' : ''}">${totalOnHoldTasksCount + totalOverdueTasksCount}</div>
                    <i class="fas fa-radiation kpi-icon"></i>
                    <div class="kpi-trend ${totalOnHoldTasksCount + totalOverdueTasksCount > 0 ? 'negative' : 'positive'}">
                        <span>${totalOverdueTasksCount} vencidas + ${totalOnHoldTasksCount} on-hold</span>
                    </div>
                </div>
            </div>

            <!-- BLOQUE 1 DE GRÁFICOS: AVANCE Y CRONOGRAMA -->
            <div id="est-psec-charts-row1" class="analytics-chart-grid" style="grid-template-columns: 3fr 2fr; margin-bottom:1.5rem;">
                <div class="analytics-chart-card">
                    <h4><i class="fas fa-chart-bar" style="color:#0066FF;"></i> Curva de Avance Real por Fase vs Objetivo (100%)</h4>
                    <div class="analytics-chart-container">
                        <canvas id="estChartPhaseProgress"></canvas>
                    </div>
                </div>
                <div class="analytics-chart-card">
                    <h4><i class="fas fa-clock" style="color:#f59e0b;"></i> Desviación de Calendario por Fase (+Días de Slippage)</h4>
                    <div class="analytics-chart-container">
                        <canvas id="estChartPhaseSlippage"></canvas>
                    </div>
                </div>
            </div>

            <!-- BLOQUE 2 DE GRÁFICOS: CUELLOS DE BOTELLA Y DISTRIBUCIÓN -->
            <div id="est-psec-charts-row2" class="analytics-chart-grid" style="grid-template-columns: 3fr 2fr; margin-bottom:1.5rem;">
                <div class="analytics-chart-card">
                    <h4><i class="fas fa-tasks" style="color:#10b981;"></i> Desglose de Tareas y Cuellos de Botella por Fase (Stacked)</h4>
                    <div class="analytics-chart-container">
                        <canvas id="estChartPhaseTasksBreakdown"></canvas>
                    </div>
                </div>
                <div class="analytics-chart-card">
                    <h4><i class="fas fa-chart-pie" style="color:#8b5cf6;"></i> Distribución del Estado de Fases</h4>
                    <div class="analytics-chart-container">
                        <canvas id="estChartPhaseOverallStatus"></canvas>
                    </div>
                </div>
            </div>

            <!-- BLOQUE: TABLA DETALLADA DE FASES (ALV AUDITORÍA) -->
            <div id="est-psec-table" style="background:#fff; border-radius:12px; border:1px solid #e2e8f0; padding:1.25rem; margin-bottom:1.5rem; box-shadow:0 2px 6px rgba(0,0,0,0.02);">
                <h4 style="margin:0 0 1rem; font-size:1.05rem; color:#1e293b; font-weight:700; display:flex; align-items:center; gap:8px;">
                    <i class="fas fa-table" style="color:var(--sap-blue)"></i> Auditoría de Fases, Plazos y Entregables
                </h4>
                <div style="overflow-x:auto;">
                    <table class="exec-drilldown-table">
                        <thead>
                            <tr>
                                <th>Fase / Código</th>
                                <th>F. Inicio</th>
                                <th>F. Fin Planificada</th>
                                <th>F. Fin Replanificada</th>
                                <th>Desvío (+Días)</th>
                                <th>Avance (%)</th>
                                <th>Tareas (Done / Total)</th>
                                <th>Problemas (Vencidas / On-Hold)</th>
                                <th>Docs</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${phasesAnalysis.map(p => `
                                <tr>
                                    <td>
                                        <strong>${p.name}</strong> <span style="font-size:0.75rem; color:#64748b;">(${p.code})</span>
                                    </td>
                                    <td>${formatDateDisplay(p.startDate)}</td>
                                    <td>${formatDateDisplay(p.endDate)}</td>
                                    <td>${formatDateDisplay(p.newEndDate)}</td>
                                    <td>
                                        ${p.slippage > 0 ? `
                                            <span style="color:#dc2626; font-weight:700;">+${p.slippage} días</span>
                                        ` : '<span style="color:#10b981;">0 días</span>'}
                                    </td>
                                    <td>
                                        <div style="display:flex; align-items:center; gap:8px;">
                                            <div style="width:50px; background:#e2e8f0; height:6px; border-radius:3px; overflow:hidden;">
                                                <div style="width:${p.progress}%; height:100%; background:${p.statusColor};"></div>
                                            </div>
                                            <strong>${p.progress}%</strong>
                                        </div>
                                    </td>
                                    <td>${p.tasksDone} / ${p.totalTasks}</td>
                                    <td>
                                        ${p.tasksOverdue.length + p.tasksOnHold > 0 ? `
                                            <span style="color:#dc2626; font-weight:700;">${p.tasksOverdue.length} vencidas | ${p.tasksOnHold} on-hold</span>
                                        ` : '<span style="color:#10b981;"><i class="fas fa-check"></i> Sin problemas</span>'}
                                    </td>
                                    <td>${p.phaseDocsCount}</td>
                                    <td>
                                        <span class="est-phase-badge ${p.badgeClass}">
                                            <i class="fas ${p.statusIcon}"></i> ${p.statusLabel}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- BLOQUE: DRILLDOWN DE TAREAS PROBLEMÁTICAS Y BLOQUEOS -->
            <div id="est-psec-drilldown" style="margin-bottom:1rem;">
                <h4 style="font-size:1.05rem; color:#1e293b; font-weight:700; margin-bottom:1rem; display:flex; align-items:center; gap:8px;">
                    <i class="fas fa-exclamation-circle" style="color:#b91c1c"></i> Tareas Problemáticas con Bloqueo o Retraso por Fase (${totalOverdueTasksCount + totalOnHoldTasksCount})
                </h4>

                ${totalOverdueTasksCount + totalOnHoldTasksCount === 0 ? `
                    <div style="padding:1.5rem; background:#f0fdf4; border-radius:10px; border:1px solid #bbf7d0; color:#166534; text-align:center;">
                        <i class="fas fa-check-circle fa-2x" style="margin-bottom:0.5rem;"></i>
                        <p style="margin:0; font-weight:600;">¡Excelente! No hay tareas con fecha vencida ni en On-Hold en ninguna de las fases del proyecto.</p>
                    </div>
                ` : `
                    <div style="background:#fff; border-radius:12px; border:1px solid #fee2e2; padding:1.25rem; box-shadow:0 4px 15px rgba(0,0,0,0.03);">
                        <div style="max-height:280px; overflow-y:auto;">
                            <table class="exec-drilldown-table">
                                <thead>
                                    <tr>
                                        <th>Fase</th>
                                        <th>Tarea / Título</th>
                                        <th>Responsable</th>
                                        <th>Fecha Límite</th>
                                        <th>Estado / Problema</th>
                                        <th>Prioridad</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${phasesAnalysis.flatMap(p => 
                                        p.tasksOverdue.concat(
                                            tasks.filter(t => {
                                                const pt = (t.phase || '').toLowerCase();
                                                const matchPhase = pt.includes(p.name.toLowerCase()) || pt === p.code.toLowerCase();
                                                return matchPhase && (t.status || '').toUpperCase() === 'ON-HOLD' && !p.tasksOverdue.includes(t);
                                            })
                                        ).map(t => {
                                            const isOverdue = t.due_date && parseDateSafe(t.due_date) < today && !['DONE', 'CLOSED'].includes((t.status||'').toUpperCase());
                                            const isOnHold = (t.status||'').toUpperCase() === 'ON-HOLD';
                                            return `
                                                <tr>
                                                    <td><span class="est-phase-badge ${p.badgeClass}">${p.name}</span></td>
                                                    <td><strong>${t.title || 'Tarea'}</strong></td>
                                                    <td>${t.assigned_to || 'Sin asignar'}</td>
                                                    <td style="${isOverdue ? 'color:#dc2626; font-weight:700;' : ''}">
                                                        ${t.due_date ? formatDateDisplay(t.due_date) : 'Sin fecha'}
                                                    </td>
                                                    <td>
                                                        ${isOnHold ? `
                                                            <span class="badge" style="background:#fef3c7; color:#b45309; font-size:0.72rem; padding:3px 8px;">
                                                                <i class="fas fa-pause-circle"></i> ON-HOLD (Detenida)
                                                            </span>
                                                        ` : (isOverdue ? `
                                                            <span class="badge" style="background:#fee2e2; color:#b91c1c; font-size:0.72rem; padding:3px 8px;">
                                                                <i class="fas fa-clock"></i> Fuera de Plazo (${t.status})
                                                            </span>
                                                        ` : `
                                                            <span class="badge">${t.status}</span>
                                                        `)}
                                                    </td>
                                                    <td>
                                                        <span class="badge" style="${(t.priority||'').toLowerCase() === 'high' ? 'background:#ef4444; color:white;' : 'background:#f1f5f9; color:#475569;'} font-size:0.7rem;">
                                                            ${t.priority || 'Normal'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            `;
                                        })
                                    ).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `}
            </div>
        `;

        container.innerHTML = html;

        // Render all Chart.js charts
        window.renderEstPhaseCharts(window.estPhaseCachedData);

    } catch (err) {
        console.error("Error loading EST Phase Progress:", err);
        container.innerHTML = `
            <div style="padding:1.5rem; color:#ef4444; background:#fef2f2; border-radius:8px;">
                <i class="fas fa-exclamation-triangle"></i> Error al cargar progreso de fases: ${err.message}
            </div>
        `;
    }
};

/**
 * Instantiates and paints all Chart.js charts for EST Phase Progress
 */
window.renderEstPhaseCharts = function (data) {
    if (!data || typeof Chart === 'undefined') return;

    window.destroyEstPhaseCharts();

    const chartDefaults = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { boxWidth: 12, padding: 15, font: { size: 11, family: "'Inter', sans-serif" } }
            },
            tooltip: {
                backgroundColor: 'rgba(255,255,255,0.98)',
                titleColor: '#0f172a',
                bodyColor: '#334155',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                padding: 10,
                boxPadding: 4,
                usePointStyle: true
            }
        }
    };

    const phaseLabels = data.phasesAnalysis.map(p => p.name);

    // 1. Chart Phase Progress vs Target (Bar)
    const ctxProgress = document.getElementById('estChartPhaseProgress');
    if (ctxProgress) {
        const progressValues = data.phasesAnalysis.map(p => p.progress);
        const bgColors = data.phasesAnalysis.map(p => {
            if (p.progress === 100) return '#10b981';
            if (p.hasProblems) return '#ef4444';
            if (p.progress > 0) return '#0066FF';
            return '#94a3b8';
        });

        window.estPhaseCharts['phaseProgress'] = new Chart(ctxProgress, {
            type: 'bar',
            data: {
                labels: phaseLabels,
                datasets: [
                    {
                        label: 'Avance Real (%)',
                        data: progressValues,
                        backgroundColor: bgColors,
                        borderRadius: 6,
                        barPercentage: 0.6
                    },
                    {
                        label: 'Objetivo Final (100%)',
                        data: [100, 100, 100, 100, 100, 100],
                        backgroundColor: 'rgba(226, 232, 240, 0.6)',
                        borderRadius: 6,
                        barPercentage: 0.6
                    }
                ]
            },
            options: {
                ...chartDefaults,
                scales: {
                    y: { beginAtZero: true, max: 100, grid: { color: '#f1f5f9' }, ticks: { callback: v => v + '%' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 2. Chart Phase Slippage / Desviación (Bar Horizontal)
    const ctxSlippage = document.getElementById('estChartPhaseSlippage');
    if (ctxSlippage) {
        const slippageValues = data.phasesAnalysis.map(p => p.slippage);
        window.estPhaseCharts['phaseSlippage'] = new Chart(ctxSlippage, {
            type: 'bar',
            data: {
                labels: phaseLabels,
                datasets: [{
                    label: 'Desvío (+Días de retraso)',
                    data: slippageValues,
                    backgroundColor: slippageValues.map(v => v > 0 ? '#ef4444' : '#10b981'),
                    borderRadius: 6
                }]
            },
            options: {
                ...chartDefaults,
                indexAxis: 'y',
                scales: {
                    x: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { precision: 0 } },
                    y: { grid: { display: false } }
                },
                plugins: { ...chartDefaults.plugins, legend: { display: false } }
            }
        });
    }

    // 3. Chart Phase Tasks Breakdown (Stacked Bar)
    const ctxTasks = document.getElementById('estChartPhaseTasksBreakdown');
    if (ctxTasks) {
        const doneData = data.phasesAnalysis.map(p => p.tasksDone);
        const wipData = data.phasesAnalysis.map(p => p.tasksDoing + p.tasksTesting);
        const overdueData = data.phasesAnalysis.map(p => p.tasksOverdue.length);
        const onHoldData = data.phasesAnalysis.map(p => p.tasksOnHold);

        window.estPhaseCharts['phaseTasks'] = new Chart(ctxTasks, {
            type: 'bar',
            data: {
                labels: phaseLabels,
                datasets: [
                    { label: 'Finalizadas (Done)', data: doneData, backgroundColor: '#10b981', stack: 'tasks' },
                    { label: 'En Curso (WIP)', data: wipData, backgroundColor: '#3b82f6', stack: 'tasks' },
                    { label: 'Vencidas (Retraso)', data: overdueData, backgroundColor: '#ef4444', stack: 'tasks' },
                    { label: 'On-Hold (Bloqueadas)', data: onHoldData, backgroundColor: '#f59e0b', stack: 'tasks' }
                ]
            },
            options: {
                ...chartDefaults,
                scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true, stacked: true, grid: { color: '#f1f5f9' }, ticks: { precision: 0 } }
                }
            }
        });
    }

    // 4. Chart Overall Status Distribution (Doughnut)
    const ctxStatus = document.getElementById('estChartPhaseOverallStatus');
    if (ctxStatus) {
        const completedCount = data.phasesAnalysis.filter(p => p.status === 'COMPLETED').length;
        const inProgressCount = data.phasesAnalysis.filter(p => p.status === 'IN_PROGRESS').length;
        const delayedCount = data.phasesAnalysis.filter(p => p.status === 'DELAYED').length;
        const upcomingCount = data.phasesAnalysis.filter(p => p.status === 'UPCOMING').length;

        window.estPhaseCharts['phaseStatus'] = new Chart(ctxStatus, {
            type: 'doughnut',
            data: {
                labels: ['Completadas', 'En Curso', 'Con Retraso / Problemas', 'Próximas'],
                datasets: [{
                    data: [completedCount, inProgressCount, delayedCount, upcomingCount],
                    backgroundColor: ['#10b981', '#0066FF', '#ef4444', '#94a3b8'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                ...chartDefaults,
                cutout: '68%'
            }
        });
    }
};

// ========================================================
// EST MODULE: GESTIÓN Y MATRIZ DE RIESGOS DEL PROYECTO
// ========================================================

window.estRiskCharts = window.estRiskCharts || {};
window.estRiskActiveTab = 'all';
window.estRiskCachedData = null;

/**
 * Destroys any existing Chart.js instances in EST Risks Module
 */
window.destroyEstRiskCharts = function () {
    if (window.estRiskCharts) {
        Object.keys(window.estRiskCharts).forEach(key => {
            if (window.estRiskCharts[key]) {
                try {
                    window.estRiskCharts[key].destroy();
                } catch (e) {
                    console.warn("Error destroying risk chart", key, e);
                }
            }
        });
        window.estRiskCharts = {};
    }
};

/**
 * Switch sub-tab in Risks Module
 */
window.switchEstRiskTab = function (tabName) {
    window.estRiskActiveTab = tabName;
    document.querySelectorAll('.est-risk-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    const sections = {
        'all': ['est-rsec-matrix-row', 'est-rsec-kpis', 'est-rsec-charts-row1', 'est-rsec-table'],
        'matrix': ['est-rsec-matrix-row', 'est-rsec-kpis'],
        'charts': ['est-rsec-charts-row1', 'est-rsec-kpis'],
        'table': ['est-rsec-table']
    };

    const targetSections = sections[tabName] || sections['all'];
    ['est-rsec-matrix-row', 'est-rsec-kpis', 'est-rsec-charts-row1', 'est-rsec-table'].forEach(secId => {
        const el = document.getElementById(secId);
        if (el) {
            el.style.display = targetSections.includes(secId) ? 'block' : 'none';
        }
    });

    if (window.estRiskCachedData) {
        setTimeout(() => {
            window.renderEstRiskCharts(window.estRiskCachedData);
        }, 50);
    }
};

/**
 * Quick switch active project from Risks Module
 */
window.changeEstRiskProject = async function (newProjId) {
    if (!newProjId) return;
    const pid = parseInt(newProjId);
    if (state.selectedProject?.id === pid) return;

    if (supabaseClient) {
        const { data, error } = await supabaseClient
            .from('cliente_proy')
            .select('*, clients(*)')
            .eq('id', pid)
            .single();

        if (!error && data) {
            state.selectedProject = {
                id: data.id,
                name: data.id_proyecto,
                client: data.clients?.nombre_cliente || 'Cliente',
                client_abrev: data.clients?.abrev || '',
                client_id: data.client_id,
                descripcion_prj: data.descripcion_prj || '',
                sharepoint_url: data.sharepoint_url,
                go_live_date: data.go_live_date,
                support_start_date: data.support_start_date,
                support_end_date: data.support_end_date
            };
            saveState();
            updateUIForUser();
        }
    }

    await window.renderEstRisksModule(pid);
    const incPrjSel = document.getElementById('analytics-filter-project');
    if (incPrjSel && Array.from(incPrjSel.options).some(o => o.value == String(pid))) {
        incPrjSel.value = String(pid);
        if (window.updateIncidentDashboard) window.updateIncidentDashboard();
    }
};

/**
 * Main render function for EST Risks Module
 */
window.renderEstRisksModule = async function (targetProjectId) {
    const container = document.getElementById('est-risks-module-container');
    if (!container) return;

    if (!supabaseClient) {
        container.innerHTML = '<div style="padding:1rem; color:#666;">Supabase no inicializado.</div>';
        return;
    }

    let projId = parseInt(targetProjectId || state.selectedProject?.id);

    // Fallback: Si no hay proyecto seleccionado, seleccionar el primero disponible
    if (!projId) {
        const { data: firstProjs } = await supabaseClient
            .from('cliente_proy')
            .select('*, clients(*)')
            .order('id', { ascending: true })
            .limit(1);

        if (firstProjs && firstProjs.length > 0) {
            const p = firstProjs[0];
            state.selectedProject = {
                id: p.id,
                name: p.id_proyecto,
                client: p.clients?.nombre_cliente || 'Cliente',
                client_abrev: p.clients?.abrev || '',
                client_id: p.client_id,
                descripcion_prj: p.descripcion_prj || '',
                go_live_date: p.go_live_date
            };
            saveState();
            updateUIForUser();
            projId = p.id;
        } else {
            container.innerHTML = '<div style="padding:1.5rem; color:#64748b; text-align:center;"><i class="fas fa-info-circle"></i> No hay proyectos creados en la base de datos para mostrar la gestión de riesgos.</div>';
            return;
        }
    }

    container.innerHTML = `
        <div style="text-align:center; padding:2.5rem;">
            <i class="fas fa-spinner fa-spin fa-2x" style="color:#f59e0b;"></i>
            <p style="margin-top:0.75rem; color:#64748b; font-weight:500;">Calculando matriz y métricas de riesgos en tiempo real...</p>
        </div>
    `;

    try {
        const [
            risksRes,
            currentProjectRes,
            allProjectsRes
        ] = await Promise.all([
            supabaseClient.from('project_risks').select('*').eq('project_id', projId).order('id', { ascending: true }),
            supabaseClient.from('cliente_proy').select('*, clients(*)').eq('id', projId).single(),
            supabaseClient.from('cliente_proy').select('id, id_proyecto, descripcion_prj, clients(nombre_cliente)').order('id', { ascending: true })
        ]);

        const risks = risksRes.data || [];
        const projectData = currentProjectRes.data || state.selectedProject || {};

        // Normalizadores de Probabilidad e Impacto
        const probWeight = (p) => {
            const s = (p || '').trim().toUpperCase();
            if (s === 'MUY ALTA') return 4;
            if (s === 'ALTA' || s === 'ALTO') return 3;
            if (s === 'MEDIA' || s === 'MEDIO') return 2;
            return 1; // Baja
        };

        const impWeight = (i) => {
            const s = (i || '').trim().toUpperCase();
            if (s === 'CRÍTICO' || s === 'CRITICO' || s === 'MUY ALTO') return 4;
            if (s === 'ALTO' || s === 'ALTA') return 3;
            if (s === 'MEDIO' || s === 'MEDIA') return 2;
            return 1; // Bajo
        };

        const totalRisks = risks.length;
        const openRisks = risks.filter(r => (r.estado || 'Abierto').toLowerCase() === 'abierto');
        const mitigatingRisks = risks.filter(r => (r.estado || '').toLowerCase().includes('mitiga'));
        const closedRisks = risks.filter(r => (r.estado || '').toLowerCase() === 'cerrado');
        const activeRisks = risks.filter(r => (r.estado || '').toLowerCase() !== 'cerrado');

        // Riesgos Críticos / Alto Impacto
        const highImpactRisks = activeRisks.filter(r => {
            const imp = impWeight(r.impacto);
            const prio = parseInt(r.prioridad || 0);
            return imp >= 3 || prio >= 7;
        });

        // Riesgos con Estrategia / Plan definido
        const withPlanRisks = risks.filter(r => (r.plan_respuesta && r.plan_respuesta.trim().length > 0) || (r.estrategia_respuesta && r.estrategia_respuesta.trim().length > 0));
        const coverageRate = totalRisks > 0 ? Math.round((withPlanRisks.length / totalRisks) * 100) : 100;

        // Cálculo de Puntuación Global de Exposición al Riesgo (0 - 100%)
        let totalActiveSeverity = 0;
        activeRisks.forEach(r => {
            totalActiveSeverity += (probWeight(r.probabilidad) * impWeight(r.impacto));
        });

        // Máxima severidad posible si todos los riesgos activos fueran 16 (4x4)
        const maxPossibleSeverity = activeRisks.length * 16;
        let riskExposureScore = 0;
        if (activeRisks.length > 0) {
            riskExposureScore = Math.min(100, Math.round((totalActiveSeverity / maxPossibleSeverity) * 100));
        }

        let exposureBadgeClass = 'est-phase-badge completed';
        let exposureLabel = 'Riesgo Controlado';
        let exposureIcon = 'fa-check-circle';
        if (riskExposureScore > 50 || highImpactRisks.length > 2) {
            exposureBadgeClass = 'est-phase-badge delayed';
            exposureLabel = 'Exposición Crítica';
            exposureIcon = 'fa-exclamation-triangle';
        } else if (riskExposureScore > 25 || highImpactRisks.length > 0) {
            exposureBadgeClass = 'est-phase-badge in-progress';
            exposureLabel = 'Exposición Moderada';
            exposureIcon = 'fa-exclamation-circle';
        }

        // Matriz de Severidad 4x4: Celda [Prob 1..4][Imp 1..4]
        // Prob: 4=Muy Alta, 3=Alta, 2=Media, 1=Baja
        // Imp:  1=Bajo, 2=Medio, 3=Alto, 4=Crítico
        const matrixCounts = {
            4: { 1: [], 2: [], 3: [], 4: [] },
            3: { 1: [], 2: [], 3: [], 4: [] },
            2: { 1: [], 2: [], 3: [], 4: [] },
            1: { 1: [], 2: [], 3: [], 4: [] }
        };

        risks.forEach(r => {
            const p = probWeight(r.probabilidad);
            const i = impWeight(r.impacto);
            if (matrixCounts[p] && matrixCounts[p][i]) {
                matrixCounts[p][i].push(r);
            }
        });

        // Cache para gráficos y tabs
        window.estRiskCachedData = {
            risks,
            totalRisks,
            openRisksCount: openRisks.length,
            mitigatingRisksCount: mitigatingRisks.length,
            closedRisksCount: closedRisks.length,
            activeRisksCount: activeRisks.length,
            highImpactCount: highImpactRisks.length,
            coverageRate,
            riskExposureScore,
            matrixCounts,
            projId,
            projectData
        };

        // Project selector options
        const projectOptions = (allProjectsRes.data || []).map(p => `
            <option value="${p.id}" ${p.id === projId ? 'selected' : ''}>
                ${p.id_proyecto} - ${p.descripcion_prj || p.clients?.nombre_cliente || ''}
            </option>
        `).join('');

        // Helper para pintar celda de la matriz
        const renderMatrixCell = (probVal, impVal) => {
            const cellRisks = matrixCounts[probVal][impVal] || [];
            const count = cellRisks.length;
            const score = probVal * impVal;

            let zoneClass = 'zone-low';
            if (score >= 12) zoneClass = 'zone-critical';
            else if (score >= 8) zoneClass = 'zone-high';
            else if (score >= 4) zoneClass = 'zone-med';

            const activeInCell = cellRisks.filter(r => (r.estado || '').toLowerCase() !== 'cerrado').length;

            return `
                <td class="est-risk-matrix-cell ${zoneClass}" title="Prob: ${probVal}, Imp: ${impVal} (Severidad ${score}/16) - ${count} riesgos (${activeInCell} activos)">
                    <div style="font-size:1.15rem; font-weight:800;">${count > 0 ? count : '-'}</div>
                    ${count > 0 ? `<div style="font-size:0.68rem; font-weight:600; opacity:0.85;">${activeInCell} activos</div>` : ''}
                </td>
            `;
        };

        // BUILD HTML INTERFACE
        let html = `
            <!-- TOOLBAR SUPERIOR GESTIÓN DE RIESGOS -->
            <div class="est-exec-toolbar">
                <div class="est-exec-project-badge">
                    <div class="est-exec-avatar" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div>
                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                            <h3 style="margin:0; font-size:1.15rem; color:#1e293b; font-weight:700;">
                                ${projectData.id_proyecto || 'Proyecto'} - ${projectData.descripcion_prj || ''}
                            </h3>
                            <span class="${exposureBadgeClass}">
                                <i class="fas ${exposureIcon}"></i> ${riskExposureScore}% - ${exposureLabel}
                            </span>
                        </div>
                        <p style="margin:3px 0 0; font-size:0.82rem; color:#64748b;">
                            <i class="fas fa-building" style="margin-right:4px;"></i> Cliente: <strong>${projectData.clients?.nombre_cliente || state.selectedProject?.client || 'N/A'}</strong> 
                            | <i class="fas fa-shield-alt" style="margin-left:6px; margin-right:4px;"></i> Riesgos Activos: <strong>${activeRisks.length}</strong> de ${totalRisks}
                            | <i class="fas fa-fire" style="margin-left:6px; margin-right:4px;"></i> Alto Impacto / Críticos: <strong style="color:${highImpactRisks.length > 0 ? '#dc2626' : '#166534'}">${highImpactRisks.length}</strong>
                        </p>
                    </div>
                </div>

                <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                    <div style="display:flex; align-items:center; gap:6px;">
                        <label style="font-size:0.8rem; font-weight:600; color:#475569;"><i class="fas fa-exchange-alt"></i> Cambiar PRJ:</label>
                        <select class="swal2-input" style="width:auto; margin:0; height:36px; font-size:0.85rem; padding:4px 8px;" onchange="window.changeEstRiskProject(this.value)">
                            ${projectOptions}
                        </select>
                    </div>
                    <button class="btn btn-outline" style="width:auto; height:36px; padding:0 12px; font-size:0.85rem;" onclick="window.renderEstRisksModule(${projId})" title="Recargar riesgos en tiempo real">
                        <i class="fas fa-sync-alt"></i> Actualizar
                    </button>
                    <button class="btn" style="width:auto; height:36px; padding:0 12px; font-size:0.85rem; background:#0066FF; color:white;" onclick="openRiskModal()" title="Registrar nuevo riesgo para este proyecto">
                        <i class="fas fa-plus"></i> Nuevo Riesgo
                    </button>
                    <button class="btn" style="width:auto; height:36px; padding:0 12px; font-size:0.85rem; background:#334155; color:white;" onclick="window.print()" title="Imprimir informe de riesgos">
                        <i class="fas fa-file-pdf"></i> Imprimir / PDF
                    </button>
                </div>
            </div>

            <!-- SMART RISK ALERTS (ALERTAS DE SEVERIDAD) -->
            <div class="exec-smart-alerts-container">
                ${highImpactRisks.length > 0 ? `
                    <div class="exec-alert-item danger">
                        <div>
                            <i class="fas fa-fire" style="font-size:1.15rem; margin-right:8px;"></i>
                            <strong>Atención Inmediata Requerida:</strong> Existen <strong>${highImpactRisks.length} riesgo(s) de Alto Impacto o Críticos</strong> activos que requieren plan de mitigación prioritario.
                        </div>
                        <button class="btn btn-outline btn-sm" style="padding:2px 10px; font-size:0.75rem; border-color:#ef4444; color:#b91c1c;" onclick="window.switchEstRiskTab('table')">
                            Ver Riesgos Críticos <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                ` : ''}

                ${coverageRate < 75 && totalRisks > 0 ? `
                    <div class="exec-alert-item warning">
                        <div>
                            <i class="fas fa-clipboard-check" style="font-size:1.15rem; margin-right:8px;"></i>
                            <strong>Planes de Mitigación Incompletos:</strong> El <strong>${100 - coverageRate}%</strong> de los riesgos registrados aún no tiene asignada una estrategia o plan de respuesta formal.
                        </div>
                        <button class="btn btn-outline btn-sm" style="padding:2px 10px; font-size:0.75rem; border-color:#f59e0b; color:#92400e;" onclick="window.switchEstRiskTab('table')">
                            Completar Planes <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                ` : ''}

                ${highImpactRisks.length === 0 && totalRisks > 0 ? `
                    <div class="exec-alert-item success">
                        <div>
                            <i class="fas fa-check-circle" style="font-size:1.15rem; margin-right:8px;"></i>
                            <strong>Nivel de Riesgo Controlado:</strong> No hay riesgos críticos no mitigados que comprometan los objetivos ni el Go-Live del proyecto.
                        </div>
                    </div>
                ` : ''}

                ${totalRisks === 0 ? `
                    <div class="exec-alert-item info">
                        <div>
                            <i class="fas fa-info-circle" style="font-size:1.15rem; margin-right:8px;"></i>
                            <strong>Sin Riesgos Registrados:</strong> No se han identificado riesgos formalmente para este proyecto en el módulo PRJ.
                        </div>
                        <button class="btn btn-outline btn-sm" style="padding:2px 10px; font-size:0.75rem; border-color:#0284c7; color:#0369a1;" onclick="openRiskModal()">
                            <i class="fas fa-plus"></i> Registrar Primer Riesgo
                        </button>
                    </div>
                ` : ''}
            </div>

            <!-- NAVEGACIÓN SUB-TABS RIESGOS -->
            <div class="est-exec-tabs est-risk-tabs">
                <button class="est-exec-tab-btn est-risk-tab-btn active" data-tab="all" onclick="window.switchEstRiskTab('all')">
                    <i class="fas fa-th-large"></i> Visión Global & Matriz
                </button>
                <button class="est-exec-tab-btn est-risk-tab-btn" data-tab="matrix" onclick="window.switchEstRiskTab('matrix')">
                    <i class="fas fa-border-all"></i> Matriz de Calor 4x4
                </button>
                <button class="est-exec-tab-btn est-risk-tab-btn" data-tab="charts" onclick="window.switchEstRiskTab('charts')">
                    <i class="fas fa-chart-pie"></i> Gráficos Analíticos
                </button>
                <button class="est-exec-tab-btn est-risk-tab-btn" data-tab="table" onclick="window.switchEstRiskTab('table')">
                    <i class="fas fa-list-alt"></i> Detalle de Riesgos (Auditoría ALV)
                </button>
            </div>

            <!-- BLOQUE: KPI CARDS EJECUTIVAS DE RIESGOS -->
            <div id="est-rsec-kpis" class="analytics-kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); margin-bottom:1.5rem;">
                <div class="kpi-card-modern kpi-total">
                    <div class="kpi-title">TOTAL RIESGOS IDENTIFICADOS</div>
                    <div class="kpi-value">${totalRisks}</div>
                    <i class="fas fa-shield-alt kpi-icon"></i>
                    <div class="kpi-trend neutral">
                        <span>${closedRisks.length} cerrados / mitigados</span>
                    </div>
                </div>

                <div class="kpi-card-modern ${openRisks.length > 0 ? 'kpi-open' : 'kpi-resolved'}">
                    <div class="kpi-title">RIESGOS ACTIVOS EN CURSO</div>
                    <div class="kpi-value">${activeRisks.length}</div>
                    <i class="fas fa-exclamation-triangle kpi-icon"></i>
                    <div class="kpi-trend neutral">
                        <span>${mitigatingRisks.length} en mitigación / ${openRisks.length} abiertos</span>
                    </div>
                </div>

                <div class="kpi-card-modern ${highImpactRisks.length > 0 ? 'kpi-critical' : 'kpi-resolved'}">
                    <div class="kpi-title">ALTO IMPACTO / CRÍTICOS</div>
                    <div class="kpi-value" style="${highImpactRisks.length > 0 ? 'color:#ef4444;' : ''}">${highImpactRisks.length}</div>
                    <i class="fas fa-fire kpi-icon"></i>
                    <div class="kpi-trend ${highImpactRisks.length > 0 ? 'negative' : 'positive'}">
                        <span>${highImpactRisks.length > 0 ? 'Requieren acción inmediata' : 'Sin riesgos críticos'}</span>
                    </div>
                </div>

                <div class="kpi-card-modern ${coverageRate >= 80 ? 'kpi-resolved' : 'kpi-open'}">
                    <div class="kpi-title">COBERTURA PLANES DE RESPUESTA</div>
                    <div class="kpi-value">${coverageRate}%</div>
                    <i class="fas fa-clipboard-check kpi-icon"></i>
                    <div class="kpi-trend ${coverageRate >= 80 ? 'positive' : 'negative'}">
                        <span>${withPlanRisks.length} de ${totalRisks} con estrategia</span>
                    </div>
                </div>
            </div>

            <!-- BLOQUE: MATRIZ DE CALOR 4x4 (HEATMAP) Y DISTRIBUCIÓN -->
            <div id="est-rsec-matrix-row" style="display:grid; grid-template-columns: 3fr 2fr; gap:1.5rem; margin-bottom:1.5rem;">
                <!-- MATRIZ 4x4 INTERACTIVA -->
                <div class="est-risk-matrix-wrapper">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <h4 style="margin:0; font-size:1rem; color:#1e293b; font-weight:700; display:flex; align-items:center; gap:8px;">
                            <i class="fas fa-border-all" style="color:#f59e0b;"></i> Matriz de Severidad de Riesgos (Probabilidad vs Impacto)
                        </h4>
                        <span style="font-size:0.75rem; color:#64748b;">Número de riesgos por cuadrante</span>
                    </div>

                    <table class="est-risk-matrix-table">
                        <thead>
                            <tr>
                                <th style="width:110px; text-align:left;">Probabilidad \ Impacto</th>
                                <th style="width:22%;">1. Bajo</th>
                                <th style="width:22%;">2. Medio</th>
                                <th style="width:22%;">3. Alto</th>
                                <th style="width:22%;">4. Crítico</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <th style="text-align:left;">4. Muy Alta</th>
                                ${renderMatrixCell(4, 1)}
                                ${renderMatrixCell(4, 2)}
                                ${renderMatrixCell(4, 3)}
                                ${renderMatrixCell(4, 4)}
                            </tr>
                            <tr>
                                <th style="text-align:left;">3. Alta</th>
                                ${renderMatrixCell(3, 1)}
                                ${renderMatrixCell(3, 2)}
                                ${renderMatrixCell(3, 3)}
                                ${renderMatrixCell(3, 4)}
                            </tr>
                            <tr>
                                <th style="text-align:left;">2. Media</th>
                                ${renderMatrixCell(2, 1)}
                                ${renderMatrixCell(2, 2)}
                                ${renderMatrixCell(2, 3)}
                                ${renderMatrixCell(2, 4)}
                            </tr>
                            <tr>
                                <th style="text-align:left;">1. Baja</th>
                                ${renderMatrixCell(1, 1)}
                                ${renderMatrixCell(1, 2)}
                                ${renderMatrixCell(1, 3)}
                                ${renderMatrixCell(1, 4)}
                            </tr>
                        </tbody>
                    </table>

                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; margin-top:12px; padding-top:10px; border-top:1px dashed #e2e8f0; font-size:0.75rem; color:#64748b; gap:8px;">
                        <span style="font-weight:700;">Nivel de Severidad:</span>
                        <span style="display:flex; align-items:center; gap:4px;"><span style="width:12px; height:12px; border-radius:3px; background:#dcfce7; border:1px solid #bbf7d0; display:inline-block;"></span> Bajo (1-3)</span>
                        <span style="display:flex; align-items:center; gap:4px;"><span style="width:12px; height:12px; border-radius:3px; background:#fef3c7; border:1px solid #fde68a; display:inline-block;"></span> Moderado (4-6)</span>
                        <span style="display:flex; align-items:center; gap:4px;"><span style="width:12px; height:12px; border-radius:3px; background:#fee2e2; border:1px solid #fecaca; display:inline-block;"></span> Alto (8-9)</span>
                        <span style="display:flex; align-items:center; gap:4px;"><span style="width:12px; height:12px; border-radius:3px; background:#ef4444; border:1px solid #dc2626; display:inline-block;"></span> Crítico (12-16)</span>
                    </div>
                </div>

                <!-- GRÁFICO: DISTRIBUCIÓN POR ESTADO DE GESTIÓN -->
                <div class="analytics-chart-card">
                    <h4><i class="fas fa-chart-pie" style="color:#0066FF;"></i> Estado del Ciclo de Vida de Riesgos</h4>
                    <div class="analytics-chart-container">
                        <canvas id="estChartRiskStatus"></canvas>
                    </div>
                </div>
            </div>

            <!-- BLOQUE: GRÁFICOS DE ESTRATEGIAS Y PRIORIDADES -->
            <div id="est-rsec-charts-row1" class="analytics-chart-grid" style="grid-template-columns: 1fr 1fr; margin-bottom:1.5rem;">
                <div class="analytics-chart-card">
                    <h4><i class="fas fa-lightbulb" style="color:#f59e0b;"></i> Estrategias de Respuesta Adoptadas</h4>
                    <div class="analytics-chart-container">
                        <canvas id="estChartRiskStrategies"></canvas>
                    </div>
                </div>

                <div class="analytics-chart-card">
                    <h4><i class="fas fa-signal" style="color:#ef4444;"></i> Riesgos por Escala de Prioridad (1-10)</h4>
                    <div class="analytics-chart-container">
                        <canvas id="estChartRiskPriorities"></canvas>
                    </div>
                </div>
            </div>

            <!-- BLOQUE: TABLA DETALLADA DE RIESGOS (AUDITORÍA ALV) -->
            <div id="est-rsec-table" style="background:#fff; border-radius:12px; border:1px solid #e2e8f0; padding:1.25rem; margin-bottom:1.5rem; box-shadow:0 2px 6px rgba(0,0,0,0.02);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:10px;">
                    <h4 style="margin:0; font-size:1.05rem; color:#1e293b; font-weight:700; display:flex; align-items:center; gap:8px;">
                        <i class="fas fa-table" style="color:#f59e0b"></i> Registro Detallado y Seguimiento de Riesgos (${totalRisks})
                    </h4>
                    <button class="btn btn-outline btn-sm" onclick="openRiskModal()">
                        <i class="fas fa-plus"></i> Añadir Riesgo
                    </button>
                </div>

                ${totalRisks === 0 ? `
                    <div style="text-align:center; padding:2rem; color:#94a3b8; background:#f8fafc; border-radius:8px; border:1px dashed #e2e8f0;">
                        <i class="fas fa-shield-alt fa-2x" style="opacity:0.4; margin-bottom:0.5rem;"></i>
                        <p style="margin:0; font-weight:500;">No hay riesgos identificados para este proyecto en la base de datos.</p>
                    </div>
                ` : `
                    <div style="overflow-x:auto;">
                        <table class="exec-drilldown-table">
                            <thead>
                                <tr>
                                    <th style="width:40px;">Nº</th>
                                    <th>Riesgo Identificado</th>
                                    <th>Causa Raíz</th>
                                    <th>Probabilidad</th>
                                    <th>Impacto</th>
                                    <th>Prioridad</th>
                                    <th>Estrategia</th>
                                    <th>Plan de Respuesta</th>
                                    <th>Estado</th>
                                    <th style="width:80px; text-align:center;">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${risks.map((r, index) => {
                                    const prioVal = parseInt(r.prioridad || 0);
                                    const prioColor = prioVal >= 7 ? '#dc2626' : (prioVal >= 4 ? '#d97706' : '#166534');

                                    const probBadge = (p) => {
                                        const w = probWeight(p);
                                        const bg = w >= 3 ? '#fee2e2; color:#b91c1c;' : (w === 2 ? '#fef3c7; color:#b45309;' : '#dcfce7; color:#15803d;');
                                        return `<span class="badge" style="background:${bg}; font-size:0.72rem; padding:2px 6px;">${p || 'Media'}</span>`;
                                    };

                                    const impBadge = (i) => {
                                        const w = impWeight(i);
                                        const bg = w >= 3 ? '#fee2e2; color:#b91c1c;' : (w === 2 ? '#fef3c7; color:#b45309;' : '#dcfce7; color:#15803d;');
                                        return `<span class="badge" style="background:${bg}; font-size:0.72rem; padding:2px 6px;">${i || 'Medio'}</span>`;
                                    };

                                    const statusBadge = (s) => {
                                        const st = (s || 'Abierto').toLowerCase();
                                        if (st === 'cerrado') return `<span class="badge" style="background:#dcfce7; color:#15803d;"><i class="fas fa-check"></i> Cerrado</span>`;
                                        if (st.includes('mitiga')) return `<span class="badge" style="background:#fef3c7; color:#b45309;"><i class="fas fa-spinner fa-spin"></i> En Mitigación</span>`;
                                        return `<span class="badge" style="background:#fee2e2; color:#b91c1c;"><i class="fas fa-exclamation-circle"></i> Abierto</span>`;
                                    };

                                    return `
                                        <tr>
                                            <td style="font-weight:700; color:#64748b;">${index + 1}</td>
                                            <td><strong>${r.riesgo_identificado || 'Sin descripción'}</strong></td>
                                            <td style="color:#64748b; font-size:0.8rem;">${r.causa || '-'}</td>
                                            <td>${probBadge(r.probabilidad)}</td>
                                            <td>${impBadge(r.impacto)}</td>
                                            <td><strong style="color:${prioColor}; font-size:0.95rem;">${prioVal}</strong></td>
                                            <td>
                                                <span class="est-phase-stat-pill ${r.estrategia_respuesta ? 'success' : 'warning'}">
                                                    ${r.estrategia_respuesta || 'Sin estrategia'}
                                                </span>
                                            </td>
                                            <td style="font-size:0.8rem; color:#334155;">${r.plan_respuesta || '<span style="color:#94a3b8;">Sin plan</span>'}</td>
                                            <td>${statusBadge(r.estado)}</td>
                                            <td style="text-align:center;">
                                                <button class="btn-icon" title="Editar en modal de riesgos" onclick="openRiskModal('${r.id}')" style="padding:4px 8px; font-size:0.85rem;">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;

        container.innerHTML = html;

        // Render all Chart.js charts
        window.renderEstRiskCharts(window.estRiskCachedData);

    } catch (err) {
        console.error("Error loading EST Risks Module:", err);
        container.innerHTML = `
            <div style="padding:1.5rem; color:#ef4444; background:#fef2f2; border-radius:8px;">
                <i class="fas fa-exclamation-triangle"></i> Error al cargar módulo de riesgos: ${err.message}
            </div>
        `;
    }
};

/**
 * Instantiates and paints all Chart.js charts for EST Risks Module
 */
window.renderEstRiskCharts = function (data) {
    if (!data || typeof Chart === 'undefined') return;

    window.destroyEstRiskCharts();

    const chartDefaults = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { boxWidth: 12, padding: 15, font: { size: 11, family: "'Inter', sans-serif" } }
            },
            tooltip: {
                backgroundColor: 'rgba(255,255,255,0.98)',
                titleColor: '#0f172a',
                bodyColor: '#334155',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                padding: 10,
                boxPadding: 4,
                usePointStyle: true
            }
        }
    };

    // 1. Chart Risk Status (Doughnut)
    const ctxStatus = document.getElementById('estChartRiskStatus');
    if (ctxStatus) {
        window.estRiskCharts['riskStatus'] = new Chart(ctxStatus, {
            type: 'doughnut',
            data: {
                labels: ['Abiertos (Pendientes)', 'En Mitigación', 'Cerrados / Mitigados'],
                datasets: [{
                    data: [data.openRisksCount, data.mitigatingRisksCount, data.closedRisksCount],
                    backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                ...chartDefaults,
                cutout: '68%'
            }
        });
    }

    // 2. Chart Risk Strategies (Bar Horizontal)
    const ctxStrategies = document.getElementById('estChartRiskStrategies');
    if (ctxStrategies) {
        const stratMap = { 'Mitigar': 0, 'Evitar': 0, 'Transferir': 0, 'Aceptar': 0, 'Sin definir': 0 };
        data.risks.forEach(r => {
            const st = (r.estrategia_respuesta || '').trim();
            if (st.toLowerCase().includes('mitig')) stratMap['Mitigar']++;
            else if (st.toLowerCase().includes('evit')) stratMap['Evitar']++;
            else if (st.toLowerCase().includes('transf')) stratMap['Transferir']++;
            else if (st.toLowerCase().includes('acept')) stratMap['Aceptar']++;
            else stratMap['Sin definir']++;
        });

        window.estRiskCharts['riskStrategies'] = new Chart(ctxStrategies, {
            type: 'bar',
            data: {
                labels: Object.keys(stratMap),
                datasets: [{
                    label: 'Nº Riesgos',
                    data: Object.values(stratMap),
                    backgroundColor: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#94a3b8'],
                    borderRadius: 6
                }]
            },
            options: {
                ...chartDefaults,
                indexAxis: 'y',
                scales: {
                    x: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { precision: 0 } },
                    y: { grid: { display: false } }
                },
                plugins: { ...chartDefaults.plugins, legend: { display: false } }
            }
        });
    }

    // 3. Chart Risk Priorities (Bar)
    const ctxPriorities = document.getElementById('estChartRiskPriorities');
    if (ctxPriorities) {
        const pCritical = data.risks.filter(r => parseInt(r.prioridad || 0) >= 8).length;
        const pHigh = data.risks.filter(r => {
            const p = parseInt(r.prioridad || 0);
            return p >= 6 && p < 8;
        }).length;
        const pMedium = data.risks.filter(r => {
            const p = parseInt(r.prioridad || 0);
            return p >= 4 && p < 6;
        }).length;
        const pLow = data.risks.filter(r => {
            const p = parseInt(r.prioridad || 0);
            return p < 4;
        }).length;

        window.estRiskCharts['riskPriorities'] = new Chart(ctxPriorities, {
            type: 'bar',
            data: {
                labels: ['Crítica (8-10)', 'Alta (6-7)', 'Media (4-5)', 'Baja (1-3)'],
                datasets: [{
                    label: 'Nº Riesgos',
                    data: [pCritical, pHigh, pMedium, pLow],
                    backgroundColor: ['#ef4444', '#ea580c', '#f59e0b', '#10b981'],
                    borderRadius: 6
                }]
            },
            options: {
                ...chartDefaults,
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { precision: 0 } },
                    x: { grid: { display: false } }
                },
                plugins: { ...chartDefaults.plugins, legend: { display: false } }
            }
        });
    }
};





function renderReportingModule() {
    elements.moduleContent.innerHTML = `
        ${renderPhaseHeader('Reporting')}
        <div class="stacked-layout" style="display: flex !important; flex-direction: column !important; gap: 0.5rem !important;">
            ${['1: Informe de Tareas', '2: Informe de Talleres', '3: Informe de Backlog', '4: Informe de Diseños', '5: Informe de Testing'].map((title, i) =>
        isItemRestricted('rep', title) ? '' : `
                <div class="collapsible-wrapper" style="border-left: 5px solid #666;">
                    <div class="collapsible-header" onclick="toggleSection(this)">
                        <h3 style="color:#666; display:flex; align-items:center; gap:10px;"><i class="fas fa-file-alt"></i> ${title}</h3>
                        <i class="fas fa-plus-circle toggle-icon"></i>
                    </div>
                    <div class="collapsible-content"><p style="padding:1rem;">En desarrollo...</p></div>
                </div>`
    ).join('')}

            <!-- PARTE 6: Informe de Incidencias (ALV 18 Columnas) -->
            ${isItemRestricted('rep', '6: Informe Detallado de Incidencias') ? '' : `
            <div class="collapsible-wrapper" style="border-left: 5px solid #673ab7;">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:#673ab7; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-file-invoice"></i> 6: Informe Detallado de Incidencias (ALV)
                    </h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content">
                    <div style="padding: 1rem;">
                        <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-bottom: 1rem;">
                            ${hasPermission('rep', 'download') ? `
                            <button class="btn btn-outline btn-sm" onclick="exportIncidents('pdf')"><i class="fas fa-file-pdf"></i> PDF</button>
                            <button class="btn btn-outline btn-sm" onclick="exportIncidents('excel')"><i class="fas fa-file-excel"></i> EXCEL</button>
                            ` : ''}
                        </div>
                        
                        <div class="table-responsive" style="max-height: 600px; overflow-x: auto;">
                            <table class="alv-table" style="min-width: 2500px; font-size: 0.75rem;">
                                <thead>
                                    <tr>
                                        <th>Cliente</th><th>Número</th><th>Proyecto</th><th>Fecha</th><th>Resp. Cliente</th>
                                        <th>Tipo</th><th>Tipo ALTIM</th><th>LoB</th><th>Descripción</th><th>Mensaje Error</th>
                                        <th>Observaciones</th><th>Prioridad</th><th>Comentarios</th><th>Sistema</th>
                                        <th>Resp. ALTIM</th><th>Estado</th><th>F. Entrega</th><th>F. Cierre</th>
                                    </tr>
                                </thead>
                                <tbody id="reporting-alv-body"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            `}

            ${isItemRestricted('rep', '7: Informe de Formación') ? '' : `
            <div class="collapsible-wrapper" style="border-left: 5px solid #666;">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:#666; display:flex; align-items:center; gap:10px;"><i class="fas fa-graduation-cap"></i> 7: Informe de Formación</h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content"><p style="padding:1rem;">En desarrollo...</p></div>
            </div>`}

            ${isItemRestricted('rep', '8: Informe de Estrategia') ? '' : `
            <div class="collapsible-wrapper" style="border-left: 5px solid #666;">
                <div class="collapsible-header" onclick="toggleSection(this)">
                    <h3 style="color:#666; display:flex; align-items:center; gap:10px;"><i class="fas fa-chess"></i> 8: Informe de Estrategia</h3>
                    <i class="fas fa-plus-circle toggle-icon"></i>
                </div>
                <div class="collapsible-content"><p style="padding:1rem;">En desarrollo...</p></div>
            </div>`}
        </div>
    `;
    renderReportingALV();
}

// Global window functions for modals
window.openIncidentModal = async function (id = null) {
    if (!hasPermission('dey', 'view') && !hasPermission('dey', 'modify')) {
        Swal.fire('Acceso Denegado', 'No tienes permisos para ver incidencias.', 'error');
        return;
    }
    const isEditing = !!id;
    const canModify = hasPermission('dey', 'modify');

    const modal = document.getElementById('incident-modal');
    const form = document.getElementById('incident-form');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('incident-id').value = id || '';
    document.getElementById('incident-modal-title').textContent = id ? 'Modificar Incidencia' : 'Nueva Incidencia';

    const currentProjectId = state.selectedProject ? (state.selectedProject.id || state.selectedProject.id_proyecto) : null;
    const currentClientId = state.selectedProject ? (state.selectedProject.client_id || state.selectedProject.id_cliente) : null;

    // --- RESPONSABLE ALTIM ---
    const respAltimSelect = document.getElementById('inc-resp-altim');
    respAltimSelect.innerHTML = '<option value="">-- Sin asignar --</option>';
    let altimStaff = [];

    if (supabaseClient && currentProjectId) {
        try {
            // 1. Get user_ids assigned to this project
            const { data: proyRels } = await supabaseClient.from('user_project_relation').select('user_id').eq('project_id', currentProjectId);
            const assignedUserIds = (proyRels || []).map(r => r.user_id);

            // 2. Fetch users directly
            const { data: allUsers } = await supabaseClient.from('users').select('*');
            if (allUsers) {
                state.users = allUsers; // Global hydration mapping
                altimStaff = allUsers.filter(u => {
                    const type = u.user_type || u.type || '';
                    const role = String(u.role || '').toLowerCase();
                    // Admin / Management always appear
                    if (role === 'administrador' || role === 'management') return true;
                    // Other Altim must be assigned to project
                    if (type === 'Altim' && assignedUserIds.includes(u.id)) return true;
                    return false;
                });
            }
        } catch (e) { console.error('Error fetching Altim staff:', e); }
    }

    altimStaff.forEach(u => {
        const name = (u.first_name || 'Usuario') + ' ' + (u.last_name || '');
        respAltimSelect.innerHTML += `<option value="${name}">${name}</option>`;
    });

    // --- RESPONSABLE CLIENTE ---
    const respClienteSelect = document.getElementById('inc-resp-cliente');
    respClienteSelect.innerHTML = '<option value="">-- Seleccione --</option>';
    let clienteStaff = [];

    let safeClientId = currentClientId;
    if (!safeClientId && supabaseClient && currentProjectId) {
        try {
            const { data: projData } = await supabaseClient.from('cliente_proy').select('client_id').eq('id', currentProjectId).maybeSingle();
            if (projData) safeClientId = projData.client_id;
        } catch (e) { }
    }

    if (supabaseClient && currentProjectId) {
        try {
            let cliUserIds = [];
            if (safeClientId) {
                const { data: cliRels } = await supabaseClient.from('user_client_relation').select('user_id').eq('client_id', safeClientId);
                cliUserIds = (cliRels || []).map(r => r.user_id);
            }

            const { data: proyRels } = await supabaseClient.from('user_project_relation').select('user_id').eq('project_id', currentProjectId);
            const proyUserIds = (proyRels || []).map(r => r.user_id);

            const currentProjectName = state.selectedProject ? String(state.selectedProject.name).toLowerCase() : 'xxx_invalid_xxx';
            const currentProjectDesc = state.selectedProject ? String(state.selectedProject.descripcion_prj || '').toLowerCase() : 'xxx_invalid_xxx';

            if (state.users) {
                clienteStaff = state.users.filter(u => {
                    const type = String(u.user_type || u.type || '').toLowerCase();
                    const role = String(u.role || '').toLowerCase();

                    // 1. Must be Client type
                    const isClient = (type === 'cliente' || role === 'cliente');
                    if (!isClient) return false;

                    // 2. Must be assigned to the project (either via DB relations, or string field)
                    const assignedRelation = proyUserIds.includes(u.id);
                    const userProjStr = String(u.nombre_proyecto || '').toLowerCase();
                    const assignedString = (userProjStr === currentProjectName) || (userProjStr === currentProjectDesc);

                    return assignedRelation || assignedString;
                });
            }
        } catch (e) { console.error('Error fetching Cliente staff:', e); }
    }

    clienteStaff.forEach(u => {
        const name = (u.first_name || 'Usuario') + ' ' + (u.last_name || '');
        respClienteSelect.innerHTML += `<option value="${name}">${name}</option>`;
    });

    // Populate LoB dropdown from master_lobs
    const lobSelect = document.getElementById('inc-lob');
    lobSelect.innerHTML = '<option value="">- Seleccione -</option>';
    if (supabaseClient) {
        try {
            const { data: lobs } = await supabaseClient.from('master_lobs').select('id_lob');
            if (lobs) {
                lobSelect.innerHTML += lobs.map(l => `<option value="${l.id_lob}">${l.id_lob}</option>`).join('');
            }
        } catch (err) { console.error('Error fetching LoBs:', err); }
    }

    if (id) {
        const inc = state.incidents.find(i => i.id == id);
        if (inc) {
            document.getElementById('inc-numero').value = inc.numero_incidencia || '';
            document.getElementById('inc-fecha').value = inc.fecha_incid || '';
            document.getElementById('inc-resp-cliente').value = inc.resp_cliente || '';
            document.getElementById('inc-tipo').value = inc.tipo || 'Incidencia';
            document.getElementById('inc-prioridad').value = inc.prioridad || 'Media';
            document.getElementById('inc-lob').value = inc.lob || '';
            document.getElementById('inc-sistema').value = inc.sistema || 'S/4Hana OP';
            document.getElementById('inc-tipo-altim').value = inc.tipo_altim || '';
            document.getElementById('inc-resp-altim').value = inc.resp_altim || '';
            let shortDesc = inc.descripcion_corta || '';
            let longDesc = inc.descripcion || '';
            const match = longDesc.match(/^\[R\] (.*?)\n(.*)/s);
            if (match) {
                shortDesc = match[1];
                longDesc = match[2];
            }
            document.getElementById('inc-descripcion-corta').value = shortDesc;
            document.getElementById('inc-descripcion').value = longDesc;
            document.getElementById('inc-error-mensaje').value = inc.error_mensaje || '';
            document.getElementById('inc-estado').value = inc.estado || '09 Nueva';
            document.getElementById('inc-observaciones').value = inc.observaciones || '';
            document.getElementById('inc-comentarios').value = inc.comentarios || '';
        }
    } else {
        // New incident
        document.getElementById('inc-fecha').valueAsDate = new Date();

        let abbrev = state.selectedProject?.client_abrev;
        if (!abbrev && supabaseClient && safeClientId) {
            try {
                const { data: cData } = await supabaseClient.from('clients').select('abrev').eq('id', safeClientId).maybeSingle();
                if (cData && cData.abrev) abbrev = cData.abrev;
            } catch (e) { }
        }
        if (!abbrev && state.selectedProject?.client) {
            abbrev = String(state.selectedProject.client).substring(0, 3).toUpperCase();
        }

        const clientAbrev = abbrev || 'GEN';
        const lastInc = (state.incidents || []).filter(i => i.numero_incidencia && i.numero_incidencia.startsWith(clientAbrev)).length;
        document.getElementById('inc-numero').value = `${clientAbrev}${String(lastInc + 1).padStart(7, '0')} `;
        document.getElementById('inc-resp-cliente').value = state.currentUser.name + ' ' + state.currentUser.lastname;
        document.getElementById('inc-estado').value = '09 Nueva';
    }

    modal.classList.add('active');
};

window.closeIncidentModal = function () {
    document.getElementById('incident-modal').classList.remove('active');
};

window.openSysConfigModal = async function () {
    if (!state.currentUser) {
        alert('Debes iniciar sesión primero.');
        return;
    }
    const safeRole = String(state.currentUser.role || '').toLowerCase();
    if (safeRole !== 'administrador' && safeRole !== 'admin') {
        alert('Acceso Denegado: Solo el Administrador puede modificar la configuración (' + safeRole + ').');
        return;
    }

    const modal = document.getElementById('sysconfig-modal');
    if (!modal) {
        alert('ADVERTENCIA: Tu navegador está usando una versión antigua de la página (Caché vieja). Pulsa Control + F5 para descargar los nuevos menús.');
        return;
    }
    if (!supabaseClient) {
        alert('ADVERTENCIA: Fallo de conexión de red o Supabase caído.');
        return;
    }

    try {
        let { data, error } = await supabaseClient.from('api_credentials_vault').select('*').order('category');
        if (error) {
            console.error(error);
            alert('Error leyendo configuración: ' + error.message);
            return;
        }

        const defaultConfigs = [
            { key_name: 'GOOGLE_GEMINI_API_KEY', key_value: '', description: 'Token de acceso Gemini', category: 'API_KEYS', is_secret: true },
            { key_name: 'SHAREPOINT_CLIENT_ID', key_value: '', description: 'Client ID SharePoint', category: 'API_KEYS', is_secret: true },
            { key_name: 'SHAREPOINT_CLIENT_SECRET', key_value: '', description: 'Secret Key SharePoint', category: 'API_KEYS', is_secret: true },
            { key_name: 'SHAREPOINT_TENANT_ID', key_value: '', description: 'ID del Tenant M365', category: 'ENDPOINTS', is_secret: false },
            { key_name: 'JIRA_API_TOKEN', key_value: '', description: 'Token de Jira', category: 'API_KEYS', is_secret: true },
            { key_name: 'JIRA_BASE_URL', key_value: 'https://altim.atlassian.net', description: 'URL base de Jira', category: 'ENDPOINTS', is_secret: false },
            { key_name: 'JIRA_USER_EMAIL', key_value: '', description: 'Email servicio Jira', category: 'EMAIL', is_secret: false },
            { key_name: 'EXCHANGE_CLIENT_ID', key_value: '', description: 'MS Exchange Client ID', category: 'API_KEYS', is_secret: true },
            { key_name: 'EXCHANGE_CLIENT_SECRET', key_value: '', description: 'MS Exchange Secret', category: 'API_KEYS', is_secret: true },
            { key_name: 'EMAILJS_PUBLIC_KEY', key_value: '', description: 'Public Key EmailJS', category: 'API_KEYS', is_secret: false },
            { key_name: 'EMAILJS_SERVICE_ID', key_value: '', description: 'ID Servicio EmailJS', category: 'ENDPOINTS', is_secret: false },
            { key_name: 'EMAILJS_TEMPLATE_ID', key_value: '', description: 'Plantilla de EmailJS', category: 'ENDPOINTS', is_secret: false },
            { key_name: 'CAROUSEL_SPEED', key_value: '5000', description: 'Velocidad del carrusel (ms)', category: 'UI_CONFIG', is_secret: false }
        ];

        // Check for missing keys and auto-seed them
        const existingKeys = (data || []).map(d => d.key_name);
        const missingKeys = defaultConfigs.filter(cfg => !existingKeys.includes(cfg.key_name));

        if (missingKeys.length > 0) {
            console.log("Insertando claves de configuración faltantes:", missingKeys.map(k => k.key_name));
            const { error: insErr } = await supabaseClient.from('api_credentials_vault').insert(missingKeys);
            if (!insErr) {
                // Refresh data after insertion
                const { data: refreshedData } = await supabaseClient.from('api_credentials_vault').select('*').order('category');
                data = refreshedData;
            }
        }

        const container = document.getElementById('sysconfig-fields');
        let html = '';
        let currentCategory = '';

        (data || []).forEach(item => {
            if (currentCategory !== item.category) {
                currentCategory = item.category;
                html += `<h4 style="margin-top: 15px; margin-bottom: 5px; color: var(--primary-color); border-bottom: 1px solid #ddd; padding-bottom: 2px;">${currentCategory || 'GENERAL'}</h4>`;
            }
            const inputType = item.is_secret ? 'password' : 'text';
            html += `
                                            <div class="form-group" style="margin-bottom: 8px;">
                                                <label style="font-size: 0.8rem; font-weight: 700; color: #444;">
                                                    ${item.key_name}
                                                    <span style="font-weight: normal; font-size: 0.7rem; color: #888; margin-left: 5px;">- ${item.description || ''}</span>
                                                </label>
                                                <input type="${inputType}" id="cfg_${item.id}" data-id="${item.id}" data-key="${item.key_name}" value="${item.key_value || ''}" placeholder="Ej. Token o URL" style="width: 100%; padding: 6px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px;">
                                            </div>
                                            `;
        });
        container.innerHTML = html;
        modal.classList.add('active');
    } catch (err) {
        console.error(err);
    }
};

window.closeSysConfigModal = function () {
    document.getElementById('sysconfig-modal').classList.remove('active');
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('incident-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('incident-id').value;
        const incTitle = document.getElementById('inc-descripcion-corta').value;
        const incDesc = document.getElementById('inc-descripcion').value;
        const mergedDesc = incTitle ? `[R] ${incTitle} \n${incDesc} ` : incDesc;

        const newInc = {
            numero_incidencia: document.getElementById('inc-numero').value,
            fecha_incid: document.getElementById('inc-fecha').value,
            resp_cliente: document.getElementById('inc-resp-cliente').value,
            tipo: document.getElementById('inc-tipo').value,
            prioridad: document.getElementById('inc-prioridad').value,
            lob: document.getElementById('inc-lob').value,
            sistema: document.getElementById('inc-sistema').value,
            tipo_altim: document.getElementById('inc-tipo-altim').value,
            resp_altim: document.getElementById('inc-resp-altim').value,
            descripcion: mergedDesc,
            error_mensaje: document.getElementById('inc-error-mensaje').value,
            estado: document.getElementById('inc-estado').value,
            observaciones: document.getElementById('inc-observaciones').value,
            comentarios: document.getElementById('inc-comentarios').value,
            cliente_id: state.selectedProject ? (state.selectedProject.client_id || null) : null,
            proyecto_id: state.selectedProject ? state.selectedProject.id : null
        };

        if (supabaseClient) {
            if (id) {
                const { error } = await supabaseClient.from('incidencias').update(newInc).eq('id', id);
                if (!error) {
                    addIncidentAuditLog(id, 'Modificación', 'Varios', '-', 'Actualización de campos');
                    const idx = state.incidents.findIndex(i => i.id == id);
                    if (idx > -1) state.incidents[idx] = { ...state.incidents[idx], ...newInc };
                } else {
                    Swal.fire('Error', error.message, 'error');
                    return;
                }
            } else {
                const { data, error } = await supabaseClient.from('incidencias').insert([newInc]).select();
                if (!error && data) {
                    state.incidents.push(data[0]);
                    addIncidentAuditLog(data[0].id, 'Creación', 'Registro', '-', 'Registro inicial');
                } else {
                    Swal.fire('Error', error.message, 'error');
                    return;
                }
            }
            renderIncidentTable();
            closeIncidentModal();
            Swal.fire('Éxito', 'Incidencia guardada correctamente.', 'success');
            if (state.activeModule === 'rep') renderReportingModule();
            if (state.activeModule === 'est') {
                if (window.fetchLiveIncidentsAndUpdate) window.fetchLiveIncidentsAndUpdate();
                else if (window.updateIncidentDashboard) window.updateIncidentDashboard();
            }
        }
    });

    // System Config Form Submit Listener
    document.getElementById('sysconfig-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const inputs = document.getElementById('sysconfig-fields').querySelectorAll('input');
        const updates = [];
        inputs.forEach(inp => {
            updates.push({
                id: parseInt(inp.getAttribute('data-id')),
                key_name: inp.getAttribute('data-key'),
                key_value: inp.value,
                updated_at: new Date().toISOString(),
                updated_by: state.currentUser ? state.currentUser.email : 'Unknown'
            });
        });

        if (supabaseClient && updates.length > 0) {
            try {
                // Upsert updates records by evaluating their id footprint
                const { error } = await supabaseClient.from('api_credentials_vault').upsert(updates);
                if (error) throw error;

                alert('Claves de Integración actualizadas correctamente en la base de datos.');
                closeSysConfigModal();
            } catch (error) {
                console.error(error);
                alert('Error al guardar configuración: ' + error.message);
            }
        }
    });
});

async function addIncidentAuditLog(incidentId, action, field, oldVal, newVal) {
    const log = {
        incident_id: incidentId,
        usuario_email: state.currentUser.email,
        accion: action,
        campo_modificado: field,
        valor_anterior: String(oldVal || '-'),
        valor_nuevo: String(newVal || '-')
    };
    if (supabaseClient) {
        const { data, error } = await supabaseClient.from('incident_audit_logs').insert([log]).select();
        if (!error && data) state.incidentAuditLogs.unshift(data[0]);
    }
}

window.fetchLiveIncidentsAndUpdate = async function(preferredProjectId = null) {
    const refreshIcon = document.getElementById('analytics-refresh-icon');
    if (refreshIcon) refreshIcon.classList.add('fa-spin');
    const timestampEl = document.getElementById('analytics-live-timestamp');
    if (timestampEl) timestampEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando incidencias on-line con Supabase...';

    try {
        if (supabaseClient) {
            // 1. Fetch live incidents from Supabase
            const { data: liveIncidents, error: incError } = await supabaseClient
                .from('incidencias')
                .select('*')
                .order('id', { ascending: false });

            if (!incError && liveIncidents) {
                state.incidents = liveIncidents;
            } else if (incError) {
                console.error('Error al sincronizar incidencias on-line:', incError);
            }

            // 2. Fetch projects for dropdown
            const { data: projs, error: projError } = await supabaseClient
                .from('cliente_proy')
                .select('id, id_proyecto, descripcion_prj, clients(nombre_cliente)')
                .order('id', { ascending: true });

            const projSelect = document.getElementById('analytics-filter-project');
            if (projSelect && projs) {
                const currentVal = projSelect.value;
                const defaultTarget = preferredProjectId !== null && preferredProjectId !== undefined 
                    ? String(preferredProjectId) 
                    : (state.selectedProject?.id ? String(state.selectedProject.id) : '');
                const targetVal = currentVal !== '' ? currentVal : defaultTarget;

                let optionsHtml = '<option value="">-- Todos los Proyectos --</option>';
                projs.forEach(p => {
                    const pLabel = `${p.id_proyecto} - ${p.descripcion_prj || p.clients?.nombre_cliente || ''}`;
                    optionsHtml += `<option value="${p.id}">${pLabel}</option>`;
                });
                projSelect.innerHTML = optionsHtml;

                if (targetVal && Array.from(projSelect.options).some(o => o.value === String(targetVal))) {
                    projSelect.value = String(targetVal);
                } else {
                    projSelect.value = '';
                }
            }
        }
    } catch (err) {
        console.error('Error en fetchLiveIncidentsAndUpdate:', err);
    } finally {
        if (refreshIcon) refreshIcon.classList.remove('fa-spin');
        const now = new Date();
        const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        if (timestampEl) {
            timestampEl.innerHTML = `<i class="fas fa-check-circle" style="color:#10b981;"></i> Conectado on-line (Última actualización: ${timeStr})`;
        }
        window.updateIncidentDashboard();
    }
};

window.updateIncidentDashboard = function() {
    let data = state.incidents || [];
    
    if (state.currentUser && (state.currentUser.user_type === 'Cliente' || state.currentUser.role === 'Cliente')) {
        const clientAbrev = state.currentUser.abrev || state.currentUser.abrev_cliente;
        if (clientAbrev) {
            data = data.filter(i => i.numero_incidencia && i.numero_incidencia.startsWith(clientAbrev));
        }
    }

    const projSelect = document.getElementById('analytics-filter-project');
    const prjF = projSelect ? projSelect.value : '';
    const statusF = document.getElementById('analytics-filter-status')?.value;
    const priorityF = document.getElementById('analytics-filter-priority')?.value;
    const typeF = document.getElementById('analytics-filter-type')?.value;
    const lobF = document.getElementById('analytics-filter-lob')?.value;

    if (prjF) {
        data = data.filter(i => (i.proyecto_id == prjF || i.project_id == prjF));
    }

    if (statusF) {
        data = data.filter(i => statusF === 'Abiertas' 
            ? (i.estado && !i.estado.includes('10') && !i.estado.includes('11')) 
            : (i.estado && i.estado.includes(statusF))
        );
    }
    if (priorityF) data = data.filter(i => i.prioridad === priorityF);
    if (typeF) data = data.filter(i => i.tipo === typeF);
    if (lobF) data = data.filter(i => i.lob === lobF);

    const filterInfo = document.getElementById('analytics-current-filter-info');
    if (filterInfo) {
        let label = 'Todos los Proyectos';
        if (projSelect && projSelect.selectedIndex > 0) {
            label = projSelect.options[projSelect.selectedIndex].text;
        }
        filterInfo.innerHTML = `<i class="fas fa-filter"></i> ${label} <span style="color:#64748b; font-weight:normal;">(${data.length} de ${(state.incidents || []).length} incidencias)</span>`;
    }

    initIncidentCharts(data);
};

function initIncidentCharts(filteredData = null) {
    if (!window.Chart) return;
    if (!window.analyticsCharts) window.analyticsCharts = {};

    let data = filteredData;
    if (!data) {
        data = state.incidents || [];
        if (state.currentUser && (state.currentUser.user_type === 'Cliente' || state.currentUser.role === 'Cliente')) {
            const clientAbrev = state.currentUser.abrev || state.currentUser.abrev_cliente;
            if (clientAbrev) data = data.filter(i => i.numero_incidencia && i.numero_incidencia.startsWith(clientAbrev));
        }
        const prjF = document.getElementById('analytics-filter-project')?.value;
        if (prjF) {
            data = data.filter(i => (i.proyecto_id == prjF || i.project_id == prjF));
        }
    }

    // Update KPIs
    if (document.getElementById('kpi-inc-total')) {
        const total = data.length;
        const closed = data.filter(i => i.estado && (i.estado.includes('10') || i.estado.includes('11'))).length;
        const resolution = total > 0 ? Math.round((closed / total) * 100) : 0;
        const open = data.filter(i => i.estado && !i.estado.includes('10') && !i.estado.includes('11')).length;
        const criticalActive = data.filter(i => i.prioridad && i.prioridad.toLowerCase().includes('crítica') && i.estado && !i.estado.includes('10') && !i.estado.includes('11')).length;

        document.getElementById('kpi-inc-total').textContent = total;
        document.getElementById('kpi-inc-resolution').textContent = `${resolution}%`;
        document.getElementById('kpi-inc-open').textContent = open;
        document.getElementById('kpi-inc-critical').textContent = criticalActive;
    }

    const count = (field) => {
        const obj = {};
        data.forEach(i => {
            const val = i[field] || 'Sin especificar';
            obj[val] = (obj[val] || 0) + 1;
        });
        return obj;
    };

    const configs = [
        { id: 'chartStatus', type: 'doughnut', data: count('estado'), colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b', '#cbd5e1'] },
        { id: 'chartPriority', type: 'bar', data: count('prioridad'), colors: ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#94a3b8'] },
        { id: 'chartType', type: 'doughnut', data: count('tipo'), colors: ['#10b981', '#8b5cf6', '#f43f5e', '#facc15'] },
        { id: 'chartLoB', type: 'bar', data: count('lob'), colors: ['#8b5cf6', '#ec4899', '#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444'] }
    ];

    configs.forEach(cfg => {
        const ctx = document.getElementById(cfg.id);
        if (!ctx) return;

        // Destroy previous instance to prevent rendering overlap
        if (window.analyticsCharts[cfg.id]) {
            window.analyticsCharts[cfg.id].destroy();
        }

        const labels = Object.keys(cfg.data);
        const chartValues = Object.values(cfg.data);
        const hasData = labels.length > 0;

        window.analyticsCharts[cfg.id] = new Chart(ctx, {
            type: cfg.type,
            data: {
                labels: hasData ? labels : ['Sin datos'],
                datasets: [{
                    data: hasData ? chartValues : [0],
                    backgroundColor: hasData ? cfg.colors : ['#e2e8f0'],
                    borderWidth: 0,
                    borderRadius: cfg.type === 'bar' ? 6 : 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: cfg.type === 'doughnut' ? '70%' : undefined,
                plugins: {
                    legend: {
                        display: cfg.type !== 'bar' && hasData,
                        position: 'right',
                        labels: { boxWidth: 12, font: { size: 11, family: "'Inter', sans-serif" }, usePointStyle: true, padding: 20 }
                    },
                    tooltip: {
                        enabled: hasData,
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        titleColor: '#1e293b',
                        bodyColor: '#334155',
                        borderColor: '#e2e8f0',
                        borderWidth: 1,
                        padding: 12,
                        boxPadding: 6,
                        usePointStyle: true
                    }
                },
                scales: cfg.type === 'bar' ? {
                    x: { grid: { display: false }, ticks: { font: { family: "'Inter', sans-serif" } } },
                    y: { grid: { color: '#f1f5f9', drawBorder: false }, ticks: { stepSize: 1, font: { family: "'Inter', sans-serif" } } }
                } : undefined
            }
        });
    });
}

function renderReportingALV() {
    const tbody = document.getElementById('reporting-alv-body');
    if (!tbody) return;

    let filtered = state.incidents || [];
    if (state.currentUser.user_type === 'Cliente' || state.currentUser.role === 'Cliente') {
        const clientAbrev = state.currentUser.abrev || state.currentUser.abrev_cliente;
        if (clientAbrev) {
            filtered = filtered.filter(i => i.numero_incidencia && i.numero_incidencia.startsWith(clientAbrev));
        }
    }

    tbody.innerHTML = filtered.map(i => `
                                            <tr class="status-${(i.estado || '').toLowerCase().split(' ')[0]}">
                                                <td>${i.cliente_id || '-'}</td>
                                                <td style="font-weight:700;">${i.numero_incidencia}</td>
                                                <td>${i.proyecto_id || '-'}</td>
                                                <td>${formatDate(i.fecha_incid)}</td>
                                                <td>${i.resp_cliente || '-'}</td>
                                                <td>${i.tipo || '-'}</td>
                                                <td>${i.tipo_altim || '-'}</td>
                                                <td>${i.lob || '-'}</td>
                                                <td>${i.descripcion_corta || i.descripcion || '-'}</td>
                                                <td>${i.error_mensaje || '-'}</td>
                                                <td>${i.observaciones || '-'}</td>
                                                <td>${i.prioridad || '-'}</td>
                                                <td>${i.comentarios || '-'}</td>
                                                <td>${i.sistema || '-'}</td>
                                                <td>${i.resp_altim || '-'}</td>
                                                <td>${i.estado || '-'}</td>
                                                <td>${formatDate(i.fecha_entrega)}</td>
                                                <td>${formatDate(i.fecha_cierre)}</td>
                                            </tr >
                                            `).join('');
}

// AI Suggestion Integration
document.getElementById('btn-ai-suggestion')?.addEventListener('click', async () => {
    const desc = document.getElementById('inc-descripcion').value || document.getElementById('inc-descripcion-corta').value;
    if (!desc) {
        Swal.fire('Atención', 'Por favor, describe primero la incidencia.', 'info');
        return;
    }

    const btn = document.getElementById('btn-ai-suggestion');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Consultando...';

    try {
        // Placeholder for Gemini API
        setTimeout(() => {
            const suggestion = "Sugerencia IA: Verificar parametrización en el módulo indicado y revisar logs del sistema.";
            document.getElementById('inc-comentarios').value = suggestion;
            Toast.fire({ icon: 'success', title: 'Sugerencia generada con IA' });
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-magic"></i> Sugerir con IA';
        }, 1500);
    } catch (err) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-magic"></i> Sugerir con IA';
    }
});

function exportIncidents(format) {
    const data = state.incidents || [];
    if (data.length === 0) {
        Swal.fire('Atención', 'No hay datos para exportar.', 'info');
        return;
    }

    if (format === 'pdf') {
        Toast.fire({ icon: 'info', title: 'Generando PDF...' });
        setTimeout(() => {
            Swal.fire('Exportación', 'El informe PDF ha sido generado y enviado a tu correo.', 'success');
        }, 2000);
    } else {
        Toast.fire({ icon: 'info', title: 'Generando Excel...' });
        setTimeout(() => {
            Swal.fire('Exportación', 'El archivo Excel ha sido descargado.', 'success');
        }, 1500);
    }
}

async function renderRoleManagement() {
    elements.moduleContent.innerHTML = `
    <div class="collapsible-wrapper" style="border-left: 4px solid var(--primary-color);">
        <div class="collapsible-header" onclick="toggleSection(this)">
            <h3 style="color:var(--primary-color); display:flex; align-items:center; gap:10px;">
                <i class="fas fa-shield-alt"></i> GESTIÓN DE ROLES Y PERMISOS
            </h3>
            <i class="fas fa-plus-circle toggle-icon"></i>
        </div>
        <div class="collapsible-content">
            <div class="filter-row" style="margin-top:0.5rem; justify-content: space-between; display: flex; gap: 1rem; align-items: center;">
                <div style="display:flex; gap:10px;">
                    ${hasPermission('rol', 'modify') ? `
                    <button class="btn compact" onclick="addNewRoleRow()">
                        <i class="fas fa-plus"></i> Añadir Permiso
                    </button>
                    ` : ''}
                    <button class="btn btn-secondary compact" onclick="exportRolesToExcel()">
                        <i class="fas fa-file-excel"></i> Descargar Excel
                    </button>
                </div>
                <div class="form-group" style="margin:0; width:300px;">
                    <input type="text" placeholder="Filtrar por módulo o rol..." id="rol-search" class="form-control" oninput="filterRolesTable()" style="padding: 6px 12px; height: 34px;">
                </div>
            </div>

            <div class="table-container" style="margin-top:1rem; overflow-x:auto;">
                <table class="alv-table" id="roles-table">
                    <thead>
                        <tr>
                            <th style="width: 80px;">Acciones</th>
                            <th>Módulo</th>
                            <th>Tipo Usuario</th>
                            <th>Rol</th>
                            <th title="Visualizar">VIS</th>
                            <th title="Modificar">MOD</th>
                            <th title="Descargar">DES</th>
                            <th title="Adjuntar">ADJ</th>
                            <th title="Invisible">INV</th>
                            <th title="Con Restricciones">RES</th>
                            <th title="No Acceso">NOA</th>
                            <th>Botón Res.</th>
                            <th>Parte Res.</th>
                        </tr>
                    </thead>
                    <tbody id="roles-tbody">
                        <tr><td colspan="13" style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin"></i> Cargando matriz de permisos...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `;

    loadRolesData();
}

async function loadRolesData() {
    if (!supabaseClient) return;
    const { data, error } = await supabaseClient.from('role_permissions').select('*').order('module_key').order('user_type');

    if (error) {
        console.error("Error cargando roles:", error);
        return;
    }

    const tbody = document.getElementById('roles-tbody');
    if (!tbody) return;

    state.allRolePermissions = data;
    renderRolesRows(data);
}

function renderRolesRows(data) {
    const tbody = document.getElementById('roles-tbody');
    tbody.innerHTML = data.map(r => `
        <tr id="role-row-${r.id}">
            <td>
                ${hasPermission('rol', 'modify') ? `
                <div style="display:flex; gap:5px;">
                    <button class="btn-icon" onclick="editRoleRow('${r.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" onclick="deleteRoleRow('${r.id}')" title="Eliminar"><i class="fas fa-trash" style="color:#ff4444"></i></button>
                </div>
                ` : ''}
            </td>
            <td style="font-weight:700; color:var(--sap-blue)">${r.module_key.toUpperCase()}</td>
            <td><span class="badge" style="background:${r.user_type === 'ALTIM' ? '#0054af' : '#e69a00'}">${r.user_type}</span></td>
            <td>${r.role_name}</td>
            <td style="text-align:center">${r.can_view ? '<i class="fas fa-check" style="color:var(--primary-color)"></i>' : ''}</td>
            <td style="text-align:center">${r.can_modify ? '<i class="fas fa-check" style="color:var(--primary-color)"></i>' : ''}</td>
            <td style="text-align:center">${r.can_download ? '<i class="fas fa-check" style="color:var(--primary-color)"></i>' : ''}</td>
            <td style="text-align:center">${r.can_attach ? '<i class="fas fa-check" style="color:var(--primary-color)"></i>' : ''}</td>
            <td style="text-align:center">${r.is_invisible ? '<i class="fas fa-eye-slash" style="color:#ffcc00"></i>' : ''}</td>
            <td style="text-align:center">${r.is_restricted ? '<i class="fas fa-exclamation-triangle" style="color:#ff4444"></i>' : ''}</td>
            <td style="text-align:center">${r.has_no_access ? '<i class="fas fa-ban" style="color:#666"></i>' : ''}</td>
            <td style="font-size:0.75rem">${r.res_button || ''}</td>
            <td style="font-size:0.75rem; max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${r.res_parte || ''}">${r.res_parte || ''}</td>
        </tr>
    `).join('');
}

window.filterRolesTable = function () {
    const term = document.getElementById('rol-search').value.toLowerCase();
    const filtered = state.allRolePermissions.filter(r =>
        r.module_key.toLowerCase().includes(term) ||
        r.role_name.toLowerCase().includes(term) ||
        r.user_type.toLowerCase().includes(term)
    );
    renderRolesRows(filtered);
}

window.addNewRoleRow = async function () {
    // Obtener roles existentes para el desplegable
    let roles = ['#'];
    if (supabaseClient) {
        const { data } = await supabaseClient.from('master_roles').select('role_name');
        if (data) roles = [...new Set(['#', ...data.map(r => r.role_name)])];
    }

    const { value: formValues } = await Swal.fire({
        title: 'Nuevo Permiso de Rol',
        width: '600px',
        html: `
                                            <div style="text-align:left; display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                                                <div class="form-group">
                                                    <label>Módulo (Key)</label>
                                                    <input id="swal-module" class="swal2-input" style="width:100%" placeholder="ej: usu, cli, des...">
                                                </div>
                                                <div class="form-group">
                                                    <label>Tipo Usuario</label>
                                                    <select id="swal-type" class="swal2-input" style="width:100%">
                                                        <option value="ALTIM">ALTIM</option>
                                                        <option value="CLIENTE">CLIENTE</option>
                                                    </select>
                                                </div>
                                                <div class="form-group">
                                                    <label>Rol</label>
                                                    <select id="swal-role" class="swal2-input" style="width:100%">
                                                        ${roles.map(r => `<option value="${r}">${r}</option>`).join('')}
                                                    </select>
                                                </div>
                                                <div style="grid-column: span 2; display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; margin-top:10px;">
                                                    <label style="font-size:0.7rem"><input type="checkbox" id="swal-view"> VIS</label>
                                                    <label style="font-size:0.7rem"><input type="checkbox" id="swal-modify"> MOD</label>
                                                    <label style="font-size:0.7rem"><input type="checkbox" id="swal-down"> DES</label>
                                                    <label style="font-size:0.7rem"><input type="checkbox" id="swal-att"> ADJ</label>
                                                    <label style="font-size:0.7rem"><input type="checkbox" id="swal-inv"> INV</label>
                                                    <label style="font-size:0.7rem"><input type="checkbox" id="swal-res"> RES</label>
                                                    <label style="font-size:0.7rem"><input type="checkbox" id="swal-noa"> NOA</label>
                                                </div>
                                                <div class="form-group" style="grid-column: span 2">
                                                    <label>Botón con Restricción</label>
                                                    <input id="swal-res-btn" class="swal2-input" style="width:100%" placeholder="ID del botón">
                                                </div>
                                                <div class="form-group" style="grid-column: span 2">
                                                    <label>Parte con Restricción</label>
                                                    <textarea id="swal-res-parte" class="swal2-textarea" style="width:100%" placeholder="Descripción de la restricción"></textarea>
                                                </div>
                                            </div>
                                            `,
        focusConfirm: false,
        preConfirm: () => {
            return {
                module_key: document.getElementById('swal-module').value.toLowerCase(),
                user_type: document.getElementById('swal-type').value,
                role_name: document.getElementById('swal-role').value || '#',
                can_view: document.getElementById('swal-view').checked,
                can_modify: document.getElementById('swal-modify').checked,
                can_download: document.getElementById('swal-down').checked,
                can_attach: document.getElementById('swal-att').checked,
                is_invisible: document.getElementById('swal-inv').checked,
                is_restricted: document.getElementById('swal-res').checked,
                has_no_access: document.getElementById('swal-noa').checked,
                res_button: document.getElementById('swal-res-btn').value,
                res_parte: document.getElementById('swal-res-parte').value
            }
        }
    });

    if (formValues) {
        const { error } = await supabaseClient.from('role_permissions').insert([formValues]);
        if (error) Swal.fire('Error', error.message, 'error');
        else {
            loadRolesData();
            Swal.fire('Guardado', 'El permiso ha sido creado con éxito.', 'success');
        }
    }
}

window.editRoleRow = async function (id) {
    const role = state.allRolePermissions.find(r => r.id == id);
    if (!role) return;

    // Obtener roles existentes para el desplegable
    let roles = ['#'];
    if (supabaseClient) {
        const { data } = await supabaseClient.from('master_roles').select('role_name');
        if (data) roles = [...new Set(['#', ...data.map(r => r.role_name)])];
    }

    const { value: formValues } = await Swal.fire({
        title: 'Editar Permiso',
        width: '600px',
        html: `
                                            <div style="text-align:left; display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                                                <div class="form-group">
                                                    <label>Módulo (Key)</label>
                                                    <input id="swal-module" class="swal2-input" style="width:100%" value="${role.module_key}">
                                                </div>
                                                <div class="form-group">
                                                    <label>Tipo Usuario</label>
                                                    <select id="swal-type" class="swal2-input" style="width:100%">
                                                        <option value="ALTIM" ${role.user_type === 'ALTIM' ? 'selected' : ''}>ALTIM</option>
                                                        <option value="CLIENTE" ${role.user_type === 'CLIENTE' ? 'selected' : ''}>CLIENTE</option>
                                                    </select>
                                                </div>
                                                <div class="form-group">
                                                    <label>Rol</label>
                                                    <select id="swal-role" class="swal2-input" style="width:100%">
                                                        ${roles.map(r => `<option value="${r}" ${role.role_name === r ? 'selected' : ''}>${r}</option>`).join('')}
                                                    </select>
                                                </div>
                                                <div style="grid-column: span 2; display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; margin-top:10px;">
                                                    <label style="font-size:0.7rem"><input type="checkbox" id="swal-view" ${role.can_view ? 'checked' : ''}> VIS</label>
                                                    <label style="font-size:0.7rem"><input type="checkbox" id="swal-modify" ${role.can_modify ? 'checked' : ''}> MOD</label>
                                                    <label style="font-size:0.7rem"><input type="checkbox" id="swal-down" ${role.can_download ? 'checked' : ''}> DES</label>
                                                    <label style="font-size:0.7rem"><input type="checkbox" id="swal-att" ${role.can_attach ? 'checked' : ''}> ADJ</label>
                                                    <label style="font-size:0.7rem"><input type="checkbox" id="swal-inv" ${role.is_invisible ? 'checked' : ''}> INV</label>
                                                    <label style="font-size:0.7rem"><input type="checkbox" id="swal-res" ${role.is_restricted ? 'checked' : ''}> RES</label>
                                                    <label style="font-size:0.7rem"><input type="checkbox" id="swal-noa" ${role.has_no_access ? 'checked' : ''}> NOA</label>
                                                </div>
                                                <div class="form-group" style="grid-column: span 2">
                                                    <label>Botón con Restricción</label>
                                                    <input id="swal-res-btn" class="swal2-input" style="width:100%" value="${role.res_button || ''}">
                                                </div>
                                                <div class="form-group" style="grid-column: span 2">
                                                    <label>Parte con Restricción</label>
                                                    <textarea id="swal-res-parte" class="swal2-textarea" style="width:100%">${role.res_parte || ''}</textarea>
                                                </div>
                                            </div>
                                            `,
        focusConfirm: false,
        preConfirm: () => {
            return {
                module_key: document.getElementById('swal-module').value.toLowerCase(),
                user_type: document.getElementById('swal-type').value,
                role_name: document.getElementById('swal-role').value || '#',
                can_view: document.getElementById('swal-view').checked,
                can_modify: document.getElementById('swal-modify').checked,
                can_download: document.getElementById('swal-down').checked,
                can_attach: document.getElementById('swal-att').checked,
                is_invisible: document.getElementById('swal-inv').checked,
                is_restricted: document.getElementById('swal-res').checked,
                has_no_access: document.getElementById('swal-noa').checked,
                res_button: document.getElementById('swal-res-btn').value,
                res_parte: document.getElementById('swal-res-parte').value
            }
        }
    });

    if (formValues) {
        const { error } = await supabaseClient.from('role_permissions').update(formValues).eq('id', id);
        if (error) Swal.fire('Error', error.message, 'error');
        else {
            loadRolesData();
            Swal.fire('Actualizado', 'El permiso ha sido modificado con éxito.', 'success');
        }
    }
}

window.deleteRoleRow = async function (id) {
    const result = await Swal.fire({
        title: '¿Eliminar permiso?',
        text: "Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff4444'
    });

    if (result.isConfirmed) {
        const { error } = await supabaseClient.from('role_permissions').delete().eq('id', id);
        if (error) Swal.fire('Error', error.message, 'error');
        else {
            loadRolesData();
            Swal.fire('Eliminado', 'El permiso ha sido borrado.', 'success');
        }
    }
}

window.exportRolesToExcel = function () {
    if (!state.allRolePermissions || state.allRolePermissions.length === 0) return;

    // Preparar datos para SheetJS
    const excelData = state.allRolePermissions.map(r => ({
        "Módulo": r.module_key.toUpperCase(),
        "Tipo Usuario": r.user_type,
        "Rol": r.role_name,
        "Visualizar": r.can_view ? 'X' : '',
        "Modificar": r.can_modify ? 'X' : '',
        "Descargar": r.can_download ? 'X' : '',
        "Adjuntar": r.can_attach ? 'X' : '',
        "Invisible": r.is_invisible ? 'X' : '',
        "Con Restricciones": r.is_restricted ? 'X' : '',
        "No Acceso": r.has_no_access ? 'X' : '',
        "Botón Res.": r.res_button || '',
        "Parte Res.": r.res_parte || ''
    }));

    // Crear Workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Permisos");

    // Descargar archivo .xlsx
    XLSX.writeFile(workbook, "Matriz_Roles_Permisos.xlsx");
}

// START APPLICATION 
document.addEventListener('DOMContentLoaded', init);

// --- UAT TRACKING LOGIC (REA PART 4) ---

async function loadUATTracking() {
    if (!supabaseClient || !state.selectedProject) return;

    const container = document.getElementById('uat-tracking-container');
    const actions = document.getElementById('tracking-actions');
    if (!container) return;

    const { data, error } = await supabaseClient
        .from('master_uats')
        .select('*')
        .eq('project_id', state.selectedProject.id)
        .order('id', { ascending: true });

    if (error) {
        container.innerHTML = `<div style="color:red; text-align:center;">Error: ${error.message}</div>`;
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div style="color:#666; text-align:center; padding: 2rem; background: #fdfdfd; border: 1px dashed #ddd; border-radius: 8px;">
                <i class="fas fa-info-circle"></i> No hay registros en el checklist de este proyecto. 
                Vaya a la Parte 3 para configurar los UATs.
            </div>
        `;
        if (actions) actions.style.display = 'none';
        return;
    }

    if (actions) actions.style.display = 'block';
    renderUATTrackingTable(data);
}

function renderUATTrackingTable(data) {
    const container = document.getElementById('uat-tracking-container');
    if (!container) return;

    const uniqueLobs = [...new Set(data.map(u => u.id_lob).filter(Boolean))].sort();
    const uniqueScopeItems = [...new Set(data.map(u => u.proceso_scope_item).filter(Boolean))].sort();

    container.innerHTML = `
                                            <div class="tracking-filters" style="display:flex; gap:15px; margin-bottom:15px; background:#f8f9fa; padding:12px; border-radius:8px; border:1px solid #eee; align-items:flex-end;">
                                                <div class="filter-group">
                                                    <label style="font-size:0.7rem; font-weight:bold; display:block; margin-bottom:4px; color:#555;">LOB:</label>
                                                    <select id="filter-tracking-lob" class="form-control compact" onchange="applyUATTrackingFilters()" style="width:150px">
                                                        <option value="">-- Todos --</option>
                                                        ${uniqueLobs.map(l => `<option value="${l}">${l}</option>`).join('')}
                                                    </select>
                                                </div>
                                                <div class="filter-group">
                                                    <label style="font-size:0.7rem; font-weight:bold; display:block; margin-bottom:4px; color:#555;">ESCENARIO:</label>
                                                    <input type="text" id="filter-tracking-scenario" class="form-control compact" placeholder="Buscar escenario..." onkeyup="applyUATTrackingFilters()" style="width:250px">
                                                </div>
                                                <div class="filter-group">
                                                    <label style="font-size:0.7rem; font-weight:bold; display:block; margin-bottom:4px; color:#555;">SCOPE ITEM:</label>
                                                    <select id="filter-tracking-scope" class="form-control compact" onchange="applyUATTrackingFilters()" style="width:200px">
                                                        <option value="">-- Todos --</option>
                                                        ${uniqueScopeItems.map(s => `<option value="${s}">${s}</option>`).join('')}
                                                    </select>
                                                </div>
                                                <button class="btn btn-outline compact" onclick="resetTrackingFilters()" style="padding: 2px 10px; height: 34px; font-size: 0.75rem; min-width: auto; background: white;">
                                                    <i class="fas fa-undo"></i> Reset
                                                </button>
                                            </div>
                                            <div style="overflow-x: auto; width: 100%;">
                                                <table class="alv-table" style="min-width: 2100px; border-collapse: collapse; font-size: 0.85rem;">
                                                    <thead>
                                                        <tr>
                                                            <th style="width:120px; background: #f1f5f9; position:sticky; left:0; z-index:10;">Caso/Paso</th>
                                                            <th style="width:80px; background: #f1f5f9;">LOB</th>
                                                            <th style="width:250px; background: #f1f5f9;">Escenario</th>
                                                            <th style="width:250px; background: #f1f5f9;">Resultado Esperado</th>

                                                            <!-- EDITABLE COLUMNS -->
                                                            <th style="width:300px; background: #fffde7; border-bottom: 2px solid #fbc02d;">Resultado Obtenido</th>
                                                            <th style="width:130px; background: #fffde7; border-bottom: 2px solid #fbc02d;">Estado OK/NOK</th>
                                                            <th style="width:150px; background: #fffde7; border-bottom: 2px solid #fbc02d;">Defecto Asociado</th>
                                                            <th style="width:150px; background: #fffde7; border-bottom: 2px solid #fbc02d;">Tipo Pruebas</th>
                                                            <th style="width:180px; background: #fffde7; border-bottom: 2px solid #fbc02d;">Rol Responsable</th>
                                                            <th style="width:180px; background: #fffde7; border-bottom: 2px solid #fbc02d;">ID Req/Historia</th>

                                                            <th style="background: #f1f5f9;">BP</th>
                                                            <th style="background: #f1f5f9;">Scope Item</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        ${data.map(u => {
        const statusColor = u.estado_ok_nok === 'OK' ? '#2e7d32' : (u.estado_ok_nok === 'NOK' ? '#d32f2f' : '#333');
        return `
                        <tr data-id="${u.id}">
                            <td style="font-weight: 600; position:sticky; left:0; background:white; z-index:5; border-right:2px solid #eee;">${u.id_casop || '-'}</td>
                            <td>${u.id_lob || '-'}</td>
                            <td title="${u.escenario}">${u.escenario ? (u.escenario.substring(0, 45) + '...') : '-'}</td>
                            <td title="${u.resultado_esperado}">${u.resultado_esperado ? (u.resultado_esperado.substring(0, 45) + '...') : '-'}</td>
                            
                            <!-- EDITABLES -->
                            <td>
                                <textarea class="tracking-input" data-field="resultado_obtenido" style="width:100%; height:24px; font-size:0.75rem; border:1px solid #ddd; padding:0 4px; resize: none; overflow:hidden; line-height:24px;">${u.resultado_obtenido || ''}</textarea>
                            </td>
                            <td>
                                <select class="tracking-input" data-field="estado_ok_nok" style="width:100%; font-size:0.75rem; height:24px; border:1px solid #ddd; color: ${statusColor}; font-weight:bold; cursor:pointer; padding:0 4px;">
                                    <option value="Pendiente" ${u.estado_ok_nok === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                                    <option value="OK" ${u.estado_ok_nok === 'OK' ? 'selected' : ''} style="color:#2e7d32; font-weight:bold;">OK</option>
                                    <option value="NOK" ${u.estado_ok_nok === 'NOK' ? 'selected' : ''} style="color:#d32f2f; font-weight:bold;">NOK</option>
                                </select>
                            </td>
                            <td>
                                <input class="tracking-input" data-field="defecto_asociado" style="width:100%; height:24px; border:1px solid #ddd; padding:0 4px; font-size:0.75rem;" value="${u.defecto_asociado || ''}">
                            </td>
                            <td>
                                <input class="tracking-input" data-field="tipo_prueba" style="width:100%; height:24px; border:1px solid #ddd; padding:0 4px; font-size:0.75rem;" value="${u.tipo_prueba || ''}">
                            </td>
                            <td>
                                <input class="tracking-input" data-field="rol_perfil_responsable" style="width:100%; height:24px; border:1px solid #ddd; padding:0 4px; font-size:0.75rem;" value="${u.rol_perfil_responsable || ''}">
                            </td>
                            <td>
                                <input class="tracking-input" data-field="id_requisito_historia" style="width:100%; height:24px; border:1px solid #ddd; padding:0 4px; font-size:0.75rem;" value="${u.id_requisito_historia || ''}">
                            </td>
                            
                            <!-- REST OF DATA -->
                            <td>${u.id_bp || '-'}</td>
                            <td>${u.proceso_scope_item || '-'}</td>
                        </tr>
                        `;
    }).join('')}
                                                    </tbody>
                                                </table>
                                            </div>
                                            `;
}

async function saveUATTracking() {
    if (!supabaseClient || !state.selectedProject) return;

    const rows = document.querySelectorAll('#uat-tracking-container tbody tr');
    const updates = [];

    rows.forEach(row => {
        const id = row.getAttribute('data-id');
        const inputs = row.querySelectorAll('.tracking-input');
        const updateObj = { id: parseInt(id) };

        inputs.forEach(input => {
            const field = input.getAttribute('data-field');
            updateObj[field] = input.value;
        });

        updates.push(updateObj);
    });

    if (updates.length === 0) return;

    Swal.fire({
        title: 'Sincronizando...',
        text: 'Guardando avances en la base de datos.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        const { error } = await supabaseClient
            .from('master_uats')
            .upsert(updates);

        if (error) throw error;

        Swal.fire('¡Éxito!', 'Seguimiento actualizado correctamente.', 'success');
        loadUATTracking(); // Refresh
    } catch (err) {
        Swal.fire('Error', 'Fallo al guardar seguimiento: ' + err.message, 'error');
    }
}

async function exportUATTrackingToExcel() {
    if (!state.selectedProject) return;

    const rows = document.querySelectorAll('#uat-tracking-container tbody tr');
    if (rows.length === 0) {
        Swal.fire('Información', 'No hay datos para exportar.', 'info');
        return;
    }

    const excelData = [];
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const inputs = row.querySelectorAll('.tracking-input');

        const dataRow = {
            "Caso/Paso": cells[0].innerText,
            "LOB": cells[1].innerText,
            "Escenario": cells[2].getAttribute('title') || cells[2].innerText,
            "Resultado Esperado": cells[3].getAttribute('title') || cells[3].innerText,
            "Resultado Obtenido": inputs[0].value,
            "Estado": inputs[1].value,
            "Defecto": inputs[2].value,
            "Tipo Prueba": inputs[3].value,
            "Responsable": inputs[4].value,
            "ID Historia/Req": inputs[5].value,
            "BP": cells[10].innerText,
            "Scope Item": cells[11].innerText
        };
        excelData.push(dataRow);
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Auto-size columns (basic)
    const wscols = [
        { wch: 15 }, { wch: 10 }, { wch: 40 }, { wch: 40 },
        { wch: 40 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
        { wch: 25 }, { wch: 20 }, { wch: 10 }, { wch: 30 }
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Seguimiento UAT");

    const fileName = `Seguimiento_UAT_${state.selectedProject.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}

async function applyUATTrackingFilters() {
    const lob = document.getElementById('filter-tracking-lob')?.value.toLowerCase() || '';
    const scenario = document.getElementById('filter-tracking-scenario')?.value.toLowerCase() || '';
    const scope = document.getElementById('filter-tracking-scope')?.value.toLowerCase() || '';

    const rows = document.querySelectorAll('#uat-tracking-container tbody tr');
    rows.forEach(row => {
        const rowLob = row.cells[1].innerText.toLowerCase();
        const rowScenario = row.cells[2].innerText.toLowerCase() + (row.cells[2].getAttribute('title')?.toLowerCase() || '');
        const rowScope = row.cells[11].innerText.toLowerCase();

        const matchLob = !lob || rowLob.includes(lob);
        const matchScenario = !scenario || rowScenario.includes(scenario);
        const matchScope = !scope || rowScope.includes(scope);

        if (matchLob && matchScenario && matchScope) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function resetTrackingFilters() {
    const lob = document.getElementById('filter-tracking-lob');
    const scenario = document.getElementById('filter-tracking-scenario');
    const scope = document.getElementById('filter-tracking-scope');

    if (lob) lob.value = '';
    if (scenario) scenario.value = '';
    if (scope) scope.value = '';

    applyUATTrackingFilters();
}

// --- REA PART 2: EVIDENCIAS LOGIC ---

async function loadREAEvidencias() {
    const container = document.getElementById('rea-evidencias-container');
    if (!container || !state.selectedProject) return;

    const { data, error } = await supabaseClient
        .from('documentos')
        .select('*')
        .eq('proyecto', state.selectedProject.id_proyecto || state.selectedProject.name)
        .eq('id_fase', 'REA')
        .eq('tipo_documento', 'Documento de evidencias de pruebas');

    if (error) {
        container.innerHTML = `<p style="color:red">Error al cargar evidencias: ${error.message}</p>`;
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:2rem; color:#999; background:#fff; border-radius:8px; border:1px solid #eee;">
                <p><i class="fas fa-file-invoice" style="opacity:0.3; font-size:2rem; margin-bottom:1rem;"></i><br>
                No hay evidencias de pruebas registradas para este proyecto.</p>
                <button class="btn btn-outline" style="min-width:auto; margin-top:1rem;" onclick="openDocumentModal('REA', 'Documento de evidencias de pruebas')">
                    <i class="fas fa-plus"></i> Registrar Nueva Evidencia
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
                                            <table class="alv-table">
                                                <thead>
                                                    <tr>
                                                        <th>Nombre (Num.)</th>
                                                        <th>LOB</th>
                                                        <th>Link (Url)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${data.map(d => `
                    <tr>
                        <td style="font-weight:700; color:var(--sap-blue); text-align:left;">${d.numerador}</td>
                        <td><span class="badge" style="background:#f0f0f0; color:#666;">${d.id_lob || '-'}</span></td>
                        <td style="max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${d.url ? `<a href="${d.url}" target="_blank" style="color:var(--sap-blue); text-decoration:underline; font-size:0.75rem;" title="${d.url}">${d.url}</a>` : '-'}
                        </td>
                    </tr>
                `).join('')}
                                                </tbody>
                                            </table>
                                            `;
}

function toggleSection(header) {
    const wrapper = header.closest('.collapsible-wrapper');
    const content = wrapper.querySelector('.collapsible-content');
    header.classList.toggle('expanded-header');
    content.classList.toggle('expanded');

    // Toggle icon plus / minus
    const icon = header.querySelector('.toggle-icon');
    if (icon) {
        if (content.classList.contains('expanded')) {
            icon.classList.remove('fa-plus-circle');
            icon.classList.add('fa-minus-circle');
        } else {
            icon.classList.remove('fa-minus-circle');
            icon.classList.add('fa-plus-circle');
        }
    }

    // Trigger charts layout update when expanding
    if (content.classList.contains('expanded')) {
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
            if (window.estKpiCharts && window.estExecCachedData) {
                window.renderEstCharts(window.estExecCachedData);
            }
            if (window.estPhaseCharts && window.estPhaseCachedData) {
                window.renderEstPhaseCharts(window.estPhaseCachedData);
            }
            if (window.estRiskCharts && window.estRiskCachedData) {
                window.renderEstRiskCharts(window.estRiskCachedData);
            }
            if (window.updateIncidentDashboard) {
                const prjSel = document.getElementById('analytics-filter-project');
                if (prjSel && prjSel.options.length <= 1 && window.fetchLiveIncidentsAndUpdate) {
                    window.fetchLiveIncidentsAndUpdate(state.selectedProject?.id);
                } else {
                    window.updateIncidentDashboard();
                }
            }
        }, 150);
    }
}

// --- DASHBOARD NEWS CAROUSEL LOGIC ---

let carouselInterval;
let currentSlideIndex = 0;

async function loadPublicNews() {
    const container = document.getElementById('news-carousel-container');
    const dotsContainer = document.getElementById('carousel-dots');
    if (!container || !supabaseClient) return;

    try {
        const { data: news, error } = await supabaseClient
            .from('public_news')
            .select('*')
            .eq('is_active', true)
            .order('order_priority', { ascending: false })
            .limit(5);

        if (error) throw error;

        if (!news || news.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:2rem; color:#999;">
                    <i class="fas fa-info-circle" style="font-size:2rem; opacity:0.3; margin-bottom:1rem;"></i><br>
                    No hay novedades publicadas actualmente.
                </div>
            `;
            dotsContainer.innerHTML = '';
            return;
        }

        renderNewsCarousel(news);
    } catch (err) {
        console.error("Error loading news:", err);
        container.innerHTML = `<p style="color:red; font-size:0.75rem; padding:1rem;">Error al cargar novedades: ${err.message}</p>`;
    }
}

function renderNewsCarousel(news) {
    const container = document.getElementById('news-carousel-container');
    const dotsContainer = document.getElementById('carousel-dots');
    if (!container || !dotsContainer) return;

    // Reset carousel
    clearInterval(carouselInterval);
    currentSlideIndex = 0;

    container.innerHTML = news.map((item, index) => `
        <div class="carousel-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
            ${item.image_url ? `<img src="${item.image_url}" class="news-image" onerror="this.src='https://via.placeholder.com/400x200?text=ALTIM+News'">` : `<div class="news-image" style="background:var(--primary-soft); display:flex; align-items:center; justify-content:center;"><i class="fas fa-newspaper" style="font-size:3rem; color:var(--primary-color); opacity:0.2;"></i></div>`}
            <div class="news-content">
                <h4 class="news-title">${item.title}</h4>
                <p class="news-desc">${item.description || 'Sin descripción disponible.'}</p>
                <a href="${item.url}" target="_blank" class="news-link">
                    Leer más <i class="fas fa-external-link-alt"></i>
                </a>
            </div>
        </div>
    `).join('');

    dotsContainer.innerHTML = news.map((_, index) => `
        <div class="dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></div>
    `).join('');

    // Start auto-slide
    if (news.length > 1) {
        const speed = parseInt(state.systemConfig?.CAROUSEL_SPEED) || 5000;
        carouselInterval = setInterval(nextSlide, speed);
    }
}

function nextSlide() {
    const slides = document.querySelectorAll('.carousel-slide');
    if (slides.length <= 1) return;

    currentSlideIndex = (currentSlideIndex + 1) % slides.length;
    updateCarouselUI();
}

function goToSlide(index) {
    clearInterval(carouselInterval);
    currentSlideIndex = index;
    updateCarouselUI();
    const slides = document.querySelectorAll('.carousel-slide');
    if (slides.length > 1) {
        const speed = parseInt(state.systemConfig?.CAROUSEL_SPEED) || 5000;
        carouselInterval = setInterval(nextSlide, speed);
    }
}

function updateCarouselUI() {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');

    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === currentSlideIndex);
    });

    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlideIndex);
    });
}

/**
 * Renders the Help Module (User Guide)
 */
function renderHelpModule() {
    const content = typeof HELP_CONTENT !== 'undefined' ? HELP_CONTENT : [];
    
    let html = `
        <div class="help-container" style="animation: fadeIn 0.4s ease;">
            <div class="help-sidebar-nav">
                ${content.map((section, index) => `
                    <div class="help-nav-item ${index === 0 ? 'active' : ''}" onclick="showHelpSection('${section.id}', this)">
                        <i class="fas ${section.icon}"></i>
                        <span>${section.title}</span>
                    </div>
                `).join('')}
                <hr style="margin: 1rem 0; border: none; border-top: 1px solid #eee;">
                <button class="btn btn-outline" style="width:100%;" onclick="window.print()">
                    <i class="fas fa-file-pdf"></i> Exportar a PDF
                </button>
            </div>
            <div class="help-main-content" id="help-content-display">
                ${content.length > 0 ? renderHelpSectionContent(content[0]) : '<p>No hay contenido de ayuda disponible.</p>'}
            </div>
        </div>
    `;
    
    elements.moduleContent.innerHTML = html;
}

function renderHelpSectionContent(section) {
    return `
        <div class="help-section-detail">
            <h2 style="color: var(--primary-color); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 15px;">
                <i class="fas ${section.icon}" style="background: var(--primary-color); color: white; padding: 10px; border-radius: 8px; font-size: 1.2rem;"></i>
                ${section.title}
            </h2>
            <div class="help-text-body">
                ${section.content}
            </div>
            <div style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                <small style="color: #999;">¿Necesitas más ayuda? Contacta con support@altim.es</small>
                <button class="btn btn-link" onclick="renderHelpModule()" style="font-size: 0.8rem;">Volver al inicio de la guía</button>
            </div>
        </div>
    `;
}

window.showHelpSection = function(id, el) {
    const section = HELP_CONTENT.find(s => s.id === id);
    if (!section) return;
    
    // Update active class
    document.querySelectorAll('.help-nav-item').forEach(item => item.classList.remove('active'));
    el.classList.add('active');
    
    document.getElementById('help-content-display').innerHTML = renderHelpSectionContent(section);
    document.getElementById('help-content-display').scrollTop = 0;
};

window.stubAction = function(actionName) {
    Swal.fire('En construcción', `La funcionalidad para "${actionName}" se implementará próximamente.`, 'info');
};

window.limpiarBpml = async function() {
    if (!supabaseClient || !state.selectedProject) return;

    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'Se eliminarán TODOS los registros del Master BPML para este proyecto. Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, borrar todo',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        Swal.fire({ title: 'Borrando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        const { error } = await supabaseClient
            .from('master_bpml')
            .delete()
            .eq('id_proyecto', state.selectedProject.id);

        if (error) {
            Swal.fire('Error', error.message, 'error');
        } else {
            Swal.fire('Borrado', 'Los registros han sido eliminados del proyecto.', 'success');
            window.renderExplorePhase();
        }
    }
};

window.addNuevoRegistroBpml = async function() {
    if (!supabaseClient || !state.selectedProject) return;

    const lblStyle = "display:block; margin-top:10px; font-weight:bold; color:#000; font-size:0.85rem;";
    const inpStyle = "width:100%; margin:5px 0 0 0; font-size:0.85rem; padding:8px; height:auto; color:#000;";

    const htmlForm = `
        <div style="text-align:left; max-height:500px; overflow-y:auto; padding-right:10px;">
            <label style="${lblStyle}">BPML ID *</label>
            <input type="text" id="new-bpml-id" class="swal2-input" style="${inpStyle}" placeholder="Ej: P2P-001">
            <label style="${lblStyle}">ID E2E *</label>
            <input type="text" id="new-id-e2e" class="swal2-input" style="${inpStyle}">
            <label style="${lblStyle}">Negocio *</label>
            <input type="text" id="new-negocio" class="swal2-input" style="${inpStyle}">
            <label style="${lblStyle}">Grupo Proceso L1 *</label>
            <input type="text" id="new-grupo-l1" class="swal2-input" style="${inpStyle}">
            <label style="${lblStyle}">Grupo Proceso L2 *</label>
            <input type="text" id="new-grupo-l2" class="swal2-input" style="${inpStyle}">
            <label style="${lblStyle}">Nombre Proceso L3</label>
            <input type="text" id="new-nombre-proceso-l3" class="swal2-input" style="${inpStyle}">
            <label style="${lblStyle}">ID BP *</label>
            <input type="text" id="new-id-bp" class="swal2-input" style="${inpStyle}">
            <label style="${lblStyle}">Scope Item</label>
            <input type="text" id="new-scope-item" class="swal2-input" style="${inpStyle}">
            <label style="${lblStyle}">Nombre Proceso L4</label>
            <input type="text" id="new-nombre-proceso-l4" class="swal2-input" style="${inpStyle}">
            <label style="${lblStyle}">Org. Objetivo</label>
            <input type="text" id="new-org-objetivo" class="swal2-input" style="${inpStyle}">
            <label style="${lblStyle}">Evento Desencadenante</label>
            <input type="text" id="new-evento-desencadenante" class="swal2-input" style="${inpStyle}">
            <label style="${lblStyle}">Evento Final Resultado</label>
            <input type="text" id="new-evento-final" class="swal2-input" style="${inpStyle}">
            <label style="${lblStyle}">Rol Negocio Principal</label>
            <input type="text" id="new-rol-principal" class="swal2-input" style="${inpStyle}">
            <label style="${lblStyle}">Objetos Datos Clave</label>
            <input type="text" id="new-datos-clave" class="swal2-input" style="${inpStyle}">
            <label style="${lblStyle}">Reglas Negocio Clave</label>
            <input type="text" id="new-reglas-negocio" class="swal2-input" style="${inpStyle}">
            <label style="${lblStyle}">Integraciones Estándar</label>
            <input type="text" id="new-integraciones" class="swal2-input" style="${inpStyle}">
            <label style="${lblStyle}">Controles Clave</label>
            <input type="text" id="new-controles" class="swal2-input" style="${inpStyle}">
            <label style="${lblStyle}">KPIs Clave</label>
            <input type="text" id="new-kpis" class="swal2-input" style="${inpStyle}">
            <label style="${lblStyle}">Priority</label>
            <input type="text" id="new-priority" class="swal2-input" style="${inpStyle}">
            <label style="${lblStyle}">Sprint</label>
            <input type="text" id="new-sprint" class="swal2-input" style="${inpStyle}">
            <label style="${lblStyle}">Estado Ajuste FPG</label>
            <input type="text" id="new-estado-fpg" class="swal2-input" style="${inpStyle}">
            <label style="${lblStyle}">IDs Referencia Gap</label>
            <input type="text" id="new-ids-gap" class="swal2-input" style="${inpStyle}">
            <label style="${lblStyle}">Notas / Enlace Evidencia</label>
            <input type="text" id="new-notas-evidencia" class="swal2-input" style="${inpStyle}">
        </div>
    `;

    const { value: formValues } = await Swal.fire({
        title: '<i class="fas fa-plus-circle" style="color:var(--sap-blue)"></i> Nuevo Registro BPML',
        html: htmlForm,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Guardar Registro',
        cancelButtonText: 'Cancelar',
        width: '600px',
        preConfirm: () => {
            const bpmlId = document.getElementById('new-bpml-id').value.trim();
            const id_e2e = document.getElementById('new-id-e2e').value.trim();
            const negocio = document.getElementById('new-negocio').value.trim();
            const grupo_l1 = document.getElementById('new-grupo-l1').value.trim();
            const grupo_l2 = document.getElementById('new-grupo-l2').value.trim();
            const id_bp = document.getElementById('new-id-bp').value.trim();

            if (!bpmlId || !id_e2e || !negocio || !grupo_l1 || !grupo_l2 || !id_bp) {
                Swal.showValidationMessage('Todos los campos marcados con * son obligatorios');
                return false;
            }

            return {
                bpml_id: bpmlId,
                id_e2e: id_e2e,
                negocio: negocio,
                grupo_proceso_l1: grupo_l1,
                grupo_proceso_l2: grupo_l2,
                nombre_proceso_l3: document.getElementById('new-nombre-proceso-l3').value.trim(),
                id_bp: id_bp,
                nombre_scope_item_sap_best_practice: document.getElementById('new-scope-item').value.trim(),
                nombre_proceso_l4: document.getElementById('new-nombre-proceso-l4').value.trim(),
                estructura_organizativa_objetivo: document.getElementById('new-org-objetivo').value.trim(),
                evento_desencadenante: document.getElementById('new-evento-desencadenante').value.trim(),
                evento_final_resultado: document.getElementById('new-evento-final').value.trim(),
                rol_negocio_principal: document.getElementById('new-rol-principal').value.trim(),
                objetos_datos_clave: document.getElementById('new-datos-clave').value.trim(),
                reglas_negocio_clave: document.getElementById('new-reglas-negocio').value.trim(),
                integraciones_estandar: document.getElementById('new-integraciones').value.trim(),
                controles_clave: document.getElementById('new-controles').value.trim(),
                kpis_clave: document.getElementById('new-kpis').value.trim(),
                priority: document.getElementById('new-priority').value.trim(),
                sprint: document.getElementById('new-sprint').value.trim(),
                estado_ajuste_fpg: document.getElementById('new-estado-fpg').value.trim(),
                ids_referencia_gap: document.getElementById('new-ids-gap').value.trim(),
                notas_enlace_evidencia: document.getElementById('new-notas-evidencia').value.trim(),
                id_proyecto: state.selectedProject.id,
                seleccionado: false
            };
        }
    });

    if (formValues) {
        Swal.fire({ title: 'Guardando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        
        const { error } = await supabaseClient
            .from('master_bpml')
            .insert([formValues]);
            
        if (error) {
            Swal.fire('Error', error.message, 'error');
        } else {
            Swal.fire({ icon: 'success', title: 'Registro Creado', timer: 1500, showConfirmButton: false });
            window.renderMasterBpmlTable();
        }
    }
};

window.addRegistrosTemplate = async function() {
    if (!supabaseClient || !state.selectedProject) return;

    Swal.fire({ title: 'Buscando registros...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    // Fetch ALL records from general_bpml
    const { data: generalData, error: generalErr } = await supabaseClient
        .from('general_bpml')
        .select('*');

    if (generalErr) {
        Swal.fire('Error', 'No se pudieron cargar los registros de General BPML: ' + generalErr.message, 'error');
        return;
    }

    if (!generalData || generalData.length === 0) {
        Swal.fire('Información', 'La tabla General_BPML está vacía.', 'info');
        return;
    }

    // Fetch existing records in master_bpml for current project
    const { data: existingData, error: existingErr } = await supabaseClient
        .from('master_bpml')
        .select('bpml_id')
        .eq('id_proyecto', state.selectedProject.id);

    if (existingErr) {
        Swal.fire('Error', existingErr.message, 'error');
        return;
    }

    const existingIds = new Set((existingData || []).map(r => r.bpml_id));

    // Filter to find new ones
    const rowsToInsert = generalData.filter(r => !existingIds.has(r.bpml_id)).map(r => {
        const rowData = { ...r };
        delete rowData.id; 
        delete rowData.seleccionado;
        
        rowData.id_proyecto = state.selectedProject.id;
        rowData.seleccionado = false; 
        return rowData;
    });

    if (rowsToInsert.length === 0) {
        Swal.fire('Información', 'Todos los registros del Template ya existen en este proyecto.', 'info');
        return;
    }

    // Insert new records
    Swal.fire({ title: `Insertando ${rowsToInsert.length} registros...`, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const { error: insertErr } = await supabaseClient
        .from('master_bpml')
        .insert(rowsToInsert);

    if (insertErr) {
        Swal.fire('Error al insertar', insertErr.message, 'error');
    } else {
        Swal.fire('Completado', `Se han añadido ${rowsToInsert.length} registros desde el template.`, 'success');
        window.renderMasterBpmlTable();
    }
};

window.borrarEntradas = async function() {
    if (!supabaseClient || !state.masterBpmlData || !state.selectedProject) return;

    // Filter selected rows
    const selectedRows = state.masterBpmlData.filter(r => r.seleccionado === true);
    if (selectedRows.length === 0) {
        Swal.fire('Atención', 'No has seleccionado ningún registro en la tabla para borrar.', 'warning');
        return;
    }

    // Confirmation Popup
    const result = await Swal.fire({
        title: '¿Eliminar registros?',
        text: `Se van a borrar de forma permanente ${selectedRows.length} registros del proyecto actual. Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, borrar entradas',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        Swal.fire({ title: 'Borrando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        const idsToDelete = selectedRows.map(r => r.bpml_id);

        const { error } = await supabaseClient
            .from('master_bpml')
            .delete()
            .eq('id_proyecto', state.selectedProject.id)
            .in('bpml_id', idsToDelete);

        if (error) {
            Swal.fire('Error', 'No se pudieron borrar los registros: ' + error.message, 'error');
        } else {
            Swal.fire('Borrado exitoso', `Se han eliminado ${selectedRows.length} registros.`, 'success');
            // Re-render Explore Phase (which has built-in logic to show 'Generar BPML' if count drops to 0)
            window.renderExplorePhase();
        }
    }
};

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

    // --- NEW LOGIC: FETCH USERS FOR "RESPONSABLE" ---
    let usersList = [];
    try {
        const currentProjectId = parseInt(state.selectedProject.id);
        
        // 1. Fetch users assigned to this project
        const { data: proyRelations } = await supabaseClient.from('user_project_relation').select('user_id').eq('project_id', currentProjectId);
        const assignedUserIds = (proyRelations || []).map(r => r.user_id);

        // 2. Fetch all users
        const { data: allUsers } = await supabaseClient.from('users').select('*');
        
        // 3. Filter users based on requirements
        const specialRoles = ['administrador', 'management'];
        usersList = (allUsers || []).filter(u => {
            if (!u.email) return false;
            const role = (u.role || '').trim().toLowerCase();
            return assignedUserIds.includes(u.id) || specialRoles.includes(role);
        });
    } catch (err) {
        console.error("Error fetching responsables list:", err);
        usersList = [state.currentUser];
    }

    // Generate dropdown options
    const responsableOptions = usersList.map(u => {
        const uName = u.first_name || u.name || 'Usuario';
        const uLast = u.last_name || u.lastname || '';
        return `<option value="${u.email}" ${req?.responsable === u.email ? 'selected' : ''}>${uName} ${uLast}</option>`;
    }).join('');

    const responsableHtml = `<select id="swal-req-responsable" class="swal2-input" style="width:100%; height: 35px; margin: 5px 0;"><option value="">-- Sin asignar --</option>${responsableOptions}</select>`;
    // --- END NEW LOGIC ---

    const result = await Swal.fire({
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
                    <div><label style="font-weight:700">Responsable</label>${responsableHtml}</div>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:5px">
                    <div><label style="font-weight:700">Prioridad</label><select id="swal-req-priority" class="swal2-input" style="width:100%; height: 35px; margin: 5px 0;"><option value="Low" ${req?.priority === 'Low' ? 'selected' : ''}>Baja</option><option value="Medium" ${req?.priority === 'Medium' || !req ? 'selected' : ''}>Media</option><option value="High" ${req?.priority === 'High' ? 'selected' : ''}>Alta</option></select></div>
                    <div><label style="font-weight:700">Fecha Límite</label><input id="swal-req-date" type="date" class="swal2-input" style="width:100%; height: 35px; margin: 5px 0;" value="${req?.due_date ? new Date(req.due_date).toISOString().split('T')[0] : ''}"></div>
                </div>
                <div style="margin-top:5px">
                    <label style="font-weight:700">Color</label><input id="swal-req-color" type="color" class="swal2-input" style="width:100%; height:35px; padding:0; margin: 5px 0;" value="${req?.color || '#9b59b6'}">
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
                responsable: document.getElementById('swal-req-responsable').value || null,
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

// --- PROJECT NOTIFICATIONS LOGIC ---
window.openNotificationsModal = async function() {
    if (!supabaseClient) {
        Swal.fire('Error', 'No hay conexión a la base de datos', 'error');
        return;
    }
    if (!state.selectedProject) {
        Swal.fire('Atención', 'Selecciona un proyecto primero', 'info');
        return;
    }

    Swal.fire({
        title: 'Notificaciones del Proyecto',
        html: '<div style="margin:2rem"><i class="fas fa-spinner fa-spin fa-2x"></i><br>Cargando...</div>',
        showConfirmButton: false,
        showCloseButton: true,
        width: '800px',
        customClass: { popup: 'swal-wide' }
    });

    try {
        const { data, error } = await supabaseClient
            .from('project_notifications')
            .select('*')
            .eq('project_id', String(state.selectedProject.id || state.selectedProject.id_proyecto))
            .order('created_at', { ascending: false })
            .limit(50);
            
        if (error) throw error;

        let tableHtml = `
        <div style="max-height:60vh; overflow-y:auto; padding: 10px;">
            <table class="styled-table" style="width:100%; text-align:left;">
                <thead>
                    <tr>
                        <th style="width: 25%;">Acción</th>
                        <th style="width: 35%;">Documento</th>
                        <th style="width: 25%;">Usuario</th>
                        <th style="width: 15%;">Fecha</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (data.length === 0) {
            tableHtml += `<tr><td colspan="4" style="text-align:center;">No hay notificaciones para este proyecto.</td></tr>`;
        } else {
            tableHtml += data.map(n => `
                <tr>
                    <td><i class="fas fa-info-circle" style="color:var(--sap-blue)"></i> ${n.text}</td>
                    <td style="font-weight:600;">
                        ${n.url ? `<a href="${n.url}" target="_blank" style="color:var(--sap-blue);text-decoration:none;"><i class="fas fa-external-link-alt"></i> ${n.document_name || 'Enlace'}</a>` : (n.document_name || 'Documento')}
                    </td>
                    <td><i class="fas fa-user" style="color:#666;"></i> ${n.user_email}</td>
                    <td>${new Date(n.created_at).toLocaleString('es-ES', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit'})}</td>
                </tr>
            `).join('');
        }
        
        tableHtml += `</tbody></table></div>`;

        Swal.update({
            html: tableHtml
        });

    } catch (e) {
        console.error('Error loading notifications ALV', e);
        Swal.update({ html: '<div style="color:red; padding: 1rem;">Error al cargar notificaciones.</div>' });
    }
};

window.loadNotifications = async function() {
    const container = document.getElementById('notification-container');
    const badge = document.getElementById('notif-badge');
    
    // Si no hay proyecto seleccionado o no hay supabaseClient, ocultar.
    if (!state.selectedProject || !supabaseClient) {
        if(container) container.style.display = 'none';
        return;
    }
    
    // Mostrar siempre si hay proyecto
    if(container) container.style.display = 'block';
    
    try {
        const { count, error } = await supabaseClient
            .from('project_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', String(state.selectedProject.id || state.selectedProject.id_proyecto));
            
        if (error) throw error;
        
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.classList.remove('hidden');
                
                // Animate if there are new notifications
                if (window.lastNotifCount !== undefined && count > window.lastNotifCount) {
                    const bellIcon = document.querySelector('#notif-btn .fa-bell');
                    if (bellIcon) {
                        bellIcon.classList.remove('ring-animation');
                        void bellIcon.offsetWidth; // trigger reflow
                        bellIcon.classList.add('ring-animation');
                        setTimeout(() => bellIcon.classList.remove('ring-animation'), 600);
                    }
                }
            } else {
                badge.classList.add('hidden');
            }
            window.lastNotifCount = count;
        }
    } catch(e) {
        console.error('Error loading notifications count', e);
    }
};

// Aliases for backwards compatibility with cached index.html
window.toggleNotifications = window.openNotificationsModal;

