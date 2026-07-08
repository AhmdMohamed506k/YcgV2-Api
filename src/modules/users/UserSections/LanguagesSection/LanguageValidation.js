

import joi from 'joi';
import { generalFields } from '../../../../middleware/validation/generalFields.js';

export const addLanguage = {
    body: joi.object({
        Language: joi.string().min(2).max(50).required(),
        Proficiency: joi.string().valid('Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Native').required()
    }).required()
};

export const updateLanguage = {
    params: joi.object({
        _id: generalFields.id.required()
    }).required(),
    body: joi.object({
        Language: joi.string().min(2).max(50),
        Proficiency: joi.string().valid('Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Native')
    }).min(1)
};

export const deleteLanguage = {
    params: joi.object({
        _id: generalFields.id.required()
    }).required()
};