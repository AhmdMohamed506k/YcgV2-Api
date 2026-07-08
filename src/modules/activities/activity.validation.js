import joi from 'joi';
import { generalFields } from '../../middleware/validation/generalFields.js'; 




export const activityValidation = {
   
    getFeed: {
        query: joi.object({
            page: joi.number().integer().min(1),
            limit: joi.number().integer().min(1).max(50)
        })
    },

 
    createActivity: {
        body: joi.object({
            text: joi.string().min(1).required()
        }).required()
    },

    updateActivity: {
        params: joi.object({ activityId: generalFields.id.required() }),
        body: joi.object({
            text: joi.string().min(1).optional()
        }).min(1)
    },

    toggleLike: {
        body: joi.object({
            ActivityId: generalFields.id.required()
        }).required()
    },

    addComment: {
        body: joi.object({
            ActivityId: generalFields.id.required(),
            text: joi.string().min(1).required(),
            parentId: generalFields.id.optional()
        }).required()
    },

    updateComment: {
        body: joi.object({
            commentId: generalFields.id.required(),
            text: joi.string().min(1).required()
        }).required()
    },

    deleteComment: {
        body: joi.object({
            commentId: generalFields.id.required()
        }).required()
    },

  
    repostActivity: {
        body: joi.object({
            originalActivityId: generalFields.id.required(),
            content: joi.string().allow('').optional()
        }).required()
    }
};