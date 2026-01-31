// --- CONFIGURACIÓN DE CALENDARIO (FLATPICKR) ---
let calendario;

function actualizarFechaDisplay(fecha) {
    const fechaDisplay = document.getElementById('fecha-display');
    if (!fechaDisplay) return;

    if (!fecha) {
        // Fallback seguro por si i18n no ha cargado
        const textoDefault = i18n.translations && i18n.translations.inicio ? 
                             i18n.translations.inicio["selecciona-fecha"] : "Selecciona una fecha →";
        fechaDisplay.innerHTML = `${textoDefault}`;
        return;
    }

    const lang = i18n.currentLang || 'es';
    const locales = { 'es': 'es-ES', 'eu': 'eu-ES' };
    
    const dia = fecha.getDate();
    const mes = fecha.toLocaleDateString(locales[lang], { month: 'short' });
    const año = fecha.getFullYear();

    fechaDisplay.innerHTML = `<strong>${dia} ${mes.replace('.', '')} ${año}</strong>`;
}

function initCalendario(lang) {
    if (calendario) calendario.destroy();
    
    // Validación de seguridad para el idioma eu
    let configLocale = "es"; 
    if (lang === 'eu') {
        // Verificamos si la librería de euskera está disponible, si no, usamos es
        configLocale = (window.flatpickr && flatpickr.l10ns && flatpickr.l10ns.eu) ? 'eu' : 'es';
    }

    calendario = flatpickr("#calendario-visible", {
        locale: configLocale,
        inline: true,
        static: true,
        minDate: "today",
        dateFormat: "Y-m-d",
        monthSelectorType: "static",
        onChange: function(selectedDates, dateStr) {
            const hiddenInput = document.getElementById('fecha-hidden');
            if(hiddenInput) hiddenInput.value = dateStr;
            if (selectedDates.length > 0) {
                actualizarFechaDisplay(selectedDates[0]);
            }
        }
    });

    // Forzamos el lunes como primer día después de inicializar
    if (calendario.config && calendario.config.locale) {
        calendario.l10n.firstDayOfWeek = 1;
        calendario.redraw();
    }
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
// Funcion Autorelleno
async function autorrellenarFormulario() {
    try {
        const response = await fetch('/get-session-user');
        const data = await response.json();

        if (data.logged) {
            const inputNombre = document.getElementById('nombre');
            const inputEmail = document.getElementById('email');
            const inputTel = document.getElementById('telefono');

            if (inputNombre) inputNombre.value = data.nombre;
            if (inputEmail) inputEmail.value = data.email;
            if (inputTel) inputTel.value = data.telefono;
            
            // Si el botón de login existe, podrías cambiarle el texto aquí también
            if (btnLogin) {
                btnLogin.textContent = "Hola, " +  data.nombre.split(" ")[0];
                btnLogin.classList.add("btn-usuario-logeado"); // Añadimos una clase
            }
        }
    } catch (error) {
        console.error("Error al obtener datos de sesión:", error);
    }
}
function mostrarMensajeAuth(texto, color, formulario) {
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
    autorrellenarFormulario();
    initCalendario(i18n.currentLang || 'es');

    const formReserva = document.getElementById('form-reserva');
    const modalConfirm = document.getElementById('modal-confirmacion');
    const cerrarModal = document.getElementById('cerrar-modal');

    // 1. Manejo de Reservas
    if (formReserva) {
        formReserva.addEventListener('submit', async function(e) {
            e.preventDefault();
            const fechaVal = document.getElementById('fecha-hidden').value;
            if (!fechaVal) {
                alert(i18n.currentLang === 'es' ? 'Por favor, selecciona una fecha' : 'Mesedez, hautatu data bat');
                return;
            }

            const formData = new FormData(formReserva);
            const params = new URLSearchParams(formData);

            try {
                const response = await fetch('/reservar', { method: 'POST', body: params });
                const result = await response.text();

                if (result === "success") {
                    const horaVal = document.getElementById('hora').value;
                    const nombreVal = document.getElementById('nombre').value;
                    const detalleMsg = i18n.currentLang === 'es' 
                        ? `Confirmada reserva para el ${fechaVal} a las ${horaVal}, a nombre de ${nombreVal}.`
                        : `Erreserba berretsia ${fechaVal}(e)rako ${horaVal}(e)tan, ${nombreVal}(r)en.`;
                    
                    document.getElementById('modal-detalle-reserva').innerText = detalleMsg;
                    modalConfirm.classList.add('active');
                } else {
                    alert(i18n.currentLang === 'es' ? "Error: No hay mesas disponibles" : "Errorea: Ez dago mahai librerik");
                }
            } catch (error) {
                alert("Error de conexión");
            }
        });
    }

    // 2. Manejo de Modal Auth
    const btnAbrirAuth = document.getElementById('abrir-auth');
    const modalAuth = document.getElementById('modal-auth');
    const btnCerrarAuth = document.getElementById('cerrar-auth');
    const loginForm = document.getElementById('form-login');
    const registroForm = document.getElementById('form-registro');

    if(btnAbrirAuth) {
        btnAbrirAuth.onclick = (e) => { e.preventDefault(); modalAuth.style.display = 'flex'; };
    }
    if(btnCerrarAuth) {
        btnCerrarAuth.onclick = () => modalAuth.style.display = 'none';
    }

    // 3. Petición de Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const params = new URLSearchParams(new FormData(loginForm));
            try {
                const response = await fetch('/login-auth', { method: 'POST', body: params });
                const result = await response.text();

                if (result === "1") {
                    window.location.href = "/admin";
                } else if (result === "2") {
                    mostrarMensajeAuth("Bienvenido", "verde", loginForm);
                    setTimeout(() => { window.location.href = "/"; }, 1000);
                } else {
                    mostrarMensajeAuth("Credenciales incorrectas", "rojo", loginForm);
                }
            } catch (error) {
                mostrarMensajeAuth("Error de servidor", "rojo", loginForm);
            }
        });
    }

    // 4. Petición de Registro
    if (registroForm) {
        registroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const params = new URLSearchParams(new FormData(registroForm));
            try {
                const response = await fetch('/registro', { method: 'POST', body: params });
                const result = await response.text();
                if (result === "success") {
                    mostrarMensajeAuth("¡Registro con éxito!", "verde", registroForm);
                    setTimeout(() => { verTab('login'); registroForm.reset(); }, 2000);
                } else {
                    mostrarMensajeAuth("Error en el registro", "rojo", registroForm);
                }
            } catch (error) {
                mostrarMensajeAuth("Error de conexión", "rojo", registroForm);
            }
        });
    }

    if (cerrarModal) {
        cerrarModal.onclick = () => {
            modalConfirm.classList.remove('active');
            formReserva.reset();
            calendario.clear();
            actualizarFechaDisplay(null);
        };
    }
});

document.addEventListener('languageChanged', () => {
    const lang = i18n.currentLang || 'es';
    initCalendario(lang);
    
    // Si ya había una fecha seleccionada, la mantenemos
    const fechaPrevia = document.getElementById('fecha-hidden').value;
    if (fechaPrevia) {
        calendario.setDate(fechaPrevia);
        actualizarFechaDisplay(calendario.selectedDates[0]);
    } else {
        actualizarFechaDisplay(null);
    }
});
window.verTab = verTab;