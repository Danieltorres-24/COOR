// Variables globales
let documentosEnvio = [];
let documentosArea = [];
let paginaActualEnvio = 1;
let paginaActualArea = 1;
const registrosPorPagina = 5;
let documentoEditando = null;
let pdfDoc = null;
let pdfPaginaActual = 1;
let pdfEscala = 1.2; 

// Inicialización cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Configurar fecha automática
    const fechaInput = document.getElementById('fechaEnvio');
    const hoy = new Date();
    fechaInput.value = hoy.toISOString().split('T')[0];
    
    // Cargar datos de ejemplo (en un caso real, estos vendrían del servidor)
    cargarDatosEjemplo();
    
    // Renderizar tablas
    renderizarTablaEnvio();
    renderizarTablaArea();
});

// Función para guardar un nuevo documento
function guardarNuevoDocumento() {
    const numero = document.getElementById('numeroDocumento').value;
    const area = document.getElementById('areaDocumento').value;
    const descripcion = document.getElementById('descripcionDocumento').value;
    const fecha = document.getElementById('fechaEnvio').value;
    const archivo = document.getElementById('archivoEnvio').files[0];
    
    if (!numero || !area || !descripcion || !fecha) {
        alert('Por favor, complete todos los campos obligatorios');
        return;
    }
    
    // Crear nuevo documento
    const nuevoDocumento = {
        id: documentosEnvio.length > 0 ? Math.max(...documentosEnvio.map(d => d.id)) + 1 : 1,
        numero: numero,
        area: area,
        descripcion: descripcion,
        fecha: fecha,
        archivo: archivo
    };
    
    // Agregar a la lista
    documentosEnvio.unshift(nuevoDocumento);
    
    // Limpiar formulario
    limpiarFormulario();
    
    // Actualizar tabla
    renderizarTablaEnvio();
    
    alert('Documento guardado correctamente');
}

// Función para limpiar el formulario
function limpiarFormulario() {
    document.getElementById('numeroDocumento').value = '';
    document.getElementById('areaDocumento').value = '';
    document.getElementById('descripcionDocumento').value = '';
    const fechaInput = document.getElementById('fechaEnvio');
    const hoy = new Date();
    fechaInput.value = hoy.toISOString().split('T')[0];
    document.getElementById('archivoEnvio').value = '';
}

