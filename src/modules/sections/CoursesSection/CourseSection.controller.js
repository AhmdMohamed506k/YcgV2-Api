import { userModel } from "../../../../DB/models/User/UserMainModel/user.model.js";
import { CourseSectionModel } from "../../../../DB/models/User/UserSections/CourseSection.model.js";
import {asyncHandler} from "../../../middleware/asyncHandler/asyncHandler.js"
import redisClient from "../../../utils/redisClient/redisClient.js";



export const AddNewUserCourseSection = asyncHandler(async(req , res , next)=>{
    
  const NewCourse={}

  if(req.body.CourseName)NewCourse.CourseName=req.body.CourseName;
  if(req.body.ComanyName)NewCourse.ComanyName=req.body.ComanyName;
  NewCourse.CreatedBy=req.user._id;


  // Check if User Exists
  const UserExist= await userModel.findById({_id:req.user._id});
  if(!UserExist){return next(new Error("User not found", 400))}


     
  // If User Exists Create User Course 
  const AddedCourse= await CourseSectionModel.create(NewCourse)
    
    

  // Clear Old Cash
  const key = await redisClient.keys(`Course:*`)
  if(key.length > 0){ await redisClient.del(key)}
     

  if(!AddedCourse){return next(new Error("Faild to add course",400))}
  res.status(200).json({msg:"added successfully",AddedCourse})


}) 





export const GetUserCourseSection = asyncHandler(async(req,res,next)=>{
    

  //Generate Cash Key 
  const CashKey=`Course:${req.user._id}`
   
  //Check if Courses are Cashed or not
  const CashData = await redisClient.get(CashKey) 
  if(CashData){

  // if Cashed Display cashed Courses  
  return res.status(200).json({status:"success",source:"Cash",UserCourses:JSON.parse(CashData)})

  }  

  //If not ==> Display User Courses
  const UserCourses = await CourseSectionModel.find({CreatedBy:req.user._id});
  if(UserCourses.length == 0){ return next(new Error("Sorry user doesn't has data in this section",400)) }


  //then Cash User Courses 
  await redisClient.set(CashKey,JSON.stringify(UserCourses),"EX",300)

  res.status(200).json({UserCourses})

})



export const UpdateUserCourseData = asyncHandler(async(req,res,next)=>{
     
  const {coursId}=req.params;
  const newCourseData={};
  if(req.body.CourseName)newCourseData.CourseName=req.body.CourseName;
  if(req.body.ComanyName)newCourseData.ComanyName=req.body.ComanyName;

   
  // Check if Course Exists and if user is authorized then Update old data  
  const updatedCourseData = await CourseSectionModel.findOneAndUpdate({CreatedBy:req.user._id , _id:coursId },newCourseData,{new:true})
  if (!updatedCourseData) {return next(new Error("Course not found or you are not authorized", 404)); }
    
  //Clear Cash
  const key = await redisClient.keys(`Course:*`)
  if(key.length > 0){ await redisClient.del(key)}

  res.status(200).json({ message: "Course updated successfully"});
    


})



export const DeleteUserCourse = asyncHandler(async (req, res, next) => {
  const { _id } = req.params;



  // Check if Course Exists and if user is authorized then Delete coures
  const result = await CourseSectionModel.findByIdAndDelete({_id,CreatedBy:req.user._id})
  if (!result) {
    return next(new Error("Course not found or you are not authorized", 404));
  }



  //Clear Cash
  const key = await redisClient.keys(`Course:*`);
  if(key.length > 0){ await redisClient.del(key)}



  res.status(200).json({message: "Course deleted successfully"});
});