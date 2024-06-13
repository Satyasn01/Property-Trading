const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',   // replace with your database username
  host: 'localhost',
  database: 'real_estate_trading',  // replace with your database name
  password: 'satya@2002',  // replace with your database password
  port: 5432,
});

module.exports = pool;
