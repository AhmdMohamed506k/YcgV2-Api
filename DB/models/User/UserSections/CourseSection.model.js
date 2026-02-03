import mongoose, { model, Types } from "mongoose";



const CourseSectionSchema = new mongoose.Schema({

    CourseName:{
        type:String,
        lowercase:true,
        required:true
    },
    ComanyName:{
        type:String,
        lowercase:true,
    },
    CreatedBy:{
      type:Types.ObjectId,
       ref:"user",
      required:true
    }

})

const CourseSectionModel= model("CourseSectionModel",CourseSectionSchema);
export {CourseSectionSchema,CourseSectionModel }