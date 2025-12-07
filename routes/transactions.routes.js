const transferMoney = require("../services/transaction.services")

const router = express.Router()

router.post("/", transferMoney)

module.exports = router