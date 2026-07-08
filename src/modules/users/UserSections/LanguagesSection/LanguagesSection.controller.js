
import { userModel } from "../../../../../DB/models/User/user_main_model/user.model.js";
import  LanguagesSectionModel  from "../../../../../DB/models/User/UserSections/Languages.model.js";
import { asyncHandler } from "../../../../middleware/asyncHandler/asyncHandler.js";
import redisClient from "../../../../utils/redis_client/redis_client.js";


const clearCache = async (userId) => {
    await redisClient.del(`Language:${userId}`);
    await redisClient.del(`user:profile:${userId}`);
};



export const AddNewUserLanguageSection = asyncHandler(async (req, res, next) => {

    const { Language, Proficiency } = req.body;
   

     
    // Find User By ID
    const user = await userModel.findById(req.user._id);
    if (!user) return next(new Error("User not found", 400));


    // Push language data
    const NewLanguage = await LanguagesSectionModel.create({Language, Proficiency,CreatedBy:req.user._id})
     
     

    // Clear cash
    await clearCache(req.user._id)


    if (!NewLanguage) return next(new Error("Failed to add Language", 400));
    res.status(200).json({ msg: "Language added successfully" });
    
})
export const GetSpecificUserLanguages = asyncHandler(async (req, res, next) => {

  // Find user
  const user = await userModel.findById(req.user._id);
  if (!user) {return next(new Error("User not found"));}

  // Cache key (user-specific)
  const cacheKey = `Language:${req.user._id}`;

  // Check cache
  const cachedData = await redisClient.get(cacheKey);
  if (cachedData) { return res.status(200).json({status: "success",source: "cache",data: JSON.parse(cachedData),});
  }

  // Get user languages
  const userLanguages = await LanguagesSectionModel.find({CreatedBy:req.user._id});

  // Cache the result
  await redisClient.set(cacheKey,JSON.stringify(userLanguages),"EX",3000);

  // Response
  return res.status(200).json({ status: "success",source: "db", data: userLanguages,});
});

export const updateUserLanguageData = asyncHandler(async (req, res, next) => {
  const { _id } = req.params;
  const { Language, Proficiency } = req.body;



  // Find User By ID
  const user = await userModel.findById(req.user._id);
  if (!user) return next(new Error("User not found", 400));





  // Find User and the Language
  const result = await LanguagesSectionModel.findOneAndUpdate( {CreatedBy: req.user._id, _id},
    {
    Language,
    Proficiency
    },
    { new: true }
  );


  
  //clear cash after update
  await clearCache(req.user._id)

  if (!result) { return next(new Error("Language not found or you are not authorized", 404)); }
  res.status(200).json({message: "Language updated successfully"});
});
export const DeleteUserLanguagesSection = asyncHandler(async (req, res, next) => {

  const { _id } = req.params;
   



  // Find User By ID
  const user = await userModel.findById(req.user._id);
  if (!user) return next(new Error("User not found", 400));


  // Find User and the Language
  const result = await LanguagesSectionModel.findOneAndDelete( {CreatedBy: req.user._id, _id})
   


  //clear cash after Delete
  await clearCache(req.user._id)


  if (!result) {return next(new Error("Language not found or you are not authorized", 404)); }

  res.status(200).json({ message: "Language deleted successfully"});
});
