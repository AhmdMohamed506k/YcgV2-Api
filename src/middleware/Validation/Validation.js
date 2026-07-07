



export const validate = (schema) => {
    return (req, res, next) => {
        const validationErrors = [];
        
        ['body', 'params', 'query'].forEach((key) => {
            if (schema[key]) {
                const validationResult = schema[key].validate(req[key], { abortEarly: false });
                if (validationResult.error) {
                    validationErrors.push(...validationResult.error.details);
                }
            }
        });

        if (validationErrors.length > 0) {
            return next(new Error(validationErrors.map(e => e.message).join(', '), { cause: 400 }));
        }
        next();
    };
};