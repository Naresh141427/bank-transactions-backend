
const { pool } = require("../db/db");
const getuser = require("../models/user.model");



const transferMoney = async (req, res) => {
    const MAX_TRIES = 3;

    for (let trytrans = 0; trytrans < MAX_TRIES; trytrans++) {
        const connection = await pool.getConnection();

        try {

            const { senderId, receiverId, amount } = req.body || {};


            if (!senderId || !receiverId || !Number(amount)) {
                return res.status(400).json({
                    message: "All fields are required(sender, reciever, amount)"
                });
            };

            if (senderId === receiverId) {
                return res.status(400).json({
                    message: "Sender and receiver cannot be same"
                })
            }

            const sender = await getuser(senderId)
            if (!sender) {
                return res.status(404).send({
                    message: "sender user details not found"
                })
            }

            const reciever = await getuser(receiverId)
            if (!reciever) {
                return res.status(404).send({
                    message: "reciever user details not found"
                })
            }

            connection.beginTransaction();

            const first = Math.min(senderId, receiverId)
            const second = Math.max(senderId, receiverId)


            const [[firstRow]] = await connection.query("SELECT balance FROM users WHERE id = ? FOR UPDATE;", [first])
            const [[secondRow]] = await connection.query("SELECT balance FROM users WHERE id = ? FOR UPDATE;", [second])

            const senderBalance = first === senderId ? firstRow.balance : secondRow.balance


            if (senderBalance < amount) {
                await connection.rollback()
                connection.release()
                return res.status(400).json({
                    message: "Insufficient balance"
                })
            }


            //update users balances 
            await connection.query("UPDATE users SET balance = balance - ? WHERE id = ?", [amount, senderId])
            await connection.query("UPDATE users SET balance = balance + ? WHERE id = ?", [amount, receiverId])

            await connection.query("INSERT INTO transactions(sender_id, receiver_id,amount) VALUES(?,?,?)", [senderId, receiverId, amount])

            await connection.commit()
            connection.release()

            return res.status(200).json({
                message: "Money transfered successfully"
            })

        } catch (err) {
            await connection.rollback()
            if (err.code === 'ER_LOCK_DEADLOCK') {
                console.warn(`Deadlock occurred, retrying attempt ${trytrans + 1}/${MAX_TRIES}...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            } else {
                connection.release()
                console.error("Error while transering money: ", err.message)
                return res.status(500).json({
                    message: "Internal server error"
                })
            }

        }
    }
    return res.status(503).json({
        message: "Service unavailable due to persistent database contention (deadlocks)."
    });
}

module.exports = transferMoney