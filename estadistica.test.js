// estadisticas.test.js
'use strict';

const mongoose = require('mongoose');

const Actuaciones = require('./models/actuaciones');
const ConsumoAcumulado = require('./models/consumos_acumulados');
const Dispensacion = require('./models/dispensacion');
const PaMedicamento = require('./models/pa_medicamento');
const FarmaController = require('./controllers/farma');
const EstadisticasController = require('./controllers/estadisticas');

const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/prueba_farma';
const TIMEOUT = 30000;

// ==================== HELPER FUNCTIONS ====================

async function crearDatosPruebaAmpliados() {
    await Actuaciones.deleteMany({ paciente_id: /^TEST_/ });
    await ConsumoAcumulado.deleteMany({ paciente_id: /^TEST_/ });
    await Dispensacion.deleteMany({ paciente_id: /^TEST_/ });
    await PaMedicamento.deleteMany({ nombre_medicamento: /^TEST_/ });

    const principiosActivos = [
        { nombre_medicamento: 'TEST_MED_PA1', principio_activo_descripcion: 'TEST_PRINCIPIO_1' },
        { nombre_medicamento: 'TEST_MED_PA2', principio_activo_descripcion: 'TEST_PRINCIPIO_2' },
        { nombre_medicamento: 'TEST_MED_PA3', principio_activo_descripcion: 'TEST_PRINCIPIO_3' }
    ];
    await PaMedicamento.insertMany(principiosActivos);

    const dispensaciones = [
        {
            cab_e_s_id: 'TEST_CAB_001',
            paciente_id: 'TEST_PAC_001',
            paciente_nombre_completo: 'TEST PACIENTE UNO',
            programa_dispensacion_id: 'PROG_TEST',
            programa_dispensacion_descripcion: 'Programa Test',
            especialidad_id: 'ESP_TEST',
            dosis: 100,
            tipo_dosis: 'mg',
            cantidad: 30,
            frecuencia_id: 'FREQ_001',
            fecha_inicio: new Date('2024-01-15'),
            fecha_fin: new Date('2024-02-15'),
            total_dias: '31',
            nombre_medicamento: 'TEST_MED_PA1',
            gfh_id: 'GFH_TEST_1',
            gfh_descripcion: 'Test GFH 1',
            medico_id: 'MED_TEST',
            medico_nombre_completo: 'Dr. Test',
            precio_unidad_pvf_m: '0.50'
        },
        {
            cab_e_s_id: 'TEST_CAB_002',
            paciente_id: 'TEST_PAC_001',
            paciente_nombre_completo: 'TEST PACIENTE UNO',
            programa_dispensacion_id: 'PROG_TEST',
            programa_dispensacion_descripcion: 'Programa Test',
            especialidad_id: 'ESP_TEST',
            dosis: 200,
            tipo_dosis: 'mg',
            cantidad: 30,
            frecuencia_id: 'FREQ_001',
            fecha_inicio: new Date('2024-01-15'),
            fecha_fin: new Date('2024-02-15'),
            total_dias: '31',
            nombre_medicamento: 'TEST_MED_PA2',
            gfh_id: 'GFH_TEST_1',
            gfh_descripcion: 'Test GFH 1',
            medico_id: 'MED_TEST',
            medico_nombre_completo: 'Dr. Test',
            precio_unidad_pvf_m: '0.50'
        },
        {
            cab_e_s_id: 'TEST_CAB_003',
            paciente_id: 'TEST_PAC_001',
            paciente_nombre_completo: 'TEST PACIENTE UNO',
            programa_dispensacion_id: 'PROG_TEST',
            programa_dispensacion_descripcion: 'Programa Test',
            especialidad_id: 'ESP_TEST',
            dosis: 300,
            tipo_dosis: 'mg',
            cantidad: 30,
            frecuencia_id: 'FREQ_001',
            fecha_inicio: new Date('2024-01-15'),
            fecha_fin: new Date('2024-02-15'),
            total_dias: '31',
            nombre_medicamento: 'TEST_MED_PA3',
            gfh_id: 'GFH_TEST_1',
            gfh_descripcion: 'Test GFH 1',
            medico_id: 'MED_TEST',
            medico_nombre_completo: 'Dr. Test',
            precio_unidad_pvf_m: '0.50'
        },
        {
            cab_e_s_id: 'TEST_CAB_004',
            paciente_id: 'TEST_PAC_002',
            paciente_nombre_completo: 'TEST PACIENTE DOS',
            programa_dispensacion_id: 'PROG_TEST',
            programa_dispensacion_descripcion: 'Programa Test',
            especialidad_id: 'ESP_TEST',
            dosis: 100,
            tipo_dosis: 'mg',
            cantidad: 30,
            frecuencia_id: 'FREQ_001',
            fecha_inicio: new Date('2024-01-15'),
            fecha_fin: new Date('2024-02-15'),
            total_dias: '31',
            nombre_medicamento: 'TEST_MED_PA1',
            gfh_id: 'GFH_TEST_2',
            gfh_descripcion: 'Test GFH 2',
            medico_id: 'MED_TEST',
            medico_nombre_completo: 'Dr. Test',
            precio_unidad_pvf_m: '0.50'
        },
        {
            cab_e_s_id: 'TEST_CAB_005',
            paciente_id: 'TEST_PAC_002',
            paciente_nombre_completo: 'TEST PACIENTE DOS',
            programa_dispensacion_id: 'PROG_TEST',
            programa_dispensacion_descripcion: 'Programa Test',
            especialidad_id: 'ESP_TEST',
            dosis: 200,
            tipo_dosis: 'mg',
            cantidad: 30,
            frecuencia_id: 'FREQ_001',
            fecha_inicio: new Date('2024-01-15'),
            fecha_fin: new Date('2024-02-15'),
            total_dias: '31',
            nombre_medicamento: 'TEST_MED_PA2',
            gfh_id: 'GFH_TEST_2',
            gfh_descripcion: 'Test GFH 2',
            medico_id: 'MED_TEST',
            medico_nombre_completo: 'Dr. Test',
            precio_unidad_pvf_m: '0.50'
        },
        {
            cab_e_s_id: 'TEST_CAB_006',
            paciente_id: 'TEST_PAC_003',
            paciente_nombre_completo: 'TEST PACIENTE TRES',
            programa_dispensacion_id: 'PROG_TEST',
            programa_dispensacion_descripcion: 'Programa Test',
            especialidad_id: 'ESP_TEST',
            dosis: 100,
            tipo_dosis: 'mg',
            cantidad: 30,
            frecuencia_id: 'FREQ_001',
            fecha_inicio: new Date('2024-01-15'),
            fecha_fin: new Date('2024-02-15'),
            total_dias: '31',
            nombre_medicamento: 'TEST_MED_PA1',
            gfh_id: 'GFH_TEST_1',
            gfh_descripcion: 'Test GFH 1',
            medico_id: 'MED_TEST',
            medico_nombre_completo: 'Dr. Test',
            precio_unidad_pvf_m: '0.50'
        },
        {
            cab_e_s_id: 'TEST_CAB_007',
            paciente_id: 'TEST_PAC_NUEVO',
            paciente_nombre_completo: 'TEST PACIENTE NUEVO',
            programa_dispensacion_id: 'PROG_TEST',
            programa_dispensacion_descripcion: 'Programa Test',
            especialidad_id: 'ESP_TEST',
            dosis: 100,
            tipo_dosis: 'mg',
            cantidad: 30,
            frecuencia_id: 'FREQ_001',
            fecha_inicio: new Date('2024-03-15'),
            fecha_fin: new Date('2024-04-15'),
            total_dias: '31',
            nombre_medicamento: 'TEST_MED_PA1',
            gfh_id: 'GFH_TEST_3',
            gfh_descripcion: 'Test GFH 3',
            medico_id: 'MED_TEST',
            medico_nombre_completo: 'Dr. Test',
            precio_unidad_pvf_m: '0.50'
        }
    ];
    await Dispensacion.insertMany(dispensaciones);

    const consumos = [
        {
            almacen_id: 'ALM_TEST',
            fecha: new Date('2024-01-20'),
            gfh_id: 'GFH_TEST_1',
            gfh_descripcion: 'Test GFH 1',
            codigo_nacional: 'CN_TEST',
            nombre_medicamento: 'TEST_MEDICAMENTO',
            unidades_totales: 50,
            principio_activo_id: 'PA_TEST',
            principio_activo_descripcion: 'TEST_PRINCIPIO_1',
            grupo_terapeutico_id: 'GT_TEST',
            grupo_terapeutico_descripcion: 'Grupo Test',
            tipo_especialidad1_id: 'TE1_TEST',
            tipo_especialidad1_descripcio: 'Test',
            laboratorio_id: 'LAB_TEST',
            laboratorio_descripcion: 'Lab Test',
            paciente_id: 'TEST_PAC_CONSUMO',
            paciente_nombre_completo: 'TEST PACIENTE CONSUMO',
            tipo_paciente_pe_id: 'TPE_TEST',
            tipo_paciente_pe_descripcion: 'Test',
            epigrafe_contable_id: 'EC_TEST',
            epigrafe_contable_descripcion: 'Test',
            medico_id: 'MED_TEST',
            medico_nombre_completo: 'Dr. Test',
            terapia_id: 'TER_TEST',
            terapia_descripcion: 'Test',
            cab_e_s_id: 'CAB_TEST'
        },
        {
            almacen_id: 'ALM_TEST',
            fecha: new Date('2024-01-25'),
            gfh_id: 'GFH_TEST_2',
            gfh_descripcion: 'Test GFH 2',
            codigo_nacional: 'CN_TEST',
            nombre_medicamento: 'TEST_MEDICAMENTO',
            unidades_totales: 30,
            principio_activo_id: 'PA_TEST',
            principio_activo_descripcion: 'TEST_PRINCIPIO_1',
            grupo_terapeutico_id: 'GT_TEST',
            grupo_terapeutico_descripcion: 'Grupo Test',
            tipo_especialidad1_id: 'TE1_TEST',
            tipo_especialidad1_descripcio: 'Test',
            laboratorio_id: 'LAB_TEST',
            laboratorio_descripcion: 'Lab Test',
            paciente_id: 'TEST_PAC_CONSUMO',
            paciente_nombre_completo: 'TEST PACIENTE CONSUMO',
            tipo_paciente_pe_id: 'TPE_TEST',
            tipo_paciente_pe_descripcion: 'Test',
            epigrafe_contable_id: 'EC_TEST',
            epigrafe_contable_descripcion: 'Test',
            medico_id: 'MED_TEST',
            medico_nombre_completo: 'Dr. Test',
            terapia_id: 'TER_TEST',
            terapia_descripcion: 'Test',
            cab_e_s_id: 'CAB_TEST'
        }
    ];
    await ConsumoAcumulado.insertMany(consumos);

    const actuacionesData = [
        {
            paciente_id: 'TEST_PAC_ACT',
            actuacion: 'TEST ACTUACION',
            farmaceutico: 'TEST_FARM',
            fecha: new Date('2024-01-20'),
            hora: '10:00:00',
            lin_observaciones: 'Test actuacion 1'
        },
        {
            paciente_id: 'TEST_PAC_ACT',
            actuacion: 'TEST ACTUACION',
            farmaceutico: 'TEST_FARM',
            fecha: new Date('2024-01-25'),
            hora: '11:00:00',
            lin_observaciones: 'Test actuacion 2'
        }
    ];
    await Actuaciones.insertMany(actuacionesData);
}

