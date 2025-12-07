const { pool } = require("../db/db")

const getuser = async (id) => {
    try {
        const [row] = await pool.query("SELECT name, balance FROM users WHERE id = ?", [id])
        return row[0]
    } catch (err) {
        console.error("DB Error: ", err.message);
        return err
    }
}

module.exports = getuser