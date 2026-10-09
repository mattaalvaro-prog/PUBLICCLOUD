
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
