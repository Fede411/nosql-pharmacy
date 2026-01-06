// controllers/estadisticas.js 

const actuaciones = require('../models/actuaciones');
const consumos_acumulados = require('../models/consumos_acumulados');
const dispensaciones = require('../models/dispensacion');
const pa_medicamento = require('../models/pa_medicamento');

// Helper to use teh GFH filter
const aplicarFiltroGFH = (query, gfh_ids) => {
    if (gfh_ids && gfh_ids.length > 0) {
        query['gfh_id'] = { $in: gfh_ids };
    }
    return query;
};

// Helper to convert ISO date string to DD/MM/YYYY format for database comparison
// Since dates in DB are stored as strings in DD/MM/YYYY format,
// we need to convert the ISO input dates to this format for string comparison
const convertToDBDateFormat = (isoDateStr) => {
    try {
        const date = new Date(isoDateStr);
        if (isNaN(date.getTime())) return null;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch {
        return null;
    }
};

exports.getPacientesPorPeriodo = async function (sDate, fDate, gfh_ids = null) {
    try {
        const startDateStr = convertToDBDateFormat(sDate);
        const endDateStr = convertToDBDateFormat(fDate);
        
        if (!startDateStr || !endDateStr) {
            throw new Error('Fechas inválidas proporcionadas');
        }

        let query = {
            "fecha_inicio": { $gte: startDateStr, $lte: endDateStr }
        };
        query = aplicarFiltroGFH(query, gfh_ids);

        const resultado = await dispensaciones.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        // Parse DD/MM/YYYY string to extract year and month
                        fecha: "$fecha_inicio"
                    },
                    total: { $sum: 1 },
                    pacientes_unicos: { $addToSet: "$paciente_id" }
                }
            },
            {
                $project: {
                    _id: 0,
                    periodo: "$_id.fecha",  // Keep as DD/MM/YYYY string; can be grouped by month
                    total_dispensaciones: "$total",
                    total_pacientes: { $size: "$pacientes_unicos" }
                }
            },
            { $sort: { periodo: 1 } }
        ]);

        return resultado;
    } catch (error) {
        console.error('Error en getPacientesPorPeriodo:', error);
        throw error;
    }
};

// Top drugs
exports.getTopMedicamentos = async function (sDate, fDate, limite = 10, gfh_ids = null) {
    try {
        if (limite <= 0) return [];

        const startDateStr = convertToDBDateFormat(sDate);
        const endDateStr = convertToDBDateFormat(fDate);
        
        if (!startDateStr || !endDateStr) {
            throw new Error('Fechas inválidas proporcionadas');
        }

        let query = {
            "fecha_inicio": { $gte: startDateStr, $lte: endDateStr }
        };
        query = aplicarFiltroGFH(query, gfh_ids);

        const resultado = await dispensaciones.aggregate([
            { $match: query },
            {
                $group: {
                    _id: "$nombre_medicamento",
                    total: { $sum: 1 },
                    pacientes: { $addToSet: "$paciente_id" }
                }
            },
            {
                $project: {
                    _id: 0,
                    medicamento: "$_id",
                    dispensaciones: "$total",
                    pacientes_unicos: { $size: "$pacientes" }
                }
            },
            { $sort: { dispensaciones: -1 } },
            { $limit: limite }
        ]);

        return resultado;
    } catch (error) {
        console.error('Error en getTopMedicamentos:', error);
        throw error;
    }
};

