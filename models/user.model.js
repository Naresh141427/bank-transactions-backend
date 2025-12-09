const { pool } = require("../db/db")

const getuser = async (id) => {
    try {
        const [row] = await pool.query(
            "SELECT id, name, status FROM users WHERE id = ?",
            [id]
        );

        return row[0] || null;

    } catch (err) {
        console.error("DB Error in getuser():", err.message);
        throw err;
    }
};



module.exports = getuser