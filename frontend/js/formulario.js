 <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
    <script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/es.js"></script>
    
    
        // Calendario
        const calendario = flatpickr("#calendario-visible", {
            locale: "es",
            inline: true,
            minDate: "today",
            dateFormat: "Y-m-d",
            
            onChange: function(selectedDates, dateStr, instance) {
                document.getElementById('fecha-hidden').value = dateStr;
                
                if (selectedDates.length > 0) {
                    const fecha = selectedDates[0];
                    const dia = fecha.getDate();
                    const mes = fecha.toLocaleDateString('es-ES', { month: 'short' });
                    const año = fecha.getFullYear();
                    
                    document.getElementById('fecha-display').innerHTML = 
                        '📅 <strong>' + dia + ' ' + mes + ' ' + año + '</strong>';
                }
            }
        });
        
        // Validar fecha
        document.getElementById('form-reserva').addEventListener('submit', function(e) {
            const fechadSeleccionada = document.getElementById('fecha-hiden').value;
            
            if (!fechaSeleccionada) {
                e.preventDefault();
                alert('Por favor, selecciona una fecha en el calendario');
                return false;
            }
        });
        
        // Limpiar
        document.querySelector('.boton-secundario').addEventListener('click', function() {
            calendario.clear();
            document.getElementById('fecha-display').innerHTML = '📅 Selecciona una fecha →';
        });
  