require("dotenv").config()

const express = require("express")
const { testConnection } = require("./db/db")
const userRouter = require("./routes/user.routes")
const transferMoney = require("./services/transaction.services")


const app = express()

app.use(express.json())

// user routes
app.use("/psbank/user", userRouter)

//money transfer route
app.use("/psbank/transfer", transferMoney)

app.get("/", () => console.log("Banking backend is running"))


const PORT = process.env.PORT || 5000
const startServer = async () => {
    await testConnection()

    app.listen(PORT,
        () => console.log(`Server running at port ${PORT}`)
    )
}

startServer()

