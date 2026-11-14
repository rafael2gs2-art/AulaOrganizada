// UI
const pantallaRegistro = document.getElementById('pantalla-registro');
const pantallaApp = document.getElementById('pantalla-app');
const tituloSeccion = document.getElementById('titulo-seccion');

// Perfil
const formularioUsuario = document.getElementById('formulario-usuario');
const btnAvatar = document.getElementById('btn-avatar');
const avatarInicial = document.getElementById('avatar-inicial');
const menuPerfil = document.getElementById('menu-perfil');
const menuNombreUsuario = document.getElementById('menu-nombre-usuario');
const menuCorreoUsuario = document.getElementById('menu-correo-usuario');

// Listas
const listaHoy = document.getElementById('lista-hoy');
const listaTareasPendientes = document.getElementById('lista-tareas-pendientes');
const contenedorFechas = document.getElementById('contenedor-fechas');

// Modales
const btnFlotanteAgregar = document.getElementById('btn-flotante-agregar');
const modalMenuCrear = document.getElementById('modal-menu-crear');
const modalWizard = document.getElementById('modal-wizard');
const modalCrearTareaSimple = document.getElementById('modal-crear-tarea-simple');
const modalDetalleItem = document.getElementById('modal-detalle-item');
const modalConfigRecordatorio = document.getElementById('modal-config-recordatorio');
const modalReprogramar = document.getElementById('modal-reprogramar');
const modalEditarCompleto = document.getElementById('modal-editar-completo');

// Wizard & Simple Elements
const wizSwitchFin = document.getElementById('wiz-switch-fin');
const contenedorCamposFin = document.getElementById('contenedor-campos-fin');
const wizFechaInicio = document.getElementById('wiz-fecha-inicio');
const wizFechaFin = document.getElementById('wiz-fecha-fin');
const wizDiasDuracion = document.getElementById('wiz-dias-duracion');
const contenedorOtroCurso = document.getElementById('contenedor-otro-curso');
const wizOtroCursoInput = document.getElementById('wiz-otro-curso-input');

let pasoActualWizard = 1;
let wizMateriaSeleccionada = '📐 Matemática';
let diasMesSeleccionados = [];
let itemSeleccionadoContexto = null;
let tipoRecordatorioSeleccionado = 'alarma';
let timerLongPress = null;

// Persistencia
let perfilUsuario = JSON.parse(localStorage.getItem('perfil_aula_organizada')) || null;
let tareas = JSON.parse(localStorage.getItem('tareas_aula_organizada')) || [];
let ejecucionesCompletadas = JSON.parse(localStorage.getItem('ejecuciones_aula')) || {}; 

let fechaHoyRealStr = obtenerFechaString(new Date());
let fechaSeleccionadaStr = fechaHoyRealStr;
let audioCtx = null;

document.addEventListener('DOMContentLoaded', () => {
    generarGridDiasMes();

    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    if (btnFlotanteAgregar) {
        btnFlotanteAgregar.addEventListener('click', (e) => {
            e.stopPropagation();
            abrirMenuOpcionesCrear();
        });
    }

    if (perfilUsuario) {
        mostrarPantallaApp();
    } else {
        mostrarPantallaRegistro();
    }

    setInterval(comprobarRecordatoriosAlarmas, 5000);
});

function autoExpandirNota(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
}

function obtenerFechaString(fecha) {
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function parseFechaLocal(str) {
    if (!str) return new Date();
    const partes = str.split('-');
    return new Date(partes[0], partes[1] - 1, partes[2]);
}

function agregarDiasAFecha(fechaBase, dias) {
    const res = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), fechaBase.getDate());
    res.setDate(res.getDate() + parseInt(dias, 10));
    return res;
}

function formatearMinutosHoras(inputElement, minVal, maxVal) {
    let v = parseInt(inputElement.value, 10);
    if (isNaN(v) || v < minVal) v = minVal;
    if (v > maxVal) v = maxVal;
    inputElement.value = String(v).padStart(2, '0');
}

