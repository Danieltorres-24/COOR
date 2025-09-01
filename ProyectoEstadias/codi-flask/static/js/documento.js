let currentFolioId = null;
let currentFolioData = null;
let currentBorradorData = null;
let destinatariosSeleccionados = [];

document.addEventListener('DOMContentLoaded', function() {
    currentFolioId = folioId;
    currentFolioData = folioData;
    currentBorradorData = borradorData;

    if (!currentFolioId || !currentFolioData) {
        alert('No se ha especificado un folio válido');
        window.location.href = '/folios';
        return;
    }

    // Inicializar selects
    const areaSelect = document.getElementById('area');
    const unidadSelect = document.getElementById('unidad');

    if (areaSelect && areas) {
        areaSelect.innerHTML = '<option value="">Selecciona un área</option>';
        areas.forEach(area => {
            const opt = document.createElement('option');
            opt.value = area.IdArea;
            opt.textContent = area.nombre;
            opt.setAttribute('data-ui', area.UI);
            opt.setAttribute('data-cc', area.CC);
            areaSelect.appendChild(opt);
        });
    }

    if (unidadSelect && unidades) {
        unidadSelect.innerHTML = '<option value="">Selecciona una unidad</option>';
        unidades.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.id;
            opt.textContent = u.nombre;
            unidadSelect.appendChild(opt);
        });
    }

    // Botones
    document.getElementById('preview-btn')?.addEventListener('click', generatePreview);
    document.getElementById('generate-btn')?.addEventListener('click', generateWordDocument);
    document.getElementById('save-btn')?.addEventListener('click', saveDraft);
    document.getElementById('cancel-btn')?.addEventListener('click', () => window.location.href='/folios');

    // Eventos de selects e inputs
    areaSelect?.addEventListener('change', generatePreview);
    unidadSelect?.addEventListener('change', generatePreview);
    ['asunto','cuerpo','elaborador'].forEach(id => 
        document.getElementById(id)?.addEventListener('input', generatePreview)
    );

    // Cargar destinatarios
    loadDestinatarios();

    // Cargar borrador
    if (currentBorradorData?.destinatarios) {
        currentBorradorData.destinatarios.forEach(d => agregarDestinatario(d.id, d.nombre, d.cargo));
    }

    // Vista previa inicial
    setTimeout(generatePreview, 500);
});

// -------------------- DESTINATARIOS --------------------
function loadDestinatarios() {
    fetch('/api/destinatarios')
        .then(res => res.json())
        .then(data => populateDestinatarios(data.destinatarios))
        .catch(err => console.error('Error cargando destinatarios:', err));
}

function populateDestinatarios(destinatarios) {
    const select = document.getElementById('destinatario');
    if (!select) return;
    select.innerHTML = '';
    destinatarios.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = `${d.nombre} - ${d.cargo}`;
        opt.setAttribute('data-nombre', d.nombre);
        opt.setAttribute('data-cargo', d.cargo);
        select.appendChild(opt);
    });
    select.addEventListener('change', manejarSeleccionDestinatarios);
}

function manejarSeleccionDestinatarios() {
    const select = document.getElementById('destinatario');
    Array.from(select.selectedOptions).forEach(opt => {
        const id = opt.value;
        const nombre = opt.getAttribute('data-nombre');
        const cargo = opt.getAttribute('data-cargo');
        if (!destinatariosSeleccionados.some(d => d.id === id)) {
            destinatariosSeleccionados.push({id, nombre, cargo});
        }
    });
    actualizarChipsDestinatarios();
    generatePreview();
}

function agregarDestinatario(id, nombre, cargo) {
    if (!destinatariosSeleccionados.some(d => d.id === id)) {
        destinatariosSeleccionados.push({id, nombre, cargo});
        actualizarChipsDestinatarios();
    }
}

function actualizarChipsDestinatarios() {
    const cont = document.getElementById('destinatariosSeleccionados');
    if (!cont) return;
    cont.innerHTML = '';
    destinatariosSeleccionados.forEach(d => {
        const div = document.createElement('div');
        div.className = 'destinatario-chip';
        div.innerHTML = `<span>${d.nombre} - ${d.cargo}</span> <button data-id="${d.id}">×</button>`;
        cont.appendChild(div);
        div.querySelector('button').addEventListener('click', () => quitarDestinatario(d.id));
    });
}

function quitarDestinatario(id) {
    destinatariosSeleccionados = destinatariosSeleccionados.filter(d => d.id !== id);
    actualizarChipsDestinatarios();
    generatePreview();
}

