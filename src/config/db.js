const { Pool, types } = require('pg');
require('dotenv').config();

// empêche pg de convertir les colonnes DATE en objet Date JS, source du décalage de fuseau horaire observé en JSON
types.setTypeParser(1082, (value) => value); // Le code 1082 est l'id interne PostgreSQL (OID) du type DATE, c'est une constante

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Erreur inattendue du pool PostgreSQL', err);
});

module.exports = pool;
