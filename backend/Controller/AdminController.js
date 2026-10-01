const User = require('../Modules/User');


exports.getVerificationRequests = async (req, res) => {
    try {
        const mentors = await User.find({
            role: 'mentor',
            aadhaarVerificationStatus: {
                $in: ['pending', 'rejected']
            }
        })
            .select('-password')
            .sort({ updatedAt: -1 });

        return res.status(200).json(mentors);

    } catch (err) {
        console.error(
            'Get verification requests error:',
            err
        );

        return res.status(500).json({
            message:
                'Unable to fetch verification requests'
        });
    }
};



exports.updateVerificationStatus = async (
    req,
    res
) => {
    try {
        const { status } = req.body;


        if (
            !['verified', 'rejected'].includes(status)
        ) {
            return res.status(400).json({
                message:
                    'Status must be verified or rejected'
            });
        }

        const mentor = await User.findOne({
            _id: req.params.id,
            role: 'mentor'
        });


        if (!mentor) {
            return res.status(404).json({
                message: 'Mentor not found'
            });
        }


        if (status === 'verified') {

            if (
                !mentor.linkedinUrl ||
                !mentor.resumeUrl
            ) {
                return res.status(400).json({
                    message:
                        'LinkedIn URL and resume are required before verification'
                });
            }
        }


        mentor.aadhaarVerificationStatus =
            status;



        if (status === 'verified') {

            mentor.premiumEligible = true;

        }



        if (status === 'rejected') {

            mentor.premiumEligible = false;
            mentor.premiumEnabled = false;


            mentor.mentorshipPrice = 0;
        }


        await mentor.save();


        const safeMentor =
            mentor.toObject();

        delete safeMentor.password;


        return res.status(200).json({
            message:
                `Mentor verification ${status} successfully`,

            user: safeMentor
        });

    } catch (err) {

        console.error(
            'Update verification status error:',
            err
        );

        return res.status(500).json({
            message:
                'Unable to update mentor verification'
        });
    }
};


exports.updateMentorApproval = async (
    req,
    res
) => {
    try {
        const { approved } = req.body;


        if (typeof approved !== 'boolean') {
            return res.status(400).json({
                message:
                    'approved must be true or false'
            });
        }


        const mentor = await User.findOne({
            _id: req.params.id,
            role: 'mentor'
        });


        if (!mentor) {
            return res.status(404).json({
                message: 'Mentor not found'
            });
        }


        mentor.mentorApproved = approved;


        if (approved) {
            mentor.mentorApprovedAt =
                new Date();

            mentor.mentorApprovedBy =
                req.user._id;
        } else {
            mentor.mentorApprovedAt =
                null;

            mentor.mentorApprovedBy =
                null;
        }


        await mentor.save();


        const safeMentor =
            mentor.toObject();

        delete safeMentor.password;


        return res.status(200).json({
            message: approved
                ? 'Legacy marketplace approval updated'
                : 'Legacy marketplace approval removed',

            user: safeMentor
        });

    } catch (err) {

        console.error(
            'Mentor approval error:',
            err
        );

        return res.status(500).json({
            message:
                'Unable to update mentor approval'
        });
    }
};


exports.updatePremiumStatus = async (
    req,
    res
) => {
    try {
        const { enabled } = req.body;



        if (typeof enabled !== 'boolean') {
            return res.status(400).json({
                message:
                    'enabled must be true or false'
            });
        }



        const mentor = await User.findOne({
            _id: req.params.id,
            role: 'mentor'
        });


        if (!mentor) {
            return res.status(404).json({
                message: 'Mentor not found'
            });
        }



        if (enabled) {


            if (
                mentor.aadhaarVerificationStatus !==
                'verified'
            ) {
                return res.status(403).json({
                    message:
                        'Mentor must be admin-verified before premium can be enabled'
                });
            }


            // Premium eligibility must also be true.
            if (!mentor.premiumEligible) {
                return res.status(400).json({
                    message:
                        'Mentor is not eligible for premium'
                });
            }
        }



        mentor.premiumEnabled =
            enabled;


        await mentor.save();


        const safeMentor =
            mentor.toObject();

        delete safeMentor.password;


        return res.status(200).json({
            message: enabled
                ? 'Premium enabled successfully'
                : 'Premium disabled successfully',

            user: safeMentor
        });

    } catch (err) {

        console.error(
            'Update premium status error:',
            err
        );

        return res.status(500).json({
            message:
                'Unable to update premium status'
        });
    }
};



exports.getAdminStats = async (
    req,
    res
) => {
    try {

        const [
            totalUsers,
            totalMentors,
            totalLearners,
            pendingVerifications,
            verifiedMentors,
            premiumMentors
        ] = await Promise.all([

            // Total users
            User.countDocuments(),

            // Total mentors
            User.countDocuments({
                role: 'mentor'
            }),

            // Total learners
            User.countDocuments({
                role: 'learner'
            }),

            // Pending verification
            User.countDocuments({
                role: 'mentor',
                aadhaarVerificationStatus:
                    'pending'
            }),

            // Verified mentors
            User.countDocuments({
                role: 'mentor',
                aadhaarVerificationStatus:
                    'verified'
            }),

            // Premium enabled mentors
            User.countDocuments({
                role: 'mentor',
                premiumEnabled: true
            })
        ]);


        return res.status(200).json({
            totalUsers,
            totalMentors,
            totalLearners,
            pendingVerifications,
            verifiedMentors,
            premiumMentors
        });

    } catch (err) {

        console.error(
            'Admin stats error:',
            err
        );

        return res.status(500).json({
            message:
                'Unable to fetch admin statistics'
        });
    }
};