require('dotenv').config(); // ← DEBE SER LA PRIMERA LÍNEA

const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const path = require('path');
const FarmaController = require('./controllers/farma');
const EstadisticasController = require('./controllers/estadisticas');
const { Parser } = require('json2csv'); // ← Añadir si lo usas

const app = express();

const mongoose = require('mongoose');
const pa_medicamento = require('./models/pa_medicamento');
const dispensaciones = require('./models/dispensacion');

// Usar variable de entorno o fallback a local
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prueba_farma';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Successfully connected to MongoDB');
    })
    .catch((error) => {
        console.error('❌ Error connecting to MongoDB:', error);
        process.exit(1);
    });

app.use(methodOverride('_method'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/home', (req, res, next) => {
    res.redirect('/dispensacion');c
});
app.get('/', (req, res, next) => {
    res.redirect('/dispensacion');
});
app.get('/incio', (req, res, next) => {
    res.redirect('/dispensacion');
});

app.get('/home', async (req, res, next) => {
    let dispensacion = await FarmaController.listdispensacion().catch(e => next(e));
    res.render('dispensacion', { dispensacion: dispensacion, patientDeleted: req.query.patientDeleted });
});

app.get('/dispensacion', async (req, res, next) => {
    try {
        const { paciente_id, start, end, medicamento1, medicamento2, medicamento3, principio_activo1, principio_activo2, principio_activo3 } = req.query;

        let dispensacion;

        if (paciente_id && start && end) {
            dispensacion = await FarmaController.filterPatientsByNumHistorialFecha(paciente_id, start, end);
        } else if (medicamento1 || medicamento2 || medicamento3) {
            dispensacion = await FarmaController.filterPatientsByUnionRegistrado(medicamento1, medicamento2, medicamento3, start, end);
        } else if (principio_activo1 || principio_activo2 || principio_activo3) {
            dispensacion = await FarmaController.filterPatientsByUnionPrincipioActivoDescripcion(principio_activo1, principio_activo2, principio_activo3, start, end);
        } else {
            dispensacion = await FarmaController.listdispensacion();
        }

        res.render('dispensacion', { 
            dispensacion, 
            paciente_id, start, end, 
            medicamento1, medicamento2, medicamento3, 
            principio_activo1, principio_activo2, principio_activo3 
        });

    } catch (err) {
        next(err);
    }
});


// ---- DISPENSACION ROUTES (GET version) ----
app.get('/dispensacion/filterPatientsByUnionRegistrado', async (req, res, next) => {
    try {
        const { medicamento1, medicamento2, medicamento3, start, end } = req.query;
        let dispensacion = await FarmaController.filterPatientsByUnionRegistrado(
            medicamento1, medicamento2, medicamento3, start, end
        ).catch(e => next(e));

        res.render('dispensacion', { 
            dispensacion,
            paciente_id: req.query.paciente_id || '',
            start: start || '',
            end: end || '',
            medicamento1: medicamento1 || '',
            medicamento2: medicamento2 || '',
            medicamento3: medicamento3 || '',
            principio_activo1: req.query.principio_activo1 || '',
            principio_activo2: req.query.principio_activo2 || '',
            principio_activo3: req.query.principio_activo3 || ''
        });
    } catch (err) {
        next(err);
    }
});

app.get('/dispensacion/infoCompleta', async (req, res, next) => {
    try {
        let dispensacion = await FarmaController.filterPatientsByUnionRegistrado().catch(e => next(e));
        res.render('dispensacion', { dispensacion });
    } catch (err) {
        next(err);
    }
});

app.get('/dispensacion/cuentaTotal', async (req, res, next) => {
    try {
        res.render('vistaCuentas');
    } catch (err) {
        next(err);
    }
});

app.get('/dispensacion/filterPatientsByUnionPrincipioActivoDescripcion', async (req, res, next) => {
    try {
        const { principio_activo1, principio_activo2, principio_activo3, start, end } = req.query;
        let dispensacion = await FarmaController.filterPatientsByUnionPrincipioActivoDescripcion(
            principio_activo1, principio_activo2, principio_activo3, start, end
        ).catch(e => next(e));

        res.render('dispensacion', { 
            dispensacion,
            paciente_id: req.query.paciente_id || '',
            start: start || '',
            end: end || '',
            medicamento1: req.query.medicamento1 || '',
            medicamento2: req.query.medicamento2 || '',
            medicamento3: req.query.medicamento3 || '',
            principio_activo1: principio_activo1 || '',
            principio_activo2: principio_activo2 || '',
            principio_activo3: principio_activo3 || ''
        });
    } catch (err) {
        next(err);
    }
});

