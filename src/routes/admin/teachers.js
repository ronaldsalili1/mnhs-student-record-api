import { Hono } from 'hono';
import bcrypt from 'bcrypt';
import { zValidator } from '@hono/zod-validator';

import Teacher from '../../models/teacher.js';
import checkAdminToken from '../../middlewares/checkAdminToken.js';
import { generateRecordExistsReponse, generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';
import statusCodes from '../../constants/statusCodes.js';
import { generateRandomString } from '../../helpers/general.js';
import { publish } from '../../helpers/rabbitmq.js';
import config from '../../config/index.js';
import { getTeacherOptionsSchema } from '../../schema/admin/teachers.js';
import validate from '../../helpers/validator.js';

const app = new Hono().basePath('/teachers');

app.use('*', checkAdminToken);

// GET ENDPOINTS
app.get(
    '/',
    async (c) => {
        const {
            page = 1,
            limit = 10,
            status,
            keyword,
        } = c.req.query();
        const skip = limit * (page - 1);
        const query = {
            ...(status && { status }),
            ...(keyword && {
                $or: [
                    { first_name: { $regex: keyword, $options: 'i' } },
                    { last_name: { $regex: keyword, $options: 'i' } },
                    { middle_name: { $regex: keyword, $options: 'i' } },
                    { suffix: { $regex: keyword, $options: 'i' } },
                    { email: { $regex: keyword, $options: 'i' } },
                ],
            }),
        };

        const total = await Teacher.countDocuments(query);
        const teachers = await Teacher.find(query)
            .limit(limit)
            .skip(skip)
            .sort({ last_name: 1 })
            .lean();

        for (const teacher of teachers) {
            delete teacher.password;
        }

        return c.json(generateResponse(statusCodes.OK, 'Success', {
            total,
            page,
            limit,
            count: teachers.length,
            teachers,
        }));
    },
);

app.get(
    '/options',
    zValidator('query', getTeacherOptionsSchema, validate),
    async (c) => {
        const {
            page,
            limit,
            keyword,
        } = c.req.valid('query');
        const skip = limit * (page - 1);

        const teacherQuery = {
            ...(keyword && {
                $or: [
                    { first_name: { $regex: keyword, $options: 'i' } },
                    { last_name: { $regex: keyword, $options: 'i' } },
                    { middle_name: { $regex: keyword, $options: 'i' } },
                    { suffix: { $regex: keyword, $options: 'i' } },
                ],
            }),
        };

        const total = await Teacher.countDocuments(teacherQuery);
        const teachers = await Teacher.find(teacherQuery)
            .limit(limit)
            .skip(skip)
            .sort({ last_name: 1, first_name: 1, middle_name: 1 })
            .lean();

        return c.json(generateResponse(statusCodes.OK, 'Success', {
            total,
            page,
            limit,
            count: teachers.length,
            teachers,
        }));
    },
);

app.get(
    '/:teacherId',
    async (c) => {
        const id = c.req.param('teacherId');

        const teacher = await Teacher.findById(id).lean();
        if (!teacher) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Teacher'));
        }

        delete teacher.password;

        return c.json(generateResponse(statusCodes.OK, 'Success', { teacher }));
    },
);
app.get(
    '/options/all',
    async (c) => {
        const teachers = await Teacher.find().sort({ last_name: 1 }).lean();

        // Remove password in response
        // eslint-disable-next-line no-param-reassign
        teachers.forEach((teacher) => delete teacher.password);

        return c.json(generateResponse(statusCodes.OK, 'Success', { teachers }));
    },
);

// POST ENDPOINTS
app.post(
    '/',
    async (c) => {
        const admin = c.get('admin');
        const { teacher: teacherBody } = await c.req.json();
        const {
            email,
            first_name,
            last_name,
            middle_name,
            suffix,
        } = teacherBody;

        const trimmedEmail = email.trim();
        const teacherExist = await Teacher.exists({ email: trimmedEmail });
        if (teacherExist) {
            c.status(statusCodes.CONFLICT);
            return c.json(generateRecordExistsReponse('Teacher with the same email'));
        }

        const saltRounds = 10;
        const plainPassword = generateRandomString(6);
        const password = await bcrypt.hash(plainPassword, saltRounds);

        try {
            await publish('spawn_notification', {
                type: 'account_creation',
                to: email,
                password: plainPassword,
                first_name,
                last_name,
                link: `${config.teacher.host}${config.teacher.prefix}/login`,
            });
        } catch (error) {
            return c.json(generateResponse(statusCodes.BAD_REQUEST, 'Unable to send account creation notification'));
        }

        const newTeacher = new Teacher();
        newTeacher.email = email;
        newTeacher.password = password;
        newTeacher.status = 'enabled';
        newTeacher.last_name = last_name;
        newTeacher.first_name = first_name;
        newTeacher.middle_name = middle_name;
        newTeacher.suffix = suffix;
        newTeacher.created_by = admin._id;

        await newTeacher.save();

        const teacherObject = newTeacher.toObject();
        delete teacherObject.password;

        c.status(statusCodes.CREATED);
        return c.json(generateResponse(statusCodes.OK, 'Success', { teacher: teacherObject }));
    },
);

// PATCH ENDPOINTS
app.patch(
    '/:teacherId',
    async (c) => {
        const admin = c.get('admin');
        const id = c.req.param('teacherId');
        const { teacher: teacherBody } = await c.req.json();
        const {
            email,
            first_name,
            last_name,
            middle_name,
            suffix,
            status,
            current_password,
            new_password_1,
            new_password_2,
        } = teacherBody;

        const existingTeacher = await Teacher.findById(id);
        if (!existingTeacher) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Teacher'));
        }

        // Check if email already exist
        const trimmedEmail = email.trim();
        const teacherEmailExist = await Teacher.exists({
            _id: { $ne: id },
            email: trimmedEmail,
        });
        if (teacherEmailExist) {
            c.status(statusCodes.CONFLICT);
            return c.json(generateRecordExistsReponse('Teacher with the same email'));
        }

        if (
            (current_password && current_password !== '')
        || (new_password_1 && new_password_1 !== '')
        || (new_password_2 && new_password_2 !== '')
        ) {
        // Check if current password is valid
            const passwordMatched = await bcrypt
                .compare(current_password, existingTeacher.password);
            if (!passwordMatched) {
                c.status(statusCodes.FORBIDDEN);
                return c.json(generateResponse(403, 'Current password is incorrect'));
            }

            // Check if new_password_1 and new_password_1 matched
            if (new_password_1 !== new_password_2) {
                c.status(statusCodes.FORBIDDEN);
                return c.json(generateResponse(403, 'The new password and the confirm password did not match'));
            }

            // Hash new password
            const saltRounds = 10;
            const newPassword = await bcrypt.hash(new_password_1, saltRounds);

            existingTeacher.password = newPassword;
        }

        existingTeacher.email = email;
        existingTeacher.last_name = last_name;
        existingTeacher.first_name = first_name;
        existingTeacher.middle_name = middle_name;
        existingTeacher.suffix = suffix;
        existingTeacher.status = status;
        existingTeacher.updated_by = admin._id;

        await existingTeacher.save();

        const teacherObject = existingTeacher.toObject();
        delete teacherObject.password;

        return c.json(generateResponse(statusCodes.OK, 'Success', { teacher: teacherObject }));
    },
);

export default app;