async function limpiarDatosPrueba() {
    await Actuaciones.deleteMany({ paciente_id: /^TEST_/ });
    await ConsumoAcumulado.deleteMany({ paciente_id: /^TEST_/ });
    await Dispensacion.deleteMany({ paciente_id: /^TEST_/ });
    await PaMedicamento.deleteMany({ nombre_medicamento: /^TEST_/ });
}

// ==================== JEST CONFIGURATION  ====================
beforeAll(async () => {
    try {
        // Close any existing connection
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }

        // Connect to database - WITHOUT deprecated options
        await mongoose.connect(DB_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });

        console.log(' Connected to MongoDB for statistics tests');

        // Create test data
        await crearDatosPruebaAmpliados();
        console.log(' Test data created');
    } catch (error) {
        console.error(' Error in beforeAll:', error);
        throw error;
    }
}, TIMEOUT);

afterAll(async () => {
    try {
        // Wait a bit before cleaning to ensure all tests finished
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Clean test data
        await limpiarDatosPrueba();
        console.log(' Test data cleaned');

        // Close connection
        await mongoose.connection.close();
        console.log(' MongoDB connection closed');
    } catch (error) {
        console.error(' Error in afterAll:', error);
        // Don't throw error to allow Jest to finish properly
    }
}, TIMEOUT);

