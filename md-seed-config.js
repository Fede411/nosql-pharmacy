const mongoose =require ('mongoose');
var Patients = require ('./seeders/patients.seeder')
const mongoURL = process.env.MONGO_URL || 'mongodb://localhost:27017/bio_bbdd';

/**
 * Seeders List
 * order is important
 * @type {Object}
 */
const seedersList = {
  Patients,
};
/**
 * Connect to mongodb implementation
 * @return {Promise}
 */

const connect = async () =>
  await mongoose.connect(mongoURL, { useNewUrlParser: true });
/**
 * Drop/Clear the database implementation
 * @return {Promise}
 */
const dropdb = async () => mongoose.connection.db.dropDatabase();
 module.exports= {seedersList,connect,dropdb}