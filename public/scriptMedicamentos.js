document.addEventListener("DOMContentLoaded", function () {
    // guard to avoid multiple fetches if this script is included more than once on the page
    if (window._medicamentosLoaded) return;
    window._medicamentosLoaded = true;

    fetch('/medicamentos')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Suponiendo que data es un array de objetos con el campo 'nombre_medicamento'
            const uniqueMedicamentos = [...new Set(data.map(item => item.nombre_medicamento))];
            const datalist = document.getElementById('optionsMedicamentos');

            if (!datalist) return; // no datalist present on this page

            uniqueMedicamentos.forEach(medicamento => {
                if (!Array.from(datalist.options).some(option => option.value === medicamento)) {
                    const option = document.createElement('option');
                    option.value = medicamento;
                    datalist.appendChild(option);
                }
            });
        })
        .catch(error => console.error('Error al cargar los medicamentos:', error));
});
