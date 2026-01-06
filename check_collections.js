const mongoose = require('mongoose');
const consumos = require('./models/consumos_acumulados');
const actuaciones = require('./models/actuaciones');

async function check() {
  try {
    await mongoose.connect('mongodb://localhost:27017/prueba_farma');
    const c1 = await consumos.countDocuments({});
    const c2 = await actuaciones.countDocuments({});
    const sampleCons = await consumos.findOne().lean();
    const sampleAct = await actuaciones.findOne().lean();
    console.log('consumos count:', c1);
    console.log('actuaciones count:', c2);
    console.log('sample consumos:', sampleCons);
    console.log('sample actuaciones:', sampleAct);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