function mostrarPantallaRegistro() { pantallaRegistro.style.display = 'flex'; }

function mostrarPantallaApp() {
    pantallaRegistro.style.display = 'none';
    avatarInicial.textContent = perfilUsuario.nombre.charAt(0).toUpperCase();
    menuNombreUsuario.textContent = perfilUsuario.nombre;
    menuCorreoUsuario.textContent = perfilUsuario.correo;

    fechaHoyRealStr = obtenerFechaString(new Date());
    generarTiraMeses();
    renderizarTodo();
}

function generarTiraMeses() {
    contenedorFechas.innerHTML = '';
    const hoy = new Date();
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 0);

    let aux = new Date(inicio);
    let elementoHoyDOM = null;

    while (aux <= fin) {
        const fechaStr = obtenerFechaString(aux);
        const div = document.createElement('div');
        
        let clases = 'dia-item';
        if (fechaStr === fechaHoyRealStr) clases += ' es-hoy-real';
        if (fechaStr === fechaSeleccionadaStr) clases += ' activo';
        
        div.className = clases;
        div.innerHTML = `
            <span class="mes-tag">${meses[aux.getMonth()]}</span>
            <div>${dias[aux.getDay()]}</div>
            <span class="num-dia">${aux.getDate()}</span>
        `;
        div.onclick = () => seleccionarFecha(fechaStr, div);

        if (fechaStr === fechaHoyRealStr) elementoHoyDOM = div;
        contenedorFechas.appendChild(div);
        aux.setDate(aux.getDate() + 1);
    }

    if (elementoHoyDOM) {
        setTimeout(() => elementoHoyDOM.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }), 100);
    }
}

function seleccionarFecha(fechaStr, elemento) {
    document.querySelectorAll('.dia-item').forEach(el => el.classList.remove('activo'));
    elemento.classList.add('activo');
    fechaSeleccionadaStr = fechaStr;
    renderizarTodo();
}

function cambiarTab(idTab, btn, titulo) {
    document.querySelectorAll('.vista-tab').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('activo'));
    document.getElementById(idTab).style.display = 'block';
    btn.classList.add('activo');
    tituloSeccion.textContent = titulo;
}

function abrirMenuOpcionesCrear() { modalMenuCrear.style.display = 'flex'; }
function cerrarMenuOpcionesCrear() { modalMenuCrear.style.display = 'none'; }

function seleccionarTipoElemento(tipo) {
    cerrarMenuOpcionesCrear();
    if (tipo === 'tarea') abrirModalWizard();
    else if (tipo === 'trabajo') abrirCrearTareaSimple();
}

function toggleOtroCursoSimple() {
    const val = document.getElementById('simple-materia').value;
    document.getElementById('contenedor-otro-curso-simple').style.display = val === 'OTRO' ? 'flex' : 'none';
}

function abrirCrearTareaSimple() {
    document.getElementById('simple-nombre').value = '';
    document.getElementById('simple-fecha').value = fechaSeleccionadaStr;
    const inputNota = document.getElementById('simple-nota');
    inputNota.value = '';
    inputNota.style.height = 'auto';
    document.getElementById('simple-materia').value = '📐 Matemática';
    toggleOtroCursoSimple();
    modalCrearTareaSimple.style.display = 'flex';
}

function cerrarCrearTareaSimple() { modalCrearTareaSimple.style.display = 'none'; }

