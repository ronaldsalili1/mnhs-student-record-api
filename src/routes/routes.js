// Admin Routes
import adminAdmins from './admin/admins.js';
import adminAuth from './admin/auth.js';
import adminSchool from './admin/school.js';
import adminTeachers from './admin/teachers.js';
import adminSections from './admin/sections.js';
import adminSubjects from './admin/subjects.js';
import adminSubjectTeachers from './admin/subject_teachers.js';
import adminSemesters from './admin/semesters.js';
import adminStudents from './admin/students.js';

// Worker Routes
import workerNotifications from './worker/notifications.js';

export default [
    // Admin Routes
    [
        adminAdmins,
        adminAuth,
        adminSchool,
        adminTeachers,
        adminSections,
        adminSubjects,
        adminSemesters,
        adminSubjectTeachers,
        adminStudents,
    ],

    // Worker Routes
    [
        workerNotifications,
    ],
];
