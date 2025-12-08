const { pool } = require("../db/db");
const getuser = require("../models/user.model");

const transferMoney = async (req, res, next) => {
    const MAX_TRIES = 3;
    const { senderId, receiverId, amount } = req.body || {};


    if (!senderId || !receiverId || !Number(amount)) {
        return res.status(400).json({
            message: "All fields are required (senderId, receiverId, amount)"
        });
    }

    if (senderId === receiverId) {
        return res.status(400).json({
            message: "Sender and receiver cannot be the same"
        });
    }


    const sender = await getuser(senderId);
    const receiver = await getuser(receiverId);

    if (!sender || !receiver) {
        return res.status(404).json({
            message: "User details not found"
        });
    }

    for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const first = Math.min(senderId, receiverId);
            const second = Math.max(senderId, receiverId);

            const [[firstRow]] = await connection.query(
                "SELECT balance FROM users WHERE id = ? FOR UPDATE",
                [first]
            );
            const [[secondRow]] = await connection.query(
                "SELECT balance FROM users WHERE id = ? FOR UPDATE",
                [second]
            );

            const senderBalance = first === senderId ? firstRow.balance : secondRow.balance;

            if (senderBalance < amount) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ message: "Insufficient balance" });
            }

            await connection.query(
                "UPDATE users SET balance = balance - ? WHERE id = ?",
                [amount, senderId]
            );

            await connection.query(
                "UPDATE users SET balance = balance + ? WHERE id = ?",
                [amount, receiverId]
            );

            await connection.query(
                "INSERT INTO transactions(sender_id, receiver_id, amount) VALUES (?, ?, ?)",
                [senderId, receiverId, amount]
            );

            await connection.commit();
            connection.release();

            return res.status(200).json({
                message: "Money transferred successfully"
            });

        } catch (err) {
            await connection.rollback();

            if (err.code === "ER_LOCK_DEADLOCK") {
                console.warn(`Deadlock attempt ${attempt}/${MAX_TRIES}. Retrying...`);
                await new Promise(r => setTimeout(resolve, 500));
                connection.release();
                continue;
            }

            connection.release();
            return next(err);
        }
    }

    return res.status(503).json({
        message: "Service unavailable due to repeated deadlocks."
    });
};

module.exports = transferMoney;
