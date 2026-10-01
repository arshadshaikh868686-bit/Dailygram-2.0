const jwt = require('jsonwebtoken');
const User = require('../Modules/User');

const protect = async (req, res, next) => {
    try {
        const header = req.headers.authorization || '';
        if (!header.startsWith('Bearer ')) return res.status(401).json({ message: 'Authentication required' });

        const token = header.slice(7).trim();
        if (!token) return res.status(401).json({ message: 'Authentication required' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.userid).select('-password');
        if (!req.user) return res.status(401).json({ message: 'User not found' });
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = protect;
