const User = require('../Modules/User');
const jwt = require('jsonwebtoken');
require('dotenv').config()

const RegistrationController = async (req, res) => {
    try {
        const { name, email, password, role, skills = [] } = req.body;
        if (!name?.trim() || !email?.trim() || !password || !role) {
            return res.status(400).json({ message: 'name, email, password and role are required' });
        }
        if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
        if (!['mentor', 'learner'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
        if (!Array.isArray(skills)) return res.status(400).json({ message: 'skills must be an array' });

        const normalizedEmail = email.trim().toLowerCase();
        const userExist = await User.findOne({ email: normalizedEmail });
        if (userExist) return res.status(409).json({ message: 'User already exists' });

        const user = await User.create({ name: name.trim(), email: normalizedEmail, password, role, skills });
        const accessToken = jwt.sign(
            { userid: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { userid: user._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            accessToken,
            refreshToken,
            userid: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            skills: user.skills
        });
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ message: 'User already exists' });
        res.status(500).json({ message: err.message });
    }
};

module.exports = { Userdata: RegistrationController };
