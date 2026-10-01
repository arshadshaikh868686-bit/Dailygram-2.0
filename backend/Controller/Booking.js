const mongoose = require('mongoose');
const Appointment = require('../Modules/Appointment');
const User = require('../Modules/User');
const { getIO, onlineusers } = require('../socket');


exports.Booking = async (req, res) => {
    try {
        const {
            mentorId,
            skill,
            scheduledAt,
            duration
        } = req.body;

        const learnerId = req.user._id;

        if (!mentorId || !skill) {
            return res.status(400).json({
                message: 'mentorId and skill are required'
            });
        }


        const appointmentDate = scheduledAt
            ? new Date(scheduledAt)
            : new Date(
                Date.now() + 24 * 60 * 60 * 1000
            );


        if (Number.isNaN(appointmentDate.getTime())) {
            return res.status(400).json({
                message: 'Invalid scheduledAt'
            });
        }


        if (appointmentDate <= new Date()) {
            return res.status(400).json({
                message:
                    'Appointment must be scheduled in the future'
            });
        }
        const appointmentDuration =
            duration === undefined
                ? 60
                : Number(duration);


        if (
            !Number.isFinite(appointmentDuration) ||
            appointmentDuration < 15 ||
            appointmentDuration > 180
        ) {
            return res.status(400).json({
                message:
                    'duration must be between 15 and 180 minutes'
            });
        }
        if (!mongoose.isValidObjectId(mentorId)) {
            return res.status(400).json({
                message: 'Invalid mentorId'
            });
        }



        if (
            String(mentorId) ===
            String(learnerId)
        ) {
            return res.status(400).json({
                message: 'You cannot book yourself'
            });
        }


        const mentor = await User.findOne({
            _id: mentorId,
            role: 'mentor'
        });


        if (!mentor) {
            return res.status(404).json({
                message: 'Mentor not found'
            });
        }



        const requestedSkill =
            String(skill).trim();


        const matchedSkill =
            mentor.skills.find(
                mentorSkill =>
                    String(mentorSkill)
                        .toLowerCase() ===
                    requestedSkill.toLowerCase()
            );


        if (!matchedSkill) {
            return res.status(400).json({
                message:
                    'Mentor does not offer this skill'
            });
        }



        const mentorshipPrice =
            Math.max(
                0,
                Math.round(
                    Number(
                        mentor.mentorshipPrice || 0
                    )
                )
            );

        if (
            mentorshipPrice > 0 &&
            mentor.aadhaarVerificationStatus !==
            'verified'
        ) {
            return res.status(403).json({
                message:
                    'This mentor is not verified for paid mentorship yet'
            });
        }



        const existing =
            await Appointment.findOne({
                learnerId,
                mentorId,
                skill: matchedSkill,
                status: {
                    $in: [
                        'pending',
                        'accepted'
                    ]
                }
            });


        if (existing) {
            return res.status(409).json({
                message:
                    'An active appointment already exists',
                appointment: existing
            });
        }


        const appointment =
            await Appointment.create({
                learnerId,
                mentorId,
                skill: matchedSkill,
                scheduledAt: appointmentDate,
                duration: appointmentDuration,

                // Snapshot current mentor price
                mentorshipPrice,

                paymentStatus:
                    mentorshipPrice === 0
                        ? 'not_required'
                        : 'pending'
            });


        if (
            onlineusers[
            String(mentorId)
            ]
        ) {
            getIO()
                .to(
                    onlineusers[
                    String(mentorId)
                    ]
                )
                .emit(
                    'newRequest',
                    appointment
                );
        }


        return res.status(201).json(
            appointment
        );

    } catch (err) {
        console.error(
            'Booking error:',
            err
        );

        return res.status(500).json({
            message: 'Server error'
        });
    }
};


exports.Myrequest = async (req, res) => {
    try {
        const requests =
            await Appointment.find({
                mentorId: req.user._id,
                status: 'pending'
            })
                .populate(
                    'learnerId',
                    'name email skills'
                )
                .populate(
                    'mentorId',
                    'name email skills mentorshipPrice aadhaarVerificationStatus premiumEnabled'
                )
                .sort({
                    createdAt: -1
                });


        return res.status(200).json(
            requests
        );

    } catch (err) {
        console.error(
            'Myrequest error:',
            err
        );

        return res.status(500).json({
            message: 'Server error'
        });
    }
};

