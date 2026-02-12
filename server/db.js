
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'npa_user',
    password: 'npa_password',
    database: 'npa_workbench',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();
