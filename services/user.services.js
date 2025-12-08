const getuser = require("../models/user.model")


const getUserDetails = async (req, res, next) => {
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

    } catch (err) {
        next(err)
    }
}



module.exports = getUserDetails 