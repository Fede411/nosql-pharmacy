const actuaciones = [
    "Imprimir RECETA",
    "Información al paciente: TSI OBLIGATORIA",
    "Información al paciente: PACIENTE DE OTRA CCAA",
    "PRM: Efectos adversos",
    "Información al paciente: MED. NUEVO (INICIO)",
    "PRM: Interacciones medicamentosas",
    "Información al paciente: NORMAS FUNCIONAMIENTO CONSULTA",
    "Seguimiento: AJUSTE DE MEDICACION",
    "ADHERENCIA (E. INFECCIOSAS)",
    "Información al paciente: ADMINISTRACIÓN Y/O RECONSTITUCIÓN",
    "Información al paciente: CONSERVACIÓN DE MEDICAMENTOS",
    "OTRAS ACTUACIONES",
    "PRM: ERRORES DE MEDICACIÓN QUE LLEGAN AL PACIENTE",
    "Seguimiento: PÉRDIDA DE MEDICACION/ROTURA",
    "ADHERENCIA (GASTRO)",
    "Imprimir FACTURA PROVISIONAL",
    "ADHERENCIA (PEDIATRIA)",
    "ADHERENCIA (NEUROLOGIA)",
    "Información al paciente: CITA",
    "Autorización: UFI NO TRAMITADO",
    "ADHERENCIA (REUMATOLOGIA)",
    "Validación: ADAPTAR ESPECIALIDAD/DOSIS",
    "Validación: INDICACION EN INICIO DE TRATAMIENTO",
    "Autorización: COMPROBADOS DATOS MEDICOS EN WEB SERMAS",
    "Validación: ACTUALIZACIÓN DATOS CLÍNICOS",
    "ADHERENCIA (OTROS SERVICIOS)",
    "Imprimir JUSTIFICANTE DE ASISTENCIA",
    "PRM: Características personales",
    "PRM: Conservación inadecuada",
    "PRM: Contraindicación",
    "PRM: Dosis/pauta/duración no adecuada",
    "PRM: Duplicidad",
    "PRM: Error de administración",
    "PRM: Error de dispensación",
    "PRM: Error de prescripción",
    "PRM: Otros",
    "PRM: Otros problemas de salud que afectan al tratamiento",
    "PRM: Problema de salud insuficientemente tratado",
    "Autorización: PROTOCOLO HORMONA DE CRECIMIENTO",
    "INFORMACIÓN UAF-PEX",
    "Información al paciente: SIN RECETA",
    "ADHERENCIA (HEMATOLOGÍA)",
    "Seguimiento: FARMACOTERAPÉUTICO/CLÍNICO",
    "Validación: CLARIFICACIÓN DE LA PRESCRIPCIÓN",
    "Validación: CONCILIACION DE TTO PRESENCIAL O TLF",
    "ADHERENCIA (ONCOLOGÍA)",
    "ADHERENCIA (DERMATOLOGÍA)",
    "Validación: CHEQUEO de INTERACCIONES en el tratamiento",
    "FELICITACIÓN VERBAL O ESCRITA",
    "PACIENTE INCLUIDO EN ESTUDIO FARMACIA",
    "Validación: CONCILIACION DE TTO NO PRESENCIAL (HORUS)",
    "Seguimiento: REVISIÓN CON EL FARMACÉUTICO",
    "Autorización: MEX NO TRAMITADO",
    "Autorización: MUC NO TRAMITADO",
    "Autorización: MAI NO TRAMITADO",
    "Información al paciente: MED. NUEVO (CAMBIO)",
    "Estratificación",
    "Seguimiento: TELEFÓNICO. REVISIÓN",
    "Información al paciente: TELEFÓNICO. NUEVO o CAMBIO",
    "ENVÍO A DOMICILIO: otorga consentimiento informado",
    "ADHERENCIA (ENDOCRINO)",
    "ADHERENCIA (NEUMO)",
    "Autorización: MEDICAMENTO EXTRANJERO",
    "Autorización: MEDICAMENTO USO COMPASIVO",
    "Autorización: MEDICAMENTO USO FUERA DE INDICACIÓN",
    "Autorización: MEDICAMENTO EN INDICACIÓN FT (MAI)",
    "Devolución medicación",
    "Seguimiento: REVISIÓN PENDIENTE",
    "RAM notificada",
    "Seguimiento presencial: Cambio de dosis/frecuencia",
    "Seguimiento telefónico: Cambio de dosis/frecuencia",
    "ADHERENCIA (NEFROLOGIA)"
];

