import joi from 'joi';
import { generalFields } from '../../../../middleware/Validation/generalFields.js';



export const AddEducation = {
    body: joi.object({
        schoolOrUniversity: joi.string().min(2).max(100).required(),
        degree: joi.string().min(2).max(100).required(),
        startMonth: joi.number().integer().min(1).max(12).required(),
        startYear: joi.number().integer().min(1900).max(2100).required(),
        endMonth: joi.number().integer().min(1).max(12),
        endYear: joi.number().integer().min(1900).max(2100),
        StillStudent: joi.boolean().default(false),
        activitiesAndSocieties: joi.string().allow('', null)
    }).required()
};

export const UpdateEducation = {
    params: joi.object({
        _id: generalFields.id.required()
    }).required(),
    body: joi.object({
        schoolOrUniversity: joi.string().min(2).max(100),
        degree: joi.string().min(2).max(100),
        startMonth: joi.number().integer().min(1).max(12),
        startYear: joi.number().integer().min(1900).max(2100),
        endMonth: joi.number().integer().min(1).max(12),
        endYear: joi.number().integer().min(1900).max(2100),
        stillStudent: joi.boolean(),
        activitiesAndSocieties: joi.string().allow('', null)
    }).min(1)
};

export const DeleteEducation = {
    params: joi.object({
        _id: generalFields.id.required()
    }).required()
};