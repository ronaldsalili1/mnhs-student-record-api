import amqp from 'amqplib';

const username = process.env.AMQP_USERNAME;
const password = process.env.AMQP_PASSWORD;
const host = process.env.AMQP_HOST;
const port = process.env.AMQP_PORT;
const vhost = process.env.AMQP_VHOST;
const queuePrefix = process.env.AMQP_QUEUE_PREFIX;

// eslint-disable-next-line import/prefer-default-export
export const publish = async (queue, payload) => {
    const amqpHost = `amqp://${username}:${password}@${host}:${port}/${vhost}`;
    const connection = await amqp.connect(amqpHost);
    const channel = await connection.createChannel();
    const actualQueueName = `${queuePrefix}_${queue}`;
    await channel.assertQueue(actualQueueName);
    await channel.sendToQueue(actualQueueName, Buffer.from(JSON.stringify(payload)));
};
