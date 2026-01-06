'use strict'
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ActuacionSchema = Schema({


    paciente_id: String,
    actuacion: String,
    farmaceutico: String,
    fecha: Date,
    hora: String,
    lin_observaciones: String

});

const ConsumoAcumuladoSchema = Schema({

    almacen_id: String,
    fecha: Date,
    gfh_id: String,
    gfh_descripcion: String,
    codigo_nacional: String,
    nombre_medicamento: String,
    unidades_totales: Number,
    principio_activo_id: String,
    principio_activo_descripcion: String,
    grupo_terapeutico_id: String,
    grupo_terapeutico_descripcion: String,
    tipo_especialidad1_id: String,
    tipo_especialidad1_descripcion: String,
    tipo_especialidad2_id: String,
    tipo_especialidad2_descripcion: String,
    tipo_especialidad3_id: String,
    tipo_especialidad3_descripcion: String,
    laboratorio_id: String,
    laboratorio_descripcion: String,
    paciente_id: String,
    paciente_nombre_completo: String,
    tipo_paciente_pe_id: String,
    tipo_paciente_pe_descripcion: String,
    epigrafe_contable_id: Number,
    epigrafe_contable_descripcion: String,
    medico_id: String,
    medico_nombre_completo: String,
    terapia_id: String,
    terapia_descripcion: String,
    dispensador_id: String,
    tipo_dispensador_id: String,
    cab_e_s_id: String,


});

const DispensacionSchema = Schema({
    cab_e_s_id: String,
    paciente_id: String,
    paciente_nombre_completo: String,
    programa_dispensacion_id: String,
    programa_dispensacion_descripcion: String,
    especialidad_id: String,
    dosis: Number,
    tipo_dosis: String,
    cantidad: Number,
    frecuencia_id: String,
    fecha_inicio: Date,
    fecha_fin: Date,
    total_dias: String,
    nombre_medicamento: String,
    gfh_id: String,
    gfh_descripcion: String,
    medico_id: String,
    medico_nombre_completo: String,
    precio_unidad_pvf_m: String
});
const pa_medicamentoSchema = new Schema({
    nombre_medicamento: String,
    principio_activo_descripcion: String
});
module.exports = mongoose.model('pa_medicamento', pa_medicamentoSchema, 'pa_medicamento');


const Actuacion = mongoose.model('Actuacion', ActuacionSchema);
module.exports = Actuacion;
const ConsumoAcumulado = mongoose.model('ConsumoAcumulado', ConsumoAcumuladoSchema);
module.exports = ConsumoAcumulado;

module.exports = mongoose.model('Dispensacion', DispensacionSchema);