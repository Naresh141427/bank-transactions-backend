
const { pool } = require("../db/db");
const getuser = require("../models/user.model");

const transferMoney = async (req, res, next) => {
    const MAX_TRIES = 3;
    const { senderId, receiverId, transferAmount } = req.body || {};

    const sender = Number(senderId)
    const receiver = Number(receiverId)
    const amount = Number(transferAmount)



    if (isNaN(sender) || isNaN(receiver) || isNaN(amount) || sender <= 0 || receiver <= 0 || amount <= 0) {
        return res.status(400).json({
            message: "Invalid senderId, receiverId, or amount."
        });
    }

    if (sender === receiver) {
        return res.status(400).json({
            message: "Sender and receiver cannot be the same"
        });
    }


    let checkSender, checkRecevier;

    try {
        checkSender = await getuser(sender)
        checkRecevier = await getuser(receiver)

    } catch (err) {
        return next(err)
    }

    if (!checkSender) {
        return res.status(404).json({
            message: "sender user details not found"
        });
    }
    if (!checkRecevier) {
        return res.status(404).json({
            message: "receiver user details not found"
        });
    }

    if (checkSender.status !== "ACTIVE" || checkSender.status === "BLOCKED") {
        return res.status(401).json({
            message: "sender account is in inactive or blocked. please activate and try again"
        })
    }

    if (checkRecevier.status !== "ACTIVE" || checkRecevier.status === "BLOCKED") {
        return res.status(401).json({
            message: "account is in inactive or blocked. please activate and try again"
        })
    }


    for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const first = Math.min(sender, receiver);
            const second = Math.max(sender, receiver);

            const [[firstRow]] = await connection.query(
                "SELECT balance FROM users WHERE id = ? FOR UPDATE",
                [first]
            );
            const [[secondRow]] = await connection.query(
                "SELECT balance FROM users WHERE id = ? FOR UPDATE",
                [second]
            );

            const moneySender = sender === first ? firstRow : secondRow
            const moneyReceiver = receiver === first ? firstRow : secondRow


            const moneySenderBalanceBefore = Number(moneySender.balance)
            const moneySenderBalanceAfter = moneySenderBalanceBefore - amount


            const moneyReceiverBalanceBefore = Number(moneyReceiver.balance)
            const moneyReceiverBalanceAfter = moneyReceiverBalanceBefore + amount


            if (moneySenderBalanceBefore < amount) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ message: "Insufficient balance" });
            }

            await connection.query(
                "UPDATE users SET balance = ? WHERE id = ?",
                [moneySenderBalanceAfter, sender]
            );

            await connection.query(
                "UPDATE users SET balance = ? WHERE id = ?",
                [moneyReceiverBalanceAfter, receiver]
            );

            await connection.query(
                "UPDATE users SET last_activity_date = NOW() WHERE id IN (?,?)",
                [sender, receiver]
            )

            await connection.query(
                "INSERT INTO transactions (user_id, counterparty_id, amount, type, balance_before, balance_after) VALUES (?, ?, ?, 'TRANSFER_SENT', ?, ?)",
                [sender, receiver, amount, moneySenderBalanceBefore, moneySenderBalanceAfter]
            );

            await connection.query(
                "INSERT INTO transactions (user_id, counterparty_id, amount, type, balance_before, balance_after) VALUES (?, ?, ?,'TRANSFER_RECEIVED',  ?, ?)",
                [receiver, sender, amount, moneyReceiverBalanceBefore, moneyReceiverBalanceAfter]
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
                await new Promise(resolve => setTimeout(resolve, 500));
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


const withdrawAmount = async (req, res, next) => {
    const { userId } = req.params;
    const { withdrawAmount } = req.body;

    const user = Number(userId)
    const amount = Number(withdrawAmount)

    if (isNaN(user) || isNaN(amount) || user <= 0 || amount <= 0) {
        return res.status(400).json({
            message: "please provide a valid userId and amount"
        })
    }

    let checkUser

    try {
        checkUser = await getuser(user)

    } catch (err) {
        return next(err)
    }

    if (!checkUser) {
        return res.status(404).json({
            message: "user not found"
        })
    }

    if (checkUser.status !== "ACTIVE" || checkUser.status === "BLOCKED") {
        return res.status(401).json({
            message: "account is in inactive or blocked. please activate and try again"
        })
    }

    const connection = await pool.getConnection()

    try {

        await connection.beginTransaction()

        const [[dbUser]] = await connection.query("SELECT balance FROM users WHERE id = ? FOR UPDATE", [user])


        if (dbUser.balance < amount) {
            await connection.rollback()
            connection.release()
            return res.status(400).json({
                message: "insufficient balance to withdraw"
            })
        }

        const balanceBefore = dbUser.balance
        const balanceAfter = dbUser.balance - amount


        const [result] = await connection.query("UPDATE users SET balance = ? WHERE id = ?", [balanceAfter, user])

        await connection.query(
            "UPDATE users SET last_activity_date = NOW() WHERE id = ?",
            [user]
        )

        if (result.affectedRows === 0) {
            await connection.rollback();
            connection.release();
            return res.status(500).json({
                message: "Something went wrong while updating balance"
            });
        }

        await connection.query(
            "INSERT INTO transactions (user_id, counterparty_id, amount, type, balance_before, balance_after) VALUES (?, ?, ?, 'WITHDRAW',?, ?)",
            [user, null, amount, balanceBefore, balanceAfter]
        );

        await connection.commit()
        connection.release()

        return res.status(201).json({
            message: "amount withdrawal successfull"
        })

    } catch (err) {
        await connection.rollback()
        connection.release()
        return next(err)
    }
}



const depositAmount = async (req, res, next) => {
    const { userId } = req.params
    const { depositAmount } = req.body

    const user = Number(userId)
    const amount = Number(depositAmount)

    if (isNaN(user) || isNaN(amount) || !user || !amount || amount <= 0) {
        return res.status(400).json({
            message: "Please enter valid user id and amount"
        })
    }

    let checkUser
    try {
        checkUser = await getuser(user)
    } catch (err) {
        return next(err)
    }


    if (!checkUser) {
        return res.status(404).json({
            message: "User not found"
        })
    }

    if (checkUser.status !== "ACTIVE" || checkUser.status === "BLOCKED") {
        return res.status(401).json({
            message: "account is in inactive or blocked. please activate and try again"
        })
    }


    const connection = await pool.getConnection()

    try {

        await connection.beginTransaction()

        const [[dbUser]] = await connection.query("SELECT balance FROM users WHERE id = ? FOR UPDATE", [user])


        const userBalanceBeforeDeposit = Number(dbUser.balance)
        const userBalanceAferDeposit = userBalanceBeforeDeposit + amount


        const [result] = await connection.query("UPDATE users SET balance = ? WHERE id= ?", [userBalanceAferDeposit, user])

        await connection.query(
            "UPDATE users SET last_activity_date = NOW() WHERE id = ?",
            [user]
        )


        if (result.affectedRows === 0) {
            await connection.rollback()
            connection.release()
            return res.status(500).json({
                message: "something went wrong while updating amount. please try again"
            })
        }



        await connection.query(
            `INSERT INTO transactions(user_id, counterparty_id, amount, type,balance_before, balance_after)
            VALUES(?,?,?,?,?,?)
            `,
            [user, null, amount, "DEPOSIT", userBalanceBeforeDeposit, userBalanceAferDeposit]
        )

        await connection.commit()
        connection.release()

        return res.status(200).json({
            message: "Money deposited succussfully"
        })
    } catch (err) {
        connection.rollback()
        connection.release()
        return next(err)
    }


}


module.exports = { transferMoney, withdrawAmount, depositAmount };