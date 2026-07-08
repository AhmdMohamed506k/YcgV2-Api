import { nanoid } from "nanoid/non-secure";
import { userModel } from "../../../../../DB/models/User/user_main_model/user.model.js";
import { experienceSectionModel } from "../../../../../DB/models/User/UserSections/ExperienceSection.model.js";
import { asyncHandler } from "../../../../middleware/asyncHandler/asyncHandler.js";
import { customAlphabet } from "nanoid";
import mongoose from "mongoose";
import redisClient from "../../../../utils/redis_client/redis_client.js";



const clearCache = async (userId) => {
    await redisClient.del(`Experience:${userId}`);
    await redisClient.del(`user:profile:${userId}`);
};



//==> AddNewExperience
export const AddNewUserExperienceSection = asyncHandler(async (req, res, next) => {
    const { ExperienceType, JobTitle, CompanyName, StartFrom, EndingIn, Location, LocationType, StealWorking } = req.body;

   
    if (StealWorking === "false" && StartFrom > EndingIn) {
        return res.status(400).json({ msg: "Start date must be before end date" });
    }

    const ObjectData = {ExperienceType, JobTitle, CompanyName, StealWorking, Location, LocationType, CreatedBy: req.user._id,...(StealWorking === "false" && { StartFrom, EndingIn }) };

    const newExperience = await experienceSectionModel.create(ObjectData);
    if (!newExperience) return next(new Error("Failed to add experience", 400));

    await clearCache(req.user._id);
    res.status(200).json({ msg: "Experience added successfully" });
});

//==> GetUserExperience
export const GetSpecificUserExperience = asyncHandler(async(req,res,next)=>{
              

  const cashKey= `Experience:${req.user._id}`
   
  const CashedData= await redisClient.get(cashKey)
  if(CashedData){
  return res.status(200).json({status:'success', source:'cash',data:JSON.parse(CashedData)});
  }

  const Experiences = await experienceSectionModel.find({CreatedBy:req.user._id});
  if (!Experiences) return next(new Error("User not found or User has no Experiences", 400));
    
  await redisClient.set(cashKey ,JSON.stringify(Experiences),"EX",300)
   
     
  return res.status(200).json({UserExperiences:Experiences})
})

//==> UpdataSpecificUserExperience
export const updateExperienceData = asyncHandler(async (req, res, next) => {
  const { _id } = req.params;
  const { ExperienceType, JobTitle, CompanyName, StartFrom, EndingIn, Location, LocationType, StealWorking} = req.body;

  const experience = await experienceSectionModel.findById(_id);

  if (!experience) {return next(new Error("Sorry Experience Not Found", { cause: 400 }));}

 
  experience.ExperienceType = ExperienceType;
  experience.JobTitle = JobTitle;
  experience.CompanyName = CompanyName;
  experience.Location = Location;
  experience.LocationType = LocationType;
  experience.StealWorking = StealWorking;

  // date logic
  if (StealWorking === false) {
    experience.StartFrom = StartFrom;
    experience.EndingIn = EndingIn;
  } else {
    experience.EndingIn = null;
  }

  await experience.save();
 
  await clearCache(req.user._id);

  return res.status(200).json({message: "Experience updated successfully", experience});
});

// ==> DeleteSpecificUserExperience
export const DeleteUserExperienceSection = asyncHandler(async (req, res, next) => {
  const { _id } = req.params;

  const experience = await experienceSectionModel.findByIdAndDelete(_id);

  if (!experience) {
    return next(new Error("Experience Not Found", { cause: 404 }));
  }
   
 
  await clearCache(req.user._id);


  return res.status(200).json({ message: "Experience deleted successfully"});
});
