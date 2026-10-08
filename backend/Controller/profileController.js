const User = require('../Modules/User');
const Appointment = require('../Modules/Appointment');

exports.profileController = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        return res.status(200).json(user);

    } catch (err) {
        console.error('Profile fetch error:', err);

        return res.status(500).json({
            message: 'Unable to fetch profile'
        });
    }
};

exports.UpdateProfile = async (req, res) => {
    try {
        const {
            name,
            skills,
            role,
            bio,
            experience,
            companyName,
            profileImage,
            linkedinUrl,
            resumeUrl,
            mentorshipPrice
        } = req.body;

        const update = {};
        const currentRole = req.user.role;

        const targetRole =
            role !== undefined
                ? String(role).trim()
                : currentRole;

        if (!['mentor', 'learner'].includes(targetRole)) {
            return res.status(400).json({
                message: 'role must be mentor or learner'
            });
        }

        if (
            currentRole === 'admin' &&
            targetRole !== currentRole
        ) {
            return res.status(403).json({
                message: 'Admin role cannot be changed'
            });
        }

       

        if (name !== undefined) {
            const cleanName = String(name).trim();

            if (!cleanName) {
                return res.status(400).json({
                    message: 'name cannot be empty'
                });
            }

            update.name = cleanName;
        }

        if (skills !== undefined) {
            if (!Array.isArray(skills)) {
                return res.status(400).json({
                    message: 'skills must be an array'
                });
            }

            update.skills = skills
                .map(skill => String(skill).trim())
                .filter(Boolean);
        }

        if (role !== undefined) {
            update.role = targetRole;
        }

        if (bio !== undefined) {
            const cleanBio = String(bio).trim();

            if (cleanBio.length > 500) {
                return res.status(400).json({
                    message: 'bio cannot exceed 500 characters'
                });
            }

            update.bio = cleanBio;
        }

        if (companyName !== undefined) {
            const cleanCompanyName =
                String(companyName).trim();

            if (cleanCompanyName.length > 150) {
                return res.status(400).json({
                    message:
                        'Company / organization name cannot exceed 150 characters'
                });
            }

            update.companyName = cleanCompanyName;
        }

        if (experience !== undefined) {
            const value = Number(experience);

            if (
                !Number.isFinite(value) ||
                value < 0
            ) {
                return res.status(400).json({
                    message:
                        'experience must be a valid non-negative number'
                });
            }

            update.experience = value;
        }

        if (profileImage !== undefined) {
            update.profileImage =
                String(profileImage).trim();
        }

        if (linkedinUrl !== undefined) {
            update.linkedinUrl =
                String(linkedinUrl).trim();
        }

        if (resumeUrl !== undefined) {
            update.resumeUrl =
                String(resumeUrl).trim();
        }


        let newMentorshipPrice = null;
        let shouldSyncAppointments = false;


        if (mentorshipPrice !== undefined) {

            if (currentRole !== 'mentor') {
                return res.status(403).json({
                    message:
                        'Only mentors can change mentorship price'
                });
            }

            if (targetRole !== 'mentor') {
                return res.status(403).json({
                    message:
                        'Mentorship price cannot be changed for a learner'
                });
            }

            const price = Number(mentorshipPrice);

            if (
                !Number.isFinite(price) ||
                price < 0
            ) {
                return res.status(400).json({
                    message:
                        'Mentorship price must be 0 or greater'
                });
            }

            if (price === 0) {
                newMentorshipPrice = 0;
                update.mentorshipPrice = 0;
                shouldSyncAppointments = true;
            } else {

                if (
                    req.user.aadhaarVerificationStatus !==
                    'verified'
                ) {
                    return res.status(403).json({
                        message:
                            'Paid mentorship is available only after admin verification'
                    });
                }

                newMentorshipPrice = Math.round(price);

                update.mentorshipPrice =
                    newMentorshipPrice;

                shouldSyncAppointments = true;
            }
        }


        if (currentRole !== targetRole) {

            update.mentorApproved = false;
            update.mentorApprovedAt = null;
            update.mentorApprovedBy = null;

            update.aadhaarVerificationStatus =
                'not_submitted';

            update.premiumEligible = false;
            update.premiumEnabled = false;

 
            update.mentorshipPrice = 0;

            newMentorshipPrice = 0;
            shouldSyncAppointments = true;
        }


        if (Object.keys(update).length === 0) {
            return res.status(400).json({
                message: 'No profile changes provided'
            });
        }

    

        const user =
            await User.findByIdAndUpdate(
                req.user._id,
                { $set: update },
                {
                    new: true,
                    runValidators: true
                }
            ).select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

      

        if (
            shouldSyncAppointments &&
            newMentorshipPrice !== null
        ) {
            try {
                const unpaidAppointments =
                    await Appointment.find({
                        mentorId: req.user._id,
                        paymentStatus: {
                            $ne: 'paid'
                        },
                        status: {
                            $in: [
                                'pending',
                                'accepted'
                            ]
                        }
                    });

                for (const appointment of unpaidAppointments) {

                    appointment.finalPrice =
                        newMentorshipPrice;

                    if (newMentorshipPrice === 0) {

                        appointment.paymentStatus =
                            'not_required';

                        appointment.paymentOrderId =
                            undefined;

                    } else {

                        appointment.paymentStatus =
                            'pending';

                        appointment.paymentOrderId =
                            undefined;
                    }

                    await appointment.save();
                }

            } catch (appointmentError) {

                console.error(
                    'Appointment price sync error:',
                    appointmentError
                );
            }
        }


        return res.status(200).json({
            message: 'Profile updated successfully',
            user
        });

    } catch (err) {

        console.error(
            'Profile update error:',
            err
        );

        return res.status(400).json({
            message: err.message
        });
    }
};

exports.getMentorProfile = async (req, res) => {
    try {
        const { id } = req.params;

        const mentor =
            await User.findOne({
                _id: id,
                role: 'mentor'
            }).select('-password');

        if (!mentor) {
            return res.status(404).json({
                message: 'Mentor not found'
            });
        }

        return res.status(200).json(mentor);

    } catch (err) {
        console.error(
            'Mentor profile error:',
            err
        );

        return res.status(500).json({
            message: 'Unable to fetch mentor profile'
        });
    }
};

exports.submitMentorVerification =
    async (req, res) => {
        try {
            const {
                linkedinUrl,
                resumeUrl
            } = req.body;

            const user =
                await User.findById(
                    req.user._id
                );

            if (!user) {
                return res.status(404).json({
                    message: 'User not found'
                });
            }

            if (user.role !== 'mentor') {
                return res.status(403).json({
                    message:
                        'Only mentors can submit verification'
                });
            }

            const cleanLinkedinUrl =
                String(
                    linkedinUrl || ''
                ).trim();

            const cleanResumeUrl =
                String(
                    resumeUrl || ''
                ).trim();

            if (
                !cleanLinkedinUrl ||
                !cleanResumeUrl
            ) {
                return res.status(400).json({
                    message:
                        'LinkedIn URL and resume URL are required'
                });
            }

            user.linkedinUrl =
                cleanLinkedinUrl;

            user.resumeUrl =
                cleanResumeUrl;

            user.aadhaarVerificationStatus =
                'pending';

            user.mentorApproved = false;
            user.mentorApprovedAt = null;
            user.mentorApprovedBy = null;

            await user.save();

            return res.status(200).json({
                message:
                    'Mentor verification submitted successfully',
                user:
                    await User.findById(
                        user._id
                    ).select('-password')
            });

        } catch (err) {
            console.error(
                'Mentor verification error:',
                err
            );

            return res.status(400).json({
                message: err.message
            });
        }
    };