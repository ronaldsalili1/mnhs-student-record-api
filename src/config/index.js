import importAll from '../helpers/importAll.js';

const configs = await importAll('/config/environments');

export default configs[process.env.NODE_ENV] || configs.development;
