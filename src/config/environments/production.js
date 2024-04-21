export default {
    api: {
        domain: 'mnhs.pitcompanion.com',
        port: 3000,
        redis: {
            host: '127.0.0.1',
            port: '6379',
            db: 0,
        },
    },
    admin: {
        host: 'https://mnhs.pitcompanion.com',
        prefix: '/admin',
    },
    teacher: {
        host: 'https://mnhs.pitcompanion.com',
        prefix: '/teacher',
    },
    student: {
        host: 'https://mnhs.pitcompanion.com',
        prefix: '/student',
    },
    worker: {
        domain: '127.0.0.1',
        port: 5672,
        vhost: '',
        queuePrefix: 'mnhs',
    },
};