app.get('/dispensacion/filterPatientsByNumHistorialFecha', async (req, res, next) => {
    try {
        const { paciente_id, start, end } = req.query;
        let dispensacion = await FarmaController.filterPatientsByNumHistorialFecha(
            paciente_id, start, end
        ).catch(e => next(e));

        res.render('dispensacion', { 
            dispensacion,
            paciente_id: paciente_id || '',
            start: start || '',
            end: end || '',
            medicamento1: req.query.medicamento1 || '',
            medicamento2: req.query.medicamento2 || '',
            medicamento3: req.query.medicamento3 || '',
            principio_activo1: req.query.principio_activo1 || '',
            principio_activo2: req.query.principio_activo2 || '',
            principio_activo3: req.query.principio_activo3 || ''
        });
    } catch (err) {
        next(err);
    }
});

app.get('/dispensacion/filterPacienteByDate', async (req, res, next) => {
    try {
        const { start, end } = req.query;
        let patients = await FarmaController.filterPacienteByDate(start, end).catch(e => next(e));

        res.render('dispensacion', { 
            dispensacion: patients,
            paciente_id: req.query.paciente_id || '',
            start: start || '',
            end: end || '',
            medicamento1: req.query.medicamento1 || '',
            medicamento2: req.query.medicamento2 || '',
            medicamento3: req.query.medicamento3 || '',
            principio_activo1: req.query.principio_activo1 || '',
            principio_activo2: req.query.principio_activo2 || '',
            principio_activo3: req.query.principio_activo3 || ''
        });
    } catch (err) {
        next(err);
    }
});

app.get('/dispensacion/countPacienteByDate', async (req, res, next) => {
    try {
        const { start, end } = req.query;
        let cuenta = await FarmaController.countPacienteByDate(start, end).catch(e => next(e));
        res.render('vistaCuentasDisp', { cuenta });
    } catch (err) {
        next(err);
    }
});

app.get('/dispensacion/pacienteNuevo', async (req, res, next) => {
    try {
        const { start, end } = req.query;
        let dispensacion = await FarmaController.pacienteNuevo(start, end).catch(e => next(e));

        res.render('dispensacion', { 
            dispensacion,
            paciente_id: req.query.paciente_id || '',
            start: start || '',
            end: end || '',
            medicamento1: req.query.medicamento1 || '',
            medicamento2: req.query.medicamento2 || '',
            medicamento3: req.query.medicamento3 || '',
            principio_activo1: req.query.principio_activo1 || '',
            principio_activo2: req.query.principio_activo2 || '',
            principio_activo3: req.query.principio_activo3 || ''
        });
    } catch (err) {
        next(err);
    }
});

app.get('/dispensacion/countPacienteNuevoByDate', async (req, res, next) => {
    try {
        const { start, end } = req.query;
        let cuenta = await FarmaController.countPacienteNuevoByDate(start, end).catch(e => next(e));
        res.render('vistaCuentasDisp2', { cuenta });
    } catch (err) {
        next(err);
    }
});


// ---- CONSUMOS ACUMULADOS ROUTES ----

// Filter by UNION REGISTRADO (medicamentos)
app.get('/consumos_acumulados/filterConsumoByUnionRegistrado', async (req, res, next) => {
    try {
        const {
            medicamento1, medicamento2, medicamento3,
            start, end, paciente_id,
            principio_activo1, principio_activo2, principio_activo3
        } = req.query;

        const consumos_acumulados =
            await FarmaController.filterConsumoByUnionRegistrado(
                medicamento1, medicamento2, medicamento3, start, end
            );

        res.render('consumos_acumulados', {
            consumos_acumulados,
            paciente_id: paciente_id || '',
            start: start || '',
            end: end || '',
            medicamento1: medicamento1 || '',
            medicamento2: medicamento2 || '',
            medicamento3: medicamento3 || '',
            principio_activo1: principio_activo1 || '',
            principio_activo2: principio_activo2 || '',
            principio_activo3: principio_activo3 || ''
        });
    } catch (e) {
        next(e);
    }
});


