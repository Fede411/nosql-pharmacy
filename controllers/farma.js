// controllers/farma.js 

const actuaciones = require('../models/actuaciones');
const consumos_acumulados = require('../models/consumos_acumulados');
const dispensaciones = require('../models/dispensacion');
const pa_medicamento = require('../models/pa_medicamento');


const aplicarFiltroGFH = (query, gfh_ids) => {
    if (gfh_ids && gfh_ids.length > 0) {
        query['gfh_id'] = { $in: gfh_ids };
    }
    return query;
}
const calcularEstadisticasGFH = (datos) => {
    const gfh_stats = {};

    datos.forEach(item => {
        const gfh = item.gfh_id || 'Sin GFH';
        gfh_stats[gfh] = (gfh_stats[gfh] || 0) + 1;
    });

    return gfh_stats;
};

const logSafe = (msg, data) => {
    if (process.env.NODE_ENV !== 'test') {
        if (Array.isArray(data)) {
            console.log(msg, `[${data.length} elementos]`);
        } else if (typeof data === 'object' && data !== null) {
            console.log(msg, Object.keys(data));
        } else {
            console.log(msg, data);
        }
    }
}

exports.filterPatientsByNumHistorial = async function (paciente_id, gfh_ids = null) {
    let query = { 'paciente_id': paciente_id };
    query = aplicarFiltroGFH(query, gfh_ids);
    let numHistorial = await dispensaciones.find(query);
    return numHistorial;
}

exports.filterPatientsByNumHistorialFecha = async function (paciente_id, sDate, fDate, gfh_ids = null) {
    if (!sDate || sDate.length < 1) {
        let query = { "paciente_id": paciente_id };
        query = aplicarFiltroGFH(query, gfh_ids);
        let numHistorial = await dispensaciones.find(query).sort({ "fecha_inicio": -1 });
        logSafe("Sin fecha - total:", numHistorial);
        return numHistorial;
    } else {
        logSafe("Parametros recibidos:", { paciente_id, sDate, fDate, gfh_ids });
        let query = {
            "paciente_id": paciente_id,
            "fecha_inicio": { $gte: new Date(sDate), $lte: new Date(fDate) }
        };
        query = aplicarFiltroGFH(query, gfh_ids);
        let numHistorial = await dispensaciones.find(query);
        logSafe("Con fecha - total:", numHistorial);
        return numHistorial;
    }
}

exports.filterActuacionesByNumHistorialFecha = async function (paciente_id, sDate, fDate) {
    if (!sDate || sDate.length < 1) {
        let numHistorial = await actuaciones.find({
            "paciente_id": paciente_id,
            "fecha": { $exists: true, $ne: null } // ✅ Solo con fecha
        }).sort({ "fecha": -1 });
        logSafe("Sin fecha - total:", numHistorial);
        return numHistorial;
    } else {
        logSafe("Parametros recibidos:", { paciente_id, sDate, fDate });
        let numHistorial = await actuaciones.find({
            "paciente_id": paciente_id,
            "fecha": {
                $gte: new Date(sDate),
                $lte: new Date(fDate),
                $exists: true,
                $ne: null
            }
        });
        logSafe("Con fecha - total:", numHistorial);
        return numHistorial;
    }
}