// Actuation by type
exports.getDistribucionActuaciones = async function (sDate, fDate) {
    try {
        // The actuaciones collection stores a CSV string in the field named 'paciente_id,actuacion,fecha,hora'
        // We need to extract the action and the date from that string and then filter by date
        const RAW_FIELD = 'paciente_id,actuacion,fecha,hora';
        const start = new Date(sDate);
        const end = new Date(fDate);

        const pipeline = [
            // project the raw field into a predictable name
            { $project: { raw: { $getField: { field: RAW_FIELD, input: '$$ROOT' } } } },
            // split the CSV into parts
            { $project: { parts: { $split: ["$raw", ","] } } },
            // extract action and date (action may be quoted)
            { $project: {
                actionRaw: { $trim: { input: { $arrayElemAt: ["$parts", 1] }, chars: '"' } },
                dateStr: { $arrayElemAt: ["$parts", 2] }
            } },
            // convert dateStr YYYY-MM-DD to Date
            { $addFields: { action: "$actionRaw", parsedDate: { $dateFromString: { dateString: "$dateStr", format: "%Y-%m-%d" } } } },
            // filter by provided range
            { $match: { parsedDate: { $gte: start, $lte: end } } },
            // group by action
            { $group: { _id: "$action", total: { $sum: 1 } } },
            { $project: { _id: 0, tipo: "$_id", cantidad: "$total" } },
            { $sort: { cantidad: -1 } }
        ];

        const resultado = await actuaciones.aggregate(pipeline);
        return resultado;
    } catch (error) {
        console.error('Error en getDistribucionActuaciones:', error);
        throw error;
    }
};

// Accumulated consumable of drugs in time
exports.getConsumoAcumulado = async function (medicamentos, sDate, fDate, gfh_ids = null) {
    try {
        let query = {
            "nombre_medicamento": { $in: medicamentos },
            "fecha": { $gte: new Date(sDate), $lte: new Date(fDate) }
        };
        query = aplicarFiltroGFH(query, gfh_ids);

        const resultado = await consumos_acumulados.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        medicamento: "$nombre_medicamento",
                        year: { $year: "$fecha" },
                        month: { $month: "$fecha" }
                    },
                    unidades: { $sum: "$unidades_totales" }
                }
            },
            {
                $project: {
                    _id: 0,
                    medicamento: "$_id.medicamento",
                    periodo: {
                        $concat: [
                            { $toString: "$_id.year" },
                            "-",
                            {
                                $cond: [
                                    { $lt: ["$_id.month", 10] },
                                    { $concat: ["0", { $toString: "$_id.month" }] },
                                    { $toString: "$_id.month" }
                                ]
                            }
                        ]
                    },
                    unidades: "$unidades"
                }
            },
            { $sort: { periodo: 1, medicamento: 1 } }
        ]);

        return resultado;
    } catch (error) {
        console.error('Error en getConsumoAcumulado:', error);
        throw error;
    }
};

// Comparative of patients Vs new patients
exports.getComparativaPacientes = async function (sDate, fDate, gfh_ids = null) {
    try {
        const startDateStr = convertToDBDateFormat(sDate);
        const endDateStr = convertToDBDateFormat(fDate);
        
        if (!startDateStr || !endDateStr) {
            throw new Error('Fechas inválidas proporcionadas');
        }

        let queryAnteriores = { "fecha_inicio": { $lt: startDateStr } };
        queryAnteriores = aplicarFiltroGFH(queryAnteriores, gfh_ids);

        const idsAnterioresResult = await dispensaciones.distinct('paciente_id', queryAnteriores);
        const idsPacAnteriores = new Set(idsAnterioresResult.map(id => id.toString()));

        let queryPeriodo = { "fecha_inicio": { $gte: startDateStr, $lte: endDateStr } };
        queryPeriodo = aplicarFiltroGFH(queryPeriodo, gfh_ids);

        const resultado = await dispensaciones.aggregate([
            { $match: queryPeriodo },
            {
                $group: {
                    _id: "$fecha_inicio",  // Group by date string directly
                    pacientes: { $addToSet: "$paciente_id" }
                }
            },
            {
                $project: {
                    _id: 0,
                    periodo: "$_id",
                    pacientes: "$pacientes"
                }
            },
            { $sort: { periodo: 1 } }
        ]);

        const resultadoFinal = resultado.map(r => {
            const total = r.pacientes.length;
            const nuevos = r.pacientes.filter(id => !idsPacAnteriores.has(id.toString())).length;
            return {
                periodo: r.periodo,
                total_pacientes: total,
                pacientes_nuevos: nuevos,
                pacientes_recurrentes: total - nuevos
            };
        });

        return resultadoFinal;
    } catch (error) {
        console.error('Error en getComparativaPacientes:', error);
        throw error;
    }
};