function guardarTareaSimple() {
    let cursoFinal = document.getElementById('simple-materia').value;
    if (cursoFinal === 'OTRO') {
        const pers = document.getElementById('simple-otro-curso-input').value.trim();
        cursoFinal = pers ? `✏️ ${pers}` : '✏️ Otro curso';
    }

    const fecha = document.getElementById('simple-fecha').value || fechaSeleccionadaStr;
    const hora = document.getElementById('simple-hora-num').value.padStart(2, '0');
    const min = document.getElementById('simple-min-num').value.padStart(2, '0');
    const ampm = document.getElementById('simple-ampm').value;

    const nuevaTarea = {
        id: Date.now(),
        nombre: document.getElementById('simple-nombre').value.trim() || 'Nuevo Trabajo',
        nota: document.getElementById('simple-nota').value.trim(),
        curso: cursoFinal,
        frecuencia: 'unico',
        fechaInicio: fecha,
        fechaFin: fecha,
        tieneFechaFin: true,
        hora12: `${hora}:${min} ${ampm}`,
        tipoRecordatorio: 'alarma',
        prioridad: document.getElementById('simple-prioridad').value,
        fechaCompletadaExacta: null,
        omitidos: []
    };

    tareas.push(nuevaTarea);
    localStorage.setItem('tareas_aula_organizada', JSON.stringify(tareas));
    cerrarCrearTareaSimple();
    renderizarTodo();
}

function toggleSwitchFechaFin() {
    if (wizSwitchFin.checked) {
        contenedorCamposFin.style.display = 'block';
        wizDiasDuracion.value = 1;
        actualizarFechaFinDesdeDias();
    } else {
        contenedorCamposFin.style.display = 'none';
    }
}

function actualizarFechaFinDesdeDias() {
    const numDias = parseInt(wizDiasDuracion.value, 10) || 1;
    const baseStr = wizFechaInicio.value || fechaHoyRealStr;
    const baseDate = parseFechaLocal(baseStr);
    const fechaResultado = agregarDiasAFecha(baseDate, numDias);
    wizFechaFin.value = obtenerFechaString(fechaResultado);
}

function actualizarDiasDesdeFechaFin() {
    const baseStr = wizFechaInicio.value || fechaHoyRealStr;
    const finStr = wizFechaFin.value;
    if (baseStr && finStr) {
        const dInicio = parseFechaLocal(baseStr);
        const dFin = parseFechaLocal(finStr);
        const diffDays = Math.ceil((dFin - dInicio) / (1000 * 60 * 60 * 24));
        wizDiasDuracion.value = diffDays > 0 ? diffDays : 1;
    }
}

function abrirModalWizard() {
    limpiarFormularioWizard();
    pasoActualWizard = 1;
    wizFechaInicio.value = fechaSeleccionadaStr;
    actualizarVistaWizard();
    modalWizard.style.display = 'flex';
}

function cerrarModalWizard() {
    modalWizard.style.display = 'none';
    limpiarFormularioWizard();
}

function limpiarFormularioWizard() {
    document.getElementById('wiz-nombre').value = '';
    const txtNota = document.getElementById('wiz-nota');
    txtNota.value = '';
    txtNota.style.height = 'auto';

    wizOtroCursoInput.value = '';
    contenedorOtroCurso.style.display = 'none';
    wizMateriaSeleccionada = '📐 Matemática';
    
    document.querySelectorAll('.item-materia-btn').forEach(btn => btn.classList.remove('seleccionado'));
    
    wizSwitchFin.checked = true;
    contenedorCamposFin.style.display = 'block';
    wizDiasDuracion.value = 1;

    document.getElementById('desplegable-dias-semana').style.display = 'none';
    document.getElementById('desplegable-dias-mes').style.display = 'none';
    document.querySelectorAll('.check-dia-sem').forEach(c => c.checked = false);
    diasMesSeleccionados = [];
    document.querySelectorAll('.btn-dia-mes').forEach(b => b.classList.remove('activo'));
    
    const radioDiario = document.querySelector('input[name="wiz-frecuencia"][value="diario"]');
    if (radioDiario) radioDiario.checked = true;

    document.getElementById('wiz-prioridad').value = 'Normal';
}

