import joi from 'joi';
import { Types } from 'mongoose';


const objectIdValidation = (value, helper) => {
    return Types.ObjectId.isValid(value) ? true : helper.message('Invalid ID format');
};

export const generalFields = {
  
    id: joi.string().custom(objectIdValidation),
   
   
};