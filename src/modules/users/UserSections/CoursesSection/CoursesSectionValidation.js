

import joi from 'joi';
import { generalFields } from '../../../../middleware/validation/generalFields.js'; 

export const addCourse = {
    body: joi.object({
        CourseName: joi.string().min(2).max(100).required(),
        CompanyName: joi.string().min(2).max(100).required()
    }).required()
};

export const updateCourse = {
    params: joi.object({
        courseId: generalFields.id.required()
    }).required(),
    body: joi.object({
        CourseName: joi.string().min(2).max(100),
        CompanyName: joi.string().min(2).max(100)
    }).min(1) 
};

export const deleteCourse = {
    params: joi.object({
        _id: generalFields.id.required() 
    }).required()
};