// Admin Routes
import adminAdmins from './admin/admins.js';
import adminAuth from './admin/auth.js';
import adminSchool from './admin/school.js';
import adminTeachers from './admin/teachers.js';

// Sections
import adminSections from './admin/sections.js';
import adminSectionAdvisers from './admin/section_advisers.js';
import adminSectionStudents from './admin/section_students.js';

import adminSubjects from './admin/subjects.js';
import adminSubjectTeachers from './admin/subject_teachers.js';
import adminSemesters from './admin/semesters.js';
import adminStudents from './admin/students.js';
import adminStudentShsEligibilities from './admin/student_shs_eligibilities.js';
import adminSubjectStudents from './admin/subject_students.js';

// Worker Routes
import workerNotifications from './worker/notifications.js';

export default [
    // Admin Routes
    [
        adminAdmins,
        adminAuth,
        adminSchool,
        adminTeachers,

        // Sections
        adminSections,
        adminSectionAdvisers,
        adminSectionStudents,

        adminSubjects,
        adminSemesters,
        adminSubjectTeachers,
        adminStudents,
        adminStudentShsEligibilities,
        adminSubjectStudents,
    ],

    // Worker Routes
    [
        workerNotifications,
    ],
];
