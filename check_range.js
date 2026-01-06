const mongoose = require('mongoose');
const dispensacion = require('./models/dispensacion');

async function checkDateRange() {
    try {
        await mongoose.connect('mongodb://localhost:27017/prueba_farma');
        // Get all distinct dates as strings, then parse them
        const docs = await dispensacion.find({}, { fecha_inicio: 1 }).limit(1000).lean();
        const dates = docs.map(d => {
            const parts = d.fecha_inicio.split('/');
            return new Date(parts[2], parts[1]-1, parts[0]); // DD/MM/YYYY -> Date
        }).sort((a,b) => a-b);
        
        console.log('First date:', dates[0]);
        console.log('Last date:', dates[dates.length-1]);
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkDateRange();
