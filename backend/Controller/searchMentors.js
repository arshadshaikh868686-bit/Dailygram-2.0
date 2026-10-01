const User = require('../Modules/User');

exports.MentorSearch = async (req, res) => {
    try {
        const requestedSkills = String(req.query.skills || '')
            .split(',')
            .map(skill => skill.trim().toLowerCase())
            .filter(Boolean);

        const query = {
            role: 'mentor',
            _id: { $ne: req.user._id }
        };

        if (requestedSkills.length) {
            query.skills = {
                $in: requestedSkills.map(
                    skill =>
                        new RegExp(
                            `^${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
                            'i'
                        )
                )
            };
        }

        const mentors = await User.find(query)
            .select(
                'name skills bio experience profileImage rating completedSessions mentorshipPrice premiumEnabled'
            )
            .sort({
                rating: -1,
                completedSessions: -1,
                createdAt: -1
            });

        return res.status(200).json(mentors);

    } catch (err) {
        console.error('Mentor search error:', err);

        return res.status(500).json({
            message: 'Unable to fetch mentors'
        });
    }
};