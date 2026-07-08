import joi from 'joi';
import { generalFields } from '../../middleware/validation/generalFields.js'

export const chatValidation = {
  
    sendMessage: {
        body: joi.object({
            receiverId: generalFields.id.required(),
            receiverType: joi.string().valid('User', 'Company').required(),
            text: joi.string().min(1).max(2000).required()
        }).required()
    },

    
    getChatHistory: {
        params: joi.object({ chatId: generalFields.id.required() }).required()
    }
};