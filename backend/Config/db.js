const mongoose = require('mongoose');

const dbconnect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_DB);

        console.log('✅ MongoDB is connected successfully!');
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        throw err;
    }
};

module.exports = dbconnect;