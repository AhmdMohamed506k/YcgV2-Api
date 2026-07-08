import joi from 'joi';
import { generalFields } from '../../../middleware/validation/generalFields.js'; 




// ===========================Register====================================
export const register = {
    body: joi.object({
        email: joi.string().email().required(),
        password: joi.string().min(8).required(),
        userPhoneNumber: joi.string().pattern(/^[0-9]{10,15}$/).required(),
        dateOfBirth: joi.date().iso().required()
    }).required()
};
export const verifyAccount = {
    body: joi.object({
        EmailVerificationCode: joi.string().length(8).required()
    }).required()
};

export const addUserName = {
    body: joi.object({
        firstName: joi.string().min(2).max(30).required(),
        lastName: joi.string().min(2).max(30).required()
    }).required()
};

export const addUserLocation = {
    body: joi.object({
        country: joi.string().min(2).required(),
        city: joi.string().min(2).required()
    }).required()
};

export const addUserCurrentJob = {
    body: joi.object({
        JopTitle: joi.string().min(2).max(100).required(),
        EmploymentType: joi.string().valid('Full-time', 'Part-time', 'Freelance', 'Internship').required()
    }).required()
};

export const addUserOtherInfo = {
    body: joi.object({
        userSubTitle: joi.string().max(200).optional()
    }).required()
};



// ===========================Login====================================
export const login = {
    body: joi.object({
        email: joi.string().email().required(),
        password: joi.string().required()
    }).required()
};

// ===========================UpdateUserData====================================
export const updateProfile = {
    body: joi.object({
        firstName: joi.string().min(2).max(50),
        lastName: joi.string().min(2).max(50),
        userSubTitle: joi.string().max(200),
        country: joi.string(),
        city: joi.string()
    }).min(1)
};
export const updatePassword = {
    body: joi.object({
        password: joi.string().min(8).required(),
        RePassword: joi.string().valid(joi.ref('password')).required()
    }).required()
};

// ===========================ForgetPassword====================================
export const forgetPassword = {
    body: joi.object({
        email: joi.string().email().required()
    }).required()
};
export const checkResetCode = {
    body: joi.object({
        email: joi.string().email().required(),
        Code: joi.string().length(6).required()
    }).required()
};
export const resetPassword = {
    body: joi.object({
        email: joi.string().email().required(),
        newPassword: joi.string().min(8).required()
    }).required()
};




// ===========================UserCv====================================
export const uploadCV = {
    body: joi.object({
        customName: joi.string().required()
    }).required()
};

export const deleteCV = {
    body: joi.object({
        cvId: generalFields.id.required()
    }).required()
};