// Dispensations by GFH
exports.getDispensacionesPorGFH = async function (sDate, fDate, gfh_ids = null) {
    try {
        const startDateStr = convertToDBDateFormat(sDate);
        const endDateStr = convertToDBDateFormat(fDate);
        
        if (!startDateStr || !endDateStr) {
            throw new Error('Fechas inválidas proporcionadas');
        }

        let query = {
            "fecha_inicio": { $gte: startDateStr, $lte: endDateStr }
        };
        query = aplicarFiltroGFH(query, gfh_ids);

        const resultado = await dispensaciones.aggregate([
            { $match: query },
            {
                $group: {
                    _id: "$gfh_id",
                    total: { $sum: 1 },
                    pacientes: { $addToSet: "$paciente_id" }
                }
            },
            {
                $project: {
                    _id: 0,
                    gfh: "$_id",
                    dispensaciones: "$total",
                    pacientes_unicos: { $size: "$pacientes" }
                }
            },
            { $sort: { dispensaciones: -1 } }
        ]);

        return resultado;
    } catch (error) {
        console.error('Error en getDispensacionesPorGFH:', error);
        throw error;
    }
};

// Most used active principals
exports.getPrincipiosActivos = async function (sDate, fDate, gfh_ids = null) {
    try {
        const startDateStr = convertToDBDateFormat(sDate);
        const endDateStr = convertToDBDateFormat(fDate);
        if (!startDateStr || !endDateStr) throw new Error('Fechas inválidas proporcionadas');

        let query = {
            "fecha": { $gte: startDateStr, $lte: endDateStr }
        };
        query = aplicarFiltroGFH(query, gfh_ids);

        const resultado = await consumos_acumulados.aggregate([
            { $match: query },
            {
                $group: {
                    _id: "$principio_activo_descripcion",
                    unidades: { $sum: "$unidades_totales" },
                    pacientes: { $addToSet: "$paciente_id" }
                }
            },
            {
                $project: {
                    _id: 0,
                    principio_activo: "$_id",
                    unidades_totales: "$unidades",
                    pacientes_unicos: { $size: "$pacientes" }
                }
            },
            { $sort: { unidades_totales: -1 } },
            { $limit: 20 }
        ]);

        return resultado;
    } catch (error) {
        console.error('Error en getPrincipiosActivos:', error);
        throw error;
    }
};

// Summary (KPIs)
exports.getResumenGeneral = async function (sDate, fDate, gfh_ids = null) {
    try {
        // Convert ISO dates to DD/MM/YYYY format for database queries
        const startDateStr = convertToDBDateFormat(sDate);
        const endDateStr = convertToDBDateFormat(fDate);
        
        if (!startDateStr || !endDateStr) {
            throw new Error('Fechas inválidas proporcionadas');
        }

        // Use string comparison for dispensaciones and consumos (DB stores dates as strings DD/MM/YYYY)
        let queryDisp = { "fecha_inicio": { $gte: startDateStr, $lte: endDateStr } };
        let queryConsumo = { "fecha": { $gte: startDateStr, $lte: endDateStr } };
        // actuaciones stores CSV strings; handled in its own functions, keep queryAct for count but it may not match; we'll count by parsing if necessary
        let queryAct = { "fecha": { $gte: new Date(sDate), $lte: new Date(fDate) } };
        let queryAnteriores = { "fecha_inicio": { $lt: startDateStr } };

        queryDisp = aplicarFiltroGFH(queryDisp, gfh_ids);
        queryConsumo = aplicarFiltroGFH(queryConsumo, gfh_ids);
        queryAnteriores = aplicarFiltroGFH(queryAnteriores, gfh_ids);

        const [
            dispensacionesStats,
            consumosTotal,
            actuacionesCount,
            idsAnteriores
        ] = await Promise.all([
            dispensaciones.aggregate([
                { $match: queryDisp },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        pacientes_unicos: { $addToSet: "$paciente_id" },
                        medicamentos_unicos: { $addToSet: "$nombre_medicamento" }
                    }
                }
            ]),
            consumos_acumulados.aggregate([
                { $match: queryConsumo },
                {
                    $group: {
                        _id: null,
                        total_unidades: { $sum: "$unidades_totales" }
                    }
                }
            ]),
            actuaciones.countDocuments(queryAct),
            dispensaciones.distinct('paciente_id', queryAnteriores)
        ]);

        const totalDispensaciones = dispensacionesStats[0]?.total || 0;
        const pacientesUnicosList = dispensacionesStats[0]?.pacientes_unicos || [];
        const medicamentosUnicosList = dispensacionesStats[0]?.medicamentos_unicos || [];

        const pacientesUnicos = pacientesUnicosList.length;
        const medicamentosUnicos = medicamentosUnicosList.length;
        const unidadesTotales = consumosTotal[0]?.total_unidades || 0;
        const totalActuaciones = actuacionesCount;

        const idsPacAnteriores = new Set(idsAnteriores.map(id => id.toString()));
        const totalPacientesNuevos = pacientesUnicosList.filter(
            id => !idsPacAnteriores.has(id.toString())
        ).length;

        return {
            total_dispensaciones: totalDispensaciones,
            pacientes_unicos: pacientesUnicos,
            pacientes_nuevos: totalPacientesNuevos,
            medicamentos_unicos: medicamentosUnicos,
            unidades_dispensadas: unidadesTotales,
            total_actuaciones: totalActuaciones,
            promedio_dispensaciones_paciente: pacientesUnicos > 0
                ? (totalDispensaciones / pacientesUnicos).toFixed(2)
                : '0.00'
        };
    } catch (error) {
        console.error('Error en getResumenGeneral:', error);
        throw error;
    }
};



