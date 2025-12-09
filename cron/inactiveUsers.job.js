const cron = require("node-cron")
const { pool } = require("../db/db")


function startInactiveUserJob() {
    cron.schedule(
        "0 2 * * *",
        async () => {
            console.log("Cron checking for inactive users...");
            const connection = await pool.getConnection()

            try {
                await connection.beginTransaction()

                await connection.query(`
                        UPDATE users
                        SET status = 'INACTIVE'
                        WHERE 
                            status = "ACTIVE" AND
                            last_activity_date IS NOT NULL AND
                            last_activity_date < DATE_SUB(NOW(), INTERVAL 90 DAY)
                    `)

                await connection.query(`
                        UPDATE users
                        SET status = 'BLOCKED'
                        WHERE 
                            status IN ("ACTIVE","INACTIVE")) AND
                            last_activity_date < DATE_SUB(NOW(), INTERVAL 365 DAY)
                    `)

                await connection.commit()
                connection.release()
                console.log("[CRON] Inactive & Blocked user checks completed");
            } catch (err) {
                await connection.rollback()
                console.log("[CRON] Erro marking inactive users: ", err.message);
            } finally {
                connection.release()
            }
        },
        {
            scheduled: true,
            timezone: "Asia/kolkata"
        }
    )
}

module.exports = startInactiveUserJob 