// --- CONFIGURACIÓN DE CALENDARIO (FLATPICKR) ---
let calendario;

function actualizarFechaDisplay(fecha) {
    const fechaDisplay = document.getElementById('fecha-display');
    if (!fechaDisplay) return;

    if (!fecha) {
        const textoDefault = "inicio.selecciona-fecha".split('.').reduce((obj, i) => (obj ? obj[i] : null), i18n.translations);
        fechaDisplay.innerHTML = `${textoDefault || 'Selecciona una fecha →'}`;
        return;
    }

    const lang = i18n.currentLang;
    const locales = { 'es': 'es-ES', 'eu': 'eu-ES' };
    
    const dia = fecha.getDate();
    const mes = fecha.toLocaleDateString(locales[lang] || 'es-ES', { month: 'short' });
    const año = fecha.getFullYear();

    fechaDisplay.innerHTML = `<strong>${dia} ${mes.replace('.', '')} ${año}</strong>`;
}

function initCalendario(lang) {
    if (calendario) calendario.destroy();

    calendario = flatpickr("#calendario-visible", {
        locale: lang === 'es' ? 'es' : 'eu',
        inline: true,
        minDate: "today",
        dateFormat: "Y-m-d",
        onChange: function(selectedDates, dateStr) {
            document.getElementById('fecha-hidden').value = dateStr;
            if (selectedDates.length > 0) {
                actualizarFechaDisplay(selectedDates[0]);
            }
        }
    });
}

// --- LÓGICA DE LOGIN Y MODAL DE AUTH ---

function verTab(tipo) {
    const loginForm = document.getElementById('form-login');
    const registroForm = document.getElementById('form-registro');
    const tabs = document.querySelectorAll('.tab-link');

    if (tipo === 'login') {
        loginForm.style.display = 'flex';
        registroForm.style.display = 'none';
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        registroForm.style.display = 'flex';
        tabs[1].classList.add('active');
        tabs[0].classList.remove('active');
    }
}

function mostrarMensajeAuth(texto, color, formulario) {
    // Eliminar mensaje previo si existe
    const mensajePrevio = formulario.querySelector('.mensaje-auth');
    if (mensajePrevio) mensajePrevio.remove();

    const mensajeDiv = document.createElement('div');
    mensajeDiv.className = 'mensaje-auth';
    mensajeDiv.innerText = texto;
    mensajeDiv.style.padding = "10px";
    mensajeDiv.style.marginTop = "15px";
    mensajeDiv.style.borderRadius = "5px";
    mensajeDiv.style.textAlign = "center";
    mensajeDiv.style.color = "white";
    mensajeDiv.style.fontWeight = "bold";
    mensajeDiv.style.backgroundColor = color === "verde" ? "#28a745" : "#dc3545";
    
    formulario.appendChild(mensajeDiv);
}

