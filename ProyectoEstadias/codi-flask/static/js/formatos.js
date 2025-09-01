document.getElementById('btnCopiar').addEventListener('click', function () {
    fetch('/copiar_doc')
        .then(response => response.json())
        .then(data => {
            if (data.texto) {
                navigator.clipboard.writeText(data.texto)
                    .then(() => {
                        alert("Contenido copiado al portapapeles.");
                    })
                    .catch(err => {
                        alert("No se pudo copiar el contenido.");
                        console.error(err);
                    });
            } else if (data.error) {
                alert("Error: " + data.error);
            }
        })
        .catch(error => {
            alert("Error al conectar con el servidor.");
            console.error(error);
        });
});