// 1. Drug doses in time
exports.getEvolucionDosisMedicamento = async function (nombre_medicamento, sDate, fDate, gfh_ids = null) {
    try {
        const startDateStr = convertToDBDateFormat(sDate);
        const endDateStr = convertToDBDateFormat(fDate);
        if (!startDateStr || !endDateStr) throw new Error('Fechas inválidas proporcionadas');

        let query = {
            "nombre_medicamento": { $regex: nombre_medicamento, $options: 'i' },
            "fecha": { $gte: startDateStr, $lte: endDateStr }
        };
        query = aplicarFiltroGFH(query, gfh_ids);

        const resultado = await consumos_acumulados.aggregate([
            { $match: query },
            // Parse year/month from DD/MM/YYYY string fecha
            {
                $addFields: {
                    year: { $toInt: { $substr: ["$fecha", 6, 4] } },
                    month: { $toInt: { $substr: ["$fecha", 3, 2] } }
                }
            },
            {
                $group: {
                    _id: {
                        medicamento: "$nombre_medicamento",
                        year: "$year",
                        month: "$month"
                    },
                    unidades: { $sum: "$unidades_totales" },
                    pacientes: { $addToSet: "$paciente_id" }
                }
            },
            {
                $project: {
                    _id: 0,
                    medicamento: "$_id.medicamento",
                    periodo: {
                        $concat: [
                            { $toString: "$_id.year" },
                            "-",
                            {
                                $cond: [
                                    { $lt: ["$_id.month", 10] },
                                    { $concat: ["0", { $toString: "$_id.month" }] },
                                    { $toString: "$_id.month" }
                                ]
                            }
                        ]
                    },
                    unidades_totales: "$unidades",
                    pacientes_unicos: { $size: "$pacientes" }
                }
            },
            { $sort: { periodo: 1 } }
        ]);

        return resultado;
    } catch (error) {
        console.error('Error en getEvolucionDosisMedicamento:', error);
        throw error;
    }
};

// 2. Top drugs
exports.getTopMedicamentosPorUnidades = async function (sDate, fDate, limite = 10, gfh_ids = null) {
    try {
        if (limite <= 0) return [];

        const startDateStr = convertToDBDateFormat(sDate);
        const endDateStr = convertToDBDateFormat(fDate);
        if (!startDateStr || !endDateStr) throw new Error('Fechas inválidas proporcionadas');

        let query = {
            "fecha": { $gte: startDateStr, $lte: endDateStr }
        };
        query = aplicarFiltroGFH(query, gfh_ids);

        const resultado = await consumos_acumulados.aggregate([
            { $match: query },
            {
                $group: {
                    _id: "$nombre_medicamento",
                    unidades: { $sum: "$unidades_totales" },
                    pacientes: { $addToSet: "$paciente_id" }
                }
            },
            {
                $project: {
                    _id: 0,
                    medicamento: "$_id",
                    unidades_totales: "$unidades",
                    pacientes_unicos: { $size: "$pacientes" },
                    promedio_por_paciente: {
                        $divide: ["$unidades", { $size: "$pacientes" }]
                    }
                }
            },
            { $sort: { unidades_totales: -1 } },
            { $limit: limite }
        ]);

        return resultado;
    } catch (error) {
        console.error('Error en getTopMedicamentosPorUnidades:', error);
        throw error;
    }
};

