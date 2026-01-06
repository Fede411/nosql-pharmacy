


const consumos_acumulados = require('../models/consumos_acumulados');


exports.filterDosisByNombreMedicamento = async function (nombre_medicamento, sDate, fDate) {
    try {
        const nombreMedicamento = await consumos_acumulados.aggregate([
            {
                $match: {
                    "nombre_medicamento": { $regex: nombre_medicamento, $options: 'i' },
                    "fecha": { $gte: new Date(sDate), $lte: new Date(fDate) }
                }
            },
            {
                $group: {
                    _id: "$nombre_medicamento",
                    sumaMedicamento: { $sum: "$unidades_totales" }
                }
            }
        ]);
        console.log("Parametros recibidos:", { nombreMedicamento });
        return nombreMedicamento;
    } catch (error) {
        console.error('Error en filterDosisByNombreMedicamento:', error);
        throw error;
    }
}

exports.filterDosisByNombreMedicamentoAndIdPaciente = async function (nombre_medicamento, paciente_id, sDate, fDate) {
    try {
        console.log("Parametros recibidos:", { nombre_medicamento, paciente_id, sDate, fDate })
        const nombreMedicamento = await consumos_acumulados.aggregate([
            {
                $match: {
                    "nombre_medicamento": { $regex: nombre_medicamento, $options: 'i' },
                    "paciente_id": { $regex: paciente_id, $options: 'i' },
                    "fecha": { $gte: new Date(sDate), $lte: new Date(fDate) }
                }
            },
            {
                $group: {
                    _id: "$nombre_medicamento",
                    sumaMedicamento: { $sum: "$unidades_totales" }
                }
            }
        ]);
        console.log("Parametros recibidos:", { nombreMedicamento });
        return nombreMedicamento;
    } catch (error) {
        console.error('Error en filterDosisByNombreMedicamento:', error);
        throw error;
    }
}