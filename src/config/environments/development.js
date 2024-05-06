export default {
    api: {
        domain: 'localhost',
        port: 3000,
        redis: {
            host: 'mnhs-student-record-redis',
            port: '6379',
            db: 0,
        },
    },
    admin: {
        host: 'http://localhost:3001',
        prefix: '/admin',
    },
    teacher: {
        host: 'http://localhost:3002',
        prefix: '/teacher',
    },
    student: {
        host: 'http://localhost:3003',
        prefix: '/student',
    },
    worker: {
        domain: 'mnhs-student-record-rabbitmq',
        port: 5672,
        vhost: '',
        queuePrefix: 'mnhs',
    },
};