// 3. Patiets with the most different drugs
exports.getAnalisisPolimedicacion = async function (sDate, fDate, gfh_ids = null) {
    try {
        const startDateStr = convertToDBDateFormat(sDate);
        const endDateStr = convertToDBDateFormat(fDate);
        
        if (!startDateStr || !endDateStr) {
            throw new Error('Fechas inválidas proporcionadas');
        }

        let query = {
            "fecha_inicio": { $gte: startDateStr, $lte: endDateStr }
        };
        query = aplicarFiltroGFH(query, gfh_ids);

        const resultado = await dispensaciones.aggregate([
            { $match: query },
            {
                $group: {
                    _id: "$paciente_id",
                    medicamentos: { $addToSet: "$nombre_medicamento" },
                    total_dispensaciones: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    paciente_id: "$_id",
                    num_medicamentos_diferentes: { $size: "$medicamentos" },
                    total_dispensaciones: "$total_dispensaciones"
                }
            },
            { $sort: { num_medicamentos_diferentes: -1 } },
            { $limit: 20 }
        ]);

        return resultado;
    } catch (error) {
        console.error('Error en getAnalisisPolimedicacion:', error);
        throw error;
    }
};

// 4. Ranges of patients with different drugs
exports.getDistribucionPolimedicacion = async function (sDate, fDate, gfh_ids = null) {
    try {
        const startDateStr = convertToDBDateFormat(sDate);
        const endDateStr = convertToDBDateFormat(fDate);
        
        if (!startDateStr || !endDateStr) {
            throw new Error('Fechas inválidas proporcionadas');
        }

        let query = {
            "fecha_inicio": { $gte: startDateStr, $lte: endDateStr }
        };
        query = aplicarFiltroGFH(query, gfh_ids);

        const resultado = await dispensaciones.aggregate([
            { $match: query },
            {
                $group: {
                    _id: "$paciente_id",
                    medicamentos: { $addToSet: "$nombre_medicamento" }
                }
            },
            {
                $project: {
                    num_medicamentos: { $size: "$medicamentos" }
                }
            },
            {
                $bucket: {
                    groupBy: "$num_medicamentos",
                    boundaries: [1, 2, 4, 6, 11, 100],
                    default: "Más de 10",
                    output: {
                        count: { $sum: 1 }
                    }
                }
            }
        ]);


        const rangos = resultado.map(r => {
            let rango;
            if (r._id === 1) rango = "1 medicamento";
            else if (r._id === 2) rango = "2-3 medicamentos";
            else if (r._id === 4) rango = "4-5 medicamentos";
            else if (r._id === 6) rango = "6-10 medicamentos";
            else rango = "Más de 10";

            return {
                rango: rango,
                pacientes: r.count
            };
        });

        return rangos;
    } catch (error) {
        console.error('Error en getDistribucionPolimedicacion:', error);
        throw error;
    }
};