// Filter by PRINCIPIO ACTIVO
app.get('/consumos_acumulados/filterConsumoByUnionPrincipioActivoDescripcion', async (req, res, next) => {
    try {
        const {
            principio_activo1, principio_activo2, principio_activo3,
            start, end, paciente_id,
            medicamento1, medicamento2, medicamento3
        } = req.query;

        const consumos_acumulados =
            await FarmaController.filterConsumoByUnionPrincipioActivoDescripcion(
                principio_activo1, principio_activo2, principio_activo3, start, end
            );

        res.render('consumos_acumulados', {
            consumos_acumulados,
            paciente_id: paciente_id || '',
            start: start || '',
            end: end || '',
            medicamento1: medicamento1 || '',
            medicamento2: medicamento2 || '',
            medicamento3: medicamento3 || '',
            principio_activo1: principio_activo1 || '',
            principio_activo2: principio_activo2 || '',
            principio_activo3: principio_activo3 || ''
        });
    } catch (e) {
        next(e);
    }
});


// Filter DOSIS by medicamento
app.get('/consumos_acumulados/filterDosisByNombreMedicamento', async (req, res, next) => {
    try {
        const { medicamento, start, end } = req.query;

        const dosis =
            await FarmaController.filterDosisByNombreMedicamento(
                medicamento, start, end
            );

        res.render('dosis', {
            dosis,
            medicamento: medicamento || '',
            start: start || '',
            end: end || ''
        });
    } catch (e) {
        next(e);
    }
});


// Filter DOSIS by medicamento + paciente
app.get('/consumos_acumulados/filterDosisByNombreMedicamentoAndIdPaciente', async (req, res, next) => {
    try {
        const { medicamento, paciente_id, start, end } = req.query;

        const dosis =
            await FarmaController.filterDosisByNombreMedicamentoAndIdPaciente(
                medicamento, paciente_id, start, end
            );

        res.render('dosisPac', {
            dosis1: dosis,
            medicamento: medicamento || '',
            paciente_id: paciente_id || '',
            start: start || '',
            end: end || ''
        });
    } catch (e) {
        next(e);
    }
});


//Filter CONSUMOS by paciente + fecha
app.get('/consumos_acumulados/filterConsumosByNumHistorialFecha', async (req, res, next) => {
    try {
        const {
            paciente_id, start, end,
            medicamento1, medicamento2, medicamento3,
            principio_activo1, principio_activo2, principio_activo3
        } = req.query;

        const consumos_acumulados =
            await FarmaController.filterConsumosByNumHistorialFecha(
                paciente_id, start, end
            );

        res.render('consumos_acumulados', {
            consumos_acumulados,
            paciente_id: paciente_id || '',
            start: start || '',
            end: end || '',
            medicamento1: medicamento1 || '',
            medicamento2: medicamento2 || '',
            medicamento3: medicamento3 || '',
            principio_activo1: principio_activo1 || '',
            principio_activo2: principio_activo2 || '',
            principio_activo3: principio_activo3 || ''
        });
    } catch (e) {
        next(e);
    }
});

// ---- ACTUACIONES ROUTES ----
app.get('/actuaciones', async (req, res, next) => {
    try {
        const { actuacion, start, end, paciente_id } = req.query;

        let actuaciones;

        if (paciente_id && start && end) {
            actuaciones = await FarmaController.filterActuacionesByNumHistorialFecha(paciente_id, start, end);
        } else if (actuacion && start && end) {
            actuaciones = await FarmaController.filteractuacionesByTipo(actuacion, start, end);
        } else {
            actuaciones = await FarmaController.listactuaciones();
        }

        res.render('actuaciones', { actuaciones, actuacion, start, end, paciente_id });
    } catch (err) {
        next(err);
    }
});

app.get('/actuaciones/filteractuacionesByTipo', async (req, res, next) => {
    try {
        const { actuacion, start, end } = req.query;
        let actuaciones = await FarmaController.filteractuacionesByTipo(actuacion, start, end);
        res.render('actuaciones', { actuaciones });
    } catch (err) {
        next(err);
    }
});

app.get('/actuaciones/countactuaciones', async (req, res, next) => {
    try {
        const { actuacion, start, end } = req.query;
        let cuenta = await FarmaController.countactuaciones(actuacion, start, end);
        res.render('vistaCuentas', { cuenta });
    } catch (err) {
        next(err);
    }
});

