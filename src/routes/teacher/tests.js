import { Hono } from 'hono';
import { getTests } from '../../controllers/teacher/tests.js';

const adminTests = new Hono().basePath('/teacher/tests');

adminTests.get('/', getTests);

export default adminTests;