describe('27. Statistics Controller Tests', () => {

    describe('27.1 getResumenGeneral', () => {

        test('Should get general summary with all metrics', async () => {
            const resultado = await EstadisticasController.getResumenGeneral(
                '2024-01-01',
                '2024-03-01',
                null
            );

            expect(resultado).toBeDefined();
            expect(resultado.total_dispensaciones).toBeDefined();
            expect(resultado.pacientes_unicos).toBeDefined();
            expect(resultado.pacientes_nuevos).toBeDefined();
            expect(resultado.medicamentos_unicos).toBeDefined();
            expect(resultado.unidades_dispensadas).toBeDefined();
            expect(resultado.total_actuaciones).toBeDefined();
            expect(resultado.promedio_dispensaciones_paciente).toBeDefined();

            expect(typeof resultado.total_dispensaciones).toBe('number');
            expect(typeof resultado.pacientes_unicos).toBe('number');
            expect(typeof resultado.pacientes_nuevos).toBe('number');
            expect(typeof resultado.medicamentos_unicos).toBe('number');
            expect(typeof resultado.unidades_dispensadas).toBe('number');
            expect(typeof resultado.total_actuaciones).toBe('number');
        }, TIMEOUT);

        test('Should correctly calculate new patients', async () => {
            const resultado = await EstadisticasController.getResumenGeneral(
                '2024-03-01',
                '2024-04-01',
                null
            );

            expect(resultado).toBeDefined();
            expect(resultado.pacientes_nuevos).toBeGreaterThanOrEqual(0);
        }, TIMEOUT);

        test('Should filter by GFH correctly', async () => {
            const resultadoSinFiltro = await EstadisticasController.getResumenGeneral(
                '2024-01-01',
                '2024-03-01',
                null
            );

            const resultadoConFiltro = await EstadisticasController.getResumenGeneral(
                '2024-01-01',
                '2024-03-01',
                ['GFH_TEST_1']
            );

            expect(resultadoSinFiltro.total_dispensaciones).toBeGreaterThanOrEqual(
                resultadoConFiltro.total_dispensaciones
            );
        }, TIMEOUT);

        test('Should calculate average dispensations per patient', async () => {
            const resultado = await EstadisticasController.getResumenGeneral(
                '2024-01-01',
                '2024-03-01',
                null
            );

            if (resultado.pacientes_unicos > 0) {
                const promedioCalculado = resultado.total_dispensaciones / resultado.pacientes_unicos;
                expect(parseFloat(resultado.promedio_dispensaciones_paciente)).toBeCloseTo(promedioCalculado, 2);
            }
        }, TIMEOUT);
    });

    describe('27.2 getPacientesPorPeriodo', () => {

        test('Should group patients by month correctly', async () => {
            const resultado = await EstadisticasController.getPacientesPorPeriodo(
                '2024-01-01',
                '2024-03-01',
                null
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);

            if (resultado.length > 0) {
                const primerElemento = resultado[0];
                expect(primerElemento.periodo).toBeDefined();
                expect(primerElemento.total_dispensaciones).toBeDefined();
                expect(primerElemento.total_pacientes).toBeDefined();
                expect(typeof primerElemento.total_dispensaciones).toBe('number');
                expect(typeof primerElemento.total_pacientes).toBe('number');
            }
        }, TIMEOUT);

        test('Should order periods chronologically', async () => {
            const resultado = await EstadisticasController.getPacientesPorPeriodo(
                '2024-01-01',
                '2024-04-01',
                null
            );

            if (resultado.length > 1) {
                for (let i = 0; i < resultado.length - 1; i++) {
                    expect(resultado[i].periodo <= resultado[i + 1].periodo).toBe(true);
                }
            }
        }, TIMEOUT);

        test('Should count unique patients correctly', async () => {
            const resultado = await EstadisticasController.getPacientesPorPeriodo(
                '2024-01-01',
                '2024-03-01',
                null
            );

            resultado.forEach(periodo => {
                expect(periodo.total_pacientes).toBeLessThanOrEqual(periodo.total_dispensaciones);
            });
        }, TIMEOUT);

        test('Should filter by GFH', async () => {
            const resultadoConFiltro = await EstadisticasController.getPacientesPorPeriodo(
                '2024-01-01',
                '2024-03-01',
                ['GFH_TEST_1']
            );

            expect(resultadoConFiltro).toBeDefined();
            expect(Array.isArray(resultadoConFiltro)).toBe(true);
        }, TIMEOUT);
    });

    describe('27.3 getTopMedicamentos', () => {

        test('Should get top medications with correct limit', async () => {
            const limite = 5;
            const resultado = await EstadisticasController.getTopMedicamentos(
                '2024-01-01',
                '2024-03-01',
                limite,
                null
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
            expect(resultado.length).toBeLessThanOrEqual(limite);
        }, TIMEOUT);

        test('Should order medications by dispensations descending', async () => {
            const resultado = await EstadisticasController.getTopMedicamentos(
                '2024-01-01',
                '2024-03-01',
                10,
                null
            );

            if (resultado.length > 1) {
                for (let i = 0; i < resultado.length - 1; i++) {
                    expect(resultado[i].dispensaciones >= resultado[i + 1].dispensaciones).toBe(true);
                }
            }
        }, TIMEOUT);

        test('Should include unique patients per medication', async () => {
            const resultado = await EstadisticasController.getTopMedicamentos(
                '2024-01-01',
                '2024-03-01',
                10,
                null
            );

            resultado.forEach(med => {
                expect(med.medicamento).toBeDefined();
                expect(med.dispensaciones).toBeDefined();
                expect(med.pacientes_unicos).toBeDefined();
                expect(typeof med.dispensaciones).toBe('number');
                expect(typeof med.pacientes_unicos).toBe('number');
            });
        }, TIMEOUT);

        test('Unique patients should be less than or equal to dispensations', async () => {
            const resultado = await EstadisticasController.getTopMedicamentos(
                '2024-01-01',
                '2024-03-01',
                10,
                null
            );

            resultado.forEach(med => {
                expect(med.pacientes_unicos).toBeLessThanOrEqual(med.dispensaciones);
            });
        }, TIMEOUT);

        test('Should apply GFH filter correctly', async () => {
            const resultadoConFiltro = await EstadisticasController.getTopMedicamentos(
                '2024-01-01',
                '2024-03-01',
                10,
                ['GFH_TEST_1']
            );

            expect(resultadoConFiltro).toBeDefined();
            expect(Array.isArray(resultadoConFiltro)).toBe(true);
        }, TIMEOUT);
    });

    describe('27.4 getDistribucionActuaciones', () => {

        test('Should get actions distribution', async () => {
            const resultado = await EstadisticasController.getDistribucionActuaciones(
                '2024-01-01',
                '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);

            if (resultado.length > 0) {
                const primerElemento = resultado[0];
                expect(primerElemento.tipo).toBeDefined();
                expect(primerElemento.cantidad).toBeDefined();
                expect(typeof primerElemento.cantidad).toBe('number');
            }
        }, TIMEOUT);

        test('Should order by quantity descending', async () => {
            const resultado = await EstadisticasController.getDistribucionActuaciones(
                '2024-01-01',
                '2024-03-01'
            );

            if (resultado.length > 1) {
                for (let i = 0; i < resultado.length - 1; i++) {
                    expect(resultado[i].cantidad >= resultado[i + 1].cantidad).toBe(true);
                }
            }
        }, TIMEOUT);

        test('Should work without dates', async () => {
            const resultado = await EstadisticasController.getDistribucionActuaciones(
                null,
                null
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        }, TIMEOUT);

        test('All quantities should be positive', async () => {
            const resultado = await EstadisticasController.getDistribucionActuaciones(
                '2024-01-01',
                '2024-03-01'
            );

            resultado.forEach(actuacion => {
                expect(actuacion.cantidad).toBeGreaterThan(0);
            });
        }, TIMEOUT);
    });

    describe('27.5 getComparativaPacientes', () => {

        test('Should get new vs recurring patients comparison', async () => {
            const resultado = await EstadisticasController.getComparativaPacientes(
                '2024-01-01',
                '2024-03-01',
                null
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);

            if (resultado.length > 0) {
                const primerElemento = resultado[0];
                expect(primerElemento.periodo).toBeDefined();
                expect(primerElemento.total_pacientes).toBeDefined();
                expect(primerElemento.pacientes_nuevos).toBeDefined();
                expect(primerElemento.pacientes_recurrentes).toBeDefined();
            }
        }, TIMEOUT);

        test('Total patients should be sum of new and recurring', async () => {
            const resultado = await EstadisticasController.getComparativaPacientes(
                '2024-01-01',
                '2024-03-01',
                null
            );

            resultado.forEach(periodo => {
                const suma = periodo.pacientes_nuevos + periodo.pacientes_recurrentes;
                expect(suma).toBe(periodo.total_pacientes);
            });
        }, TIMEOUT);

        test('Should order by period', async () => {
            const resultado = await EstadisticasController.getComparativaPacientes(
                '2024-01-01',
                '2024-04-01',
                null
            );

            if (resultado.length > 1) {
                for (let i = 0; i < resultado.length - 1; i++) {
                    expect(resultado[i].periodo <= resultado[i + 1].periodo).toBe(true);
                }
            }
        }, TIMEOUT);

        test('Should filter by GFH', async () => {
            const resultadoConFiltro = await EstadisticasController.getComparativaPacientes(
                '2024-01-01',
                '2024-03-01',
                ['GFH_TEST_1']
            );

            expect(resultadoConFiltro).toBeDefined();
            expect(Array.isArray(resultadoConFiltro)).toBe(true);
        }, TIMEOUT);

        test('New patients should not be negative', async () => {
            const resultado = await EstadisticasController.getComparativaPacientes(
                '2024-01-01',
                '2024-03-01',
                null
            );

            resultado.forEach(periodo => {
                expect(periodo.pacientes_nuevos).toBeGreaterThanOrEqual(0);
                expect(periodo.pacientes_recurrentes).toBeGreaterThanOrEqual(0);
            });
        }, TIMEOUT);
    });

    describe('27.6 getDispensacionesPorGFH', () => {

        test('Should get dispensations grouped by GFH', async () => {
            const resultado = await EstadisticasController.getDispensacionesPorGFH(
                '2024-01-01',
                '2024-03-01',
                null
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);

            if (resultado.length > 0) {
                const primerElemento = resultado[0];
                expect(primerElemento.gfh).toBeDefined();
                expect(primerElemento.dispensaciones).toBeDefined();
                expect(primerElemento.pacientes_unicos).toBeDefined();
            }
        }, TIMEOUT);

        test('Should order by dispensations descending', async () => {
            const resultado = await EstadisticasController.getDispensacionesPorGFH(
                '2024-01-01',
                '2024-03-01',
                null
            );

            if (resultado.length > 1) {
                for (let i = 0; i < resultado.length - 1; i++) {
                    expect(resultado[i].dispensaciones >= resultado[i + 1].dispensaciones).toBe(true);
                }
            }
        }, TIMEOUT);

        test('Unique patients should be less than or equal to dispensations', async () => {
            const resultado = await EstadisticasController.getDispensacionesPorGFH(
                '2024-01-01',
                '2024-03-01',
                null
            );

            resultado.forEach(gfh => {
                expect(gfh.pacientes_unicos).toBeLessThanOrEqual(gfh.dispensaciones);
            });
        }, TIMEOUT);

        test('Should filter by specific GFH', async () => {
            const resultado = await EstadisticasController.getDispensacionesPorGFH(
                '2024-01-01',
                '2024-03-01',
                ['GFH_TEST_1']
            );

            expect(resultado).toBeDefined();
            if (resultado.length > 0) {
                resultado.forEach(gfh => {
                    expect(gfh.gfh).toBe('GFH_TEST_1');
                });
            }
        }, TIMEOUT);

        test('Should filter by multiple GFH', async () => {
            const resultado = await EstadisticasController.getDispensacionesPorGFH(
                '2024-01-01',
                '2024-03-01',
                ['GFH_TEST_1', 'GFH_TEST_2']
            );

            expect(resultado).toBeDefined();
            if (resultado.length > 0) {
                resultado.forEach(gfh => {
                    expect(['GFH_TEST_1', 'GFH_TEST_2']).toContain(gfh.gfh);
                });
            }
        }, TIMEOUT);
    });

    describe('27.7 getPrincipiosActivos', () => {

        test('Should get most used active principles', async () => {
            const resultado = await EstadisticasController.getPrincipiosActivos(
                '2024-01-01',
                '2024-03-01',
                null
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);

            if (resultado.length > 0) {
                const primerElemento = resultado[0];
                expect(primerElemento.principio_activo).toBeDefined();
                expect(primerElemento.unidades_totales).toBeDefined();
                expect(primerElemento.pacientes_unicos).toBeDefined();
            }
        }, TIMEOUT);

        test('Should order by total units descending', async () => {
            const resultado = await EstadisticasController.getPrincipiosActivos(
                '2024-01-01',
                '2024-03-01',
                null
            );

            if (resultado.length > 1) {
                for (let i = 0; i < resultado.length - 1; i++) {
                    expect(resultado[i].unidades_totales >= resultado[i + 1].unidades_totales).toBe(true);
                }
            }
        }, TIMEOUT);

        test('Should limit to 20 results', async () => {
            const resultado = await EstadisticasController.getPrincipiosActivos(
                '2024-01-01',
                '2024-03-01',
                null
            );

            expect(resultado.length).toBeLessThanOrEqual(20);
        }, TIMEOUT);

        test('Total units should be positive', async () => {
            const resultado = await EstadisticasController.getPrincipiosActivos(
                '2024-01-01',
                '2024-03-01',
                null
            );

            resultado.forEach(pa => {
                expect(pa.unidades_totales).toBeGreaterThan(0);
                expect(pa.pacientes_unicos).toBeGreaterThan(0);
            });
        }, TIMEOUT);

        test('Should filter by GFH', async () => {
            const resultadoConFiltro = await EstadisticasController.getPrincipiosActivos(
                '2024-01-01',
                '2024-03-01',
                ['GFH_TEST_1']
            );

            expect(resultadoConFiltro).toBeDefined();
            expect(Array.isArray(resultadoConFiltro)).toBe(true);
        }, TIMEOUT);
    });

    describe('27.8 Statistics error handling', () => {

        test('Should handle invalid dates in general summary', async () => {
            // Temporarily silence console.error
            const originalError = console.error;
            console.error = jest.fn();

            try {
                await EstadisticasController.getResumenGeneral(
                    'invalid-date',
                    'invalid-date',
                    null
                );
                // If it gets here without error, the test should fail
                expect(true).toBe(false);
            } catch (error) {
                expect(error).toBeDefined();
                expect(error.message).toBe('Fechas inválidas proporcionadas');
            } finally {
                // Restore console.error
                console.error = originalError;
            }
        }, TIMEOUT);

        test('Should handle empty GFH as no filter', async () => {
            const resultadoNulo = await EstadisticasController.getResumenGeneral(
                '2024-01-01',
                '2024-03-01',
                null
            );

            const resultadoVacio = await EstadisticasController.getResumenGeneral(
                '2024-01-01',
                '2024-03-01',
                []
            );

            expect(resultadoNulo.total_dispensaciones).toBe(resultadoVacio.total_dispensaciones);
        }, TIMEOUT);

        test('Should return empty arrays when no data exists', async () => {
            // Use a non-existent GFH instead of future dates
            // to ensure there is no data
            const resultado = await EstadisticasController.getTopMedicamentos(
                '2024-01-01',
                '2024-03-01',
                10,
                ['GFH_COMPLETELY_NON_EXISTENT_12345']
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
            expect(resultado.length).toBe(0);
        }, TIMEOUT);
    });

    describe('27.9 Data consistency between functions', () => {

        test('Total dispensations in summary should match sum of periods', async () => {
            const resumen = await EstadisticasController.getResumenGeneral(
                '2024-01-01',
                '2024-03-01',
                null
            );

            const periodos = await EstadisticasController.getPacientesPorPeriodo(
                '2024-01-01',
                '2024-03-01',
                null
            );

            const totalPeriodos = periodos.reduce((sum, p) => sum + p.total_dispensaciones, 0);
            expect(resumen.total_dispensaciones).toBe(totalPeriodos);
        }, TIMEOUT);

        test('Unique patients in summary should be consistent', async () => {
            const resumen = await EstadisticasController.getResumenGeneral(
                '2024-01-01',
                '2024-03-01',
                null
            );

            const comparativa = await EstadisticasController.getComparativaPacientes(
                '2024-01-01',
                '2024-03-01',
                null
            );

            if (comparativa.length > 0) {
                expect(resumen.pacientes_unicos).toBeGreaterThanOrEqual(resumen.pacientes_nuevos);
            }
        }, TIMEOUT);

        test('GFH in dispensations should match base data', async () => {
            const porGFH = await EstadisticasController.getDispensacionesPorGFH(
                '2024-01-01',
                '2024-03-01',
                null
            );

            const totalDispensaciones = porGFH.reduce((sum, g) => sum + g.dispensaciones, 0);

            const resumen = await EstadisticasController.getResumenGeneral(
                '2024-01-01',
                '2024-03-01',
                null
            );

            expect(totalDispensaciones).toBe(resumen.total_dispensaciones);
        }, TIMEOUT);
    });

    describe('27.10 Statistics query performance', () => {

        test('General summary should complete in reasonable time', async () => {
            const inicio = Date.now();

            await EstadisticasController.getResumenGeneral(
                '2024-01-01',
                '2024-12-31',
                null
            );

            const duracion = Date.now() - inicio;
            expect(duracion).toBeLessThan(5000);
        }, TIMEOUT);

        test('Top medications should be fast', async () => {
            const inicio = Date.now();

            await EstadisticasController.getTopMedicamentos(
                '2024-01-01',
                '2024-12-31',
                10,
                null
            );

            const duracion = Date.now() - inicio;
            expect(duracion).toBeLessThan(3000);
        }, TIMEOUT);

        test('Queries with GFH should not be significantly slower', async () => {
            const inicioSinFiltro = Date.now();
            await EstadisticasController.getResumenGeneral(
                '2024-01-01',
                '2024-03-01',
                null
            );
            const duracionSinFiltro = Date.now() - inicioSinFiltro;

            const inicioConFiltro = Date.now();
            await EstadisticasController.getResumenGeneral(
                '2024-01-01',
                '2024-03-01',
                ['GFH_TEST_1']
            );
            const duracionConFiltro = Date.now() - inicioConFiltro;

            expect(duracionConFiltro).toBeLessThan(duracionSinFiltro * 1.5);
        }, TIMEOUT);
    });

    describe('27.11 Edge cases in statistics', () => {

        test('Should handle single day period', async () => {
            const resultado = await EstadisticasController.getResumenGeneral(
                '2024-01-15',
                '2024-01-15',
                null
            );

            expect(resultado).toBeDefined();
            expect(resultado.total_dispensaciones).toBeGreaterThanOrEqual(0);
        }, TIMEOUT);

        test('Should handle dates in reverse order', async () => {
            const resultado = await EstadisticasController.getPacientesPorPeriodo(
                '2024-03-01',
                '2024-01-01',
                null
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        }, TIMEOUT);

        test('Should handle limit 0 in top medications', async () => {
            const resultado = await EstadisticasController.getTopMedicamentos(
                '2024-01-01',
                '2024-03-01',
                0,
                null
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
            expect(resultado.length).toBe(0);
        }, TIMEOUT);

        test('Should handle non-existent GFH', async () => {
            const resultado = await EstadisticasController.getResumenGeneral(
                '2024-01-01',
                '2024-03-01',
                ['GFH_NON_EXISTENT_XYZ']
            );

            expect(resultado).toBeDefined();
            expect(resultado.total_dispensaciones).toBe(0);
            expect(resultado.pacientes_unicos).toBe(0);
        }, TIMEOUT);
    });
});

describe('28. Statistics-Farma Controller Integration', () => {

    test('countPacienteByDate counts should match getResumenGeneral', async () => {
        const cuentaFarma = await FarmaController.countPacienteByDate(
            '2024-01-01',
            '2024-03-01',
            null
        );

        const resumenEstadisticas = await EstadisticasController.getResumenGeneral(
            '2024-01-01',
            '2024-03-01',
            null
        );

        expect(cuentaFarma.cuenta).toBe(resumenEstadisticas.pacientes_unicos);
    }, TIMEOUT);


    test('New patients should match between controllers', async () => {
        const resultadoNuevosFarma = await FarmaController.countPacienteNuevoByDate(
            '2024-03-01',
            '2024-04-01',
            null
        );

        const resumenEstadisticas = await EstadisticasController.getResumenGeneral(
            '2024-03-01',
            '2024-04-01',
            null
        );


        expect(resultadoNuevosFarma.cuenta).toBe(resumenEstadisticas.pacientes_nuevos);
    }, TIMEOUT);

    test('countPacienteByDate counts should match getResumenGeneral', async () => {
        const cuentaFarma = await FarmaController.countPacienteByDate(
            '2024-01-01',
            '2024-03-01',
            null
        );

        const resumenEstadisticas = await EstadisticasController.getResumenGeneral(
            '2024-01-01',
            '2024-03-01',
            null
        );

        expect(cuentaFarma.cuenta).toBe(resumenEstadisticas.pacientes_unicos);
    }, TIMEOUT);
});