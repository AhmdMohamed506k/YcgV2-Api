import joi from 'joi';
import { generalFields } from '../../middleware/validation/generalFields.js'; 

export const jobValidation = {
   
    createJob: {
        body: joi.object({
            title: joi.string().min(3).required(),
            Position: joi.string().required(),
            description: joi.string().min(10).required(),
            companyId: generalFields.id.required(),
            requirements: joi.alternatives().try(
                joi.array().items(joi.string()),
                joi.string()
            ).required(),
            locationType: joi.string().valid('Onsite', 'Remote', 'Hybrid').required(),
            jobType: joi.string().valid('Full-time', 'Part-time', 'Internship', 'Freelance').required(),
            experienceLevel: joi.string().valid('Junior', 'Mid-Level', 'Senior', 'Lead').required(),
            salary: joi.object({
                min: joi.number().min(0).required(),
                max: joi.number().greater(joi.ref('min')).required(),
                currency: joi.string().length(3).default('USD')
            }).required(),
            screeningQuestions: joi.array().items(joi.string()).optional(),
            MustHaveQualifications: joi.array().items(joi.string()).optional(),
            PreferredQualifications: joi.array().items(joi.string()).optional()
        }).required()
    },

   
    updateJob: {
        params: joi.object({ JobPostId: generalFields.id.required() }),
        body: joi.object({
            title: joi.string().min(3).optional(),
            Position: joi.string().optional(),
            description: joi.string().min(10).optional(),
            requirements: joi.alternatives().try(joi.array().items(joi.string()), joi.string()).optional(),
            salary: joi.object({
                min: joi.number().min(0).optional(),
                max: joi.number().greater(joi.ref('min')).optional()
            }).optional(),
            state: joi.string().valid('open', 'closed').optional()
        }).min(1)
    },

 
    searchJobs: {
        query: joi.object({
            title: joi.string().optional(),
            locationType: joi.string().valid('Onsite', 'Remote', 'Hybrid').optional(),
            jobType: joi.string().valid('Full-time', 'Part-time', 'Internship', 'Freelance').optional(),
            minSalary: joi.number().min(0).optional(),
            maxSalary: joi.number().optional(),
            page: joi.number().integer().min(1).optional(),
            limit: joi.number().integer().min(1).max(50).optional()
        })
    },
  
    DeleteJob: {
        params: joi.object({ JobPostId: generalFields.id.required() })
    },
  
    getJobById: {
        params: joi.object({ JobPostId: generalFields.id.required() })
    }
};