// Función para renderizar la tabla de envío
function renderizarTablaEnvio() {
    const tbody = document.querySelector('#tablaEnvioDocumentos tbody');
    const filaNuevoDocumento = document.getElementById('filaNuevoDocumento');
    
    // Limpiar tabla (excepto la fila de nuevo documento)
    while (tbody.firstChild) {
        if (tbody.firstChild === filaNuevoDocumento) {
            break;
        }
        tbody.removeChild(tbody.firstChild);
    }
    
    // Calcular índices para la paginación
    const inicio = (paginaActualEnvio - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    const documentosPagina = documentosEnvio.slice(inicio, fin);
    
    // Agregar documentos a la tabla
    documentosPagina.forEach(documento => {
        const tr = document.createElement('tr');
        
        if (documentoEditando === documento.id) {
            // Modo edición
            tr.innerHTML = `
                <td><input type="text" value="${documento.numero}" id="editNumero-${documento.id}"></td>
                <td><input type="text" value="${documento.area}" id="editArea-${documento.id}"></td>
                <td><input type="text" value="${documento.descripcion}" id="editDescripcion-${documento.id}"></td>
                <td><input type="date" value="${documento.fecha}" id="editFecha-${documento.id}"></td>
                <td><input type="file" id="editArchivo-${documento.id}" accept=".pdf"></td>
                <td class="acciones">
                    <button onclick="guardarEdicion(${documento.id})" title="Guardar"><i class="fas fa-save"></i></button>
                    <button onclick="cancelarEdicion()" title="Cancelar"><i class="fas fa-times"></i></button>
                </td>
            `;
        } else {
            // Modo visualización
            tr.innerHTML = `
                <td>${documento.numero}</td>
                <td>${documento.area}</td>
                <td>${documento.descripcion}</td>
                <td>${documento.fecha}</td>
                <td>${documento.archivo ? documento.archivo.name : 'Sin archivo'}</td>
                <td class="acciones">
                    <button onclick="editarDocumento(${documento.id})" title="Editar"><i class="fas fa-edit"></i></button>
                    <button onclick="eliminarDocumento(${documento.id})" title="Eliminar"><i class="fas fa-trash"></i></button>
                </td>
            `;
        }
        
        tbody.insertBefore(tr, filaNuevoDocumento);
    });
    
    // Actualizar paginación
    actualizarPaginacion('envio');
}

// Función para renderizar la tabla de área
function renderizarTablaArea() {
    const tbody = document.querySelector('#tablaDocumentosArea tbody');
    
    // Limpiar tabla
    tbody.innerHTML = '';
    
    // Calcular índices para la paginación
    const inicio = (paginaActualArea - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    const documentosPagina = documentosArea.slice(inicio, fin);
    
    // Agregar documentos a la tabla
    documentosPagina.forEach(documento => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${documento.folio}</td>
            <td>${documento.documento}</td>
            <td>${documento.remitente}</td>
            <td class="acciones">
                <button onclick="verDocumento(${documento.id})" title="Ver"><i class="fas fa-eye"></i></button>
                <button onclick="descargarDocumento(${documento.id})" title="Descargar"><i class="fas fa-download"></i></button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // Actualizar paginación
    actualizarPaginacion('area');
}

// Función para cargar datos de la tabla desde la base de datos
function cargarEntradas() {
    fetch('/api/entradas')
        .then(response => response.json())
        .then(data => {
            documentosEnvio = data; // Reemplaza los datos actuales
            renderizarTablaEnvio(); // Renderiza la primera tabla
        })
        .catch(error => console.error('Error al cargar entradas:', error));
}

// Llamar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarEntradas();
});

// Cargar documentos desde la base de datos
function cargarDocumentosDesdeBD() {
    fetch('/api/documentos')
        .then(res => res.json())
        .then(data => {
            documentosEnvio = data; // Sobreescribe el arreglo local
            renderizarTablaEnvio(); // Renderiza la tabla con los datos de la BD
        })
        .catch(err => console.error('Error al cargar documentos:', err));
}
document.addEventListener('DOMContentLoaded', function() {
    const fechaInput = document.getElementById('fechaEnvio');
    const hoy = new Date();
    fechaInput.value = hoy.toISOString().split('T')[0];
    
    // Cargar datos de la base de datos
    cargarDocumentosDesdeBD();
});


// Función para actualizar la paginación
function actualizarPaginacion(tabla) {
    let totalPaginas, paginaActual, elementInfo, prevBtn, nextBtn, datos;
    
    if (tabla === 'envio') {
        totalPaginas = Math.ceil(documentosEnvio.length / registrosPorPagina);
        paginaActual = paginaActualEnvio;
        elementInfo = document.getElementById('pageInfoEnvio');
        prevBtn = document.getElementById('prevBtnEnvio');
        nextBtn = document.getElementById('nextBtnEnvio');
        datos = documentosEnvio;
    } else {
        totalPaginas = Math.ceil(documentosArea.length / registrosPorPagina);
        paginaActual = paginaActualArea;
        elementInfo = document.getElementById('pageInfoArea');
        prevBtn = document.getElementById('prevBtnArea');
        nextBtn = document.getElementById('nextBtnArea');
        datos = documentosArea;
    }
    
    // Actualizar información de página
    elementInfo.textContent = `Página ${paginaActual} de ${totalPaginas}`;
    
    // Habilitar/deshabilitar botones
    prevBtn.disabled = paginaActual === 1;
    nextBtn.disabled = paginaActual === totalPaginas || datos.length === 0;
}

// Función para cambiar de página
function cambiarPagina(tabla, direccion) {
    let totalPaginas;
    
    if (tabla === 'envio') {
        totalPaginas = Math.ceil(documentosEnvio.length / registrosPorPagina);
        paginaActualEnvio += direccion;
        
        // Asegurarse de que esté dentro de los límites
        if (paginaActualEnvio < 1) paginaActualEnvio = 1;
        if (paginaActualEnvio > totalPaginas) paginaActualEnvio = totalPaginas;
        
        renderizarTablaEnvio();
    } else {
        totalPaginas = Math.ceil(documentosArea.length / registrosPorPagina);
        paginaActualArea += direccion;
        
        // Asegurarse de que esté dentro de los límites
        if (paginaActualArea < 1) paginaActualArea = 1;
        if (paginaActualArea > totalPaginas) paginaActualArea = totalPaginas;
        
        renderizarTablaArea();
    }
}

// Función para editar un documento
function editarDocumento(id) {
    documentoEditando = id;
    renderizarTablaEnvio();
}

// Función para guardar la edición de un documento
function guardarEdicion(id) {
    const documentoIndex = documentosEnvio.findIndex(d => d.id === id);
    
    if (documentoIndex !== -1) {
        // Obtener valores editados
        const nuevoNumero = document.getElementById(`editNumero-${id}`).value;
        const nuevaArea = document.getElementById(`editArea-${id}`).value;
        const nuevaDescripcion = document.getElementById(`editDescripcion-${id}`).value;
        const nuevaFecha = document.getElementById(`editFecha-${id}`).value;
        const nuevoArchivo = document.getElementById(`editArchivo-${id}`).files[0];
        
        // Validar campos
        if (!nuevoNumero || !nuevaArea || !nuevaDescripcion || !nuevaFecha) {
            alert('Por favor, complete todos los campos obligatorios');
            return;
        }
        
        // Actualizar documento
        documentosEnvio[documentoIndex] = {
            ...documentosEnvio[documentoIndex],
            numero: nuevoNumero,
            area: nuevaArea,
            descripcion: nuevaDescripcion,
            fecha: nuevaFecha,
            archivo: nuevoArchivo || documentosEnvio[documentoIndex].archivo
        };
        
        // Salir del modo edición
        documentoEditando = null;
        
        // Actualizar tabla
        renderizarTablaEnvio();
        
        alert('Cambios guardados correctamente');
    }
}

// Función para cancelar la edición
function cancelarEdicion() {
    documentoEditando = null;
    renderizarTablaEnvio();
}

// Función para eliminar un documento
function eliminarDocumento(id) {
    if (confirm('¿Está seguro de que desea eliminar este documento?')) {
        documentosEnvio = documentosEnvio.filter(d => d.id !== id);
        
        // Ajustar la página actual si es necesario
        const totalPaginas = Math.ceil(documentosEnvio.length / registrosPorPagina);
        if (paginaActualEnvio > totalPaginas && totalPaginas > 0) {
            paginaActualEnvio = totalPaginas;
        } else if (totalPaginas === 0) {
            paginaActualEnvio = 1;
        }
        
        renderizarTablaEnvio();
        alert('Documento eliminado correctamente');
    }
}
fetch('/guardar_documento', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ numero, area, descripcion })
})
.then(res => res.json())
.then(data => {
    if(data.success){
        alert('Documento guardado correctamente');
        limpiarFormulario();
        // Aquí puedes volver a cargar la tabla desde el servidor
    } else {
        alert('Error: ' + data.message);
    }
});


// Función para ver un documento (simulada)
function verDocumento(id) {
    alert(`Viendo documento con ID: ${id}`);
    // En una implementación real, aquí se abriría el visor de PDF
}

// Función para descargar un documento (simulada)
function descargarDocumento(id) {
    alert(`Descargando documento con ID: ${id}`);
    // En una implementación real, aquí se descargaría el archivo
}

// Funciones para el visor de PDF (simuladas)
function pdfPrevPage() {
    alert('Navegando a página anterior del PDF');
}

function pdfNextPage() {
    alert('Navegando a página siguiente del PDF');
}

function pdfZoomOut() {
    alert('Alejando vista del PDF');
}

function pdfZoomIn() {
    alert('Acercando vista del PDF');
}

function pdfPrint() {
    alert('Imprimiendo PDF');
}

function pdfDownload() {
    alert('Descargando PDF');
}

function closePdfViewer() {
    alert('Cerrando visor de PDF');
}