// 5. Frequency of dispensation
exports.getAnalisisAdherencia = async function (sDate, fDate, gfh_ids = null) {
    try {
        const startDateStr = convertToDBDateFormat(sDate);
        const endDateStr = convertToDBDateFormat(fDate);
        
        if (!startDateStr || !endDateStr) {
            throw new Error('Fechas inválidas proporcionadas');
        }

        let query = {
            "fecha_inicio": { $gte: startDateStr, $lte: endDateStr }
        };
        query = aplicarFiltroGFH(query, gfh_ids);

        const resultado = await dispensaciones.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        paciente: "$paciente_id",
                        medicamento: "$nombre_medicamento"
                    },
                    dispensaciones: { $sum: 1 },
                    fechas: { $push: "$fecha_inicio" }
                }
            },
            {
                $group: {
                    _id: "$_id.paciente",
                    medicamentos: {
                        $push: {
                            medicamento: "$_id.medicamento",
                            dispensaciones: "$dispensaciones"
                        }
                    },
                    total_dispensaciones: { $sum: "$dispensaciones" }
                }
            },
            {
                $project: {
                    _id: 0,
                    paciente_id: "$_id",
                    num_medicamentos: { $size: "$medicamentos" },
                    total_dispensaciones: "$total_dispensaciones",
                    promedio_dispensaciones: {
                        $divide: ["$total_dispensaciones", { $size: "$medicamentos" }]
                    }
                }
            },
            { $sort: { promedio_dispensaciones: -1 } },
            { $limit: 20 }
        ]);

        return resultado;
    } catch (error) {
        console.error('Error en getAnalisisAdherencia:', error);
        throw error;
    }
};

// 6. Comparative of consume between active principals
exports.getComparativaPrincipiosActivos = async function (principios, sDate, fDate, gfh_ids = null) {
    try {
        let query = {
            "principio_activo_descripcion": { $in: principios },
            "fecha": { $gte: new Date(sDate), $lte: new Date(fDate) }
        };
        query = aplicarFiltroGFH(query, gfh_ids);

        const resultado = await consumos_acumulados.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        principio: "$principio_activo_descripcion",
                        year: { $year: "$fecha" },
                        month: { $month: "$fecha" }
                    },
                    unidades: { $sum: "$unidades_totales" },
                    pacientes: { $addToSet: "$paciente_id" }
                }
            },
            {
                $project: {
                    _id: 0,
                    principio_activo: "$_id.principio",
                    periodo: {
                        $concat: [
                            { $toString: "$_id.year" },
                            "-",
                            {
                                $cond: [
                                    { $lt: ["$_id.month", 10] },
                                    { $concat: ["0", { $toString: "$_id.month" }] },
                                    { $toString: "$_id.month" }
                                ]
                            }
                        ]
                    },
                    unidades_totales: "$unidades",
                    pacientes_unicos: { $size: "$pacientes" }
                }
            },
            { $sort: { periodo: 1, principio_activo: 1 } }
        ]);

        return resultado;
    } catch (error) {
        console.error('Error en getComparativaPrincipiosActivos:', error);
        throw error;
    }
};

// 7. Trends in time of actuations
exports.getTendenciasActuaciones = async function (sDate, fDate) {
    try {
        const RAW_FIELD = 'paciente_id,actuacion,fecha,hora';
        const start = new Date(sDate);
        const end = new Date(fDate);

        const pipeline = [
            { $project: { raw: { $getField: { field: RAW_FIELD, input: '$$ROOT' } } } },
            { $project: { parts: { $split: ["$raw", ","] } } },
            { $project: {
                actionRaw: { $trim: { input: { $arrayElemAt: ["$parts", 1] }, chars: '"' } },
                dateStr: { $arrayElemAt: ["$parts", 2] }
            } },
            { $addFields: { action: "$actionRaw", parsedDate: { $dateFromString: { dateString: "$dateStr", format: "%Y-%m-%d" } } } },
            { $match: { parsedDate: { $gte: start, $lte: end } } },
            { $group: { _id: { tipo: "$action", year: { $year: "$parsedDate" }, month: { $month: "$parsedDate" } }, total: { $sum: 1 } } },
            { $project: { _id: 0, tipo_actuacion: "$_id.tipo", periodo: { $concat: [ { $toString: "$_id.year" }, "-", { $cond: [ { $lt: ["$_id.month", 10] }, { $concat: ["0", { $toString: "$_id.month" }] }, { $toString: "$_id.month" } ] } ] }, cantidad: "$total" } },
            { $sort: { periodo: 1, tipo_actuacion: 1 } }
        ];

        const resultado = await actuaciones.aggregate(pipeline);
        return resultado;
    } catch (error) {
        console.error('Error en getTendenciasActuaciones:', error);
        throw error;
    }
};

