import { Hono } from 'hono';

import Notification from '../../models/notification.js';
import checkWorkerApiKey from '../../middlewares/checkWorkerApiKey.js';
import statusCodes from '../../constants/statusCodes.js';
import { generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';

const app = new Hono().basePath('/notifications');

app.use('*', checkWorkerApiKey);

// GET ENDPOINTS
app.get(
    '/:notificationId',
    async (c) => {
        const id = c.req.param('notificationId');

        const notification = await Notification.findById(id).lean();
        if (!notification) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Notification'));
        }

        return c.json(generateResponse(statusCodes.OK, 'Success', { notification }));
    },
);

// POST ENDPOINTS
app.post(
    '/',
    async (c) => {
        const { notification: notificationBody } = await c.req.json();
        const {
            channel,
            type,
            to,
            from,
            cc,
            bcc,
            subject,
            content,
        } = notificationBody;

        const newNotification = new Notification();
        newNotification.channel = channel;
        newNotification.type = type;
        newNotification.status = 'queued';
        newNotification.to = to;
        newNotification.from = from;
        newNotification.cc = cc;
        newNotification.bcc = bcc;
        newNotification.subject = subject;
        newNotification.content = content;

        await newNotification.save();

        c.status(statusCodes.CREATED);
        return c.json(generateResponse(statusCodes.OK, 'Success', { notification: newNotification }));
    },
);

// PATCH ENDPOINTS
app.patch(
    '/:notificationId/status',
    async (c) => {
        const id = c.req.param('notificationId');
        const { notification: notificationBody } = await c.req.json();
        const { status } = notificationBody;

        const notification = await Notification.findById(id);
        if (!notification) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Notification'));
        }

        notification.status = status;
        if (status === 'sent') {
            notification.sent_at = new Date();
        }

        await notification.save();

        return c.json(generateResponse(statusCodes.OK, 'Success', { notification }));
    },
);

export default app;
