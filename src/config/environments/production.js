export default {
    api: {
        domain: 'mnhs.pitcompanion.com',
        port: 3000,
    },
    admin: {
        host: 'https://mnhs.pitcompanion.com/admin',
    },
    teacher: {
        host: 'https://mnhs.pitcompanion.com/teacher',
    },
    student: {
        host: 'https://mnhs.pitcompanion.com/student',
    },
    worker: {
        domain: '127.0.0.1',
        port: 5672,
        vhost: '',
        queuePrefix: 'mnhs',
    },
};
