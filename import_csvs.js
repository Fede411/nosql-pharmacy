const mongoose = require('mongoose');
const fs = require('fs');
const Papa = require('papaparse');

mongoose.connect('mongodb://localhost:27017/prueba_farma')
    .then(() => {
        console.log('✅ Conectado a MongoDB');
        return importarCSVs();
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });

async function importarCSVs() {
    const db = mongoose.connection.db;
    
    const archivos = [
        {
            ruta: './synthetic_data/consumos_acumulados.csv',
            coleccion: 'consumos_acumulados'
        },
        {
            ruta: './synthetic_data/dispensacion_anonimizado.csv',
            coleccion: 'dispensacion'
        },
        {
            ruta: './synthetic_data/pa_medicamento.csv',
            coleccion: 'pa_medicamento'
        },
        {
            ruta: './synthetic_data/actuaciones.csv',
            coleccion: 'actuaciones'
        }
    ];
    
    for (const archivo of archivos) {
        try {
            console.log(`\n📥 Importando ${archivo.coleccion}...`);
            
            const csvData = fs.readFileSync(archivo.ruta, 'utf8');
            
            const parsed = Papa.parse(csvData, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true,
                delimiter: ';'
            });
            
            console.log(`   Registros encontrados: ${parsed.data.length}`);
            
            await db.collection(archivo.coleccion).deleteMany({});
            console.log(`   Colección limpiada`);
            
            const batchSize = 1000;
            let insertados = 0;
            
            for (let i = 0; i < parsed.data.length; i += batchSize) {
                const batch = parsed.data.slice(i, i + batchSize);
                await db.collection(archivo.coleccion).insertMany(batch);
                insertados += batch.length;
                console.log(`   Insertados: ${insertados}/${parsed.data.length}`);
            }
            
            console.log(`   ✅ ${archivo.coleccion} completado`);
            
        } catch (error) {
            console.error(`   ❌ Error en ${archivo.coleccion}:`, error.message);
        }
    }
    
    console.log('\n🎉 Importación completada');
    
    console.log('\n📊 Documentos por colección:');
    for (const archivo of archivos) {
        const count = await db.collection(archivo.coleccion).countDocuments();
        console.log(`   ${archivo.coleccion}: ${count}`);
    }
    
    process.exit(0);
}