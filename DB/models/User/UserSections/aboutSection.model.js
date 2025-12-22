import mongoose, { model, Types } from "mongoose";



const aboutSectionSchema = new mongoose.Schema({
    userDescription:{
        type:String,
        required:true,
        
    },
    CreatedBy:{
        type:Types.ObjectId,
        ref:"user",
        required:true
    }

})

const aboutSectionModel = model("aboutSection",aboutSectionSchema);

export {
aboutSectionModel,
aboutSectionSchema
} 