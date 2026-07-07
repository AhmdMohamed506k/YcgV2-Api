import joi from 'joi';
import { generalFields } from '../../../../middleware/Validation/generalFields.js';

export const addExperience = {
    body: joi.object({
        ExperienceType: joi.string().valid('Full-time', 'Part-time', 'Freelance', 'Internship').required(),
        JobTitle: joi.string().min(2).max(100).required(),
        CompanyName: joi.string().min(2).max(100).required(),
        StartFrom: joi.date().iso(),
        EndingIn: joi.date().iso().greater(joi.ref('StartFrom')),
        Location: joi.string(),
        LocationType: joi.string().valid('On-site', 'Remote', 'Hybrid'),
        StealWorking: joi.boolean().required()
    }).required()
};

export const updateExperience = {
    params: joi.object({
        _id: generalFields.id.required()
    }).required(),
    body: joi.object({
        ExperienceType: joi.string().valid('Full-time', 'Part-time', 'Freelance', 'Internship'),
        JobTitle: joi.string().min(2).max(100),
        CompanyName: joi.string().min(2).max(100),
        StartFrom: joi.date().iso(),
        EndingIn: joi.date().iso(),
        Location: joi.string(),
        LocationType: joi.string().valid('On-site', 'Remote', 'Hybrid'),
        StealWorking: joi.boolean()
    }).min(1)
};

export const deleteExperience = {
    params: joi.object({
        _id: generalFields.id.required()
    }).required()
};