// Función auxiliar para generar fecha aleatoria
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Función auxiliar para formatear hora
function randomHour() {
    const hour = Math.floor(Math.random() * 13) + 8; // 8-20h
    const minute = Math.floor(Math.random() * 60);
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

// Función para seleccionar actuación aleatoria con pesos realistas
function selectActuacion() {
    // Actuaciones más frecuentes tienen mayor probabilidad
    const frecuentes = [
        "Imprimir RECETA",
        "Información al paciente: MED. NUEVO (INICIO)",
        "Información al paciente: CITA",
        "Seguimiento: AJUSTE DE MEDICACION",
        "OTRAS ACTUACIONES"
    ];

    // 60% de probabilidad de ser una actuación frecuente
    if (Math.random() < 0.6) {
        return frecuentes[Math.floor(Math.random() * frecuentes.length)];
    }

    return actuaciones[Math.floor(Math.random() * actuaciones.length)];
}

// Función principal para generar datos
function generarDatosSinteticos(numPacientes = 50, minActuacionesPorPaciente = 1, maxActuacionesPorPaciente = 10) {
    const datos = [];
    const fechaInicio = new Date(2004, 0, 1); // 1 enero 2004
    const fechaFin = new Date(2024, 11, 31); // 31 diciembre 2024

    for (let i = 1; i <= numPacientes; i++) {
        const pacienteId = i.toString().padStart(6, '0'); // 000001, 000002, etc.
        const numActuaciones = Math.floor(Math.random() * (maxActuacionesPorPaciente - minActuacionesPorPaciente + 1)) + minActuacionesPorPaciente;

        // Generar fechas ordenadas para este paciente
        const fechasPaciente = [];
        for (let j = 0; j < numActuaciones; j++) {
            fechasPaciente.push(randomDate(fechaInicio, fechaFin));
        }
        fechasPaciente.sort((a, b) => a - b); // Ordenar cronológicamente

        // Crear actuaciones para este paciente
        for (let j = 0; j < numActuaciones; j++) {
            let actuacion = selectActuacion();

            // Lógica de dependencias: si es la primera actuación, más probable que sea de inicio
            if (j === 0 && Math.random() < 0.4) {
                actuacion = "Información al paciente: MED. NUEVO (INICIO)";
            }

            // Si ya tuvo un inicio, puede tener seguimientos
            if (j > 0 && Math.random() < 0.3) {
                const seguimientos = [
                    "Seguimiento: AJUSTE DE MEDICACION",
                    "Seguimiento: FARMACOTERAPÉUTICO/CLÍNICO",
                    "Seguimiento: REVISIÓN CON EL FARMACÉUTICO"
                ];
                actuacion = seguimientos[Math.floor(Math.random() * seguimientos.length)];
            }

            datos.push({
                paciente_id: pacienteId,
                actuacion: actuacion,
                fecha: fechasPaciente[j],
                hora: randomHour(),
                lin_observaciones: "" // Campo vacío de tipo string
            });
        }
    }

    return datos;
}

// Generar datos
const datosSinteticos = generarDatosSinteticos(50, 1, 10);

// Mostrar resultados
console.log("Total de registros generados:", datosSinteticos.length);
console.log("\nPrimeros 10 registros:");
console.table(datosSinteticos.slice(0, 10));

// Exportar como JSON
console.log("\n--- JSON para MongoDB ---");
console.log(JSON.stringify(datosSinteticos.slice(0, 5), null, 2));

// Estadísticas
const pacientesUnicos = new Set(datosSinteticos.map(d => d.paciente_id)).size;
const actuacionesPorTipo = {};
datosSinteticos.forEach(d => {
    actuacionesPorTipo[d.actuacion] = (actuacionesPorTipo[d.actuacion] || 0) + 1;
});

console.log("\n--- Estadísticas ---");
console.log("Pacientes únicos:", pacientesUnicos);
console.log("Actuaciones por tipo (top 10):");
const top10 = Object.entries(actuacionesPorTipo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
console.table(top10);

// Para exportar a archivo (en Node.js)
// const fs = require('fs');
// fs.writeFileSync('actuaciones.json', JSON.stringify(datosSinteticos, null, 2));

// Función para convertir a CSV
function exportarCSV(datos, nombreArchivo = 'actuaciones.csv') {
    const fs = require('fs');

    // Cabeceras
    const headers = 'paciente_id,actuacion,fecha,hora,lin_observaciones\n';

    // Filas
    const rows = datos.map(d => {
        const fecha = d.fecha.toISOString().split('T')[0]; // YYYY-MM-DD
        return `${d.paciente_id},"${d.actuacion}",${fecha},${d.hora},"${d.lin_observaciones}"`;
    }).join('\n');

    fs.writeFileSync(nombreArchivo, headers + rows);
    console.log(`✓ Archivo ${nombreArchivo} generado con ${datos.length} registros`);
}

// Generar y exportar
const datos = generarDatosSinteticos(50, 1, 10);
exportarCSV(datos);