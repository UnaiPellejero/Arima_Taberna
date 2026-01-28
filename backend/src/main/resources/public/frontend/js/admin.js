document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('reservationModal');
    const form = document.getElementById('reservationForm');
    const closeModal = document.querySelector('.close-modal');
    const tableBody = document.querySelector('tbody');
    let editingRow = null;

    // --- CERRAR MODAL ---
    closeModal.onclick = () => modal.style.display = "none";
    window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };

    // --- BUSCADOR ---
    document.getElementById('searchInput').oninput = (e) => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('tbody tr').forEach(row => {
            row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
        });
    };

    // --- ACCIONES DE LA TABLA ---
    tableBody.onclick = (e) => {
        const row = e.target.closest('tr');
        if (!row) return;

        // Botón Eliminar
        if (e.target.classList.contains('btn-delete')) {
            if (confirm("¿Eliminar definitivamente esta reserva?")) row.remove();
        }

        // Botón Editar
        if (e.target.classList.contains('btn-edit')) {
            editingRow = row;
            
            // Llenar formulario con datos de la fila
            document.getElementById('resId').value = row.cells[0].innerText;
            document.getElementById('resNombre').value = row.cells[1].innerText;
            document.getElementById('resEmail').value = row.cells[2].innerText;
            document.getElementById('resTel').value = row.cells[3].innerText;
            document.getElementById('resFecha').value = row.cells[4].innerText.replace(' ', 'T');
            document.getElementById('resPax').value = row.cells[5].innerText;
            document.getElementById('resComentarios').value = row.cells[6].innerText;
            
            modal.style.display = "block";
        }
    };

    // --- GUARDAR CAMBIOS ---
    form.onsubmit = (e) => {
        e.preventDefault();
        
        if (editingRow) {
            editingRow.cells[1].innerText = document.getElementById('resNombre').value;
            editingRow.cells[2].innerText = document.getElementById('resEmail').value;
            editingRow.cells[3].innerText = document.getElementById('resTel').value;
            editingRow.cells[4].innerText = document.getElementById('resFecha').value.replace('T', ' ');
            editingRow.cells[5].innerText = document.getElementById('resPax').value;
            editingRow.cells[6].innerText = document.getElementById('resComentarios').value;
        }

        modal.style.display = "none";
    };
});