function seleccionarMateria(btnElement, materiaStr) {
    document.querySelectorAll('.item-materia-btn').forEach(btn => btn.classList.remove('seleccionado'));
    btnElement.classList.add('seleccionado');

    if (materiaStr === 'OTRO') {
        contenedorOtroCurso.style.display = 'flex';
        wizMateriaSeleccionada = 'OTRO';
    } else {
        contenedorOtroCurso.style.display = 'none';
        wizMateriaSeleccionada = materiaStr;
    }
}

function toggleOpcionesFrecuencia(tipo) {
    document.getElementById('desplegable-dias-semana').style.display = tipo === 'semanal' ? 'block' : 'none';
    document.getElementById('desplegable-dias-mes').style.display = tipo === 'mensual' ? 'block' : 'none';
}

function generarGridDiasMes() {
    const contenedor = document.getElementById('grid-dias-mes-contenedor');
    contenedor.innerHTML = '';
    for (let i = 1; i <= 31; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-dia-mes';
        btn.textContent = i;
        btn.onclick = () => {
            btn.classList.toggle('activo');
            if (diasMesSeleccionados.includes(i)) {
                diasMesSeleccionados = diasMesSeleccionados.filter(d => d !== i);
            } else {
                diasMesSeleccionados.push(i);
            }
        };
        contenedor.appendChild(btn);
    }
}

function moverWizard(delta) {
    if (pasoActualWizard === 1 && delta === 1) {
        const nombreInput = document.getElementById('wiz-nombre').value.trim();
        if (!nombreInput) {
            alert("Por favor, ingresa el nombre de la tarea antes de continuar.");
            document.getElementById('wiz-nombre').focus();
            return;
        }
    }

    if (delta === -1 && pasoActualWizard === 1) {
        cerrarModalWizard();
        return;
    }
    pasoActualWizard += delta;
    if (pasoActualWizard > 4) {
        guardarTareaWizard();
        cerrarModalWizard();
        return;
    }
    actualizarVistaWizard();
}

function actualizarVistaWizard() {
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`paso-${i}`).style.display = i === pasoActualWizard ? 'block' : 'none';
        document.getElementById(`dot-paso-${i}`).classList.toggle('activo', i === pasoActualWizard);
    }
    const btnAnt = document.getElementById('btn-wiz-anterior');
    const btnSig = document.getElementById('btn-wiz-siguiente');
    btnAnt.textContent = pasoActualWizard === 1 ? 'Cancelar' : 'Anterior';
    btnSig.textContent = pasoActualWizard === 4 ? 'Confirmar' : 'Siguiente';
}

function guardarTareaWizard() {
    let materiaFinal = wizMateriaSeleccionada;
    if (materiaFinal === 'OTRO') {
        const personal = wizOtroCursoInput.value.trim();
        materiaFinal = personal ? `✏️ ${personal}` : '✏️ Otro curso';
    }

    const diasSemanaSeleccionados = [];
    document.querySelectorAll('.check-dia-sem:checked').forEach(cb => {
        diasSemanaSeleccionados.push(parseInt(cb.value, 10));
    });

    const fechaInicioVal = wizFechaInicio.value || fechaSeleccionadaStr;
    let fechaFinVal = null;
    if (wizSwitchFin.checked) fechaFinVal = wizFechaFin.value || fechaInicioVal;

    const hora = document.getElementById('wiz-hora-num').value.padStart(2, '0');
    const min = document.getElementById('wiz-min-num').value.padStart(2, '0');
    const ampm = document.getElementById('wiz-ampm').value;

    const nuevaTarea = {
        id: Date.now(),
        nombre: document.getElementById('wiz-nombre').value.trim(),
        nota: document.getElementById('wiz-nota').value.trim(),
        curso: materiaFinal,
        frecuencia: document.querySelector('input[name="wiz-frecuencia"]:checked').value,
        diasSemana: diasSemanaSeleccionados,
        diasMes: [...diasMesSeleccionados],
        fechaInicio: fechaInicioVal,
        fechaFin: fechaFinVal,
        tieneFechaFin: wizSwitchFin.checked,
        hora12: `${hora}:${min} ${ampm}`,
        tipoRecordatorio: 'alarma',
        prioridad: document.getElementById('wiz-prioridad').value,
        fechaCompletadaExacta: null,
        omitidos: [] 
    };

    tareas.push(nuevaTarea);
    localStorage.setItem('tareas_aula_organizada', JSON.stringify(tareas));
    renderizarTodo();
}

