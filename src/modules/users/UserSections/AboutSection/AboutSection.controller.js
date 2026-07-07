import { userModel } from "../../../../../DB/models/User/UserMainModel/user.model.js";
import aboutSectionModel from "../../../../../DB/models/User/UserSections/aboutSection.model.js";
import { asyncHandler } from "../../../../middleware/asyncHandler/asyncHandler.js";
import redisClient from "../../../../utils/redisClient/redisClient.js"


const clearUserCache = async (userId) => {
    await redisClient.del(`user:profile:${userId}`);
};

export const GetSpecificUserAboutSection = asyncHandler(async (req, res, next) => {

    const cacheKey = `User:Profile:${req.user._id}:About`;
    const cachedData = await redisClient.get(cacheKey);

    
    if (cachedData) return res.status(200).json({ UserAboutSection: JSON.parse(cachedData) });

    const UserAboutSection = await aboutSectionModel.findOne({CreatedBy:req.user._id});
    if (!UserAboutSection) return next(new Error("User not found", 400));

    
    await redisClient.set(cacheKey, JSON.stringify(UserAboutSection), { EX: 3600 });
    res.status(200).json({ UserAboutSection });
});

export const AddNewUserAboutSection = asyncHandler(async (req, res, next) => {

    const { userDescription } = req.body;

  

    const UserHaveSection = await aboutSectionModel.findOne({CreatedBy:req.user._id})
    if (UserHaveSection != null) {
        return res.status(400).json({ msg: "Sorry, you cannot add more than 1 section" });
    }


    const NewUserSection = await aboutSectionModel.create({userDescription,CreatedBy:req.user._id})

    
    await clearUserCache(req.user._id);
    res.status(200).json({ msg: "Added successfully" });
});

export const updateAboutSectionData = asyncHandler(async (req, res, next) => {

  
    const { userDescription } = req.body;

    const UserAboutSection = await aboutSectionModel.findOne({CreatedBy:req.user._id})
    if(!UserAboutSection){
        return next(new Error("Sorry Section Not Found ",{cause:404}))
    }


   UserAboutSection.userDescription = userDescription;
   await UserAboutSection.save()

    
    await clearUserCache(req.user._id);
    res.status(200).json({ msg: "Updated successfully" });
});

export const DeleteUserAboutSection = asyncHandler(async (req, res, next) => {

    const { _id } = req.body;

    const SectionExists = await aboutSectionModel.findOneAndDelete({_id});
    if (!SectionExists) return next(new Error("Section not Found",{cause:404}));

    await clearUserCache(req.user._id);
    res.status(200).json({ msg: "Deleted successfully" });
});