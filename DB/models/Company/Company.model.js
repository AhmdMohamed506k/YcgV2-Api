import { Schema, model } from "mongoose";

const companySchema = new Schema(
  {
    CompanyName: {
      type: String,
      required: [true, "Company name is Required"],
      unique: true,
      trim: true,
    },
    ContactEmail: {
      type: String,
      required: [true, "Company email is Required"],
      unique: true,
      lowercase: true,
    },
    Industry: {
      type: String,
      required: true,
    },
    OrganizationSize: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
      default: "1-10",
    },
    OrganizationType: {
      type: String,
      enum: [
        "public Company",
        "Government agency",
        "Nonprofit",
        "Sole proprietorship",
        "Privately held",
        "Partnership",
      ],
      default: "public Company",
    },
    Website: {
      type: String,
      match: [/^https?:\/\/.+/, "Please Enter valid URL"],
    },
    Location: {
      city: String,
      country: String,
      address: String,
    },
    Logo: {
      secure_url: String,
      public_id: String,
    },
    Description: {
      type: String,
 
    },
    HrManager: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    Admins: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["superAdmin", "admin", "editor"],
          default: "admin",
        },
      },
    ],
    Employees: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    IsVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

companySchema.index({ CompanyName: "text", Industry: "text" });

///////////////////Followers///////////////////////
companySchema.virtual("Followers", {
  ref: "Follow",
  localField: "_id",
  foreignField: "followingId",
});
companySchema.virtual("followersCount", {
  ref: "Follow",
  localField: "_id",
  foreignField: "followingId",
  count: true,
});

///////////////////Following///////////////////////
companySchema.virtual("Following", {
  ref: "Follow",
  localField: "_id",
  foreignField: "followerId",
});
companySchema.virtual("followingCount", {
  ref: "Follow",
  localField: "_id",
  foreignField: "followerId",
  count: true,
});

///////////////////Views/////////////////////////
companySchema.virtual("viewsCount", {
  ref: "View",
  localField: "_id",
  foreignField: "profileId",
  count: true,
});

const companyModel = model("Company", companySchema);
export default companyModel;
