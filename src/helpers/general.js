/**
 * Capitalize the first letter of the word/string
 * @param {string} value
 * @returns {string}
 */
export const capitalizeFirstLetter = (value) => {
    if (typeof value !== 'string') {
        throw new Error('Input must be a string');
    }

    if (value.length === 0) {
        return value;
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
};

/**
 *
 * @param {Object} obj
 * @returns
 */
export const objectToQueryString = (obj) => {
    const keyValuePairs = [];

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            const encodedKey = encodeURIComponent(key);
            const encodedValue = encodeURIComponent(value);
            keyValuePairs.push(`${encodedKey}=${encodedValue}`);
        }
    }

    return `?${keyValuePairs.join('&')}`;
};

/**
 *
 * @param {number} length
 * @param {boolean} digitOnly
 * @returns {string}
 */
export const generateRandomString = (length = 20, digitOnly = false) => {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    if (digitOnly) {
        possible = '0123456789';
    }

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
};
