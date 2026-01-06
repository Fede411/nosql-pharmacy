'use strict'
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pa_medicamentoSchema = new Schema({
    nombre_medicamento: String,
    principio_activo_descripcion: String
});
module.exports = mongoose.model('pa_medicamento', pa_medicamentoSchema, 'pa_medicamento');