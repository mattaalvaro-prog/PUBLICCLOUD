
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