function correspondeTareaEnFecha(item, fechaEval) {
    const fEvalStr = obtenerFechaString(fechaEval);
    
    if (fEvalStr < item.fechaInicio) return false;
    if (item.tieneFechaFin && item.fechaFin && fEvalStr > item.fechaFin) return false;
    if (item.omitidos && item.omitidos.includes(fEvalStr)) return false;

    if (item.fechaCompletadaExacta && fEvalStr > item.fechaCompletadaExacta) {
        return false;
    }

    if (item.frecuencia === 'diario') return true;
    if (item.frecuencia === 'semanal') return item.diasSemana && item.diasSemana.includes(fechaEval.getDay());
    if (item.frecuencia === 'mensual') return item.diasMes && item.diasMes.includes(fechaEval.getDate());
    if (item.frecuencia === 'unico') return fEvalStr === item.fechaInicio;

    return false;
}

function calcularInfoLapsoDias(item, fechaEvalStr) {
    if (!item.tieneFechaFin || !item.fechaFin) return '';
    const fEval = parseFechaLocal(fechaEvalStr);
    const fFin = parseFechaLocal(item.fechaFin);
    const diffTime = fFin.getTime() - fEval.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Vencida';
    if (diffDays === 0) return 'Entrega hoy';
    return `Quedan ${diffDays} días | Entrega: ${item.fechaFin}`;
}

function renderizarTodo() {
    listaHoy.innerHTML = '';
    const fechaObjSeleccionada = parseFechaLocal(fechaSeleccionadaStr);
    let tareasDelDia = tareas.filter(item => correspondeTareaEnFecha(item, fechaObjSeleccionada));

    const pesoPrioridad = { 'Alta': 3, 'Normal': 2, 'Baja': 1 };
    tareasDelDia.sort((a, b) => {
        const pA = pesoPrioridad[a.prioridad] || 2;
        const pB = pesoPrioridad[b.prioridad] || 2;
        return pB - pA;
    });

    if (tareasDelDia.length === 0) {
        listaHoy.innerHTML = `
            <div class="estado-vacio-contenedor">
                <p class="estado-vacio-linea1">No tienes pendientes</p>
                <p class="estado-vacio-linea2">¡Agrega uno!</p>
            </div>
        `;
    } else {
        tareasDelDia.forEach(item => {
            const keyEjecucion = `${item.id}_${fechaSeleccionadaStr}`;
            const estaCompletadaHoy = !!ejecucionesCompletadas[keyEjecucion];
            const esHoyMismo = (fechaSeleccionadaStr === fechaHoyRealStr);

            let colorPrioridad = '🟡';
            if (item.prioridad === 'Alta') colorPrioridad = '🔴';
            if (item.prioridad === 'Baja') colorPrioridad = '🟢';

            const textoLapso = calcularInfoLapsoDias(item, fechaSeleccionadaStr);
            const notaTexto = item.nota ? item.nota : '';

            const div = document.createElement('div');
            div.className = `item-habitnow ${estaCompletadaHoy ? 'completado' : ''}`;
            
            div.addEventListener('touchstart', () => iniciarLongPress(item));
            div.addEventListener('touchend', cancelarLongPress);
            div.addEventListener('mousedown', () => iniciarLongPress(item));
            div.addEventListener('mouseup', cancelarLongPress);

            div.innerHTML = `
                <div class="item-izq">
                    <div class="item-info">
                        <span class="item-titulo">${item.nombre} ${colorPrioridad}</span>
                        <span class="tag-curso-badge">${item.curso}</span>
                        ${textoLapso ? `<span class="tag-lapso-dias">${textoLapso}</span>` : ''}
                    </div>
                </div>

                ${notaTexto ? `<div class="item-nota-lateral" title="${notaTexto}">${notaTexto}</div>` : '<div class="item-nota-lateral"></div>'}

                <div class="item-acciones">
                    <div class="check-circulo-estetico ${estaCompletadaHoy ? 'completado' : ''} ${!esHoyMismo ? 'bloqueado' : ''}" 
                         onclick="event.stopPropagation(); toggleCompletadoFecha(${item.id}, '${fechaSeleccionadaStr}', ${esHoyMismo})">
                        ${estaCompletadaHoy ? '✓' : ''}
                    </div>
                </div>
            `;
            listaHoy.appendChild(div);
        });
    }

    // Pestaña PENDIENTES (Sustituye fecha de inicio por Fecha de Entrega y oculta completadas)
    listaTareasPendientes.innerHTML = '';
    
    if (tareas.length === 0) {
        listaTareasPendientes.innerHTML = `
            <div class="estado-vacio-contenedor">
                <p class="estado-vacio-linea1">No hay tareas pendientes</p>
            </div>
        `;
    } else {
        tareas.forEach(t => {
            const fechaEntregaTxt = (t.tieneFechaFin && t.fechaFin) ? t.fechaFin : (t.fechaInicio || 'Sin fecha');
            const div = document.createElement('div');
            div.className = 'item-habitnow';
            div.innerHTML = `
                <div class="item-izq">
                    <div class="item-info">
                        <span class="item-titulo">${t.nombre}</span>
                        <span class="tag-curso-badge">${t.curso} | 📌 Entrega: ${fechaEntregaTxt}</span>
                    </div>
                </div>
                ${t.nota ? `<div class="item-nota-lateral" title="${t.nota}">${t.nota}</div>` : ''}
            `;
            listaTareasPendientes.appendChild(div);
        });
    }
}

