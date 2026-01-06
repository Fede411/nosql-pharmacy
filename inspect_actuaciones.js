const mongoose = require('mongoose');
const actuaciones = require('./models/actuaciones');

async function inspect() {
  try {
    await mongoose.connect('mongodb://localhost:27017/prueba_farma');
    const docs = await actuaciones.find().limit(20).lean();
    docs.forEach((d,i)=>{
      console.log('DOC',i,Object.keys(d));
      console.log(d);
    });
    process.exit(0);
  } catch(err) {
    console.error(err);
    process.exit(1);
  }
}

inspect();
