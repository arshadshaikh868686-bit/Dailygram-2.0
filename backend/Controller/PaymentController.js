const crypto = require('crypto');

const razorpay = require('../Config/razorpay');
const Payment = require('../Modules/Payment');
const User = require('../Modules/User');
const Appointment = require('../Modules/Appointment');

const createSignature = (orderId, paymentId) => {
    return crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
};

const signaturesMatch = (expected, received) => {
    const expectedBuffer = Buffer.from(String(expected));
    const receivedBuffer = Buffer.from(String(received));

    if (expectedBuffer.length !== receivedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};

const createWebhookSignature = body => {
    return crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');
};

const isValidObjectId = id => /^[a-fA-F0-9]{24}$/.test(String(id));


exports.createPremiumOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const amount = 49900;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        if (user.role !== 'mentor') {
            return res.status(403).json({
                message: 'Only mentors can purchase premium'
            });
        }

        if (!user.premiumEligible) {
            return res.status(403).json({
                message: 'You are not eligible for premium'
            });
        }

        if (user.premiumEnabled) {
            return res.status(409).json({
                message: 'Premium is already active'
            });
        }

        const existingPayment = await Payment.findOne({
            userId,
            type: 'premium',
            status: {
                $in: ['created', 'pending']
            }
        });

        if (existingPayment) {
            return res.status(409).json({
                message: 'You already have an active premium payment/order',
                orderId: existingPayment.orderId
            });
        }

        const order = await razorpay.orders.create({
            amount,
            currency: 'INR',
            receipt: `premium_${userId}_${Date.now()}`
        });

        const payment = await Payment.create({
            userId,
            orderId: order.id,
            amount,
            currency: 'INR',
            type: 'premium',
            status: 'created'
        });

        return res.status(201).json({
            message: 'Premium order created successfully',
            keyId: process.env.RAZORPAY_KEY_ID,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency
            },
            paymentId: payment._id
        });
    } catch (err) {
        console.error('Create premium order error:', err);

        return res.status(500).json({
            message: 'Unable to create payment order'
        });
    }
};

exports.verifyPremiumPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                message: 'Payment verification details are required'
            });
        }

        const payment = await Payment.findOne({
            orderId: razorpay_order_id,
            userId: req.user._id,
            type: 'premium'
        });

        if (!payment) {
            return res.status(404).json({
                message: 'Premium payment order not found'
            });
        }

        if (payment.status === 'paid' && payment.verified) {
            return res.status(200).json({
                message: 'Payment already verified',
                paymentId: payment._id
            });
        }

        const generatedSignature = createSignature(
            razorpay_order_id,
            razorpay_payment_id
        );

        if (!signaturesMatch(generatedSignature, razorpay_signature)) {
            payment.status = 'failed';
            payment.verified = false;

            await payment.save();

            return res.status(400).json({
                message: 'Invalid payment signature'
            });
        }

        const user = await User.findById(req.user._id);

        if (!user || user.role !== 'mentor' || !user.premiumEligible) {
            return res.status(403).json({
                message: 'Mentor is no longer eligible for premium'
            });
        }

        payment.paymentId = razorpay_payment_id;
        payment.status = 'paid';
        payment.verified = true;

        await payment.save();

        user.premiumEnabled = true;

        await user.save();

        return res.status(200).json({
            message: 'Payment verified successfully',
            paymentId: payment._id
        });
    } catch (err) {
        console.error('Premium payment verification error:', err);

        return res.status(500).json({
            message: 'Payment verification failed'
        });
    }
};


exports.createMentorshipOrder = async (req, res) => {
    try {
        const learnerId = req.user._id;
        const { appointmentId } = req.body;

        if (!appointmentId) {
            return res.status(400).json({
                message: 'appointmentId is required'
            });
        }

        if (!isValidObjectId(appointmentId)) {
            return res.status(400).json({
                message: 'Invalid appointmentId'
            });
        }

        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({
                message: 'Appointment not found'
            });
        }


        if (String(appointment.learnerId) !== String(learnerId)) {
            return res.status(403).json({
                message: 'Only the learner can make this payment'
            });
        }

        if (appointment.status !== 'accepted') {
            return res.status(400).json({
                message: 'Appointment must be accepted before payment'
            });
        }


        const expectedAmount = Math.round(
            Number(appointment.mentorshipPrice || 0) * 100
        );

        if (expectedAmount <= 0) {
            return res.status(400).json({
                message: 'This appointment is free and does not require payment'
            });
        }


        if (appointment.paymentStatus === 'paid') {
            return res.status(409).json({
                message: 'Appointment payment is already completed'
            });
        }  

        const existingPayments = await Payment.find({
            appointmentId,
            type: 'mentorship',
            status: {
                $in: ['created', 'pending']
            }
        });

        if (existingPayments.length > 0) {
            for (const oldPayment of existingPayments) {
                oldPayment.status = 'failed';
                oldPayment.verified = false;

                await oldPayment.save();
            }
        }


        const order = await razorpay.orders.create({
            amount: expectedAmount,
            currency: 'INR',
            receipt: `mentor_${appointment._id}_${Date.now()}`
        });



        const payment = await Payment.create({
            userId: learnerId,
            appointmentId: appointment._id,
            orderId: order.id,
            amount: expectedAmount,
            currency: 'INR',
            type: 'mentorship',
            status: 'created',
            verified: false
        });


        appointment.paymentStatus = 'pending';
        appointment.paymentOrderId = order.id;

        await appointment.save();


        return res.status(201).json({
            message: 'Mentorship payment order created successfully',
            keyId: process.env.RAZORPAY_KEY_ID,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency
            },
            paymentId: payment._id,
            appointmentId: appointment._id
        });

    } catch (err) {
        console.error('Create mentorship order error:', err);

        return res.status(500).json({
            message: 'Unable to create mentorship payment order'
        });
    }
};


