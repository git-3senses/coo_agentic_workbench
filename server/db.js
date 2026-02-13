
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQLUSER || 'npa_user',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || 'npa_password',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'npa_workbench',
    port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();
