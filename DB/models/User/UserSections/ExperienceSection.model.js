


import mongoose, { isObjectIdOrHexString, isValidObjectId, model, Schema, Types } from "mongoose";





const experienceSectionSchema = new mongoose.Schema({

  JobTitle: {
        type: String,

    },
    Experiencetype: {
        type: String,
        Enum: ["Full time", "Part Time", "Freelance / Project", "Internship", "Student Activity", "FullTime"],

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
    Location: {
        type: String,

    },
    LocationType: {
        type: String,
        enum: ["onsite", "hybrid", "remote"],

    },
    CreatedBy: {
        type: Types.ObjectId,
        ref: "user",
        required:true

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