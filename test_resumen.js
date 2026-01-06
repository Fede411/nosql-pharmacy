const mongoose = require('mongoose');
const EstadisticasController = require('./controllers/estadisticas');

async function test() {
  try {
    await mongoose.connect('mongodb://localhost:27017/prueba_farma');
    const res = await EstadisticasController.getResumenGeneral('2004-01-01','2004-12-31');
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