exports.filterPatientsByUnionRegistrado = async function (
    nombre_medicamento1,
    nombre_medicamento2,
    nombre_medicamento3,
    sDate,
    fDate,
    gfh_ids = null
) {
    nombre_medicamento1 = nombre_medicamento1 ?? "";
    nombre_medicamento2 = nombre_medicamento2 ?? "";
    nombre_medicamento3 = nombre_medicamento3 ?? "";


    if (!nombre_medicamento1 && !nombre_medicamento2 && !nombre_medicamento3) {
        return [];
    }


    const buildQuery = (nombre) => {
        let query = { 'nombre_medicamento': nombre };

        if (sDate && sDate.length > 0 && fDate && fDate.length > 0) {
            query["fecha_inicio"] = { $gte: new Date(sDate), $lte: new Date(fDate) };
        }

        return aplicarFiltroGFH(query, gfh_ids);
    };


    const medicamentos = [];
    if (nombre_medicamento1) medicamentos.push(nombre_medicamento1);
    if (nombre_medicamento2.length > 1) medicamentos.push(nombre_medicamento2);
    if (nombre_medicamento3.length > 1) medicamentos.push(nombre_medicamento3);

    if (medicamentos.length === 0) return [];


    if (medicamentos.length === 1) {
        const resultado = await dispensaciones.find(buildQuery(medicamentos[0]));
        logSafe("Resultado 1 med:", resultado);
        return resultado;
    }


    let baseQuery = {};
    if (sDate && sDate.length > 0 && fDate && fDate.length > 0) {
        baseQuery["fecha_inicio"] = { $gte: new Date(sDate), $lte: new Date(fDate) };
    }
    baseQuery = aplicarFiltroGFH(baseQuery, gfh_ids);


    const pipeline = [
        {
            $match: {
                ...baseQuery,
                nombre_medicamento: { $in: medicamentos }
            }
        },
        {
            $group: {
                _id: "$paciente_id",
                medicamentos: { $addToSet: "$nombre_medicamento" },
                dispensaciones: { $push: "$$ROOT" }
            }
        },
        {
            $match: {
                $expr: { $eq: [{ $size: "$medicamentos" }, medicamentos.length] }
            }
        },
        {
            $unwind: "$dispensaciones"
        },
        {
            $replaceRoot: { newRoot: "$dispensaciones" }
        }
    ];

    const resultado = await dispensaciones.aggregate(pipeline);
    logSafe(`Resultado ${medicamentos.length} meds:`, resultado);
    return resultado;
}

exports.filteractuacionesByTipo = async function (actuacion, sDate, fDate) {
    try {
        if (process.env.NODE_ENV !== 'test') {
            console.log(`Buscando actuaciones: ${actuacion}, desde: ${sDate}, hasta: ${fDate}`);
        }

        let query = {
            "actuacion": { $regex: actuacion.toString(), $options: 'i' },
            "fecha": { $exists: true, $ne: null } // ✅ Solo registros con fecha
        };

        if (sDate && sDate.length > 0 && fDate && fDate.length > 0) {
            query["fecha"] = {
                $gte: new Date(sDate),
                $lte: new Date(fDate),
                $exists: true,
                $ne: null
            };
        }

        let resultado = await actuaciones.find(query);
        logSafe("Actuaciones encontradas:", resultado);
        return resultado;
    } catch (error) {
        console.error("Error en filteractuacionesByTipo:", error);
        throw error;
    }
}
exports.countactuaciones = async function (actuacion, sDate, fDate) {
    try {
        if (process.env.NODE_ENV !== 'test') {
            console.log(`Contando actuaciones: ${actuacion}`);
        }

        let query = { "actuacion": { $regex: actuacion.toString(), $options: 'i' } };

        if (sDate && sDate.length > 0 && fDate && fDate.length > 0) {
            query["fecha"] = { $gte: new Date(sDate), $lte: new Date(fDate) };
        }

        const cuenta = await actuaciones.countDocuments(query);
        const datos = await actuaciones.find(query).sort({ "fecha": -1 });


        const tipo_stats = {};
        datos.forEach(item => {
            const tipo = item.actuacion || 'Sin tipo';
            tipo_stats[tipo] = (tipo_stats[tipo] || 0) + 1;
        });

        if (process.env.NODE_ENV !== 'test') {
            console.log(`Total actuaciones: ${cuenta}`);
        }

        return {
            cuenta,
            datos,
            tipo_stats
        };
    } catch (error) {
        console.error("Error en countactuaciones:", error);
        throw error;
    }
}