app.get('/actuaciones/filterActuacionesByNumHistorialFecha', async (req, res, next) => {
    let actuaciones = await FarmaController.filterActuacionesByNumHistorialFecha(req.query.paciente_id, req.query.start, req.query.end).catch(e => next(e));
    res.render('actuaciones', { actuaciones: actuaciones });
});

// ---- ESTADISTICAS & CONSUMOS ACUMULADOS ----
app.get('/estadisticas', async (req, res, next) => {
    let patients = await FarmaController.listdispensacion().catch(e => next(e));
    res.render('estadisticas', { patients: patients });
});

// ---- ESTADISTICAS API ENDPOINTS (AJAX) ----
// All endpoints accept JSON POST bodies with { fecha_inicio, fecha_fin, gfh_ids }
app.post('/estadisticas/api/resumen-general', async (req, res, next) => {
    try {
        const { fecha_inicio, fecha_fin, gfh_ids } = req.body;
        const result = await EstadisticasController.getResumenGeneral(fecha_inicio, fecha_fin, gfh_ids);
        res.json({ success: true, data: result });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: err.message || 'Error' });
    }
});

app.post('/estadisticas/api/pacientes-periodo', async (req, res, next) => {
    try {
        const { fecha_inicio, fecha_fin, gfh_ids } = req.body;
        const result = await EstadisticasController.getPacientesPorPeriodo(fecha_inicio, fecha_fin, gfh_ids);
        res.json({ success: true, data: result });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: err.message || 'Error' });
    }
});

app.post('/estadisticas/api/top-medicamentos', async (req, res, next) => {
    try {
        const { fecha_inicio, fecha_fin, limite = 10, gfh_ids } = req.body;
        const result = await EstadisticasController.getTopMedicamentos(fecha_inicio, fecha_fin, parseInt(limite, 10), gfh_ids);
        res.json({ success: true, data: result });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: err.message || 'Error' });
    }
});

app.post('/estadisticas/api/distribucion-actuaciones', async (req, res, next) => {
    try {
        const { fecha_inicio, fecha_fin } = req.body;
        const result = await EstadisticasController.getDistribucionActuaciones(fecha_inicio, fecha_fin);
        res.json({ success: true, data: result });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: err.message || 'Error' });
    }
});

app.post('/estadisticas/api/comparativa-pacientes', async (req, res, next) => {
    try {
        const { fecha_inicio, fecha_fin, gfh_ids } = req.body;
        const result = await EstadisticasController.getComparativaPacientes(fecha_inicio, fecha_fin, gfh_ids);
        res.json({ success: true, data: result });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: err.message || 'Error' });
    }
});

app.post('/estadisticas/api/dispensaciones-gfh', async (req, res, next) => {
    try {
        const { fecha_inicio, fecha_fin, gfh_ids } = req.body;
        const result = await EstadisticasController.getDispensacionesPorGFH(fecha_inicio, fecha_fin, gfh_ids);
        res.json({ success: true, data: result });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: err.message || 'Error' });
    }
});

app.post('/estadisticas/api/principios-activos', async (req, res, next) => {
    try {
        const { fecha_inicio, fecha_fin, gfh_ids } = req.body;
        const result = await EstadisticasController.getPrincipiosActivos(fecha_inicio, fecha_fin, gfh_ids);
        res.json({ success: true, data: result });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: err.message || 'Error' });
    }
});

app.post('/estadisticas/api/top-medicamentos-unidades', async (req, res, next) => {
    try {
        const { fecha_inicio, fecha_fin, limite = 10, gfh_ids } = req.body;
        const result = await EstadisticasController.getTopMedicamentosPorUnidades(fecha_inicio, fecha_fin, parseInt(limite, 10), gfh_ids);
        res.json({ success: true, data: result });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: err.message || 'Error' });
    }
});

app.post('/estadisticas/api/distribucion-polimedicacion', async (req, res, next) => {
    try {
        const { fecha_inicio, fecha_fin, gfh_ids } = req.body;
        const result = await EstadisticasController.getDistribucionPolimedicacion(fecha_inicio, fecha_fin, gfh_ids);
        res.json({ success: true, data: result });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: err.message || 'Error' });
    }
});

