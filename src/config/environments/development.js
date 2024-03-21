export default {
    api: {
        domain: 'localhost',
        port: 3000,
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
        domain: '127.0.0.1',
        port: 5672,
        vhost: '',
        queuePrefix: 'mnhs',
    },
};
