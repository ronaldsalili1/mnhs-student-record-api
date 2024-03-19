import { Hono } from 'hono';

import checkWorkerApiKey from '../../middlewares/checkWorkerApiKey.js';
import { createNotification, getNotificationById, updateNotificationStatusById } from '../../controllers/worker/notifications.js';

const workerNotifications = new Hono().basePath('/worker/notifications');

workerNotifications.use('*', checkWorkerApiKey);

workerNotifications.get('/:notificationId', getNotificationById);
workerNotifications.post('/', createNotification);
workerNotifications.patch('/:notificationId/status', updateNotificationStatusById);

export default workerNotifications;
