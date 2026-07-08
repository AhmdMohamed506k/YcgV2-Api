import { userModel } from "../../../../../DB/models/User/user_main_model/user.model.js";
import CourseSectionModel from "../../../../../DB/models/User/UserSections/CourseSection.model.js";
import { asyncHandler } from "../../../../middleware/asyncHandler/asyncHandler.js";
import redisClient from "../../../../utils/redis_client/redis_client.js";


const clearCache = async (userId) => {
    await redisClient.del(`Course:${userId}`);
    await redisClient.del(`user:profile:${userId}`);
};

export const AddNewUserCourseSection = asyncHandler(async (req, res, next) => {
    const { CourseName, CompanyName } = req.body;

    const UserExist = await userModel.findById(req.user._id);
    if (!UserExist) return next(new Error("User not found", 400));

    const AddedCourse = await CourseSectionModel.create({ CourseName, CompanyName, CreatedBy: req.user._id });
    if (!AddedCourse) return next(new Error("Failed to add course", 400));

  
    await clearCache(req.user._id);

    res.status(200).json({ msg: "added successfully", AddedCourse });
});

export const GetUserCourseSection = asyncHandler(async (req, res, next) => {

  const CashKey = `Course:${req.user._id}`;
    
  const CashData = await redisClient.get(CashKey);
  if (CashData) {
    return res.status(200).json({ status: "success", source: "Cache", UserCourses: JSON.parse(CashData) });
  }

  const UserCourses = await CourseSectionModel.find({ CreatedBy: req.user._id });
  if (UserCourses.length === 0) return next(new Error("Sorry user doesn't has data in this section", 400));

  await redisClient.set(CashKey, JSON.stringify(UserCourses), { EX: 300 });

  res.status(200).json({status: "success", source: "DB", UserCourses });


});

export const UpdateUserCourseData = asyncHandler(async (req, res, next) => {
  
  const { courseId } = req.params;


  const newCourseData = {};
  if (req.body.CourseName) newCourseData.CourseName = req.body.CourseName;
  if (req.body.CompanyName) newCourseData.CompanyName = req.body.CompanyName;

  
  const updatedCourseData = await CourseSectionModel.findOneAndUpdate({ CreatedBy: req.user._id, _id: courseId }, newCourseData,{ new: true });
    
  if (!updatedCourseData) return next(new Error("Course not found or you are not authorized", 404));

  await clearCache(req.user._id);

  res.status(200).json({ message: "Course updated successfully" });
});

export const DeleteUserCourse = asyncHandler(async (req, res, next) => {
  
    const { _id } = req.params;

    const result = await CourseSectionModel.findOneAndDelete({ _id, CreatedBy: req.user._id });
    if (!result) return next(new Error("Course not found or you are not authorized", 404));

    await clearCache(req.user._id);

    res.status(200).json({ message: "Course deleted successfully" });
});