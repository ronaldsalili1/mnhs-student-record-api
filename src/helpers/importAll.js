/* eslint-disable no-await-in-loop */
import fs from 'fs';
import path from 'path';

/**
 * Imports all files from a directory and create an object
 * where the file names serve as keys and the imported files
 * are the corresponding values. Example: importAll('/helpers')
 * @param {*} dirPath The path after src folder i.e. /helpers/foldeName
 * @returns {Object}
 */
const importAll = async (dirPath) => {
    // Read all files in the directory
    const absoluteDirPath = `${process.cwd()}/src${dirPath}`;
    const files = fs.readdirSync(absoluteDirPath);

    const filesObj = {};
    for (const file of files) {
        const env = path.parse(file).name;

        // Import the configuration object from the file
        const config = await import(path.join(absoluteDirPath, file));

        filesObj[env] = config.default;
    }

    return filesObj;
};

export default importAll;
