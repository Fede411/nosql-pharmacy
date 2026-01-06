document.addEventListener("DOMContentLoaded", function () {
    // guard to avoid multiple fetches if this script is included multiple times
    if (window._principiosActivosLoaded) return;
    window._principiosActivosLoaded = true;

    fetch('/principios_activos')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (!data || data.length === 0) {
                console.warn('No se encontraron principios activos.');
                return;
            }

            const uniquePrincipiosActivos = [...new Set(data)];
            const datalist = document.getElementById('optionsPrincipiosActivos');

            if (!datalist) return; // no datalist on this page

            uniquePrincipiosActivos.forEach(principio => {
                if (!Array.from(datalist.options).some(option => option.value === principio)) {
                    const option = document.createElement('option');
                    option.value = principio;
                    datalist.appendChild(option);
                }
            });
        })
        .catch(error => console.error('Error al cargar los principios activos:', error));
});


