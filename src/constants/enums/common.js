export default {
    sex: ['male', 'female'],
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
            'password_reset_request',
            'grade_submission',
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
    student: {
        track: ['academic', 'tvl'],
        strand: ['com_sys_serv'],
    },
    grade: {
        status: ['pending', 'under_review', 'approved', 'rejected'],
    },
    form: ['sf10', 'master_gradesheet'],
};
