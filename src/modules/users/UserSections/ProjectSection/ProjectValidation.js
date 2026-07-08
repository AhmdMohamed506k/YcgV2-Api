import joi from 'joi';
import { generalFields } from '../../../../middleware/validation/generalFields.js';

export const addProject = {
    body: joi.object({
        ProjectName: joi.string().min(3).max(100).required(),
        Description: joi.string().min(10).max(2000),
        UsedSkills: joi.alternatives().try(
            joi.array().items(joi.string()),
            joi.string()
        )
    }).required()
};

export const updateProject = {
    params: joi.object({
        ProjectID: generalFields.id.required()
    }).required(),
    body: joi.object({
        ProjectName: joi.string().min(3).max(100),
        Description: joi.string().min(10).max(2000),
        UsedSkills: joi.alternatives().try(
            joi.array().items(joi.string()),
            joi.string()
        )
    }).min(1)
};

export const deleteProject = {
    params: joi.object({
        ProjectID: generalFields.id.required()
    }).required()
};