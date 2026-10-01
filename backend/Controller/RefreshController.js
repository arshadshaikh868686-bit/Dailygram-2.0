const jwt = require('jsonwebtoken');

const RefreshTokenController = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                message: 'Refresh token is required'
            });
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );

        const accessToken = jwt.sign(
            { userid: decoded.userid },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        res.status(200).json({
            accessToken
        });

    } catch (err) {
        return res.status(401).json({
            message: 'Invalid or expired refresh token'
        });
    }
};

module.exports = { RefreshTokenController };