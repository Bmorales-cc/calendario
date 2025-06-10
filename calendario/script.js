document.addEventListener('DOMContentLoaded', function() {
    // Estado de la aplicación
    const state = {
        currentDate: new Date(),
        checks: JSON.parse(localStorage.getItem('serviceChecks')) || {}
    };
    
    // Elementos del DOM
    const calendarEl = document.getElementById('calendar');
    const currentMonthEl = document.getElementById('current-month');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const todayBtn = document.getElementById('today');
    const clearDataBtn = document.getElementById('clear-data');
    
    // Event listeners
    prevMonthBtn.addEventListener('click', () => {
        state.currentDate.setMonth(state.currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    nextMonthBtn.addEventListener('click', () => {
        state.currentDate.setMonth(state.currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    todayBtn.addEventListener('click', () => {
        state.currentDate = new Date();
        renderCalendar();
    });
    
    clearDataBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro que deseas borrar todos los datos de verificación?')) {
            localStorage.removeItem('serviceChecks');
            state.checks = {};
            renderCalendar();
            alert('Todos los datos han sido eliminados');
        }
    });
    
    // Renderizar el calendario
    function renderCalendar() {
        const year = state.currentDate.getFullYear();
        const month = state.currentDate.getMonth();
        
        // Actualizar el título del mes
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                           "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        currentMonthEl.textContent = `${monthNames[month]} ${year}`;
        
        // Obtener el primer y último día del mes
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Limpiar el calendario
        calendarEl.innerHTML = '';
        
        // Generar los días del mes
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const dateStr = formatDate(date);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            
            const dayEl = document.createElement('div');
            dayEl.className = `day ${isWeekend ? 'weekend' : ''}`;
            
            const dateEl = document.createElement('div');
            dateEl.className = 'date';
            dateEl.textContent = `${day} ${isWeekend ? '(D)' : '(H)'}`;
            dayEl.appendChild(dateEl);
            
            // Obtener el estado de verificación para este día
            const check = state.checks[dateStr];
            
            if (check) {
                // Mostrar el estado de verificación
                if (check.status === 'all-ok') {
                    addStatus(dayEl, 'Todo OK', 'all-ok');
                } else {
                    if (check.cameras) {
                        addStatus(dayEl, 'Cámaras OK', 'all-ok');
                    } else {
                        addStatus(dayEl, 'Cámaras con problemas', 'cameras-issue');
                        if (check.descripciones?.cameras) {
                            addDescription(dayEl, check.descripciones.cameras, 'cameras-issue');
                        }
                    }
                    
                    if (check.servidores) {
                        addStatus(dayEl, 'Servidores OK', 'all-ok');
                    } else {
                        addStatus(dayEl, 'Servidores con problemas', 'servers-issue');
                        if (check.descripciones?.servidores) {
                            addDescription(dayEl, check.descripciones.servidores, 'servers-issue');
                        }
                    }
                    
                    if (check.telefonos) {
                        addStatus(dayEl, 'Teléfonos OK', 'all-ok');
                    } else {
                        addStatus(dayEl, 'Teléfonos con problemas', 'phones-issue');
                        if (check.descripciones?.telefonos) {
                            addDescription(dayEl, check.descripciones.telefonos, 'phones-issue');
                        }
                    }
                    
                    // Resumen del día
                    const issues = [
                        !check.cameras,
                        !check.servidores,
                        !check.telefonos
                    ].filter(x => x).length;
                    
                    if (issues > 1) {
                        addStatus(dayEl, `${issues} servicios con problemas`, 'multiple-issues');
                    }
                }
            } else if (!isWeekend) {
                // Día hábil sin verificación
                addStatus(dayEl, 'Pendiente de verificación', 'pending');
            }
            
            // Permitir editar solo días hábiles no futuros
            if (!isWeekend && date <= new Date()) {
                dayEl.addEventListener('click', () => openCheckModal(date));
            }
            
            calendarEl.appendChild(dayEl);
        }
    }
    
    // Añadir un elemento de estado al día
    function addStatus(dayEl, text, className) {
        const statusEl = document.createElement('div');
        statusEl.className = `status ${className}`;
        statusEl.textContent = text;
        dayEl.appendChild(statusEl);
    }
    
    // Añadir descripción de problema
    function addDescription(dayEl, text, className) {
        const descEl = document.createElement('div');
        descEl.className = `problem-description ${className}`;
        descEl.textContent = text;
        dayEl.appendChild(descEl);
    }
    
    // Abrir modal para registrar verificación
    function openCheckModal(date) {
        const dateStr = formatDate(date);
        const check = state.checks[dateStr] || {
            status: 'all-ok',
            cameras: true,
            servidores: true,
            telefonos: true,
            descripciones: {
                cameras: '',
                servidores: '',
                telefonos: ''
            }
        };
        
        // Crear modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.innerHTML = `
            <h3>Verificación del ${date.toLocaleDateString()}</h3>
            <div>
                <label>
                    <input type="checkbox" id="cameras" ${check.cameras ? 'checked' : ''}>
                    Cámaras funcionando correctamente
                </label>
                <textarea id="cameras-desc" placeholder="Descripción del problema con cámaras (si aplica)" 
                    style="display: ${check.cameras ? 'none' : 'block'}">${check.descripciones.cameras}</textarea>
                
                <label>
                    <input type="checkbox" id="servidores" ${check.servidores ? 'checked' : ''}>
                    Servidores funcionando correctamente
                </label>
                <textarea id="servidores-desc" placeholder="Descripción del problema con servidores (si aplica)" 
                    style="display: ${check.servidores ? 'none' : 'block'}">${check.descripciones.servidores}</textarea>
                
                <label>
                    <input type="checkbox" id="telefonos" ${check.telefonos ? 'checked' : ''}>
                    Extensiones telefónicas funcionando correctamente
                </label>
                <textarea id="telefonos-desc" placeholder="Descripción del problema con teléfonos (si aplica)" 
                    style="display: ${check.telefonos ? 'none' : 'block'}">${check.descripciones.telefonos}</textarea>
            </div>
            <button id="save-check">Guardar Verificación</button>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Mostrar/ocultar textareas cuando cambian los checkboxes
        modalContent.querySelector('#cameras').addEventListener('change', function() {
            modalContent.querySelector('#cameras-desc').style.display = this.checked ? 'none' : 'block';
        });
        modalContent.querySelector('#servidores').addEventListener('change', function() {
            modalContent.querySelector('#servidores-desc').style.display = this.checked ? 'none' : 'block';
        });
        modalContent.querySelector('#telefonos').addEventListener('change', function() {
            modalContent.querySelector('#telefonos-desc').style.display = this.checked ? 'none' : 'block';
        });

        // Guardar la verificación
        modalContent.querySelector('#save-check').addEventListener('click', () => {
            const camerasOk = document.getElementById('cameras').checked;
            const serversOk = document.getElementById('servidores').checked;
            const phonesOk = document.getElementById('telefonos').checked;
            
            state.checks[dateStr] = {
                status: camerasOk && serversOk && phonesOk ? 'all-ok' : 'issues',
                cameras: camerasOk,
                servidores: serversOk,
                telefonos: phonesOk,
                descripciones: {
                    cameras: camerasOk ? '' : document.getElementById('cameras-desc').value,
                    servidores: serversOk ? '' : document.getElementById('servidores-desc').value,
                    telefonos: phonesOk ? '' : document.getElementById('telefonos-desc').value
                }
            };
            
            localStorage.setItem('serviceChecks', JSON.stringify(state.checks));
            document.body.removeChild(modal);
            renderCalendar();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    // Formatear fecha como YYYY-MM-DD
    function formatDate(date) {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();
        
        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
        
        return [year, month, day].join('-');
    }
    
    // Renderizar el calendario inicial
    renderCalendar();
});