// 8. Drug-actuation
exports.getMedicamentosConActuaciones = async function (sDate, fDate, gfh_ids = null) {
    try {
        const startDateStr = convertToDBDateFormat(sDate);
        const endDateStr = convertToDBDateFormat(fDate);
        
        if (!startDateStr || !endDateStr) {
            throw new Error('Fechas inválidas proporcionadas');
        }
        
        let queryDisp = {
            "fecha_inicio": { $gte: startDateStr, $lte: endDateStr }
        };
        queryDisp = aplicarFiltroGFH(queryDisp, gfh_ids);

        let queryAct = {
            "fecha": { $gte: new Date(sDate), $lte: new Date(fDate) }
        };


        const dispensacionesPorMed = await dispensaciones.aggregate([
            { $match: queryDisp },
            {
                $group: {
                    _id: "$nombre_medicamento",
                    dispensaciones: { $sum: 1 },
                    pacientes: { $addToSet: "$paciente_id" }
                }
            }
        ]);


        const actuacionesPorPac = await actuaciones.aggregate([
            { $match: queryAct },
            {
                $group: {
                    _id: "$paciente_id",
                    actuaciones: { $sum: 1 }
                }
            }
        ]);


        const actMap = {};
        actuacionesPorPac.forEach(a => {
            actMap[a._id] = a.actuaciones;
        });


        const resultado = dispensacionesPorMed.map(d => {
            const totalAct = d.pacientes.reduce((sum, pac) => {
                return sum + (actMap[pac] || 0);
            }, 0);

            return {
                medicamento: d._id,
                dispensaciones: d.dispensaciones,
                pacientes_unicos: d.pacientes.length,
                total_actuaciones: totalAct,
                ratio_actuaciones: d.pacientes.length > 0
                    ? (totalAct / d.pacientes.length).toFixed(2)
                    : 0
            };
        }).sort((a, b) => b.total_actuaciones - a.total_actuaciones)
            .slice(0, 15);

        return resultado;
    } catch (error) {
        console.error('Error en getMedicamentosConActuaciones:', error);
        throw error;
    }
};

// 9. Heatmap
exports.getMapaCalorDispensaciones = async function (sDate, fDate, gfh_ids = null) {
    try {
        const startDateStr = convertToDBDateFormat(sDate);
        const endDateStr = convertToDBDateFormat(fDate);
        
        if (!startDateStr || !endDateStr) {
            throw new Error('Fechas inválidas proporcionadas');
        }

        let query = {
            "fecha_inicio": { $gte: startDateStr, $lte: endDateStr }
        };
        query = aplicarFiltroGFH(query, gfh_ids);

        const resultado = await dispensaciones.aggregate([
            { $match: query },
            {
                $project: {
                    diaSemana: { $dayOfWeek: "$fecha_inicio" },
                    hora: { $hour: "$fecha_inicio" }
                }
            },
            {
                $group: {
                    _id: {
                        dia: "$diaSemana",
                        hora: "$hora"
                    },
                    total: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    dia_semana: "$_id.dia",
                    hora: "$_id.hora",
                    cantidad: "$total"
                }
            },
            { $sort: { dia_semana: 1, hora: 1 } }
        ]);


        const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return resultado.map(r => ({
            ...r,
            dia_nombre: dias[r.dia_semana - 1]
        }));
    } catch (error) {
        console.error('Error en getMapaCalorDispensaciones:', error);
        throw error;
    }
};

// 10. Drug seasonality
exports.getEstacionalidadMedicamentos = async function (sDate, fDate, gfh_ids = null) {
    try {
        let query = {
            "fecha": { $gte: new Date(sDate), $lte: new Date(fDate) }
        };
        query = aplicarFiltroGFH(query, gfh_ids);

        const resultado = await consumos_acumulados.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        medicamento: "$nombre_medicamento",
                        mes: { $month: "$fecha" }
                    },
                    unidades: { $sum: "$unidades_totales" }
                }
            },
            {
                $group: {
                    _id: "$_id.medicamento",
                    meses: {
                        $push: {
                            mes: "$_id.mes",
                            unidades: "$unidades"
                        }
                    },
                    total: { $sum: "$unidades" }
                }
            },
            { $sort: { total: -1 } },
            { $limit: 10 }
        ]);

        return resultado;
    } catch (error) {
        console.error('Error en getEstacionalidadMedicamentos:', error);
        throw error;
    }
};

module.exports = exports;