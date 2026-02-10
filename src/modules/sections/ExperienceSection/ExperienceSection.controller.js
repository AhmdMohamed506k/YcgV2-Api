import { nanoid } from "nanoid/non-secure";
import { userModel } from "../../../../DB/models/User/UserMainModel/user.model.js";
import { experienceSectionModel } from "../../../../DB/models/User/UserSections/ExperienceSection.model.js";
import { asyncHandler } from "../../../middleware/asyncHandler/asyncHandler.js";
import { customAlphabet } from "nanoid";
import mongoose from "mongoose";
import redisClient from "../../../utils/redisClient/redisClient.js";




//==> AddNewExperience
export const AddnewUserExperiencSection = asyncHandler(async (req, res, next) => {

    const { Experiencetype, JobTitle, CompanyName, StartFrom, EndingIn, Location, LocationType, StealWorking } = req.body;


    if (StartFrom > EndingIn) {
      return res.status(400).json({ msg: "Start date must be before end date" })
    }
    if (StealWorking !== "false") {


      const ObjectData = {  Experiencetype, JobTitle, CompanyName, StealWorking, Location, LocationType,  CreatedBy: req.user._id };

      const user = await userModel.findById(req.user._id);
      if (!user) return next(new Error("User not found", 400));



     
      const newExperience = await experienceSectionModel.create(ObjectData)

      if (!newExperience) return next(new Error("Failed to add experience", 400));
      
     
      const key= await redisClient.keys(`Experienc:*`);
      if(key.length > 0){ await redisClient.del(key)};

      res.status(200).json({ msg: "Experience added successfully" });


    } else {

    


      const ObjectData = {  Experiencetype, JobTitle, CompanyName, StartFrom, EndingIn, StealWorking,Location, LocationType, CreatedBy: req.user._id };

      const user = await userModel.findById(req.user._id);
      if (!user) return next(new Error("User not found", 400));

     
      
      const newExperience = await experienceSectionModel.create(ObjectData)

      if (!newExperience) return next(new Error("Failed to add experience", 400));

      const key= await redisClient.keys(`Experienc:*`);
      if(key.length > 0){ await redisClient.del(key)};

      res.status(200).json({ msg: "Experience added successfully" });
    }

})

//==> GetUserExperience
export const GetSpecificUserExperienc = asyncHandler(async(req,res,next)=>{
              

  const cashKey= `Experienc:${req.user._id}`
   
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
export const updatExperiencData = asyncHandler(async (req, res, next) => {
  const { _id } = req.params;
  const { Experiencetype, JobTitle, CompanyName, StartFrom, EndingIn, Location, LocationType, StealWorking} = req.body;

  const experience = await experienceSectionModel.findById(_id);

  if (!experience) {return next(new Error("Sorry Experience Not Found", { cause: 400 }));}

 
  experience.Experiencetype = Experiencetype;
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
 
  const key= await redisClient.keys(`Experienc:*`);
  if(key.length > 0){ await redisClient.del(key)};
  return res.status(200).json({message: "Experience updated successfully", experience});
});

// ==> DeleteSpecificUserExperience
export const DeletUserExperienceSection = asyncHandler(async (req, res, next) => {
  const { _id } = req.params;

  const experience = await experienceSectionModel.findByIdAndDelete(_id);

  if (!experience) {
    return next(new Error("Experience Not Found", { cause: 404 }));
  }
   
   const key= await redisClient.keys(`Experienc:*`);
    if(key.length > 0){ await redisClient.del(key)};
  return res.status(200).json({ message: "Experience deleted successfully"});
});
