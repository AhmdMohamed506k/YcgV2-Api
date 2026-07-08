import joi from 'joi';
import { generalFields } from '../../../../middleware/validation/generalFields.js';

export const addSkill = {
    body: joi.object({
        name: joi.string().min(1).max(50).required(),
        level: joi.string().valid('Beginner', 'Intermediate', 'Advanced', 'Expert').default('Intermediate'),
        experienceYears: joi.number().min(0).default(0)
    }).required()
};

export const updateSkill = {
    params: joi.object({ skillId: generalFields.id.required() }).required(),
    body: joi.object({
        name: joi.string().min(1).max(50),
        level: joi.string().valid('Beginner', 'Intermediate', 'Advanced', 'Expert'),
        experienceYears: joi.number().min(0)
    }).min(1)
};

export const deleteSkill = {
    params: joi.object({ skillId: generalFields.id.required() }).required()
};