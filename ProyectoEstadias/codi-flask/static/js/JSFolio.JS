document.addEventListener('DOMContentLoaded', function() {
    const numeroInput = document.getElementById('numeroInput');
    const dirigidoInput = document.getElementById('dirigidoInput');
    const asuntoInput = document.getElementById('asuntoInput');
    const tipoRadios = document.getElementsByName('tipo');
    const agregarBtn = document.getElementById('agregarBtn');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const tableBody = document.getElementById('tableBody');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');

    let currentPage = 1;
    let totalPages = 1;
    let currentEditId = null;
    let currentSearchTerm = '';
    let currentYear = new Date().getFullYear();
    let currentSiglas = 'DS'; 
    const registrosPorPagina = 5; 

    agregarBtn.addEventListener('click', addFolio);
    searchForm.addEventListener('submit', handleSearch);
    prevBtn.addEventListener('click', goToPrevPage);
    nextBtn.addEventListener('click', goToNextPage);

    loadFolios();

    async function loadFolios() {
        try {
            const response = await fetch(`/api/folios?page=${currentPage}&per_page=${registrosPorPagina}&search=${currentSearchTerm}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error al cargar folios');
            }

            renderFolios(data.folios);
            updatePagination(data.totalPages);
        } catch (error) {
            console.error('Error:', error);
            showAlert(error.message, 'error');
        }
    }

    function renderFolios(folios) {
        tableBody.innerHTML = '';
        
        if (folios.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="no-data">No hay folios registrados</td></tr>';
            return;
        }
        
        folios.forEach(folio => {
            const row = document.createElement('tr');
            row.setAttribute('data-id', folio.id);
            row.innerHTML = `
                <td class="numero-cell">${folio.numero}</td>
                <td class="dirigido-cell">${folio.dirigido}</td>
                <td class="asunto-cell">${folio.asunto}</td>
                <td class="tipo-cell">${folio.tipo === 'interno' ? 'Interno' : 'Externo'}</td>
                <td class="actions">
                    <button type="button" class="icon-btn edit-btn" title="Editar">
                        <img src="https://cdn-icons-png.flaticon.com/128/8188/8188360.png" alt="Editar">
                    </button>
                    <button type="button" class="icon-btn delete-btn" title="Eliminar">
                        <img src="https://cdn-icons-png.flaticon.com/128/3221/3221897.png" alt="Eliminar">
                    </button>
                </td>
                <td class="document-cell">
                <button type="button" class="icon-btn doc-btn" title="Ver Documento">
                    <img src="https://cdn-icons-png.flaticon.com/128/2991/2991108.png" alt="Documento">
                </button>
            </td>
            `;
            tableBody.appendChild(row);
            
            row.querySelector('.edit-btn').addEventListener('click', () => startEditing(row, folio.id));
            row.querySelector('.delete-btn').addEventListener('click', () => deleteFolio(folio.id));
             row.querySelector('.doc-btn').addEventListener('click', () => goToDocumento(folio.id));
        });
    }

    async function addFolio() {
        const dirigido = dirigidoInput.value.trim();
        const asunto = asuntoInput.value.trim();
        const tipo = document.querySelector('input[name="tipo"]:checked').value;
        
        if (!dirigido || !asunto) {
            showAlert('Por favor complete todos los campos', 'error');
            return;
        }
        
        try {
            const response = await fetch(`/api/folios/next-number?tipo=${tipo}&year=${currentYear}&siglas=${currentSiglas}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error al obtener el próximo número');
            }
            
            const numeroFolio = `${currentSiglas}-${String(data.nextNumber).padStart(4, '0')}/${currentYear}`;
            
            const createResponse = await fetch('/api/folios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    numero: numeroFolio,
                    dirigido, 
                    asunto, 
                    tipo
                }),
            });
            
            if (!createResponse.ok) {
                const errorData = await createResponse.json();
                throw new Error(errorData.error || 'Error al agregar folio');
            }
            
            showAlert('Folio agregado correctamente', 'success');
            dirigidoInput.value = '';
            asuntoInput.value = '';
            loadFolios();
        } catch (error) {
            console.error('Error:', error);
            showAlert(error.message, 'error');
        }
    }

    function handleSearch(e) {
        e.preventDefault();
        currentSearchTerm = searchInput.value.trim();
        currentPage = 1;
        loadFolios();
    }

    function startEditing(row, id) {
        if (currentEditId && currentEditId !== id) {
            const previousEditRow = document.querySelector(`tr[data-id="${currentEditId}"]`);
            if (previousEditRow) cancelEdit(previousEditRow, currentEditId);
        }
        
        currentEditId = id;
        
        const numero = row.querySelector('.numero-cell').textContent;
        const dirigido = row.querySelector('.dirigido-cell').textContent;
        const asunto = row.querySelector('.asunto-cell').textContent;
        const tipo = row.querySelector('.tipo-cell').textContent.toLowerCase();
        
        row.querySelector('.numero-cell').innerHTML = `
            <input type="text" class="edit-input" value="${numero}" data-field="numero" disabled>
        `;
        row.querySelector('.dirigido-cell').innerHTML = `
            <input type="text" class="edit-input" value="${dirigido}" data-field="dirigido">
        `;
        row.querySelector('.asunto-cell').innerHTML = `
            <input type="text" class="edit-input" value="${asunto}" data-field="asunto">
        `;
        row.querySelector('.tipo-cell').innerHTML = `
            <select class="edit-select" data-field="tipo">
                <option value="interno" ${tipo === 'interno' ? 'selected' : ''}>Interno</option>
                <option value="externo" ${tipo === 'externo' ? 'selected' : ''}>Externo</option>
            </select>
        `;
        
        row.querySelector('.actions').innerHTML = `
            <button type="button" class="icon-btn save-btn" title="Guardar">
                <img src="https://cdn-icons-png.flaticon.com/128/5667/5667029.png" alt="Guardar">
            </button>
            <button type="button" class="icon-btn cancel-btn" title="Cancelar">
                <img src="https://cdn-icons-png.flaticon.com/128/753/753345.png" alt="Cancelar">
            </button>
        `;
        
        row.querySelector('.edit-input').focus();
        
        row.querySelector('.save-btn').addEventListener('click', () => saveEdit(row, id));
        row.querySelector('.cancel-btn').addEventListener('click', () => cancelEdit(row, id));
    }

    async function saveEdit(row, id) {
        const inputs = row.querySelectorAll('.edit-input, .edit-select');
        const updatedData = {};
        
        inputs.forEach(input => {
            const field = input.getAttribute('data-field');
            updatedData[field] = input.value;
        });
        
        try {
            const response = await fetch(`/api/folios/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al actualizar folio');
            }
            
            showAlert('Folio actualizado correctamente', 'success');
            currentEditId = null;
            loadFolios();
        } catch (error) {
            console.error('Error:', error);
            showAlert(error.message, 'error');
        }
    }

    function cancelEdit(row, id) {
        currentEditId = null;
        loadFolios();
    }

    async function deleteFolio(id) {
        if (!confirm('¿Está seguro que desea eliminar este folio?')) return;
        
        try {
            const response = await fetch(`/api/folios/${id}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al eliminar folio');
            }
            
            showAlert('Folio eliminado correctamente', 'success');
            loadFolios();
        } catch (error) {
            console.error('Error:', error);
            showAlert(error.message, 'error');
        }
    }


    function updatePagination(total) {
        totalPages = total;
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages || totalPages === 0;
        pageInfo.textContent = totalPages > 0 ? `Página ${currentPage} de ${totalPages}` : 'No hay resultados';
    }

    function goToPrevPage() {
        if (currentPage > 1) {
            currentPage--;
            loadFolios();
        }
    }

    function goToNextPage() {
        if (currentPage < totalPages) {
            currentPage++;
            loadFolios();
        }
    }

    function goToDocumento(folioId) {
    console.log('Redirigiendo a documento con ID:', folioId);
    window.location.href = `/documento?folio_id=${folioId}`;
    }

    function showAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert ${type}`;
        alert.textContent = message;
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.remove();
        }, 3000);
    }
});
