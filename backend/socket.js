const { Server } = require('socket.io');
const Message = require('./Modules/Message');
const jwt = require('jsonwebtoken');
const User = require('./Modules/User');
const {
    encryptMessage,
    decryptMessage
} = require('./Utils/encryption');
const Appointment = require('./Modules/Appointment');

const onlineusers = Object.create(null);
let io;

function getAllowedOrigins() {
    if (!process.env.CLIENT_URL) {
        return '*';
    }

    return process.env.CLIENT_URL
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
}

function initSocket(server) {
    io = new Server(server, {
        cors: {
            origin: getAllowedOrigins(),
            methods: ['GET', 'POST']
        }
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;

            if (!token) {
                return next(
                    new Error('Authentication required')
                );
            }

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            if (!decoded?.userid) {
                return next(
                    new Error('Invalid authentication token')
                );
            }

            const user = await User.findById(
                decoded.userid
            ).select('_id role');

            if (!user) {
                return next(
                    new Error('User not found')
                );
            }

            socket.userId = String(user._id);
            socket.userRole = user.role;

            next();
        } catch (err) {
            console.error(
                'Socket authentication error:',
                err.message
            );

            next(
                new Error('Invalid or expired token')
            );
        }
    });

    io.on('connection', (socket) => {
        console.log(
            'User Connected:',
            socket.id,
            'User:',
            socket.userId
        );

        onlineusers[socket.userId] = socket.id;

        socket.on(
            'sendMessage',
            async (data, callback) => {
                try {
                    const {
                        appointmentId,
                        text
                    } = data || {};

                    const senderId =
                        socket.userId;

                    if (!appointmentId) {
                        return callback?.({
                            success: false,
                            message:
                                'appointmentId is required'
                        });
                    }

                    if (
                        !text ||
                        !String(text).trim()
                    ) {
                        return callback?.({
                            success: false,
                            message:
                                'Message cannot be empty'
                        });
                    }

                    const cleanText =
                        String(text).trim();

                    if (
                        cleanText.length > 5000
                    ) {
                        return callback?.({
                            success: false,
                            message:
                                'Message cannot exceed 5000 characters'
                        });
                    }

                    const appointment =
                        await Appointment.findById(
                            appointmentId
                        );

                    if (!appointment) {
                        return callback?.({
                            success: false,
                            message:
                                'Appointment not found'
                        });
                    }

                    const sender =
                        String(senderId);

                    const learner =
                        String(
                            appointment.learnerId
                        );

                    const mentor =
                        String(
                            appointment.mentorId
                        );

                    if (
                        sender !== learner &&
                        sender !== mentor
                    ) {
                        return callback?.({
                            success: false,
                            message:
                                'You are not a participant in this appointment'
                        });
                    }

                    if (
                        appointment.status !==
                        'accepted'
                    ) {
                        return callback?.({
                            success: false,
                            message:
                                'Chat is available only for accepted appointments'
                        });
                    }

                    const price =
                        Number(
                            appointment.mentorshipPrice ||
                            0
                        );

                    const isFreeAppointment =
                        price === 0;

                    const paymentCompleted =
                        appointment.paymentStatus ===
                        'paid';

                    if (
                        !isFreeAppointment &&
                        !paymentCompleted
                    ) {
                        return callback?.({
                            success: false,
                            message:
                                'Payment is required before using chat for this paid appointment'
                        });
                    }

                    const encryptedText =
                        encryptMessage(
                            cleanText
                        );

                    const newMessage =
                        await Message.create({
                            appointmentId,
                            senderId,
                            text: encryptedText
                        });

                    const populatedMessage =
                        await newMessage.populate(
                            'senderId',
                            'name'
                        );

                    const messageForClient =
                        populatedMessage.toObject();

                    messageForClient.text =
                        decryptMessage(
                            messageForClient.text
                        );

                    const receiverId =
                        sender === learner
                            ? mentor
                            : learner;

                    if (
                        onlineusers[
                            receiverId
                        ]
                    ) {
                        io.to(
                            onlineusers[
                                receiverId
                            ]
                        ).emit(
                            'receiveMessage',
                            messageForClient
                        );
                    }

                    socket.emit(
                        'receiveMessage',
                        messageForClient
                    );

                    callback?.({
                        success: true,
                        message:
                            messageForClient
                    });
                } catch (err) {
                    console.error(
                        'sendMessage error:',
                        err
                    );

                    callback?.({
                        success: false,
                        message:
                            'Unable to send message'
                    });
                }
            }
        );

        socket.on(
            'disconnect',
            () => {
                console.log(
                    'User Disconnected:',
                    socket.id,
                    'User:',
                    socket.userId
                );

                if (
                    socket.userId &&
                    onlineusers[
                        socket.userId
                    ] === socket.id
                ) {
                    delete onlineusers[
                        socket.userId
                    ];
                }
            }
        );
    });

    return io;
}

function getIO() {
    if (!io) {
        throw new Error(
            'Socket.IO has not been initialized'
        );
    }

    return io;
}

module.exports = {
    initSocket,
    getIO,
    onlineusers
};