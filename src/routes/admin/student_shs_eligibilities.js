import { Hono } from 'hono';

import checkAdminToken from '../../middlewares/checkAdminToken.js';
import StudentShsEligibility from '../../models/student_shs_eligibility.js';
import { generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';
import statusCodes from '../../constants/statusCodes.js';

const app = new Hono().basePath('/student-shs-eligibilities');

app.use('*', checkAdminToken);

// GET ENDPOINTS
app.get(
    '/:studentId',
    async (c) => {
        const id = c.req.param('studentId');

        const studentShsEligibility = await StudentShsEligibility
            .findOne({ student_id: id }).lean();

        return c.json(generateResponse(statusCodes.OK, 'Success', { student_shs_eligibility: studentShsEligibility }));
    },
);

// POST ENDPOINTS
app.post(
    '/',
    async (c) => {
        const admin = c.get('admin');
        const { student_shs_eligibility: studentShsEligibilityBody } = await c.req.json();
        const {
            student_id,
            hs_completer,
            hs_gen_avg,
            jhs_completer,
            jhs_gen_avg,
            completion_date,
            school_name,
            school_address,
            pept_passer,
            pept_rating,
            als_ae_passer,
            als_ae_rating,
            others,
            assesment_date,
            clc_name_address,
        } = studentShsEligibilityBody;

        const newStudentShsEligibility = new StudentShsEligibility();
        newStudentShsEligibility.student_id = student_id;
        newStudentShsEligibility.hs_completer = hs_completer;
        newStudentShsEligibility.hs_gen_avg = hs_gen_avg;
        newStudentShsEligibility.jhs_completer = jhs_completer;
        newStudentShsEligibility.jhs_gen_avg = jhs_gen_avg;
        newStudentShsEligibility.completion_date = completion_date;
        newStudentShsEligibility.school_name = school_name;
        newStudentShsEligibility.school_address = school_address;
        newStudentShsEligibility.pept_passer = pept_passer;
        newStudentShsEligibility.pept_rating = pept_rating;
        newStudentShsEligibility.als_ae_passer = als_ae_passer;
        newStudentShsEligibility.als_ae_rating = als_ae_rating;
        newStudentShsEligibility.others = others;
        newStudentShsEligibility.assesment_date = assesment_date;
        newStudentShsEligibility.clc_name_address = clc_name_address;
        newStudentShsEligibility.created_by = admin._id;

        await newStudentShsEligibility.save();

        c.status(statusCodes.CREATED);
        return c.json(generateResponse(statusCodes.OK, 'Success', { student_shs_eligibility: newStudentShsEligibility }));
    },
);

// PATCH ENDPOINTS
app.patch(
    '/:studentShsEligibilityId',
    async (c) => {
        const admin = c.get('admin');
        const id = c.req.param('studentShsEligibilityId');

        const { student_shs_eligibility: studentShsEligibilityBody } = await c.req.json();
        const {
            student_id,
            hs_completer,
            hs_gen_avg,
            jhs_completer,
            jhs_gen_avg,
            completion_date,
            school_name,
            school_address,
            pept_passer,
            pept_rating,
            als_ae_passer,
            als_ae_rating,
            others,
            assesment_date,
            clc_name_address,
        } = studentShsEligibilityBody;

        const studentShsEligibility = await StudentShsEligibility.findOne({ _id: id, student_id });
        if (!studentShsEligibility) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Student SHS Eligibility'));
        }

        studentShsEligibility.student_id = student_id;
        studentShsEligibility.hs_completer = hs_completer;
        studentShsEligibility.hs_gen_avg = hs_gen_avg;
        studentShsEligibility.jhs_completer = jhs_completer;
        studentShsEligibility.jhs_gen_avg = jhs_gen_avg;
        studentShsEligibility.completion_date = completion_date;
        studentShsEligibility.school_name = school_name;
        studentShsEligibility.school_address = school_address;
        studentShsEligibility.pept_passer = pept_passer;
        studentShsEligibility.pept_rating = pept_rating;
        studentShsEligibility.als_ae_passer = als_ae_passer;
        studentShsEligibility.als_ae_rating = als_ae_rating;
        studentShsEligibility.others = others;
        studentShsEligibility.assesment_date = assesment_date;
        studentShsEligibility.clc_name_address = clc_name_address;
        studentShsEligibility.updated_by = admin._id;

        await studentShsEligibility.save();

        return c.json(generateResponse(statusCodes.OK, 'Success', { student_shs_eligibility: studentShsEligibility }));
    },
);

export default app;
