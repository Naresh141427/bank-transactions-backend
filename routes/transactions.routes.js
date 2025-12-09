const express = require("express")

const { transferMoney, withdrawAmount, depositAmount } = require("../services/transaction.services")


const router = express.Router()

router.post("/transfer", transferMoney)
router.post("/:userId/withdraw", withdrawAmount)
router.post("/:userId/deposit", depositAmount)

module.exports = router