function toggleCompletadoFecha(id, fechaStr, esHoyMismo) {
    if (!esHoyMismo) {
        alert("Solo puedes completar tareas del día de hoy.");
        return;
    }
    const key = `${id}_${fechaStr}`;
    const targetItem = tareas.find(t => t.id === id);

    if (ejecucionesCompletadas[key]) {
        delete ejecucionesCompletadas[key];
        if (targetItem) targetItem.fechaCompletadaExacta = null;
    } else {
        ejecucionesCompletadas[key] = true;
        if (targetItem) targetItem.fechaCompletadaExacta = fechaStr;
    }

    localStorage.setItem('ejecuciones_aula', JSON.stringify(ejecucionesCompletadas));
    localStorage.setItem('tareas_aula_organizada', JSON.stringify(tareas));
    renderizarTodo();
}

function iniciarLongPress(item) {
    timerLongPress = setTimeout(() => {
        abrirModalDetalleItem(item);
    }, 500);
}

function cancelarLongPress() {
    if (timerLongPress) clearTimeout(timerLongPress);
}

function obtenerEmojiDeMateria(cursoStr) {
    if (!cursoStr) return '📚';
    const partes = cursoStr.split(' ');
    if (partes.length > 0 && partes[0].length <= 3) return partes[0];
    return '📚';
}

function abrirModalDetalleItem(item) {
    itemSeleccionadoContexto = item;
    document.getElementById('det-titulo').textContent = item.nombre;
    document.getElementById('det-fecha-tag').textContent = fechaSeleccionadaStr;
    document.getElementById('det-hora-txt').textContent = item.hora12 || 'Sin hora';

    document.getElementById('det-icono-materia').textContent = obtenerEmojiDeMateria(item.curso);

    const key = `${item.id}_${fechaSeleccionadaStr}`;
    const estaComp = !!ejecucionesCompletadas[key];

    document.getElementById('btn-estado-pendiente').classList.toggle('activo', !estaComp);
    document.getElementById('btn-estado-logrado').classList.toggle('activo', estaComp);

    modalDetalleItem.style.display = 'flex';
}

