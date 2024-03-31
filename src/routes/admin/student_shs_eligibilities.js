import { Hono } from 'hono';

import checkAdminToken from '../../middlewares/checkAdminToken.js';
import {
    createStudentShsEligibility,
    getStudentShsEligibilityById,
    updateStudentShsEligibilityById,
} from '../../controllers/admin/student_shs_eligibilities.js';

const studentShsEligibilities = new Hono().basePath('/admin/student-shs-eligibilities');

studentShsEligibilities.use('*', checkAdminToken);

studentShsEligibilities.get('/:studentId', getStudentShsEligibilityById);
studentShsEligibilities.post('/', createStudentShsEligibility);
studentShsEligibilities.patch('/:studentShsEligibilityId', updateStudentShsEligibilityById);

export default studentShsEligibilities;
