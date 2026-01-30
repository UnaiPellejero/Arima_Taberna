document.addEventListener('DOMContentLoaded', () => {
    cargarReservas();

    // Lógica para cerrar el modal
    const modal = document.getElementById('reservationModal');
    const spanClose = document.querySelector('.close-modal');

    spanClose.onclick = () => modal.style.display = "none";
    
    // Cerrar si se hace clic fuera del contenido blanco
    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = "none";
    }

    // Lógica del Buscador
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('#tabla-reservas-body tr').forEach(row => {
            row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
        });
    });

    // Guardar cambios
    document.getElementById('reservationForm').onsubmit = async (e) => {
        e.preventDefault();
        
        const params = new URLSearchParams();
        params.append('id', document.getElementById('resId').value);
        params.append('nombre', document.getElementById('resNombre').value);
        params.append('tel', document.getElementById('resTel').value);
        params.append('fechaHora', document.getElementById('resFecha').value); // Formato T
        params.append('pax', document.getElementById('resPax').value);
        params.append('comentarios', document.getElementById('resComentarios').value);
        params.append('idMesa', document.getElementById('resMesa').value);

        try {
            // Dentro de document.getElementById('reservationForm').onsubmit
const res = await fetch('/api/admin/reservas/actualizar', { method: 'POST', body: params });
const status = await res.text();

if (status === "success") {
    alert("Reserva actualizada y mesa reasignada.");
    document.getElementById('reservationModal').style.display = "none";
    cargarReservas();
} else if (status === "error_no_capacity") {
    alert("❌ No hay mesas disponibles para esa cantidad de personas o ese horario.");
} else {
    alert("Hubo un error al guardar.");
}
        } catch (error) {
            console.error("Error:", error);
            alert("Error de conexión con el servidor");
        }
    };
});

function cargarReservas() {
    fetch('/api/admin/reservas')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('tabla-reservas-body');
            tbody.innerHTML = '';

            data.forEach(res => {
                const estadoClass = res.estado.toLowerCase() === 'confirmada' ? 'status-confirm' : 
                                   res.estado.toLowerCase() === 'pendiente' ? 'status-pending' : 'status-refused';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${res.id}</td>
                    <td>${res.nombre}</td>
                    <td>${res.email}</td>
                    <td>${res.tel}</td>
                    <td>${res.fechaHora}</td>
                    <td>${res.pax}</td>
                    <td>${res.comentarios || ''}</td>
                    <td><span class="status ${estadoClass}">${res.estado}</span></td>
                    <td>${res.idMesa || 'Sin asignar'}</td>
                    <td class="actions">
                        <button type="button" class="btn-edit">Editar</button>
                    </td>
                `;
                
                // Usamos event listener en lugar de onclick inline para evitar errores con comillas
                tr.querySelector('.btn-edit').addEventListener('click', () => abrirEditar(res));
                tbody.appendChild(tr);
            });
        });
}

function abrirEditar(reserva) {
    document.getElementById('resId').value = reserva.id;
    document.getElementById('resNombre').value = reserva.nombre;
    document.getElementById('resEmail').value = reserva.email;
    document.getElementById('resTel').value = reserva.tel;
    // El input datetime-local necesita el formato YYYY-MM-DDTHH:mm
    document.getElementById('resFecha').value = reserva.fechaHora.replace(' ', 'T');
    document.getElementById('resPax').value = reserva.pax;
    document.getElementById('resComentarios').value = reserva.comentarios;
    document.getElementById('resMesa').value = reserva.idMesa;
    document.getElementById('reservationModal').style.display = "block";
}