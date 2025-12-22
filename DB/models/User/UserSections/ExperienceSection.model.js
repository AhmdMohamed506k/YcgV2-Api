

import mongoose, { isObjectIdOrHexString, isValidObjectId, model, Schema, Types } from "mongoose";





 const experienceSectionSchema = new mongoose.Schema({



    Experiencetype: {
        type: String,
        Enum: ["Full time", "Part Time", "Freelance / Project", "Internship", "Student Activity", "FullTime"],

    },
    JobTitle: {
        type: String,

    },
    CompanyName: {
        type: String,

    },
    StartFrom: {
        type: Date,
    },
    EndingIn: {
        type: Date,
    },
    StealWorking: {
        type: Boolean,


    },
    CreatedBy: {
        type: Types.ObjectId,
        ref: "user",

    }

}, {
    _id: true,
    timestamps: true,
    versionKey: false,

})

const experienceSectionModel = model("experienceSection", experienceSectionSchema);
export {
    experienceSectionSchema,
    experienceSectionModel
} 