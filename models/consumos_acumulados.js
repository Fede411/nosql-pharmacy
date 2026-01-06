'use strict'
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const ConsumoAcumuladoSchema = new Schema({

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
    tipo_especialidad1_descripcio: String,
    tipo_especialidad2_id: String,
    tipo_especialidad2_descripcio: String,
    tipo_especialidad3_id: String,
    tipo_especialidad3_descripcio: String,
    laboratorio_id: String,
    laboratorio_descripcion: String,
    paciente_id: String,
    nombre_completo: String,
    tipo_paciente_pe_id: String,
    tipo_paciente_pe_descripcion: String,
    epigrafe_contable_id: String,
    epigrafe_contable_descripcion: String,
    medico_id: String,
    medico_nombre_completo: String,
    terapia_id: String,
    terapia_descripcion: String,
    dispensador_id: String,
    tipo_dispensador_id: String,
    cab_e_s_id: String,


});


module.exports = mongoose.model('consumos_acumulados', ConsumoAcumuladoSchema);