exports.filterPatientsByUnionPrincipioActivoDescripcion = async function (
    p1, p2, p3, sDate, fDate, gfh_ids = null
) {
    p1 = p1 ?? "";
    p2 = p2 ?? "";
    p3 = p3 ?? "";

    if (!p1 && !p2 && !p3) return [];

    const agregarRangoFechas = (query) => {
        if (sDate && sDate.length > 0 && fDate && fDate.length > 0) {
            query['fecha_inicio'] = { $gte: new Date(sDate), $lte: new Date(fDate) };
        }
        return aplicarFiltroGFH(query, gfh_ids);
    };


    const principios = [p1, p2, p3].filter(p => p && p.length > 0);
    if (principios.length === 0) return [];


    const medicamentos = await pa_medicamento.find({
        principio_activo_descripcion: { $in: principios }
    }).lean();

    if (medicamentos.length === 0) return [];


    const medToPrincipio = {};
    medicamentos.forEach(med => {
        medToPrincipio[med.nombre_medicamento] = med.principio_activo_descripcion;
    });


    const todosLosMedicamentos = Object.keys(medToPrincipio);


    let queryBase = {
        nombre_medicamento: { $in: todosLosMedicamentos }
    };
    queryBase = agregarRangoFechas(queryBase);


    const todasDispensaciones = await dispensaciones.find(queryBase).lean();

    if (todasDispensaciones.length === 0) return [];


    if (principios.length === 1) {
        return todasDispensaciones;
    }


    const dispensacionesPorPaciente = {};
    todasDispensaciones.forEach(disp => {
        const pacId = disp.paciente_id;
        if (!dispensacionesPorPaciente[pacId]) {
            dispensacionesPorPaciente[pacId] = {
                principios: new Set(),
                dispensaciones: []
            };
        }

        const principio = medToPrincipio[disp.nombre_medicamento];
        if (principio) {
            dispensacionesPorPaciente[pacId].principios.add(principio);
            dispensacionesPorPaciente[pacId].dispensaciones.push(disp);
        }
    });


    const resultado = [];
    Object.values(dispensacionesPorPaciente).forEach(({ principios: setPrincipios, dispensaciones: disps }) => {

        const tieneTodos = principios.every(p => setPrincipios.has(p));
        if (tieneTodos) {
            resultado.push(...disps);
        }
    });

    logSafe(`Resultado ${principios.length} principios activos:`, resultado);
    return resultado;
};

exports.filterConsumoByUnionRegistrado = async function (
    nombre_medicamento1,
    nombre_medicamento2,
    nombre_medicamento3,
    sDate,
    fDate,
    gfh_ids = null
) {
    nombre_medicamento1 = nombre_medicamento1 ?? "";
    nombre_medicamento2 = nombre_medicamento2 ?? "";
    nombre_medicamento3 = nombre_medicamento3 ?? "";


    if (!nombre_medicamento1 && !nombre_medicamento2 && !nombre_medicamento3) {
        return [];
    }

    const buildQuery = (nombre) => {
        let query = { 'nombre_medicamento': nombre.toString() };

        if (sDate && sDate.length > 0 && fDate && fDate.length > 0) {
            query["fecha"] = { $gte: new Date(sDate), $lte: new Date(fDate) };
        }

        return aplicarFiltroGFH(query, gfh_ids);
    };

    const medicamentos = [];
    if (nombre_medicamento1.length > 1) medicamentos.push(nombre_medicamento1);
    if (nombre_medicamento2.length > 1) medicamentos.push(nombre_medicamento2);
    if (nombre_medicamento3.length > 1) medicamentos.push(nombre_medicamento3);

    if (medicamentos.length === 0) return [];


    if (medicamentos.length === 1) {
        return await consumos_acumulados.find(buildQuery(medicamentos[0]));
    }


    let baseQuery = {};
    if (sDate && sDate.length > 0 && fDate && fDate.length > 0) {
        baseQuery["fecha"] = { $gte: new Date(sDate), $lte: new Date(fDate) };
    }
    baseQuery = aplicarFiltroGFH(baseQuery, gfh_ids);

    const pipeline = [
        {
            $match: {
                ...baseQuery,
                nombre_medicamento: { $in: medicamentos }
            }
        },
        {
            $group: {
                _id: "$paciente_id",
                medicamentos: { $addToSet: "$nombre_medicamento" },
                consumos: { $push: "$$ROOT" }
            }
        },
        {
            $match: {
                $expr: { $eq: [{ $size: "$medicamentos" }, medicamentos.length] }
            }
        },
        { $unwind: "$consumos" },
        { $replaceRoot: { newRoot: "$consumos" } }
    ];

    return await consumos_acumulados.aggregate(pipeline);
}

