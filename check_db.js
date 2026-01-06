const mongoose = require('mongoose');
const dispensacion = require('./models/dispensacion');

async function checkDB() {
    try {
        await mongoose.connect('mongodb://localhost:27017/prueba_farma');
        const count = await dispensacion.countDocuments({});
        const sample = await dispensacion.findOne().lean();
        console.log('Dispensacion count:', count);
        console.log('Sample doc:', JSON.stringify(sample, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkDB();
