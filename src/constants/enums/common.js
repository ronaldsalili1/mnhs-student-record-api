export default {
    admin: {
        status: ['enabled', 'disabled'],
        roles: ['superadmin', 'principal', 'head_teacher'],
    },
    user: {
        status: ['enabled', 'disabled'],
    },
    notificationEnum: {
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
};