exports.filterConsumoByUnionPrincipioActivoDescripcion = async function (
    principio_activo_descripcion1,
    principio_activo_descripcion2,
    principio_activo_descripcion3,
    sDate,
    fDate,
    gfh_ids = null
) {
    principio_activo_descripcion1 = principio_activo_descripcion1 ?? "";
    principio_activo_descripcion2 = principio_activo_descripcion2 ?? "";
    principio_activo_descripcion3 = principio_activo_descripcion3 ?? "";

    if (!principio_activo_descripcion1 && !principio_activo_descripcion2 && !principio_activo_descripcion3) {
        return [];
    }

    const agregarRangoFechas = (query) => {
        if (sDate && sDate.length > 0 && fDate && fDate.length > 0) {
            query['fecha'] = { $gte: new Date(sDate), $lte: new Date(fDate) };
        }
        return aplicarFiltroGFH(query, gfh_ids);
    };


    const principios = [principio_activo_descripcion1, principio_activo_descripcion2, principio_activo_descripcion3]
        .filter(p => p && p.length > 0);

    if (principios.length === 0) return [];

    const medicamentos = await pa_medicamento.find({
        principio_activo_descripcion: { $in: principios }
    }).lean();

    if (medicamentos.length === 0) return [];


    const medToPrincipio = {};
    medicamentos.forEach(med => {
        medToPrincipio[med.nombre_medicamento] = med.principio_activo_descripcion;
    });


    const todosLosMedicamentos = Object.keys(medToPrincipio);

    let queryBase = {
        nombre_medicamento: { $in: todosLosMedicamentos }
    };
    queryBase = agregarRangoFechas(queryBase);


    const todosConsumos = await consumos_acumulados.find(queryBase).lean();

    if (todosConsumos.length === 0) return [];


    if (principios.length === 1) {
        return todosConsumos;
    }


    const consumosPorPaciente = {};
    todosConsumos.forEach(consumo => {
        const pacId = consumo.paciente_id;
        if (!consumosPorPaciente[pacId]) {
            consumosPorPaciente[pacId] = {
                principios: new Set(),
                consumos: []
            };
        }

        const principio = medToPrincipio[consumo.nombre_medicamento];
        if (principio) {
            consumosPorPaciente[pacId].principios.add(principio);
            consumosPorPaciente[pacId].consumos.push(consumo);
        }
    });


    const resultado = [];
    Object.values(consumosPorPaciente).forEach(({ principios: setPrincipios, consumos: cons }) => {
        const tieneTodos = principios.every(p => setPrincipios.has(p));
        if (tieneTodos) {
            resultado.push(...cons);
        }
    });

    logSafe(`Resultado ${principios.length} principios activos en consumos:`, resultado);
    return resultado;
};

exports.filterConsumosByNumHistorialFecha = async function (paciente_id, sDate, fDate, gfh_ids = null) {
    try {
        if (!sDate || !fDate || sDate.length < 1 || fDate.length < 1) {
            let query = { "paciente_id": paciente_id };
            query = aplicarFiltroGFH(query, gfh_ids);

            let numHistorial = await consumos_acumulados.find(query).sort({ "fecha": -1 });
            logSafe("Sin fecha - total:", numHistorial);
            return numHistorial;
        } else {
            logSafe("Parámetros recibidos:", { paciente_id, sDate, fDate, gfh_ids });

            let query = {
                "paciente_id": paciente_id,
                "fecha": { $gte: new Date(sDate), $lte: new Date(fDate) }
            };
            query = aplicarFiltroGFH(query, gfh_ids);

            let numHistorial = await consumos_acumulados.find(query);
            logSafe("Con fecha - total:", numHistorial);
            return numHistorial;
        }
    } catch (error) {
        console.error('Error en filterConsumosByNumHistorialFecha:', error);
        throw error;
    }
}

