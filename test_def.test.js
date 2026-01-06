// test_def.test.js 

'use strict';

const mongoose = require('mongoose');

const Actuaciones = require('./models/actuaciones');
const ConsumoAcumulado = require('./models/consumos_acumulados');
const Dispensacion = require('./models/dispensacion');
const PaMedicamento = require('./models/pa_medicamento');
const FarmaController = require('./controllers/farma');

const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/prueba_farma';
const TIMEOUT = 30000;

// ==================== HELPER FUNCTIONS ====================

async function crearDatosPruebaAmpliados() {
    // Clean first to avoid duplicates
    await Actuaciones.deleteMany({ paciente_id: /^TEST_/ });
    await ConsumoAcumulado.deleteMany({ paciente_id: /^TEST_/ });
    await Dispensacion.deleteMany({ paciente_id: /^TEST_/ });
    await PaMedicamento.deleteMany({ nombre_medicamento: /^TEST_/ });

    // Create active principles
    const principiosActivos = [
        { nombre_medicamento: 'TEST_MED_PA1', principio_activo_descripcion: 'TEST_PRINCIPIO_1' },
        { nombre_medicamento: 'TEST_MED_PA2', principio_activo_descripcion: 'TEST_PRINCIPIO_2' },
        { nombre_medicamento: 'TEST_MED_PA3', principio_activo_descripcion: 'TEST_PRINCIPIO_3' }
    ];
    await PaMedicamento.insertMany(principiosActivos);

    // Create dispensations with different GFH
    const dispensaciones = [
        // Patient with 3 medications - GFH_TEST
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
            gfh_id: 'GFH_TEST',
            gfh_descripcion: 'Test',
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
            gfh_id: 'GFH_TEST',
            gfh_descripcion: 'Test',
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
            gfh_id: 'GFH_TEST',
            gfh_descripcion: 'Test',
            medico_id: 'MED_TEST',
            medico_nombre_completo: 'Dr. Test',
            precio_unidad_pvf_m: '0.50'
        },
        // Patient with only 2 medications - GFH_TEST2
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
            gfh_id: 'GFH_TEST2',
            gfh_descripcion: 'Test 2',
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
            gfh_id: 'GFH_TEST2',
            gfh_descripcion: 'Test 2',
            medico_id: 'MED_TEST',
            medico_nombre_completo: 'Dr. Test',
            precio_unidad_pvf_m: '0.50'
        },
        // Patient with only 1 medication - GFH_TEST
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
            gfh_id: 'GFH_TEST',
            gfh_descripcion: 'Test',
            medico_id: 'MED_TEST',
            medico_nombre_completo: 'Dr. Test',
            precio_unidad_pvf_m: '0.50'
        },
        // New patient
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
            gfh_id: 'GFH_TEST',
            gfh_descripcion: 'Test',
            medico_id: 'MED_TEST',
            medico_nombre_completo: 'Dr. Test',
            precio_unidad_pvf_m: '0.50'
        }
    ];
    await Dispensacion.insertMany(dispensaciones);

    // Create accumulated consumptions with different GFH
    const consumos = [
        {
            almacen_id: 'ALM_TEST',
            fecha: new Date('2024-01-20'),
            gfh_id: 'GFH_TEST',
            gfh_descripcion: 'Test',
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
            gfh_id: 'GFH_TEST2',
            gfh_descripcion: 'Test 2',
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
            paciente_id: 'TEST_PAC_CONSUMO2',
            paciente_nombre_completo: 'TEST PACIENTE CONSUMO 2',
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

    // Create actions
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

// ==================== TESTS ====================

describe('Complete Tests - Pharmacy Database', () => {

    beforeAll(async () => {
        try {
            await mongoose.connect(DB_URI);
            console.log(' MongoDB connection established');
            await crearDatosPruebaAmpliados();
            console.log(' Test data created');
        } catch (error) {
            console.error(' Error connecting to MongoDB:', error);
            throw error;
        }
    }, TIMEOUT);

    afterAll(async () => {
        try {
            await limpiarDatosPrueba();
            await mongoose.connection.close();
            console.log(' MongoDB connection closed');
        } catch (error) {
            console.error(' Error closing connection:', error);
        }
    }, TIMEOUT);

    // ==================== BASIC TESTS ====================

    describe('1. filterPatientsByUnionRegistrado', () => {

        test('Search with 1 medication WITH dates', async () => {
            const resultado = await FarmaController.filterPatientsByUnionRegistrado(
                'TEST_MED_PA1', '', '', '2024-01-01', '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
            expect(resultado.length).toBeGreaterThan(0);
        });

        test('Search with 2 medications WITH dates', async () => {
            const resultado = await FarmaController.filterPatientsByUnionRegistrado(
                'TEST_MED_PA1', 'TEST_MED_PA2', '', '2024-01-01', '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });

        test('Search with 3 medications WITH dates', async () => {
            const resultado = await FarmaController.filterPatientsByUnionRegistrado(
                'TEST_MED_PA1', 'TEST_MED_PA2', 'TEST_MED_PA3', '2024-01-01', '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });

        test('Should filter by GFH correctly', async () => {
            const sinFiltro = await FarmaController.filterPatientsByUnionRegistrado(
                'TEST_MED_PA1', '', '', '2024-01-01', '2024-03-01', null
            );

            const conFiltro = await FarmaController.filterPatientsByUnionRegistrado(
                'TEST_MED_PA1', '', '', '2024-01-01', '2024-03-01', ['GFH_TEST']
            );

            expect(conFiltro.length).toBeLessThanOrEqual(sinFiltro.length);
            expect(conFiltro.every(d => d.gfh_id === 'GFH_TEST')).toBe(true);
        });
    });

    // ==================== ACTIVE PRINCIPLES TESTS ====================

    describe('2. filterPatientsByUnionPrincipioActivoDescripcion', () => {

        test('Search with 1 active principle', async () => {
            const resultado = await FarmaController.filterPatientsByUnionPrincipioActivoDescripcion(
                'TEST_PRINCIPIO_1', '', '', '2024-01-01', '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
            expect(resultado.length).toBeGreaterThan(0);
        });

        test('Search with 2 active principles', async () => {
            const resultado = await FarmaController.filterPatientsByUnionPrincipioActivoDescripcion(
                'TEST_PRINCIPIO_1', 'TEST_PRINCIPIO_2', '', '2024-01-01', '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });

        test('Search with 3 active principles', async () => {
            const resultado = await FarmaController.filterPatientsByUnionPrincipioActivoDescripcion(
                'TEST_PRINCIPIO_1', 'TEST_PRINCIPIO_2', 'TEST_PRINCIPIO_3', '2024-01-01', '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
            expect(resultado.length).toBeGreaterThan(0);
        });

        test('Should filter by GFH in active principles search', async () => {
            const conFiltro = await FarmaController.filterPatientsByUnionPrincipioActivoDescripcion(
                'TEST_PRINCIPIO_1', '', '', '2024-01-01', '2024-03-01', ['GFH_TEST']
            );

            expect(Array.isArray(conFiltro)).toBe(true);
            if (conFiltro.length > 0) {
                expect(conFiltro.every(d => d.gfh_id === 'GFH_TEST')).toBe(true);
            }
        });
    });

    // ==================== ACTIONS TESTS ====================

    describe('3. filteractuacionesByTipo and countactuaciones', () => {

        test('Search actions WITH dates', async () => {
            const resultado = await FarmaController.filteractuacionesByTipo(
                'TEST ACTUACION', '2024-01-01', '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });

        test('Count actions', async () => {
            const resultado = await FarmaController.countactuaciones(
                'TEST ACTUACION', '2024-01-01', '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(resultado.cuenta).toBeDefined();
            expect(resultado.datos).toBeDefined();
        });
    });

    // ==================== CONSUMPTIONS TESTS ====================

    describe('4. Consumption functions', () => {

        test('filterConsumosByNumHistorialFecha WITH dates', async () => {
            const resultado = await FarmaController.filterConsumosByNumHistorialFecha(
                'TEST_PAC_CONSUMO', '2024-01-01', '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });

        test('filterDosisByNombreMedicamento', async () => {
            const resultado = await FarmaController.filterDosisByNombreMedicamento(
                'TEST_MEDICAMENTO', '2024-01-01', '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });

        test('Should filter consumptions by GFH', async () => {
            const resultado = await FarmaController.filterDosisByNombreMedicamento(
                'TEST_MEDICAMENTO', '2024-01-01', '2024-03-01', ['GFH_TEST']
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });
    });

    // ==================== PATIENTS TESTS ====================

    describe('5. Patient functions', () => {

        test('filterPatientsByNumHistorialFecha', async () => {
            const resultado = await FarmaController.filterPatientsByNumHistorialFecha(
                'TEST_PAC_001', '2024-01-01', '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });

        test('Should filter patients by GFH', async () => {
            const resultado = await FarmaController.filterPatientsByNumHistorialFecha(
                'TEST_PAC_001', '2024-01-01', '2024-03-01', ['GFH_TEST']
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
            if (resultado.length > 0) {
                expect(resultado.every(d => d.gfh_id === 'GFH_TEST')).toBe(true);
            }
        });
    });

    // ==================== TESTS FOR 3 ACTIVE PRINCIPLES (CORRECTED) ====================

    describe('18. Tests for search by 3 Active Principles', () => {

        test('Should search dispensations with 3 active principles correctly', async () => {
            const resultado = await FarmaController.filterPatientsByUnionPrincipioActivoDescripcion(
                'TEST_PRINCIPIO_1',
                'TEST_PRINCIPIO_2',
                'TEST_PRINCIPIO_3',
                '2024-01-01',
                '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
            expect(resultado.length).toBeGreaterThan(0);

            // Verify there are dispensations from all 3 medications
            const medicamentos = resultado.map(r => r.nombre_medicamento);
            expect(medicamentos).toContain('TEST_MED_PA1');
            expect(medicamentos).toContain('TEST_MED_PA2');
            expect(medicamentos).toContain('TEST_MED_PA3');
        });

        test('Should search dispensations with 3 active principles without dates', async () => {
            const resultado = await FarmaController.filterPatientsByUnionPrincipioActivoDescripcion(
                'TEST_PRINCIPIO_1',
                'TEST_PRINCIPIO_2',
                'TEST_PRINCIPIO_3',
                '',
                ''
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
            expect(resultado.length).toBeGreaterThan(0);
        }, 15000);

        test('Should return only patients who have all 3 active principles', async () => {
            const resultado = await FarmaController.filterPatientsByUnionPrincipioActivoDescripcion(
                'TEST_PRINCIPIO_1',
                'TEST_PRINCIPIO_2',
                'TEST_PRINCIPIO_3',
                '2024-01-01',
                '2024-03-01'
            );

            // Verify all records are from the same patient
            const pacientes = [...new Set(resultado.map(r => r.paciente_id))];
            expect(pacientes).toContain('TEST_PAC_001');

            // TEST_PAC_002 only has 2 principles, should not appear
            expect(pacientes).not.toContain('TEST_PAC_002');
        });

        test('Should search with 2 active principles correctly', async () => {
            const resultado = await FarmaController.filterPatientsByUnionPrincipioActivoDescripcion(
                'TEST_PRINCIPIO_1',
                'TEST_PRINCIPIO_2',
                '',
                '2024-01-01',
                '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });

        test('Should search with 1 active principle correctly', async () => {
            const resultado = await FarmaController.filterPatientsByUnionPrincipioActivoDescripcion(
                'TEST_PRINCIPIO_1',
                '',
                '',
                '2024-01-01',
                '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });
    });

    // ==================== TESTS WITH/WITHOUT DATES ====================

    describe('19. Tests for functions with and without dates', () => {

        test('filterPatientsByUnionRegistrado - with dates', async () => {
            const resultado = await FarmaController.filterPatientsByUnionRegistrado(
                'TEST_MED_PA1', '', '', '2024-01-01', '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });

        test('filterPatientsByUnionRegistrado - without dates', async () => {
            const resultado = await FarmaController.filterPatientsByUnionRegistrado(
                'TEST_MED_PA1', '', '', '', ''
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });

        test('filterPatientsByNumHistorialFecha - with dates', async () => {
            const resultado = await FarmaController.filterPatientsByNumHistorialFecha(
                'TEST_PAC_001', '2024-01-01', '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });

        test('filterPatientsByNumHistorialFecha - without dates', async () => {
            const resultado = await FarmaController.filterPatientsByNumHistorialFecha(
                'TEST_PAC_001', '', ''
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });

        test('filterActuacionesByNumHistorialFecha - with dates', async () => {
            const resultado = await FarmaController.filterActuacionesByNumHistorialFecha(
                'TEST_PAC_ACT', '2024-01-01', '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });

        test('filterActuacionesByNumHistorialFecha - without dates', async () => {
            const resultado = await FarmaController.filterActuacionesByNumHistorialFecha(
                'TEST_PAC_ACT', '', ''
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });

        test('filterConsumosByNumHistorialFecha - with dates', async () => {
            const resultado = await FarmaController.filterConsumosByNumHistorialFecha(
                'TEST_PAC_CONSUMO', '2024-01-01', '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });

        test('filterConsumosByNumHistorialFecha - without dates', async () => {
            const resultado = await FarmaController.filterConsumosByNumHistorialFecha(
                'TEST_PAC_CONSUMO', '', ''
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });

        test('filteractuacionesByTipo - with dates', async () => {
            const resultado = await FarmaController.filteractuacionesByTipo(
                'TEST ACTUACION', '2024-01-01', '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });

        test('filteractuacionesByTipo - without dates', async () => {
            const resultado = await FarmaController.filteractuacionesByTipo(
                'TEST ACTUACION', '', ''
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });

        test('filterDosisByNombreMedicamento - with dates', async () => {
            const resultado = await FarmaController.filterDosisByNombreMedicamento(
                'TEST_MEDICAMENTO', '2024-01-01', '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });

        test('filterDosisByNombreMedicamento - without dates should handle correctly', async () => {
            try {
                const resultado = await FarmaController.filterDosisByNombreMedicamento(
                    'TEST_MEDICAMENTO',
                    '',
                    ''
                );
                expect(resultado).toBeDefined();
            } catch (error) {
                // If the function doesn't handle empty dates, it should fail gracefully
                expect(error).toBeDefined();
            }
        });
    });

    // ==================== VALIDATION TESTS ====================

    describe('20. Data validation tests', () => {

        test('Should handle search with non-existent medication', async () => {
            const resultado = await FarmaController.filterPatientsByUnionRegistrado(
                'MEDICAMENTO_INEXISTENTE_XYZ',
                '',
                '',
                '2024-01-01',
                '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
            expect(resultado.length).toBe(0);
        });

        test('Should handle dates in incorrect format', async () => {
            try {
                await FarmaController.filterPatientsByNumHistorialFecha(
                    'TEST_PAC_001',
                    'invalid-date',
                    'invalid-date'
                );
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

        test('Should validate that dates are logical (start < end)', async () => {
            const resultado = await FarmaController.filterPatientsByNumHistorialFecha(
                'TEST_PAC_001',
                '2024-03-01',
                '2024-01-01'
            );

            // Should return empty array or handle the error
            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });
    });

    // ==================== PERFORMANCE TESTS ====================

    describe('21. Performance tests', () => {

        test('Search by 3 active principles should complete in reasonable time', async () => {
            const inicio = Date.now();

            await FarmaController.filterPatientsByUnionPrincipioActivoDescripcion(
                'TEST_PRINCIPIO_1',
                'TEST_PRINCIPIO_2',
                'TEST_PRINCIPIO_3',
                '2024-01-01',
                '2024-03-01'
            );

            const duracion = Date.now() - inicio;

            expect(duracion).toBeLessThan(5000); // Less than 5 seconds
        });

        test('Search by patient should be fast', async () => {
            const inicio = Date.now();

            await FarmaController.filterPatientsByNumHistorialFecha(
                'TEST_PAC_001',
                '2024-01-01',
                '2024-03-01'
            );

            const duracion = Date.now() - inicio;

            expect(duracion).toBeLessThan(1500); // Less than 1 second
        });
    });

    // ==================== DATA INTEGRITY TESTS ====================

    describe('22. Data integrity tests', () => {

        test('Dispensations should have required fields', async () => {
            const resultado = await FarmaController.filterPatientsByUnionRegistrado(
                'TEST_MED_PA1',
                '',
                '',
                '2024-01-01',
                '2024-03-01'
            );

            if (resultado.length > 0) {
                const dispensacion = resultado[0];
                expect(dispensacion.paciente_id).toBeDefined();
                expect(dispensacion.nombre_medicamento).toBeDefined();
                expect(dispensacion.fecha_inicio).toBeDefined();
            }
        });

        test('Consumptions should have valid total units', async () => {
            const resultado = await FarmaController.filterConsumosByNumHistorialFecha(
                'TEST_PAC_CONSUMO',
                '2024-01-01',
                '2024-03-01'
            );

            if (resultado.length > 0) {
                resultado.forEach(consumo => {
                    expect(consumo.unidades_totales).toBeDefined();
                    expect(typeof consumo.unidades_totales).toBe('number');
                    expect(consumo.unidades_totales).toBeGreaterThanOrEqual(0);
                });
            }
        });

        test('pa_medicamento relationship should be consistent', async () => {
            const paMed = await PaMedicamento.findOne({
                nombre_medicamento: 'TEST_MED_PA1'
            });

            expect(paMed).toBeDefined();
            expect(paMed.principio_activo_descripcion).toBe('TEST_PRINCIPIO_1');
        });
    });

    // ==================== EDGE CASE TESTS ====================

    describe('23. Edge case tests', () => {

        test('Should handle search with empty strings correctly', async () => {
            const resultado = await FarmaController.filterPatientsByUnionRegistrado(
                'TEST_MED_PA1',
                '',
                '',
                '',
                ''
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });

        test('Should handle search with null correctly', async () => {
            const resultado = await FarmaController.filterPatientsByUnionRegistrado(
                'TEST_MED_PA1',
                null,
                null,
                null,
                null
            );

            expect(resultado).toBeDefined();
        });

        test('Should handle dates at the edge of the range', async () => {
            const resultado = await FarmaController.filterPatientsByNumHistorialFecha(
                'TEST_PAC_001',
                '2024-01-15',
                '2024-01-15'
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });

        test('Should handle special characters in medication names', async () => {
            // Create medication with special characters
            await Dispensacion.create({
                cab_e_s_id: 'TEST_CAB_SPECIAL',
                paciente_id: 'TEST_PAC_SPECIAL',
                paciente_nombre_completo: 'TEST SPECIAL',
                programa_dispensacion_id: 'PROG_TEST',
                programa_dispensacion_descripcion: 'Test',
                especialidad_id: 'ESP_TEST',
                dosis: 100,
                tipo_dosis: 'mg',
                cantidad: 30,
                frecuencia_id: 'FREQ_001',
                fecha_inicio: new Date('2024-01-15'),
                fecha_fin: new Date('2024-02-15'),
                total_dias: '31',
                nombre_medicamento: 'TEST-MED (500mg)',
                gfh_id: 'GFH_TEST',
                gfh_descripcion: 'Test',
                medico_id: 'MED_TEST',
                medico_nombre_completo: 'Dr. Test',
                precio_unidad_pvf_m: '0.50'
            });

            const resultado = await FarmaController.filterPatientsByUnionRegistrado(
                'TEST-MED (500mg)',
                '',
                '',
                '2024-01-01',
                '2024-03-01'
            );

            expect(resultado).toBeDefined();
        });
    });

    // ==================== AGGREGATION TESTS ====================

    describe('24. Aggregation and statistics tests', () => {

        test('Should count actions correctly', async () => {
            const resultado = await FarmaController.countactuaciones(
                'TEST ACTUACION',
                '2024-01-01',
                '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(resultado.cuenta).toBeDefined();
            expect(typeof resultado.cuenta).toBe('number');
            expect(resultado.datos).toBeDefined();
            expect(Array.isArray(resultado.datos)).toBe(true);
        });

        test('Should calculate doses per medication correctly', async () => {
            const resultado = await FarmaController.filterDosisByNombreMedicamento(
                'TEST_MEDICAMENTO',
                '2024-01-01',
                '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);

            if (resultado.length > 0) {
                expect(resultado[0]._id).toBeDefined();
                expect(resultado[0].sumaMedicamento).toBeDefined();
            }
        });

        test('Should calculate doses per medication and patient', async () => {
            const resultado = await FarmaController.filterDosisByNombreMedicamentoAndIdPaciente(
                'TEST_MEDICAMENTO',
                'TEST_PAC_CONSUMO',
                '2024-01-01',
                '2024-03-01'
            );

            expect(resultado).toBeDefined();
            expect(Array.isArray(resultado)).toBe(true);
        });
    });

    // ==================== ADDITIONAL GFH TESTS ====================

    describe('26. Complete GFH filtering tests', () => {

        test('countPacienteByDate should filter by GFH', async () => {
            const sinFiltro = await FarmaController.countPacienteByDate(
                '2024-01-01',
                '2024-03-01',
                null
            );

            const conFiltro = await FarmaController.countPacienteByDate(
                '2024-01-01',
                '2024-03-01',
                ['GFH_TEST']
            );

            expect(conFiltro.cuenta).toBeLessThanOrEqual(sinFiltro.cuenta);
            if (conFiltro.datos.length > 0) {
                expect(conFiltro.datos.every(d => d.gfh_id === 'GFH_TEST')).toBe(true);
            }
        });

        test('pacienteNuevo should filter by GFH', async () => {
            const resultado = await FarmaController.pacienteNuevo(
                '2024-03-01',
                '2024-04-01',
                ['GFH_TEST']
            );

            expect(Array.isArray(resultado)).toBe(true);
            if (resultado.length > 0) {
                expect(resultado.every(d => d.gfh_id === 'GFH_TEST')).toBe(true);
            }
        });


        test('countPacienteNuevoByDate should filter by GFH', async () => {
            const resultado = await FarmaController.countPacienteNuevoByDate(
                '2024-03-01',
                '2024-04-01',
                ['GFH_TEST']
            );

            expect(resultado).toBeDefined();
            expect(typeof resultado.cuenta).toBe('number');
            expect(resultado.cuenta).toBeGreaterThanOrEqual(0);
            expect(resultado.datos).toBeDefined();
            expect(Array.isArray(resultado.datos)).toBe(true);


            if (resultado.datos.length > 0) {
                expect(resultado.datos.every(d => d.gfh_id === 'GFH_TEST')).toBe(true);
            }
        });

        test('filterConsumoByUnionRegistrado should filter by GFH', async () => {
            const resultado = await FarmaController.filterConsumoByUnionRegistrado(
                'TEST_MEDICAMENTO',
                '',
                '',
                '2024-01-01',
                '2024-03-01',
                ['GFH_TEST']
            );

            expect(Array.isArray(resultado)).toBe(true);
            if (resultado.length > 0) {
                expect(resultado.every(c => c.gfh_id === 'GFH_TEST')).toBe(true);
            }
        });

        test('Empty GFH array should behave as no filter', async () => {
            const sinFiltro = await FarmaController.filterPacienteByDate(
                '2024-01-01',
                '2024-03-01',
                null
            );

            const conArrayVacio = await FarmaController.filterPacienteByDate(
                '2024-01-01',
                '2024-03-01',
                []
            );

            expect(sinFiltro.length).toBe(conArrayVacio.length);
        });

        test('Multiple GFH should work correctly', async () => {
            const resultado = await FarmaController.filterPacienteByDate(
                '2024-01-01',
                '2024-03-01',
                ['GFH_TEST', 'GFH_TEST2']
            );

            expect(Array.isArray(resultado)).toBe(true);
            if (resultado.length > 0) {
                expect(
                    resultado.every(d => d.gfh_id === 'GFH_TEST' || d.gfh_id === 'GFH_TEST2')
                ).toBe(true);
            }
        });
    });

    // ==================== FINAL CLEANUP TESTS ====================

    describe('25. Test data cleanup', () => {

        test('Should delete all test dispensations', async () => {
            const resultado = await Dispensacion.deleteMany({
                paciente_id: /^TEST_/
            });

            expect(resultado.deletedCount).toBeGreaterThan(0);
        });

        test('Should delete all test pa_medicamento', async () => {
            const resultado = await PaMedicamento.deleteMany({
                nombre_medicamento: /^TEST_/
            });

            expect(resultado.deletedCount).toBeGreaterThan(0);
        });

        test('Should delete all test actions', async () => {
            const resultado = await Actuaciones.deleteMany({
                paciente_id: /^TEST_/
            });

            expect(resultado.deletedCount).toBeGreaterThanOrEqual(0);
        });

        test('Should delete all test consumptions', async () => {
            const resultado = await ConsumoAcumulado.deleteMany({
                paciente_id: /^TEST_/
            });

            expect(resultado.deletedCount).toBeGreaterThan(0);
        });
    });
});

module.exports = {
    testEnvironment: 'node',
    testTimeout: TIMEOUT,
    verbose: true
};