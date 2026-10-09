$filePath = "c:\Portal OPE\app.js"
$lines = Get-Content $filePath -Encoding UTF8

$idx = -1
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match '^function updateCarouselUI\(\) \{') {
        $idx = $i
        break
    }
}

if ($idx -ne -1) {
    $goodLines = $lines[0..($idx - 1)]
    
    $tail = @"
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
                ` + "$" + `{content.map((section, index) => `
                    <div class="help-nav-item ` + "$" + `{index === 0 ? 'active' : ''}" onclick="showHelpSection('` + "$" + `{section.id}', this)">
                        <i class="fas ` + "$" + `{section.icon}"></i>
                        <span>` + "$" + `{section.title}</span>
                    </div>
                `).join('')}
                <hr style="margin: 1rem 0; border: none; border-top: 1px solid #eee;">
                <button class="btn btn-outline" style="width:100%;" onclick="window.print()">
                    <i class="fas fa-file-pdf"></i> Exportar a PDF
                </button>
            </div>
            <div class="help-main-content" id="help-content-display">
                ` + "$" + `{content.length > 0 ? renderHelpSectionContent(content[0]) : '<p>No hay contenido de ayuda disponible.</p>'}
            </div>
        </div>
    `;
    
    elements.moduleContent.innerHTML = html;
}

function renderHelpSectionContent(section) {
    return `
        <div class="help-section-detail">
            <h2 style="color: var(--primary-color); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 15px;">
                <i class="fas ` + "$" + `{section.icon}" style="background: var(--primary-color); color: white; padding: 10px; border-radius: 8px; font-size: 1.2rem;"></i>
                ` + "$" + `{section.title}
            </h2>
            <div class="help-text-body">
                ` + "$" + `{section.content}
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
    Swal.fire('En construcción', `La funcionalidad para "` + "$" + `{actionName}" se implementará próximamente.`, 'info');
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

    const htmlForm = `
        <div style="text-align:left; max-height:400px; overflow-y:auto; padding-right:10px;">
            <label style="display:block; margin-top:10px; font-weight:bold; color:var(--sap-blue);">BPML ID *</label>
            <input type="text" id="new-bpml-id" class="swal2-input" style="width:100%; margin:5px 0 0 0;" placeholder="Ej: P2P-001">
            
            <label style="display:block; margin-top:10px; font-weight:bold; color:var(--sap-blue);">ID E2E *</label>
            <input type="text" id="new-id-e2e" class="swal2-input" style="width:100%; margin:5px 0 0 0;">
            
            <label style="display:block; margin-top:10px; font-weight:bold; color:var(--sap-blue);">Negocio *</label>
            <input type="text" id="new-negocio" class="swal2-input" style="width:100%; margin:5px 0 0 0;">
            
            <label style="display:block; margin-top:10px; font-weight:bold; color:var(--sap-blue);">Grupo Proceso L1 *</label>
            <input type="text" id="new-grupo-l1" class="swal2-input" style="width:100%; margin:5px 0 0 0;">
            
            <label style="display:block; margin-top:10px; font-weight:bold; color:var(--sap-blue);">Grupo Proceso L2 *</label>
            <input type="text" id="new-grupo-l2" class="swal2-input" style="width:100%; margin:5px 0 0 0;">
            
            <label style="display:block; margin-top:10px; font-weight:bold; color:var(--sap-blue);">ID BP *</label>
            <input type="text" id="new-id-bp" class="swal2-input" style="width:100%; margin:5px 0 0 0;">
        </div>
    `;

    const { value: formValues } = await Swal.fire({
        title: '<i class="fas fa-plus-circle" style="color:var(--sap-blue)"></i> Nuevo Registro BPML',
        html: htmlForm,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Guardar Registro',
        cancelButtonText: 'Cancelar',
        width: '500px',
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
                id_bp: id_bp,
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
"@

    Out-File -FilePath $filePath -InputObject ($goodLines -join "`n") -Encoding UTF8
    Add-Content -Path $filePath -Value $tail -Encoding UTF8
    Write-Host "Repair successful."
} else {
    Write-Host "Function updateCarouselUI not found."
}
