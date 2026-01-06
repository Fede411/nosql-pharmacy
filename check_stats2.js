const mongoose = require('mongoose');
const EstadisticasController = require('./controllers/estadisticas');

async function runChecks() {
  try {
    await mongoose.connect('mongodb://localhost:27017/prueba_farma');

    console.log('\n-- getDistribucionActuaciones --');
    const dist = await EstadisticasController.getDistribucionActuaciones('2004-01-01','2004-12-31');
    console.log(JSON.stringify(dist.slice(0,20), null, 2));

    console.log('\n-- getPrincipiosActivos --');
    const principios = await EstadisticasController.getPrincipiosActivos('2004-01-01','2004-12-31');
    console.log(JSON.stringify(principios.slice(0,20), null, 2));

    console.log('\n-- getTopMedicamentosPorUnidades --');
    const topUnidades = await EstadisticasController.getTopMedicamentosPorUnidades('2004-01-01','2004-12-31',10);
    console.log(JSON.stringify(topUnidades, null, 2));

    console.log('\n-- getTendenciasActuaciones --');
    const tendencias = await EstadisticasController.getTendenciasActuaciones('2004-01-01','2004-12-31');
    console.log(JSON.stringify(tendencias.slice(0,20), null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

runChecks();