exports.filterDosisByNombreMedicamento = async function (nombre_medicamento, sDate, fDate, gfh_ids = null) {
    try {
        let matchQuery = { "nombre_medicamento": { $regex: nombre_medicamento, $options: 'i' } };

        if (sDate && sDate.length > 0 && fDate && fDate.length > 0) {
            matchQuery["fecha"] = { $gte: new Date(sDate), $lte: new Date(fDate) };
        }

        matchQuery = aplicarFiltroGFH(matchQuery, gfh_ids);

        const nombreMedicamento = await consumos_acumulados.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: "$nombre_medicamento",
                    sumaMedicamento: { $sum: "$unidades_totales" }
                }
            }
        ]);

        logSafe("Dosis agrupadas:", nombreMedicamento);
        return nombreMedicamento;
    } catch (error) {
        console.error('Error en filterDosisByNombreMedicamento:', error);
        throw error;
    }
}

exports.filterDosisByNombreMedicamentoAndIdPaciente = async function (
    nombre_medicamento,
    paciente_id,
    sDate,
    fDate,
    gfh_ids = null
) {
    try {
        logSafe("Parametros recibidos:", { nombre_medicamento, paciente_id, sDate, fDate, gfh_ids });

        let matchQuery = {
            "nombre_medicamento": { $regex: nombre_medicamento, $options: 'i' },
            "paciente_id": { $regex: paciente_id, $options: 'i' }
        };

        if (sDate && sDate.length > 0 && fDate && fDate.length > 0) {
            matchQuery["fecha"] = { $gte: new Date(sDate), $lte: new Date(fDate) };
        }

        matchQuery = aplicarFiltroGFH(matchQuery, gfh_ids);

        // Agrupa por AMBOS campos: paciente_id Y nombre_medicamento
        const dosisPorPacienteYMedicamento = await consumos_acumulados.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: {
                        paciente_id: "$paciente_id",
                        nombre_medicamento: "$nombre_medicamento"
                    },
                    totalDosis: { $sum: "$unidades_totales" },
                    conteoRegistros: { $sum: 1 } // Cuenta cuántos registros hay
                }
            },
            {
                $project: {
                    _id: 0,
                    paciente_id: "$_id.paciente_id",
                    nombre_medicamento: "$_id.nombre_medicamento",
                    totalDosis: 1,
                    conteoRegistros: 1
                }
            },
            { $sort: { paciente_id: 1, nombre_medicamento: 1 } }
        ]);

        logSafe("Dosis por paciente y medicamento:", dosisPorPacienteYMedicamento);
        return dosisPorPacienteYMedicamento;
    } catch (error) {
        console.error('Error en filterDosisByNombreMedicamentoAndIdPaciente:', error);
        throw error;
    }
}

exports.filterPacienteByDate = async function (sDate, fDate, gfh_ids = null) {
    let query = {
        "fecha_inicio": { $gte: new Date(sDate), $lte: new Date(fDate) }
    };
    query = aplicarFiltroGFH(query, gfh_ids);

    let resultado = await dispensaciones.find(query);
    return resultado;
};

exports.pacienteNuevo = async function (sDate, fDate, gfh_ids = null) {
    try {
        const startDate = new Date(sDate);
        const endDate = new Date(fDate);

        let queryAnteriores = { "fecha_inicio": { $lt: startDate } };
        let queryPeriodo = { "fecha_inicio": { $gte: startDate, $lte: endDate } };

        queryAnteriores = aplicarFiltroGFH(queryAnteriores, gfh_ids);
        queryPeriodo = aplicarFiltroGFH(queryPeriodo, gfh_ids);

        const [idsAnteriores, dispensacionesPeriodo] = await Promise.all([
            dispensaciones.distinct('paciente_id', queryAnteriores),
            dispensaciones.find(queryPeriodo)
        ]);

        const setAnteriores = new Set(idsAnteriores.map(id => id.toString()));

        const resultado = dispensacionesPeriodo.filter(
            p => !setAnteriores.has(p.paciente_id.toString())
        );

        logSafe("Pacientes nuevos:", resultado);
        return resultado;
    } catch (error) {
        console.error("Error fetching patients:", error);
        throw error;
    }
};

