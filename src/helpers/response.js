export const generateResponse = (code, message, data) => ({
    meta: {
        code,
        message,
    },
    ...(data && { data }),
});

export const generateRecordExistsReponse = (object) => generateResponse(409, `${object} already exist`);

export const generateRecordNotExistsReponse = (object) => generateResponse(404, `${object} not found`);

export const generateUnauthorizedReponse = (code, message) => generateResponse(code || 401, message || 'Email or password is incorrect');

export const generateInternalServerError = (message) => {
    generateResponse(500, message || 'Internal Server Error');
};

export const generateValidationErrorResponse = (message) => generateResponse(400, message);