function cerrarDetalleItem() { modalDetalleItem.style.display = 'none'; }

function marcarEstadoDesdeModal(estado) {
    if (fechaSeleccionadaStr !== fechaHoyRealStr) {
        alert("Solo puedes modificar el estado para el día de hoy.");
        return;
    }
    const key = `${itemSeleccionadoContexto.id}_${fechaSeleccionadaStr}`;
    if (estado === 'logrado') {
        ejecucionesCompletadas[key] = true;
        itemSeleccionadoContexto.fechaCompletadaExacta = fechaSeleccionadaStr;
    } else {
        delete ejecucionesCompletadas[key];
        itemSeleccionadoContexto.fechaCompletadaExacta = null;
    }

    localStorage.setItem('ejecuciones_aula', JSON.stringify(ejecucionesCompletadas));
    localStorage.setItem('tareas_aula_organizada', JSON.stringify(tareas));
    cerrarDetalleItem();
    renderizarTodo();
}

function abrirConfigRecordatorio() {
    if (itemSeleccionadoContexto.hora12) {
        const partes = itemSeleccionadoContexto.hora12.split(' ');
        const hm = partes[0].split(':');
        document.getElementById('rec-hora-num').value = String(parseInt(hm[0], 10)).padStart(2, '0');
        document.getElementById('rec-min-num').value = hm[1];
        document.getElementById('rec-ampm').value = partes[1] || 'PM';
    }
    seleccionarTipoRec(itemSeleccionadoContexto.tipoRecordatorio || 'alarma');
    modalConfigRecordatorio.style.display = 'flex';
}

function cerrarConfigRecordatorio() { modalConfigRecordatorio.style.display = 'none'; }

function seleccionarTipoRec(tipo) {
    tipoRecordatorioSeleccionado = tipo;
    document.getElementById('btn-rec-alarma').classList.toggle('activo', tipo === 'alarma');
    document.getElementById('btn-rec-notif').classList.toggle('activo', tipo === 'notificacion');
}

function guardarNuevoRecordatorio() {
    const h = document.getElementById('rec-hora-num').value.padStart(2, '0');
    const m = document.getElementById('rec-min-num').value.padStart(2, '0');
    const ampm = document.getElementById('rec-ampm').value;

    itemSeleccionadoContexto.hora12 = `${h}:${m} ${ampm}`;
    itemSeleccionadoContexto.tipoRecordatorio = tipoRecordatorioSeleccionado;
    
    localStorage.setItem('tareas_aula_organizada', JSON.stringify(tareas));
    cerrarConfigRecordatorio();
    cerrarDetalleItem();
    renderizarTodo();
}

function abrirReprogramarFecha() {
    document.getElementById('input-nueva-fecha-reprogramar').value = itemSeleccionadoContexto.fechaInicio;
    modalReprogramar.style.display = 'flex';
}

function cerrarReprogramar() { modalReprogramar.style.display = 'none'; }

function confirmarReprogramar() {
    const nuevaF = document.getElementById('input-nueva-fecha-reprogramar').value;
    if (nuevaF) {
        itemSeleccionadoContexto.fechaInicio = nuevaF;
        localStorage.setItem('tareas_aula_organizada', JSON.stringify(tareas));
        cerrarReprogramar();
        cerrarDetalleItem();
        renderizarTodo();
    }
}

function omitirTareaHoy() {
    if (!itemSeleccionadoContexto.omitidos) itemSeleccionadoContexto.omitidos = [];
    itemSeleccionadoContexto.omitidos.push(fechaSeleccionadaStr);
    localStorage.setItem('tareas_aula_organizada', JSON.stringify(tareas));
    cerrarDetalleItem();
    renderizarTodo();
}

