import development from './environments/development.js';
import production from './environments/production.js';

const configs = {
    development,
    production,
};

export default configs[process.env.NODE_ENV] || configs.development;
