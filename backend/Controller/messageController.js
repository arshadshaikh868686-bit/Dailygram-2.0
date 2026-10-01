const mongoose = require('mongoose');
const { decryptMessage } = require('../Utils/encryption');
const Appointment = require('../Modules/Appointment');
const Message = require('../Modules/Message');

exports.oldChats = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        if (!mongoose.isValidObjectId(appointmentId)) {
            return res.status(400).json({
                message: 'Invalid appointmentId'
            });
        }

        const appointment = await Appointment.findById(
            appointmentId
        );

        if (!appointment) {
            return res.status(404).json({
                message: 'Appointment not found'
            });
        }

        const uid = String(req.user._id);

        const isParticipant =
            uid === String(appointment.learnerId) ||
            uid === String(appointment.mentorId);

        if (!isParticipant) {
            return res.status(403).json({
                message: 'Unauthorized'
            });
        }

        if (appointment.status !== 'accepted') {
            return res.status(403).json({
                message:
                    'Chat is available only for accepted appointments'
            });
        }

        if (
            Number(appointment.mentorshipPrice) > 0 &&
            appointment.paymentStatus !== 'paid'
        ) {
            return res.status(403).json({
                message:
                    'Payment is required before accessing chat'
            });
        }

        const oldmessages =
            await Message.find({
                appointmentId
            })
                .populate(
                    'senderId',
                    'name'
                )
                .sort({
                    createdAt: 1
                });

        const messages = oldmessages.map(
            (message) => {
                const item =
                    message.toObject();

                try {
                    item.text =
                        decryptMessage(
                            item.text
                        );
                } catch (error) {
                    item.text =
                        '[Message unavailable]';
                }

                return item;
            }
        );

        return res.status(200).json(
            messages
        );
    } catch (err) {
        console.error(
            'Old chats error:',
            err
        );

        return res.status(500).json({
            message: 'Server error'
        });
    }
};