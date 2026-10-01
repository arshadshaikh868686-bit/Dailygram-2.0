require('dotenv').config();

const express = require('express');
const adminRoutes = require('./Routes/adminRoutes');
const paymentRoutes = require('./Routes/paymentRoutes');
const http = require('http');
const cors = require('cors');
const dbconnect = require('./Config/db');
const { initSocket } = require('./socket');
const {
    handleRazorpayWebhook
} = require('./Controller/PaymentController');

const app = express();
app.post(
    '/api/payments/webhook',
    express.raw({ type: 'application/json' }),
    handleRazorpayWebhook
);
const server = http.createServer(app);

const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map(v => v.trim())
    : true;

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));


app.get('/', (req, res) => res.json({ message: 'Dailygram API is running' }));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api/auth', require('./Routes/authRoutes'));
app.use('/api/user', require('./Routes/userRoutes'));
app.use('/api/payments', paymentRoutes);
app.use(
    '/api/rating',
    require('./Routes/ratingRoutes')
);
app.use('/api/appointments', require('./Routes/appointmentRoutes'));
app.use('/api/message', require('./Routes/messageRoutes'));
app.use('/api/ai', require('./Routes/aiRoutes'));
app.use('/api/admin', adminRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ message: 'Internal server error' });
});

initSocket(server);

const port = Number(process.env.PORT) || 3000;
(async () => {
    try {
        await dbconnect();
        server.listen(port, () => console.log(`Server Running on Port ${port}`));
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
})();
