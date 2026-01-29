document.addEventListener('DOMContentLoaded', () => {
    cargarReservas();

    // Lógica del Buscador
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('#tabla-reservas-body tr').forEach(row => {
            row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
        });
    });

    // Guardar cambios del Modal
    document.getElementById('reservationForm').onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('resId').value;
        
        // Creamos los parámetros para enviar a Java
        const params = new URLSearchParams();
        params.append('id', id);
        params.append('nombre', document.getElementById('resNombre').value);
        params.append('email', document.getElementById('resEmail').value);
        params.append('tel', document.getElementById('resTel').value);
        params.append('fechaHora', document.getElementById('resFecha').value);
        params.append('pax', document.getElementById('resPax').value);
        params.append('comentarios', document.getElementById('resComentarios').value);

        const res = await fetch('/api/admin/reservas/actualizar', { method: 'POST', body: params });
        if (await res.text() === "success") {
            alert("Reserva actualizada");
            document.getElementById('reservationModal').style.display = "none";
            cargarReservas(); // Refrescar tabla
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

                tbody.innerHTML += `
                    <tr>
                        <td>${res.id}</td>
                        <td>${res.nombre}</td>
                        <td>${res.email}</td>
                        <td>${res.tel}</td>
                        <td>${res.fechaHora}</td>
                        <td>${res.pax}</td>
                        <td>${res.comentarios || ''}</td>
                        <td><span class="status ${estadoClass}">${res.estado}</span></td>
                        <td class="actions">
                            <button type="button" class="btn-edit" onclick='abrirEditar(${JSON.stringify(res)})'>Editar</button>
                        </td>
                    </tr>
                `;
            });
        });
}

function abrirEditar(reserva) {
    document.getElementById('resId').value = reserva.id;
    document.getElementById('resNombre').value = reserva.nombre;
    document.getElementById('resEmail').value = reserva.email;
    document.getElementById('resTel').value = reserva.tel;
    document.getElementById('resFecha').value = reserva.fechaHora.replace(' ', 'T');
    document.getElementById('resPax').value = reserva.pax;
    document.getElementById('resComentarios').value = reserva.comentarios;
    document.getElementById('reservationModal').style.display = "block";
}