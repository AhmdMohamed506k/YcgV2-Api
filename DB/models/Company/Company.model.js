import { Schema, model } from "mongoose";

const companySchema = new Schema(
  {
    CompanyName: {
      type: String,
      required: [true, "Company name is Required"],
      unique: true,
      trim: true,
    },
    companyEmail: {
      type: String,
      required: [true, "Company email is Required"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
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
      enum: ["public Company", "Government agency", "Nonprofit", "Sole proprietorship", "Privately held", "Partnership"],
      default: "public Company",
    },
    Website: {
      type: String,
      match: [/^https?:\/\/.+/, "Please Enter valid URL"],
    },
    location: {
      city: String,
      country: String,
      address: String,
    },
    logo: {
      secure_url: String,
      public_id: String,
    },
    description: {
      type: String,
      minLength: [50, "Description should be more than 50 words"],
    },
    hrManager: {
      type: Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false, 
    },
  },
  { timestamps: true, 
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
  },
);


companySchema.index({ companyName: "text", industry: "text" });

///////////////////Followers/////////////////////////

companySchema.virtual("CompanyFollowers",{
    ref:"CompanyFollow",
    localField:"_id",
    foreignField:"FollowerId",

})
companySchema.virtual("CompanyFollowersCount",{
    ref:"CompanyFollow",
    localField:"_id",
    foreignField:"FollowerId",
    count:true

})


///////////////////Following/////////////////////////


companySchema.virtual("CompanyFollowing",{
    ref:"CompanyFollow",
    localField:"_id",
    foreignField:"FollowingId",

})
companySchema.virtual("CompanyFollowingCount",{
    ref:"CompanyFollow",
    localField:"_id",
    foreignField:"FollowingId",
    count:true

})





const companyModel = model("company", companySchema);
export default companyModel;
