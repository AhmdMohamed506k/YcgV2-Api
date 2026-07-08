import joi from 'joi';
import { generalFields } from '../../../../middleware/validation/generalFields.js';

export const addLicense = {
    body: joi.object({
        Name: joi.string().min(2).max(100).required(),
        organization: joi.string().min(2).max(100).required(),
        CertificationURL: joi.string().uri() 
    }).required()
};

export const updateLicense = {
    params: joi.object({
        id: generalFields.id.required() 
    }).required(),
    body: joi.object({
        Name: joi.string().min(2).max(100),
        organization: joi.string().min(2).max(100),
        CertificationURL: joi.string().uri()
    }).min(1)
};

export const deleteLicense = {
    params: joi.object({
        id: generalFields.id.required()
    }).required()
};