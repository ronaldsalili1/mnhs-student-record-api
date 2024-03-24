export default {
    admin: {
        status: ['enabled', 'disabled'],
        roles: ['superadmin', 'principal', 'head_teacher'],
    },
    teacher: {
        status: ['enabled', 'disabled'],
    },
    notification: {
        channel: ['email', 'sms'],
        type: [
            'account_creation',
        ],
        status: [
            'queued',
            'cancelled',
            'sent',
        ],
    },
    subject: {
        type: ['core', 'applied', 'specialized'],
    },
    semester: {
        number: [1, 2],
        status: ['active', 'ended', 'upcoming'],
    },
};
