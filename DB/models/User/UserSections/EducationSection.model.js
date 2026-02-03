import mongoose, { model, Types } from "mongoose";

const EducationSectionSchema = new mongoose.Schema({
    schoolOrUniversity: {
      type: String,
      trim: true,
      required: true,
    },

    degree: {
      type: String,
      trim: true,
      required: true,
    },

    startDate: {
      month: {
        type: Number,
        min: 1,
        max: 12,
        required: true,
      },
      year: {
        type: Number,
        min: 1900,
        required: true,
      },
      _id: false,
    },

    endDate: {
      month: {
        type: Number,
        min: 1,
        max: 12,
      },
      year: {
        type: Number,
        min: 1900,
      },
      _id: false,
    },

    stillStudent: {
      type: Boolean,
      required: true,
    },

    activitiesAndSocieties: {
      type: String,
      trim: true,
    },

    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

/* ---------- Conditional Validation ---------- */

const EducationSectionModel = model( "EducationSection", EducationSectionSchema);
export { EducationSectionModel, EducationSectionSchema };
