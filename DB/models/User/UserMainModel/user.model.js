import mongoose, { Schema, model } from "mongoose";
import { experienceSectionSchema } from "../UserSections/ExperienceSection.model.js";
import { aboutSectionSchema } from "../UserSections/aboutSection.model.js";

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    lastName: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    userSubTitle: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      unique: true,
    },
    skill: {
      type: Array,
      default: null,
    },
    userPhoneNumber: {
      type: String,
      unique: true,
    },
    dateofBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      lowercase: true,
      default: "male",
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    userCV: {
      secure_url: { type: String, default: null },
      public_id: { type: String, default: null },
    },
    userProfileImg: {
      secure_url: { type: String, default: null },
      public_id: { type: String, default: null },
    },
    userBanner: {
      secure_url: { type: String, default: null },
      public_id: { type: String, default: null },
    },
    ForgetPassCode:  { type: String, default: null },
    Emailverificationcode: String,
    EmailverificationisVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin", "company"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },
    location: {
      country: {
        type: String,
        default: null,
      },
      city: {
        type: String,
        default: null,
      },
    },
    UserCurrentJob: {
      JopTitle: {
        type: String,
        default: null,
      },
      EmploymentType: {
        type: String,
        default: null,
      },
    },
    userSections: {
      userExperienceSection: [experienceSectionSchema],
      userAboutSection: [aboutSectionSchema],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual("myFollowers", {
  ref: "Follow",
  localField: "_id",
  foreignField: "followingId",
});

userSchema.virtual("myFollowing", {
  ref: "Follow",
  localField: "_id",
  foreignField: "followerId",
});

userSchema.virtual("followersCount", {
  ref: "Follow",
  localField: "_id",
  foreignField: "followingId",
  count: true,
});

userSchema.virtual("followingCount", {
  ref: "Follow",
  localField: "_id",
  foreignField: "followerId",
  count: true,
});

export const userModel = model("user", userSchema);