function borrarTareaDesdeModal() {
    if (confirm("¿Estás seguro de eliminar esta tarea?")) {
        tareas = tareas.filter(t => t.id !== itemSeleccionadoContexto.id);
        localStorage.setItem('tareas_aula_organizada', JSON.stringify(tareas));
        cerrarEditarCompleto();
        cerrarDetalleItem();
        renderizarTodo();
    }
}

function abrirEditarPantallaCompleta() {
    document.getElementById('edit-nombre-input').value = itemSeleccionadoContexto.nombre;
    const txtEditNota = document.getElementById('edit-nota-input');
    txtEditNota.value = itemSeleccionadoContexto.nota || '';
    autoExpandirNota(txtEditNota);

    document.getElementById('edit-prioridad-select').value = itemSeleccionadoContexto.prioridad || 'Normal';
    modalEditarCompleto.style.display = 'flex';
}

function cerrarEditarCompleto() { modalEditarCompleto.style.display = 'none'; }

function guardarEdicionCompleta() {
    itemSeleccionadoContexto.nombre = document.getElementById('edit-nombre-input').value.trim();
    itemSeleccionadoContexto.nota = document.getElementById('edit-nota-input').value.trim();
    itemSeleccionadoContexto.prioridad = document.getElementById('edit-prioridad-select').value;
    
    localStorage.setItem('tareas_aula_organizada', JSON.stringify(tareas));
    cerrarEditarCompleto();
    cerrarDetalleItem();
    renderizarTodo();
}

function sonarAlarmaBeep() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 1.2);
    } catch (e) {}
}

function comprobarRecordatoriosAlarmas() {
    const ahora = new Date();
    let horas = ahora.getHours();
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    const ampm = horas >= 12 ? 'PM' : 'AM';
    horas = horas % 12;
    horas = horas ? horas : 12;
    const horaActual12 = `${String(horas).padStart(2, '0')}:${minutos} ${ampm}`;

    tareas.forEach(t => {
        if (t.hora12 === horaActual12 && correspondeTareaEnFecha(t, ahora)) {
            const keyNotif = `notif_${t.id}_${obtenerFechaString(ahora)}_${horaActual12}`;
            if (!sessionStorage.getItem(keyNotif)) {
                sessionStorage.setItem(keyNotif, 'true');

                if (t.tipoRecordatorio === 'alarma') {
                    sonarAlarmaBeep();
                    if ("vibrate" in navigator) navigator.vibrate([200, 100, 200, 100, 200]);
                    alert(`⏰ ALARMA: No te olvides de tu tarea "${t.nombre}" (${t.curso})`);
                } else {
                    if ("Notification" in window && Notification.permission === "granted") {
                        new Notification("AulaOrganizada", {
                            body: `No te olvides de tu tarea: ${t.nombre}`,
                            icon: "✨"
                        });
                    } else {
                        alert(`💬 Notificación: No te olvides de tu tarea "${t.nombre}"`);
                    }
                }
            }
        }
    });
}

// Perfil
btnAvatar.addEventListener('click', (e) => {
    e.stopPropagation();
    menuPerfil.style.display = menuPerfil.style.display === 'none' ? 'flex' : 'none';
});

document.addEventListener('click', () => menuPerfil.style.display = 'none');

formularioUsuario.addEventListener('submit', (e) => {
    e.preventDefault();
    perfilUsuario = {
        nombre: document.getElementById('nombre-usuario').value.trim(),
        correo: document.getElementById('correo-usuario').value.trim()
    };
    localStorage.setItem('perfil_aula_organizada', JSON.stringify(perfilUsuario));
    mostrarPantallaApp();
});

document.getElementById('btn-cambiar-usuario').addEventListener('click', () => { pantallaRegistro.style.display = 'flex'; });
document.getElementById('btn-borrar-cuenta').addEventListener('click', () => {
    if (confirm("¿Borrar cuenta y datos?")) {
        localStorage.clear();
        location.reload();
    }
});