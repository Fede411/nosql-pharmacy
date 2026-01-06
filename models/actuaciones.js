'use strict'
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const actuacionesSchema = new Schema({


    paciente_id: String,
    actuacion: String,
    farmaceutico: String,
    fecha: Date,
    hora: String,
    lin_observaciones: String

});



module.exports = mongoose.model('actuaciones', actuacionesSchema);