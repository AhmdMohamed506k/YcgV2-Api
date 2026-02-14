import Redis from "ioredis";
import { userModel } from "../../../../../DB/models/User/UserMainModel/user.model.js";
import { EducationSectionModel } from "../../../../../DB/models/User/UserSections/EducationSection.model.js";
import { asyncHandler } from "../../../../middleware/asyncHandler/asyncHandler.js";
import mongoose from "mongoose";
import redisClient from "../../../../utils/redisClient/redisClient.js";



export const AddUserNewEducationField = asyncHandler(async (req, res, next) => {



  const {  schoolOrUniversity,  degree,  startMonth,  startYear,  endMonth,  endYear,  StillStudent,  activitiesAndSocieties} = req.body;


  const stillStudent = StillStudent === true || StillStudent === "true";



  if (!schoolOrUniversity || !degree || !startMonth || !startYear) {
    return res.status(400).json({   msg: "school, degree, start month and year are required" });
  }
  if (!stillStudent && (!endMonth || !endYear)) {
    return res.status(400).json({   msg: "End date is required for graduated users"});
  }




  const startAt = new Date(startYear, startMonth - 1);
  let endAt = null;

  if (!stillStudent) {
    endAt = new Date(endYear, endMonth - 1);
    if (startAt > endAt) {return res.status(400).json({ msg: "Start date must be before end date" });}
  }

  const educationObject = { schoolOrUniversity, degree, startDate: {month: Number(startMonth),year: Number(startYear) }, endDate: stillStudent ? null :{month: Number(endMonth), year: Number(endYear)}, stillStudent, activitiesAndSocieties, createdBy: req.user._id,};
 
   


  const newUserEducation = await EducationSectionModel.create(educationObject)

  if (!newUserEducation) {
    return next(new Error("Failed to add education", 400));
  }

  
  const key = await redisClient.keys(`Education:*`);
  if(key.length > 0){await redisClient.del(key)}


  res.status(200).json({msg: "Education added successfully",education: educationObject,});
});


export const GetSpecificUserEductationSection = asyncHandler(async (req, res, next) => {

    
  const CashKey = `Education:${req.user._id}`;


  const CashedData = await redisClient.get(CashKey);
  if(CashedData){
   return res.status(200).json({status:"success", source:'cach',data:JSON.parse(CashedData)})
  } 

  const UserEductation= await EducationSectionModel.find({createdBy:req.user._id});
  if (UserEductation.length == 0) { return res.status(400).json({ msg: "Sorry user doesn't has data in this section" }); }

  await redisClient.set(CashKey , JSON.stringify(UserEductation),"EX",300);

  return res.status(200).json({ UserEductation });
});


export const updateEducationData = asyncHandler(async (req, res, next) => {
  const { _id } = req.params;

  const {  schoolOrUniversity,  degree,  startMonth,  startYear,  endMonth,  endYear,  stillStudent,  activitiesAndSocieties} = req.body;

  const isStillStudent = stillStudent === true || stillStudent === "true";



  /* ---------- Find Education ---------- */
 
  const education = await EducationSectionModel.findOne({_id})
  if (!education) {return next(new Error("Education record not found"),400)}

  /* ---------- Update Simple Fields ---------- */
  if (schoolOrUniversity) education.schoolOrUniversity = schoolOrUniversity;
  if (degree) education.degree = degree;
  if (typeof stillStudent !== "undefined") education.stillStudent = isStillStudent;
  if (activitiesAndSocieties)education.activitiesAndSocieties = activitiesAndSocieties;
  /* ---------- Update Start Date ---------- */
  if (startMonth)education.startDate.month = Number(startMonth);
  if (startYear)education.startDate.year = Number(startYear);

  /* ---------- Update End Date ---------- */
  if (education.stillStudent) {
    education.endDate = null;
  } else {
 

    if (endMonth)education.endDate.month = Number(endMonth);
    if (endYear)education.endDate.year = Number(endYear);

    if ( !education.endDate.month || !education.endDate.year) {
      return next(new Error("End date is required for graduated users",400))
    }

    const startAt = new Date( education.startDate.year, education.startDate.month - 1 );
    const endAt = new Date( education.endDate.year, education.endDate.month - 1 );

    if (startAt > endAt) {
      return res.status(400).json({ msg: "Start date must be before end date", });
    }
  }

  /* ---------- Save User ---------- */
  await education.save();
  
  // clear cach
  const key = await redisClient.keys(`Education:*`);
  if(key.length > 0){await redisClient.del(key)}

  res.status(200).json({ msg: "Education updated successfully", education});
});


export const DeleteUserEductationSection = asyncHandler(async (req, res, next) => {
    const { _id } = req.params;

    
    const deletedEducation = await EducationSectionModel.findByIdAndDelete({_id}) ;
    if(!deletedEducation){
      return next(new Error("Education not found",400))
    }

    res.status(200).json({ msg: "Deleted successfully" });
  }
);
