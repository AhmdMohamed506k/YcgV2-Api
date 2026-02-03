
import { userModel } from "../../../../DB/models/User/UserMainModel/user.model.js";
import { asyncHandler } from "../../../middleware/asyncHandler/asyncHandler.js";
import redisClient from "../../../utils/redisClient/redisClient.js";





export const AddnewUserLanguageSection = asyncHandler(async (req, res, next) => {

    const { Language, Proficiency } = req.body;
    const ObjectData = {Language, Proficiency,CreatedBy:req.user._id};

     
    // Find User By ID
    const user = await userModel.findById(req.user._id);
    if (!user) return next(new Error("User not found", 400));


    const sectionPath = "userSections.userLanguageSection";

    // Initialize section if it doesn't exist
    if (!user.userSections.userLanguageSection) {
     await userModel.findByIdAndUpdate(req.user._id, { $set: { [sectionPath]: [] } }, { new: true });
    }

    // Push language data
    const NewLangauge = await userModel.findByIdAndUpdate(req.user._id, { $push: { [sectionPath]: ObjectData } }, { new: true });
     
     

    // Clear cash
    const Key = await redisClient.keys(`Language:*`);
    if(Key.length > 0){ await redisClient.del(Key)};


    if (!NewLangauge) return next(new Error("Failed to add Language", 400));
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
  const userLanguages = user.userSections.userLanguageSection;
  if (!userLanguages || userLanguages.length === 0) {
    return next(new Error("Sorry, user has no languages in this section"));
  }

  // Cache the result
  await redisClient.set(cacheKey,JSON.stringify(userLanguages),"EX",3000);

  // Response
  return res.status(200).json({ status: "success",source: "db", data: userLanguages,});
});

export const updateUserLanguageData = asyncHandler(async (req, res, next) => {
  const { _id } = req.params;
  const { Language, Proficiency } = req.body;


  // Find User and the Language
  const result = await userModel.findOneAndUpdate( {_id: req.user._id,"userSections.userLanguageSection._id": _id},
    {
      $set: {
        "userSections.userLanguageSection.$.Language": Language,
        "userSections.userLanguageSection.$.Proficiency": Proficiency
      }
    },
    { new: true }
  );


  
  //clear cash after update
  const Key = await redisClient.keys(`Language:*`);
  if(Key.length > 0){ await redisClient.del(Key)};

  if (!result) { return next(new Error("Language not found or you are not authorized", 404)); }
  res.status(200).json({message: "Language updated successfully"});
});
export const DeleteUserLanguagesSection = asyncHandler(async (req, res, next) => {
  const { _id } = req.params;


  // Find User and the Language
  const result = await userModel.findOneAndUpdate( {_id: req.user._id,"userSections.userLanguageSection._id": _id},
    {
      $pull: {
        "userSections.userLanguageSection": { _id }
      }
    },
    { new: true }
  );



  //clear cash after Delete
  const Key = await redisClient.keys(`Language:*`);
  if(Key.length > 0){ await redisClient.del(Key)};




  if (!result) {return next(new Error("Language not found or you are not authorized", 404)); }

  res.status(200).json({
    message: "Language deleted successfully"
  });
});
