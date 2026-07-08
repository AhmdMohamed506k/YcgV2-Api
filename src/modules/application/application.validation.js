import joi from 'joi';
import { generalFields } from '../../middleware/validation/generalFields.js'

export const applicationValidation = {

    applyToJob: {
        params: joi.object({ jobId: generalFields.id.required() }),
        body: joi.object({
            answers: joi.array().items(
                joi.object({
                    question: joi.string().required(),
                    answer: joi.string().required()
                })
            ).optional(),
            coverLetter: joi.string().min(50).max(2000).optional(),
            cv: joi.object({
                secure_url: joi.string().uri().required(),
                public_id: joi.string().required()
            }).optional()
        }).required()
    },

   
    reviewApplication: {
        params: joi.object({ applicationId: generalFields.id.required() }),
        body: joi.object({
            status: joi.string().valid('accepted', 'rejected').required()
        }).required()
    },

    GetApplicationDetails: {
        params: joi.object({ applicationId: generalFields.id.required() })
    },
    
    GetJobApplications: {
        params: joi.object({ jobId: generalFields.id.required() })
    }
};