app.post('/estadisticas/api/analisis-adherencia', async (req, res, next) => {
    try {
        const { fecha_inicio, fecha_fin, gfh_ids } = req.body;
        const result = await EstadisticasController.getAnalisisAdherencia(fecha_inicio, fecha_fin, gfh_ids);
        res.json({ success: true, data: result });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: err.message || 'Error' });
    }
});

app.post('/estadisticas/api/tendencias-actuaciones', async (req, res, next) => {
    try {
        const { fecha_inicio, fecha_fin } = req.body;
        const result = await EstadisticasController.getTendenciasActuaciones(fecha_inicio, fecha_fin);
        res.json({ success: true, data: result });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: err.message || 'Error' });
    }
});

app.get('/consumos_acumulados', async (req, res, next) => {
    try {
        const { paciente_id, start, end, medicamento1, medicamento2, medicamento3, principio_activo1, principio_activo2, principio_activo3 } = req.query;
        let consumos_acumulados = await FarmaController.listConsumoAcumulado();
        res.render('consumos_acumulados', { 
            consumos_acumulados,
            paciente_id: paciente_id || '',
            start: start || '',
            end: end || '',
            medicamento1: medicamento1 || '',
            medicamento2: medicamento2 || '',
            medicamento3: medicamento3 || '',
            principio_activo1: principio_activo1 || '',
            principio_activo2: principio_activo2 || '',
            principio_activo3: principio_activo3 || ''
        });
    } catch (err) {
        next(err);
    }
});

