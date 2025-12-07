const express = require("express")
const getUserDetails = require("../services/user.services")

const router = express.Router()


router.get("/:userId", getUserDetails)

module.exports = router