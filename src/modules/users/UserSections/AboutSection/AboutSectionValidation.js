import joi from 'joi';
import { generalFields } from '../../../../middleware/Validation/generalFields.js'; 

export const addAboutSection = {
    body: joi.object({
        userDescription: joi.string().min(10).max(1000).required()
    }).required()
};

export const updateAboutSection = {

    body: joi.object({
        userDescription: joi.string().min(10).max(1000).required()
    }).required()
};

export const deleteAboutSection = {
    body: joi.object({
        _id: generalFields.id.required()
    }).required()
};