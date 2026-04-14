import { model, Schema } from "mongoose";

const CompanyFollowSchema = new Schema(
  {
    FollowerId: {
      type: Schema.Types.ObjectId,
      ref: "company",
      required: true,
    },
    FollowingId: {
      type: Schema.Types.ObjectId,
      ref: "company",
      required: true,
    },
    FollowedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timeseries: true,
    versionKey: false,
    ob
  },
);

CompanyFollowModel.index({ FollowerId: 1, FollowingId: 1 }, { unique: true });

const CompanyFollowModel = model("CompanyFollow", CompanyFollowSchema);
export default CompanyFollowModel;
