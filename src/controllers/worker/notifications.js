import statusCodes from '../../constants/enums/statusCodes.js';
import { generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';
import Notification from '../../models/notification.js';

export const getNotificationById = async (c) => {
    const id = c.req.param('notificationId');

    const notification = await Notification.findById(id).lean();
    if (!notification) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateRecordNotExistsReponse('Notification'));
    }

    return c.json(generateResponse(statusCodes.OK, 'Success', { notification }));
};

export const createNotification = async (c) => {
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
};

export const updateNotificationStatusById = async (c) => {
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
};