exports.CompleteAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                message: 'Appointment not found'
            });
        }

        if (
            String(appointment.mentorId) !==
            String(req.user._id)
        ) {
            return res.status(403).json({
                message: 'Only the mentor can complete the appointment'
            });
        }

        if (appointment.status !== 'accepted') {
            return res.status(400).json({
                message: 'Only accepted appointments can be completed'
            });
        }

        if (
            Number(appointment.mentorshipPrice || 0) > 0 &&
            appointment.paymentStatus !== 'paid'
        ) {
            return res.status(400).json({
                message: 'Paid appointment must be paid before completion'
            });
        }

        appointment.status = 'completed';

        await appointment.save();

        const mentor = await User.findById(appointment.mentorId);

        if (mentor) {
            mentor.completedSessions =
                Number(mentor.completedSessions || 0) + 1;

            if (
                mentor.completedSessions >= 100 &&
                Number(mentor.rating || 0) >= 4.5
            ) {
                mentor.premiumEligible = true;
            }

            await mentor.save();
        }

        if (onlineusers[String(appointment.learnerId)]) {
            getIO()
                .to(
                    onlineusers[String(appointment.learnerId)]
                )
                .emit(
                    'appointmentCompleted',
                    appointment
                );
        }

        return res.status(200).json({
            message: 'Appointment completed successfully',
            appointment
        });

    } catch (err) {
        console.error(
            'CompleteAppointment error:',
            err
        );

        return res.status(500).json({
            message: 'Server error'
        });
    }
};

exports.MyAppointments = async (req, res) => {
    try {
        const appointments =
            await Appointment.find({
                $or: [
                    {
                        learnerId:
                            req.user._id
                    },
                    {
                        mentorId:
                            req.user._id
                    }
                ]
            })
                .populate(
                    'learnerId',
                    'name email skills'
                )
                .populate(
                    'mentorId',
                    'name email skills mentorshipPrice aadhaarVerificationStatus premiumEnabled'
                )
                .sort({
                    createdAt: -1
                });


        return res.status(200).json(
            appointments
        );

    } catch (err) {
        console.error(
            'MyAppointments error:',
            err
        );

        return res.status(500).json({
            message: 'Server error'
        });
    }
};


exports.RespondRequest = async (
    req,
    res
) => {
    try {
        const {
            status,
            mentorshipPrice
        } = req.body;



        if (
            ![
                'accepted',
                'rejected'
            ].includes(status)
        ) {
            return res.status(400).json({
                message:
                    'status must be accepted or rejected'
            });
        }



        const appointment =
            await Appointment.findById(
                req.params.id
            );


        if (!appointment) {
            return res.status(404).json({
                message:
                    'Appointment not found'
            });
        }


        if (
            String(
                appointment.mentorId
            ) !==
            String(req.user._id)
        ) {
            return res.status(403).json({
                message:
                    'Unauthorized action'
            });
        }


        if (
            appointment.status !==
            'pending'
        ) {
            return res.status(400).json({
                message:
                    'Only pending requests can be responded to'
            });
        }


        if (status === 'rejected') {

            appointment.status =
                'rejected';

            appointment.paymentStatus =
                'not_required';

            appointment.paymentOrderId =
                '';

            appointment.paymentId =
                '';

            appointment.room =
                '';
        }



        if (status === 'accepted') {

            let finalPrice =
                appointment.mentorshipPrice;

            if (
                mentorshipPrice !==
                undefined
            ) {
                const parsedPrice =
                    Number(
                        mentorshipPrice
                    );


                if (
                    !Number.isFinite(
                        parsedPrice
                    ) ||
                    parsedPrice < 0
                ) {
                    return res.status(400).json({
                        message:
                            'Mentorship price must be 0 or greater'
                    });
                }


                finalPrice =
                    Math.round(
                        parsedPrice
                    );
            }

            if (
                finalPrice > 0 &&
                req.user
                    .aadhaarVerificationStatus !==
                'verified'
            ) {
                return res.status(403).json({
                    message:
                        'Admin verification is required before accepting a paid mentorship appointment'
                });
            }



            appointment.mentorshipPrice =
                finalPrice;


            if (finalPrice === 0) {

                appointment.status =
                    'accepted';

                appointment.paymentStatus =
                    'not_required';

                appointment.paymentOrderId =
                    '';

                appointment.paymentId =
                    '';
            }


            else {

                appointment.status =
                    'accepted';

                appointment.paymentStatus =
                    'pending';

                appointment.paymentOrderId =
                    '';

                appointment.paymentId =
                    '';
            }

            appointment.room =
                `dailygram-${appointment._id}`;
        }


        await appointment.save();

        if (
            onlineusers[
            String(
                appointment.learnerId
            )
            ]
        ) {
            getIO()
                .to(
                    onlineusers[
                    String(
                        appointment.learnerId
                    )
                    ]
                )
                .emit(
                    'requestUpdate',
                    appointment
                );
        }


        return res.status(200).json(
            appointment
        );

    } catch (err) {

        console.error(
            'RespondRequest error:',
            err
        );

        return res.status(500).json({
            message: 'Server error'
        });
    }
};