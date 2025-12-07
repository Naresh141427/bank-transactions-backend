const getuser = require("../models/user.model")


const getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params

        const user = await getuser(userId)

        if (!user) {
            return res.status(404).json({
                message: "user not found"
            })
        }

        return res.status(200).json({
            user
        })

    } catch (error) {
        console.error("Error getting userDetails:", error.message)
        res.status(500).json({
            message: "Internal server error"
        })
    }
}

module.exports = getUserDetails