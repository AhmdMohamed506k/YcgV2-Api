import mongoose, { model, Types } from "mongoose";



const LanguagesSectionSchema = new mongoose.Schema({
    Language:{
        type:String,
        required:true,
        
    },
    Proficiency:{
        type:String,
        required:true,
        
    },
    CreatedBy:{
        type:Types.ObjectId,
        ref:"user",
        required:true
    }

})

const LanguagesSectionModel = model("LanguagesSection",LanguagesSectionSchema);

export {LanguagesSectionModel,LanguagesSectionSchema} 