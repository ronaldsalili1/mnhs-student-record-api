import amqp from 'amqplib';

import config from '../config/index.js';

const username = process.env.AMQP_USERNAME;
const password = process.env.AMQP_PASSWORD;
const {
    domain,
    port,
    vhost,
    queuePrefix,
} = config.worker;

// eslint-disable-next-line import/prefer-default-export
export const publish = async (queue, payload) => {
    const amqpHost = `amqp://${username}:${password}@${domain}:${port}/${vhost}`;
    const connection = await amqp.connect(amqpHost);
    const channel = await connection.createChannel();
    const actualQueueName = `${queuePrefix}_${queue}`;
    await channel.assertQueue(actualQueueName);
    await channel.sendToQueue(actualQueueName, Buffer.from(JSON.stringify(payload)));
};