// --- EVENTOS PRINCIPALES ---

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Calendario
    initCalendario(i18n.currentLang || 'es');

    // 1. Manejo de Reservas
    const formReserva = document.getElementById('form-reserva');
    const modalConfirm = document.getElementById('modal-confirmacion');
    const cerrarModal = document.getElementById('cerrar-modal');

    if (formReserva) {
        formReserva.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Validar que se haya seleccionado una fecha en el calendario
            const fechaVal = document.getElementById('fecha-hidden').value;
            if (!fechaVal) {
                const msg = i18n.currentLang === 'es' ? 'Por favor, selecciona una fecha' : 'Mesedez, hautatu data bat';
                alert(msg);
                return;
            }

            // Capturamos todos los datos del formulario
            const formData = new FormData(formReserva);
            const params = new URLSearchParams(formData);

            try {
                // Enviamos la petición al backend (App.java)
                const response = await fetch('/reservar', {
                    method: 'POST',
                    body: params
                });

                const result = await response.text();

                if (result === "success") {
                    // Preparamos el mensaje de confirmación
                    const horaVal = document.getElementById('hora').value;
                    const nombreVal = document.getElementById('nombre').value;
                    const detalleMsg = i18n.currentLang === 'es' 
                        ? `Confirmada reserva para el ${fechaVal} a las ${horaVal}, a nombre de ${nombreVal}.`
                        : `Erreserba berretsia ${fechaVal}(e)rako ${horaVal}(e)tan, ${nombreVal}(r)en.`;
                    
                    document.getElementById('modal-detalle-reserva').innerText = detalleMsg;
                    
                    // Mostramos el modal de éxito
                    modalConfirm.classList.add('active');
                } else {
                    alert(i18n.currentLang === 'es' ? "Error al procesar la reserva" : "Errorea erreserba egitean");
                }
            } catch (error) {
                console.error("Error:", error);
                alert("Error de conexión con el servidor");
            }
        });
    }

    // 2. Manejo de Modal Auth (Login/Registro)
    const btnAbrirAuth = document.getElementById('abrir-auth');
    const modalAuth = document.getElementById('modal-auth');
    const btnCerrarAuth = document.getElementById('cerrar-auth');
    const loginForm = document.getElementById('form-login');

    if(btnAbrirAuth) {
        btnAbrirAuth.addEventListener('click', (e) => {
            e.preventDefault();
            modalAuth.style.display = 'flex';
        });
    }

    if(btnCerrarAuth) {
        btnCerrarAuth.onclick = () => modalAuth.style.display = 'none';
    }

    // 3. Petición de Login al Backend (Spark Java)
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const params = new URLSearchParams(formData);

            try {
                const response = await fetch('/login-auth', {
                    method: 'POST',
                    body: params
                });

                const result = await response.text();

                if (result === "success") {
                    mostrarMensajeAuth("¡Login con éxito! Bienvenido.", "verde", loginForm);
                    setTimeout(() => {
                        window.location.href = "/index.html"; 
                    }, 1500);
                } else {
                    mostrarMensajeAuth("Usuario o contraseña incorrectos", "rojo", loginForm);
                }
            } catch (error) {
                console.error("Error:", error);
                mostrarMensajeAuth("Error de conexión con el servidor", "rojo", loginForm);
            }
        });
    }

    // Cerrar modal al hacer clic fuera
    if (cerrarModal) {
            cerrarModal.addEventListener('click', () => {
                modalConfirm.classList.remove('active');
                formReserva.reset(); // Limpia campos de texto
                calendario.clear();   // Limpia el calendario flatpickr
                actualizarFechaDisplay(null); // Resetea el texto visual de la fecha
            });
        }

    // Exponer funciones necesarias globalmente
    window.verTab = verTab;
    // 4. Petición de Registro al Backend (Spark Java)
        const registroForm = document.getElementById('form-registro');
        if (registroForm) {
            registroForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(registroForm);
                const params = new URLSearchParams(formData);
    
                console.log("Enviando datos de registro..."); // Debug en navegador
    
                try {
                    const response = await fetch('/registro', {
                        method: 'POST',
                        body: params
                    });
    
                    const result = await response.text();
    
                    if (result === "success") {
                        mostrarMensajeAuth("¡Registro con éxito! Ya puedes entrar.", "verde", registroForm);
                        setTimeout(() => {
                            verTab('login'); // Te manda al login automáticamente
                            registroForm.reset();
                        }, 2000);
                    } else {
                        mostrarMensajeAuth("Error: El usuario ya existe o faltan datos", "rojo", registroForm);
                    }
                } catch (error) {
                    console.error("Error:", error);
                    mostrarMensajeAuth("Error de conexión", "rojo", registroForm);
                }
            });
        }
});

// Actualizar calendario si cambia el idioma
document.addEventListener('languageChanged', () => {
    const lang = i18n.currentLang;
    initCalendario(lang);
    actualizarFechaDisplay(calendario.selectedDates[0] || null);
});