export default {
    api: {
        domain: 'localhost',
        port: 3000,
    },
    admin: {
        host: 'http://localhost:3001/admin',
    },
    teacher: {
        host: 'http://localhost:3002/teacher',
    },
    student: {
        host: 'http://localhost:3003/student',
    },
    worker: {
        domain: '127.0.0.1',
        port: 5672,
        vhost: '',
        queuePrefix: 'mnhs',
    },
};
