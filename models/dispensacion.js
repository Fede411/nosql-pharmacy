'use strict'
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DispensacionSchema = new Schema({
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
module.exports = mongoose.model('dispensacion', DispensacionSchema, 'dispensacion');