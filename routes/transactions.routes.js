const express = require("express")

const { transferMoney, withdrawBalance } = require("../services/transaction.services")


const router = express.Router()

router.post("/transfer", transferMoney)
router.post("/:userId/withdraw", withdrawBalance)

module.exports = router