// ---- MEDICAMENTOS & PRINCIPIOS ACTIVOS ----
app.get('/medicamentos', async (req, res) => {
    try {
        const medicamentos = await pa_medicamento.find({});
        res.json(medicamentos);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get('/principios_activos', async (req, res) => {
    try {
        const principiosActivos = await pa_medicamento.distinct('principio_activo_descripcion');
        res.json(principiosActivos);
    } catch (error) {
        console.error('Error al obtener los principios activos:', error);
        res.status(500).send('Error al obtener los principios activos');
    }
});

// ---- EXPORT CSV ----

// Export CSV of filtered actuaciones
app.get('/actuaciones/export', async (req, res, next) => {
    try {
        const { actuacion, start, end, paciente_id } = req.query;

        let actuaciones;

        if (paciente_id && start && end) {
            actuaciones = await FarmaController.filterActuacionesByNumHistorialFecha(paciente_id, start, end);
        } else if (actuacion && start && end) {
            actuaciones = await FarmaController.filteractuacionesByTipo(actuacion, start, end);
        } else {
            actuaciones = await FarmaController.listactuaciones();
        }

        const fields = ['paciente_id', 'actuacion', 'farmaceutico', 'fecha', 'hora', 'lin_observaciones'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(actuaciones);

        res.header('Content-Type', 'text/csv');
        res.attachment('actuaciones.csv');
        res.send(csv);
    } catch (err) {
        next(err);
    }
});

// Export CSV of filtered dispensacion (updated to GET + query params)
app.get('/dispensacion/export', async (req, res, next) => {
    try {
        const { paciente_id, start, end, medicamento1, medicamento2, medicamento3, principio_activo1, principio_activo2, principio_activo3 } = req.query;

        let dispensacion;

        if (paciente_id && start && end) {
            dispensacion = await FarmaController.filterPatientsByNumHistorialFecha(paciente_id, start, end);
        } else if (medicamento1 || medicamento2 || medicamento3) {
            dispensacion = await FarmaController.filterPatientsByUnionRegistrado(medicamento1, medicamento2, medicamento3, start, end);
        } else if (principio_activo1 || principio_activo2 || principio_activo3) {
            dispensacion = await FarmaController.filterPatientsByUnionPrincipioActivoDescripcion(principio_activo1, principio_activo2, principio_activo3, start, end);
        } else {
            dispensacion = await FarmaController.listdispensacion();
        }

        const fields = [
            'cab_e_s_id', 'paciente_id', 'paciente_nombre_completo', 'programa_dispensacion_id',
            'programa_dispensacion_descripcion', 'especialidad_id', 'dosis', 'tipo_dosis', 'cantidad',
            'frecuencia_id', 'fecha_inicio', 'fecha_fin', 'total_dias', 'nombre_medicamento',
            'gfh_id', 'gfh_descripcion', 'medico_id', 'medico_nombre_completo', 'precio_unidad_pvf_m'
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(dispensacion);

        res.header('Content-Type', 'text/csv');
        res.attachment('dispensacion.csv');
        res.send(csv);

    } catch (err) {
        next(err);
    }
});

// ---- EXPORT CSV FOR CONSUMOS ACUMULADOS ----
app.get('/consumos_acumulados/export', async (req, res, next) => {
    try {
        const { paciente_id, start, end, medicamento1, medicamento2, medicamento3, principio_activo1, principio_activo2, principio_activo3 } = req.query;

        let consumos_acumulados;

        // Use the same filtering logic as in your POST routes
        if (paciente_id && start && end) {
            consumos_acumulados = await FarmaController.filterConsumosByNumHistorialFecha(paciente_id, start, end);
        } else if (medicamento1 || medicamento2 || medicamento3) {
            consumos_acumulados = await FarmaController.filterConsumoByUnionRegistrado(medicamento1, medicamento2, medicamento3, start, end);
        } else if (principio_activo1 || principio_activo2 || principio_activo3) {
            consumos_acumulados = await FarmaController.filterConsumoByUnionPrincipioActivoDescripcion(principio_activo1, principio_activo2, principio_activo3, start, end);
        } else {
            consumos_acumulados = await FarmaController.listConsumoAcumulado();
        }

        // Define CSV fields (update according to your table columns)
        const fields = [
            'almacen_id','fecha','gfh_id', 'gfh_descripcion','codigo_nacional','nombre_medicamento', 'unidades_totales','principio_activo_id',
            'principio_activo_descripcion','grupo_terapeutico_id', 'grupo_terapeutico_descripcion','tipo_especialidad1_id', 'tipo_especialidad1_descripcion',
			'tipo_especialidad2_id','tipo_especialidad2_descripcion','tipo_especialidad3_id','tipo_especialidad3_descripcion', 'laboratorio_id',
			'laboratorio_descripcion','paciente_id', 'paciente_nombre_completo', 'tipo_paciente_pe_id','tipo_paciente_pe_descripcion', 'epigrafe_contable_id', 
			'epigrafe_contable_descripcion','medico_id','medico_nombre_completo','terapia_id','terapia_descripcion','dispensador_id','tipo_dispensador_id','cab_e_s_id'
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(consumos_acumulados);

        res.header('Content-Type', 'text/csv');
        res.attachment('consumos_acumulados.csv');
        res.send(csv);

    } catch (err) {
        next(err);
    }
});

// ====== CSV EXPORT ROUTES ======

app.get('/dispensacion/export', async (req, res, next) => {
    try {
        let dispensacion = await FarmaController.listdispensacion();
        
        const fields = ['paciente_id', 'paciente_nombre_completo', 'nombre_medicamento', 
                       'fecha_inicio', 'fecha_fin', 'dosis', 'cantidad'];
        
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(dispensacion);
        
        res.header('Content-Type', 'text/csv');
        res.attachment('dispensacion.csv');
        res.send(csv);
    } catch (err) {
        next(err);
    }
});

app.get('/consumos_acumulados/export', async (req, res, next) => {
    try {
        let consumos_acumulados = await FarmaController.listConsumoAcumulado();
        
        const fields = ['almacen_id', 'fecha', 'gfh_id', 'nombre_medicamento', 
                       'unidades_totales', 'paciente_id'];
        
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(consumos_acumulados);
        
        res.header('Content-Type', 'text/csv');
        res.attachment('consumos_acumulados.csv');
        res.send(csv);
    } catch (err) {
        next(err);
    }
});

app.get('/actuaciones/export', async (req, res, next) => {
    try {
        let actuaciones = await FarmaController.listactuaciones();
        
        const fields = ['paciente_id', 'actuacion', 'farmaceutico', 'fecha', 'hora'];
        
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(actuaciones);
        
        res.header('Content-Type', 'text/csv');
        res.attachment('actuaciones.csv');
        res.send(csv);
    } catch (err) {
        next(err);
    }
});

// ---- ERROR HANDLING ----
// JSON parse error handler (body-parser) - return JSON for API routes
app.use(function (err, req, res, next) {
    if (err && err.type === 'entity.parse.failed') {
        // If the request was attempting to hit the statistics API, return JSON
        if (req.path && req.path.startsWith('/estadisticas/api')) {
            return res.status(400).json({ success: false, error: 'Invalid JSON payload' });
        }
    }
    return next(err);
});

// Simple ping endpoint to verify stats API availability
app.get('/estadisticas/api/ping', (req, res) => {
    res.json({ success: true, now: new Date().toISOString() });
});

// Diagnostic endpoint: check database using Mongoose models directly
app.get('/estadisticas/api/debug/counts', async (req, res) => {
    try {
        const dispensacion = require('./models/dispensacion');
        const consumos = require('./models/consumos_acumulados');
        const actuaciones = require('./models/actuaciones');
        
        const dispCount = await dispensacion.countDocuments({});
        const consumCount = await consumos.countDocuments({});
        const actuCount = await actuaciones.countDocuments({});
        
        res.json({
            dispensaciones: dispCount,
            consumos_acumulados: consumCount,
            actuaciones: actuCount,
            message: 'If all 0, database is empty'
        });
    } catch (err) {
        res.json({ error: err.message, stack: err.stack });
    }
});

app.get('/estadisticas/api/debug/sample', async (req, res) => {
    try {
        const dispensacion = require('./models/dispensacion');
        const sample = await dispensacion.findOne().lean();
        res.json({ 
            sample: sample,
            fieldNames: sample ? Object.keys(sample) : []
        });
    } catch (err) {
        res.json({ error: err.message });
    }
});

// Debug: return min/max dates across collections (ISO strings)
app.get('/estadisticas/api/debug/date-range', async (req, res) => {
    try {
        const dispensacion = require('./models/dispensacion');
        const consumos = require('./models/consumos_acumulados');
        const actuaciones = require('./models/actuaciones');

        const dispAgg = await dispensacion.aggregate([
            { $match: { fecha_inicio: { $exists: true, $ne: '' } } },
            { $project: { parsed: { $dateFromString: { dateString: '$fecha_inicio', format: '%d/%m/%Y', onError: null, onNull: null } } } },
            { $group: { _id: null, min: { $min: '$parsed' }, max: { $max: '$parsed' } } }
        ]);

        const consumAgg = await consumos.aggregate([
            { $match: { fecha: { $exists: true, $ne: '' } } },
            { $project: { parsed: { $dateFromString: { dateString: '$fecha', format: '%d/%m/%Y', onError: null, onNull: null } } } },
            { $group: { _id: null, min: { $min: '$parsed' }, max: { $max: '$parsed' } } }
        ]);

        const actAgg = await actuaciones.aggregate([
            { $project: { raw: { $getField: { field: 'paciente_id,actuacion,fecha,hora', input: '$$ROOT' } } } },
            { $project: { parts: { $split: ['$raw', ','] } } },
            { $project: { dateStr: { $arrayElemAt: ['$parts', 2] } } },
            { $project: { parsed: { $dateFromString: { dateString: '$dateStr', format: '%Y-%m-%d', onError: null, onNull: null } } } },
            { $group: { _id: null, min: { $min: '$parsed' }, max: { $max: '$parsed' } } }
        ]);

        const results = {
            dispensacion: dispAgg[0] || null,
            consumos: consumAgg[0] || null,
            actuaciones: actAgg[0] || null
        };

        // find global min/max
        const mins = [results.dispensacion?.min, results.consumos?.min, results.actuaciones?.min].filter(d => d);
        const maxs = [results.dispensacion?.max, results.consumos?.max, results.actuaciones?.max].filter(d => d);

        const globalMin = mins.length ? new Date(Math.min(...mins.map(d => new Date(d).getTime()))) : null;
        const globalMax = maxs.length ? new Date(Math.max(...maxs.map(d => new Date(d).getTime()))) : null;

        res.json({
            dispensacion: results.dispensacion ? { min: results.dispensacion.min, max: results.dispensacion.max } : null,
            consumos: results.consumos ? { min: results.consumos.min, max: results.consumos.max } : null,
            actuaciones: results.actuaciones ? { min: results.actuaciones.min, max: results.actuaciones.max } : null,
            global: { min: globalMin, max: globalMax }
        });
    } catch (err) {
        res.json({ error: err.message, stack: err.stack });
    }
});

app.use(function (req, res) {
    res.status(404).render('notFound');
});

app.use(function (err, req, res, next) {
    console.log(err);
    res.status(500).render('error', { error: err });
});

// ---- SERVER ----
const port = parseInt(process.env.PORT || '8001', 10);
app.listen(port, function () {
    console.log('App listening on port: ' + port);
});

