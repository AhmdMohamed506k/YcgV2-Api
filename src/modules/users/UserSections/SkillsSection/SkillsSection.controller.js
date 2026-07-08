
import { SkillsSectionModel } from "../../../../../DB/models/User/UserSections/SkillsSection.model.js";
import { asyncHandler } from "../../../../middleware/asyncHandler/asyncHandler.js";
import redisClient from "../../../../utils/redis_client/redis_client.js";

const clearSkillsCache = async (userId) => {
    await redisClient.del(`Skills:${userId}`);
    await redisClient.del(`user:profile:${userId}`);

};


export const AddSkill = asyncHandler(async (req, res, next) => {
    const { name, level, experienceYears } = req.body;
    
    
   
    const updatedSkills = await SkillsSectionModel.findOneAndUpdate(
        { createdBy: req.user._id },
        { $push: { skills: { name, level, experienceYears } } },
        { new: true, upsert: true }
    );

    await clearSkillsCache(req.user._id);
    res.status(200).json({ msg: "Skill added successfully", skills: updatedSkills.skills });
});


export const GetSkills = asyncHandler(async (req, res, next) => {
    const cacheKey = `Skills:${req.user._id}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) return res.status(200).json({ source: "cache", data: JSON.parse(cachedData) });

    const userSkills = await SkillsSectionModel.findOne({ createdBy: req.user._id });
    if (!userSkills) return next(new Error("No skills found"), 404);

    await redisClient.set(cacheKey, JSON.stringify(userSkills.skills), { EX: 300 });
    res.status(200).json({ source: "db", data: userSkills.skills });
});

export const UpdateSkill = asyncHandler(async (req, res, next) => {
    const { skillId } = req.params;
    const { name, level, experienceYears } = req.body;

    const updated = await SkillsSectionModel.findOneAndUpdate(
        { createdBy: req.user._id, "skills._id": skillId },
        { 
            $set: { 
                "skills.$.name": name,
                "skills.$.level": level,
                "skills.$.experienceYears": experienceYears
            } 
        },
        { new: true }
    );

    if (!updated) return next(new Error("Skill not found"), 404);
    await clearSkillsCache(req.user._id);
    res.status(200).json({ msg: "Skill updated successfully" });
});


export const DeleteSkill = asyncHandler(async (req, res, next) => {
    const { skillId } = req.params;

    const updated = await SkillsSectionModel.findOneAndUpdate(
        { createdBy: req.user._id },
        { $pull: { skills: { _id: skillId } } },
        { new: true }
    );

    await clearSkillsCache(req.user._id);
    res.status(200).json({ msg: "Skill deleted successfully" });
});