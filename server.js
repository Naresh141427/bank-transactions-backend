require("dotenv").config();

const express = require("express");
const { testConnection } = require("./db/db");
const userRouter = require("./routes/user.routes");
const transferRouter = require("./routes/transactions.routes")

const app = express();

app.use(express.json());

// Routes
app.use("/psbank/user", userRouter);
app.use("/psbank", transferRouter);

app.get("/", (req, res) => {
    res.send("Banking backend is running");
});

//error-handling middleware 
app.use((err, req, res, next) => {
    console.warn("Unhandled error: ", err.message);
    return res.status(500).json({
        message: "Internal Server Error",
        error: err.message
    });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await testConnection();
    app.listen(PORT, () =>
        console.log(`Server running on port ${PORT}`)
    );
};

startServer();
