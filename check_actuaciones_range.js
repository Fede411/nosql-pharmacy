const mongoose = require('mongoose');
const EstadisticasController = require('./controllers/estadisticas');

async function runChecks() {
  try {
    await mongoose.connect('mongodb://localhost:27017/prueba_farma');

    console.log('\n-- getDistribucionActuaciones 2020-2024 --');
    const dist = await EstadisticasController.getDistribucionActuaciones('2020-01-01','2024-12-31');
    console.log(JSON.stringify(dist.slice(0,20), null, 2));

    console.log('\n-- getTendenciasActuaciones 2020-2024 --');
    const tendencias = await EstadisticasController.getTendenciasActuaciones('2020-01-01','2024-12-31');
    console.log(JSON.stringify(tendencias.slice(0,20), null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

runChecks();