exports.countPacienteByDate = async function (sDate, fDate, gfh_ids = null) {
    let query = {};

    if (sDate && sDate.length > 0 && fDate && fDate.length > 0) {
        query["fecha_inicio"] = { $gte: new Date(sDate), $lte: new Date(fDate) };
    }

    query = aplicarFiltroGFH(query, gfh_ids);

    const resultado = await dispensaciones.aggregate([
        { $match: query },
        {
            $group: {
                _id: "$paciente_id",
                primera_dispensacion: { $first: "$$ROOT" }
            }
        },
        {
            $replaceRoot: { newRoot: "$primera_dispensacion" }
        },
        { $sort: { fecha_inicio: -1 } }
    ]);

    const cuenta = resultado.length;


    const gfh_stats = calcularEstadisticasGFH(resultado);

    if (process.env.NODE_ENV !== 'test') {
        console.log("cuenta pacientes en periodo:", cuenta);
        console.log("estadísticas por GFH:", gfh_stats);
    }

    return {
        cuenta,
        datos: resultado,
        gfh_stats
    };
}

exports.countPacienteNuevoByDate = async function (sDate, fDate, gfh_ids) {
    try {
        const startDate = new Date(sDate);
        const endDate = new Date(fDate);

        let queryAnteriores = { "fecha_inicio": { $lt: startDate } };
        let queryPeriodo = { "fecha_inicio": { $gte: startDate, $lte: endDate } };

        if (gfh_ids && gfh_ids.length > 0) {
            queryAnteriores.gfh_id = { $in: gfh_ids };
            queryPeriodo.gfh_id = { $in: gfh_ids };
        }

        const [idsAnteriores, dispensacionesPeriodo] = await Promise.all([
            dispensaciones.distinct('paciente_id', queryAnteriores),
            dispensaciones.find(queryPeriodo)
        ]);

        const setAnteriores = new Set(idsAnteriores.map(id => id.toString()));


        const pacientesNuevos = dispensacionesPeriodo.filter(
            p => !setAnteriores.has(p.paciente_id.toString())
        );

        const cuenta = pacientesNuevos.length;


        const gfh_stats = calcularEstadisticasGFH(pacientesNuevos);

        return {
            cuenta,
            datos: pacientesNuevos,
            gfh_stats
        };
    } catch (error) {
        console.error("Error counting new patients:", error);
        throw error;
    }
};

exports.countPacientesEnUnionMedicamento = async function (
    nombre_medicamento1,
    nombre_medicamento2,
    nombre_medicamento3,
    sDate,
    fDate,
    gfh_ids = null
) {
    try {
        const resultados = await this.filterPatientsByUnionRegistrado(
            nombre_medicamento1,
            nombre_medicamento2,
            nombre_medicamento3,
            sDate,
            fDate,
            gfh_ids
        );

        const pacientesUnicos = new Set(
            resultados.map(r => r.paciente_id.toString())
        );

        return pacientesUnicos.size;
    } catch (error) {
        console.error("Error en countPacientesEnUnionMedicamento:", error);
        throw error;
    }
};

exports.listactuaciones = async function () {
    if (process.env.NODE_ENV !== 'test') {
        console.log("ha entrado");
    }
    let actuaciones_array = await actuaciones.find().limit(10).sort({ "fecha": -1 });
    return actuaciones_array;
}

exports.listConsumoAcumulado = async function () {
    let pacientes_array = await consumos_acumulados.find().sort({ "fecha": -1 }).limit(10);
    return pacientes_array;
}

exports.listdispensacion = async function () {
    let pacientes_array = await dispensaciones.find().limit(10).sort({ "fecha": -1 });
    return pacientes_array;
}