// -------------------- VISTA PREVIA --------------------
function generatePreview() {
    const asunto = document.getElementById('asunto').value;
    const cuerpo = document.getElementById('cuerpo').value;
    const elaborador = document.getElementById('elaborador').value;

    const areaSelect = document.getElementById('area');
    const unidadSelect = document.getElementById('unidad');

    const areaNombre = areaSelect?.selectedOptions[0]?.text || '';
    const unidadNombre = unidadSelect?.selectedOptions[0]?.text || '';
    const ui = areaSelect?.selectedOptions[0]?.getAttribute('data-ui') || '';
    const cc = areaSelect?.selectedOptions[0]?.getAttribute('data-cc') || '';

    const folioNumero = currentFolioData.numero || '----';
    const numeroCompleto = `${ui}/${cc}/${folioNumero}`;
    const fechaActual = new Date().toLocaleDateString('es-ES', { day:'2-digit', month:'long', year:'numeric' });

    let destinatariosHTML = '';
    if (destinatariosSeleccionados.length > 0) {
        destinatariosHTML = destinatariosSeleccionados.map(d => `<div>${d.nombre}</div><div>${d.cargo}</div>`).join('');
        destinatariosHTML += '<div><strong>PRESENTE.</strong></div>';
    } else {
        destinatariosHTML = '<div>Por favor seleccione al menos un destinatario</div>';
    }

    const previewHTML = `
        <div><strong>Of. N° ${numeroCompleto}</strong></div>
        <div>Acapulco de Juárez, Gro., a ${fechaActual}</div>
        <div><strong>Unidad:</strong> ${unidadNombre}</div>
        <div><strong>Área:</strong> ${areaNombre}</div>
        
        <div>${destinatariosHTML}</div>
        <p><strong>${asunto}</strong></p>
        <p>${cuerpo.replace(/\n/g,'</p><p>')}</p>
        <p>Sin más por el momento, reciba un cordial saludo.</p>
        <div><strong>Atentamente,</strong></div>
        <div>Ing. Javier Alfonso Endañu Zapi</div>
        <div>Titular de la Coordinación de Informática</div>
        <div>Elaboró: ${elaborador}</div>
    `;
    document.getElementById('preview-content').innerHTML = previewHTML;
}

// -------------------- GENERAR WORD --------------------
async function generateWordDocument() {
    if (destinatariosSeleccionados.length === 0) { alert('Seleccione al menos un destinatario'); return; }

    const formData = {
        folio_id: currentFolioId,
        destinatarios: destinatariosSeleccionados,
        asunto: document.getElementById('asunto').value,
        cuerpo: document.getElementById('cuerpo').value,
        elaborador: document.getElementById('elaborador').value,
        ui: document.getElementById('area').selectedOptions[0]?.getAttribute('data-ui') || '',
        cc: document.getElementById('area').selectedOptions[0]?.getAttribute('data-cc') || '',
        unidad_id: document.getElementById('unidad').value,
        unidad_nombre: document.getElementById('unidad').selectedOptions[0]?.text || ''
    };

    const res = await fetch('/generar_documento', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(formData)
    });

    if (!res.ok) {
        const err = await res.json();
        alert('Error al generar documento: ' + err.error);
        return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Oficio_${currentFolioData.numero.replace(/[\/\-]/g,'_')}.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    alert('Documento descargado correctamente');
}

// -------------------- GUARDAR BORRADOR --------------------
async function saveDraft() {
    const formData = {
        folio_id: currentFolioId,
        destinatarios: destinatariosSeleccionados,
        asunto: document.getElementById('asunto').value,
        cuerpo: document.getElementById('cuerpo').value,
        unidad_id: document.getElementById('unidad').value
    };

    const res = await fetch('/api/guardar_borrador', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(formData)
    });

    if (res.ok) alert('Borrador guardado correctamente');
    else alert('Error al guardar borrador');
}



// Alerts
function showAlert(message, type) {
    document.querySelectorAll('.alert').forEach(alert => alert.remove());
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.innerHTML = message;
    alert.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 20px; border-radius: 8px;
        color: white; font-weight: 500; z-index: 10000; animation: slideIn 0.3s ease; max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    if (type === 'error') alert.style.background = '#e74c3c';
    else if (type === 'success') alert.style.background = '#27ae60';
    else alert.style.background = '#3498db';
    document.body.appendChild(alert);
    setTimeout(() => { alert.style.animation = 'slideOut 0.3s ease'; setTimeout(() => { if (alert.parentNode) alert.parentNode.removeChild(alert); }, 300); }, 4000);
}

// Estilos animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity:1; } to { transform: translateX(100%); opacity:0; } }
    .btn:disabled { opacity:0.6; cursor:not-allowed; transform:none !important; }
`;
document.head.appendChild(style);
