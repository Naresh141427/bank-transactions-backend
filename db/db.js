require("dotenv").config()
const mysql = require("mysql2/promise")

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})

const testConnection = async () => {
    try {
        const connection = await pool.getConnection()
        await connection.ping()
        connection.release()
        console.log("connected to MySQL database successfully");

    } catch (err) {
        console.error("MYSQL connection failed: ", err.message);
    }
}

module.exports = { pool, testConnection }