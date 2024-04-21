import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import bcrypt from 'bcrypt';
import Redis from 'ioredis';

import config from '../../config/index.js';
import statusCodes from '../../constants/statusCodes.js';
import { generateInternalServerError, generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';
import checkTeacherToken from '../../middlewares/checkTeacherToken.js';
import validate from '../../helpers/validator.js';
import { changePasswordSchema, updateProfileSchema } from '../../schema/teacher/profile.js';
import { generateRandomString } from '../../helpers/general.js';
import Teacher from '../../models/teacher.js';
import { publish } from '../../helpers/rabbitmq.js';

const app = new Hono().basePath('/profile');

app.use('*', checkTeacherToken);

app.get(
    '/',
    async (c) => {
        const teacher = c.get('teacher');
        const teacherObj = teacher.toObject();
        delete teacherObj.password;

        return c.json(generateResponse(statusCodes.OK, 'Success', { profile: teacherObj }));
    },
);

app.patch(
    '/',
    zValidator('json', updateProfileSchema, validate),
    async (c) => {
        const teacher = c.get('teacher');
        const { profile } = c.req.valid('json');
        const {
            last_name,
            first_name,
            middle_name,
            suffix,
        } = profile;

        teacher.last_name = last_name;
        teacher.first_name = first_name;
        teacher.middle_name = middle_name;
        teacher.suffix = suffix;
        teacher.updated_by = teacher._id;

        await teacher.save();

        const teacherObj = teacher.toObject();
        delete teacherObj.password;

        return c.json(generateResponse(statusCodes.OK, 'Success', { profile: teacherObj }));
    },
);

app.patch(
    '/change-password',
    zValidator('json', changePasswordSchema, validate),
    async (c) => {
        const teacher = c.get('teacher');
        const { profile } = c.req.valid('json');
        const {
            current_password,
            new_password,
            confirm_new_password,
        } = profile;

        // Check if current password is valid
        const passwordMatched = await bcrypt.compare(current_password, teacher.password);
        if (!passwordMatched) {
            c.status(statusCodes.FORBIDDEN);
            return c.json(generateResponse(403, 'Current password is incorrect'));
        }

        // Check if new_password and confirm_new_password matched
        if (new_password !== confirm_new_password) {
            c.status(statusCodes.UNAUTHORIZED);
            return c.json(generateResponse(statusCodes.FORBIDDEN, 'New password did not match'));
        }

        const saltRounds = 10;
        const password = await bcrypt.hash(new_password, saltRounds);

        teacher.password = password;
        await teacher.save();

        const teacherObj = teacher.toObject();
        delete teacherObj.password;

        return c.json(generateResponse(statusCodes.OK, 'Success', { profile: teacherObj }));
    },
);

export default app;