exports.verifyMentorshipPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                message: 'Payment verification details are required'
            });
        }

        const payment = await Payment.findOne({
            orderId: razorpay_order_id,
            userId: req.user._id,
            type: 'mentorship'
        });

        if (!payment) {
            return res.status(404).json({
                message: 'Mentorship payment order not found'
            });
        }


        if (payment.status === 'paid' && payment.verified) {
            return res.status(200).json({
                message: 'Payment already verified',
                paymentId: payment._id
            });
        }

        const appointment = await Appointment.findById(
            payment.appointmentId
        );

        if (!appointment) {
            return res.status(404).json({
                message: 'Appointment not found'
            });
        }

        if (
            String(appointment.learnerId) !==
            String(req.user._id)
        ) {
            return res.status(403).json({
                message: 'Unauthorized appointment payment'
            });
        }


        if (appointment.status !== 'accepted') {
            return res.status(400).json({
                message: 'Appointment is no longer accepted'
            });
        }


        const expectedAmount = Math.round(
            Number(appointment.mentorshipPrice || 0) * 100
        );

        if (expectedAmount <= 0) {
            return res.status(400).json({
                message: 'This appointment no longer requires payment'
            });
        }


        if (Number(payment.amount) !== Number(expectedAmount)) {
            return res.status(400).json({
                message: 'Payment amount no longer matches the appointment price'
            });
        }


        const generatedSignature = createSignature(
            razorpay_order_id,
            razorpay_payment_id
        );

        if (
            !signaturesMatch(
                generatedSignature,
                razorpay_signature
            )
        ) {
            payment.status = 'failed';
            payment.verified = false;

            await payment.save();

            appointment.paymentStatus = 'failed';

            await appointment.save();

            return res.status(400).json({
                message: 'Invalid payment signature'
            });
        }


        payment.paymentId = razorpay_payment_id;
        payment.status = 'paid';
        payment.verified = true;

        await payment.save();


        appointment.paymentStatus = 'paid';
        appointment.paymentOrderId = razorpay_order_id;
        appointment.paymentId = razorpay_payment_id;

        await appointment.save();

        return res.status(200).json({
            message: 'Mentorship payment verified successfully',
            paymentId: payment._id,
            appointmentId: payment.appointmentId
        });

    } catch (err) {
        console.error(
            'Mentorship payment verification error:',
            err
        );

        return res.status(500).json({
            message: 'Mentorship payment verification failed'
        });
    }
};



exports.handleRazorpayWebhook = async (req, res) => {
    try {
        const webhookSecret =
            process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!webhookSecret) {
            return res.status(500).json({
                message: 'Webhook secret is not configured'
            });
        }

        const signature =
            req.headers['x-razorpay-signature'];

        if (!signature) {
            return res.status(400).json({
                message: 'Webhook signature missing'
            });
        }

        const expectedSignature =
            createWebhookSignature(req.body);

        if (
            !signaturesMatch(
                expectedSignature,
                signature
            )
        ) {
            return res.status(400).json({
                message: 'Invalid webhook signature'
            });
        }

        const event = JSON.parse(
            req.body.toString()
        );

        const paymentEntity =
            event.payload?.payment?.entity;


        if (
            event.event === 'payment.captured' &&
            paymentEntity?.order_id
        ) {
            const payment = await Payment.findOne({
                orderId: paymentEntity.order_id
            });

            if (
                payment &&
                Number(paymentEntity.amount) ===
                Number(payment.amount)
            ) {
                payment.paymentId = paymentEntity.id;
                payment.status = 'paid';
                payment.verified = true;

                await payment.save();


                if (payment.type === 'premium') {
                    const user = await User.findById(
                        payment.userId
                    );

                    if (
                        user &&
                        user.role === 'mentor' &&
                        user.premiumEligible === true
                    ) {
                        user.premiumEnabled = true;

                        await user.save();
                    }
                }


                if (
                    payment.type === 'mentorship' &&
                    payment.appointmentId
                ) {
                    const appointment =
                        await Appointment.findById(
                            payment.appointmentId
                        );

                    if (
                        appointment &&
                        String(appointment.learnerId) ===
                        String(payment.userId) &&
                        appointment.status === 'accepted'
                    ) {
                        appointment.paymentStatus = 'paid';
                        appointment.paymentOrderId =
                            paymentEntity.order_id;
                        appointment.paymentId =
                            paymentEntity.id;

                        await appointment.save();
                    }
                }
            }
        }

        if (
            event.event === 'payment.failed' &&
            paymentEntity?.order_id
        ) {
            const payment = await Payment.findOne({
                orderId: paymentEntity.order_id
            });

            if (payment) {
                payment.status = 'failed';
                payment.verified = false;

                await payment.save();

                if (
                    payment.type === 'mentorship' &&
                    payment.appointmentId
                ) {
                    await Appointment.findByIdAndUpdate(
                        payment.appointmentId,
                        {
                            $set: {
                                paymentStatus: 'failed'
                            }
                        }
                    );
                }
            }
        }

        return res.status(200).json({
            received: true
        });

    } catch (err) {
        console.error(
            'Razorpay webhook error:',
            err
        );

        return res.status(500).json({
            message: 'Webhook processing failed'
        });
    }
};