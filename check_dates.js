const mongoose = require('mongoose');
const dispensacion = require('./models/dispensacion');

async function checkDates() {
    try {
        await mongoose.connect('mongodb://localhost:27017/prueba_farma');
        const docs = await dispensacion.find({}).select('fecha_inicio').limit(20).lean();
        console.log('Sample dates:');
        docs.forEach(d => console.log(d.fecha_inicio));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkDates();
