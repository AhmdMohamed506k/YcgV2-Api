import { jobModel } from "../../../DB/models/Jobs/JobPost/Job.model.js";
import { applicationModel } from "../../../DB/models/Jobs/JobApplication/JobApplication.model.js";
import companyModel from "../../../DB/models/Company/Company.model.js";
import { asyncHandler } from "../../middleware/asyncHandler/asyncHandler.js";
import cloudinary from "../../utils/Cloudinary/Cloudinary.js";
import redisClient from "../../utils/redisClient/redisClient.js";
import { sendEmail } from "../../service/SendEmail/sendMail.js"; 
import MyPusher from "../../service/Pusher/PusherConfig.js"; 

// ====================================JobPostCRUD====================================================
 
export const CreateJobPost = asyncHandler(async (req, res, next) => {
    const { title,Position, description, companyId, requirements, locationType, jobType, experienceLevel, salary, screeningQuestions, rejectionSettings, MustHaveQualifications, PreferredQualifications } = req.body;
    const userId = req.user._id;

    const company = await companyModel.findById(companyId);
    if (!company) return next(new Error("Company not found", { cause: 404 }));

    const isAdmin = company.Admins.some(a => a.user.toString() === userId.toString());
    if (!isAdmin) return next(new Error("Unauthorized: Only company admins can post jobs", { cause: 403 }));
    
    let ValidRequirements = [];
    if (requirements) {
        if (Array.isArray(requirements)) {
            ValidRequirements = requirements;
        } else if (typeof requirements === "string") {
            ValidRequirements = requirements.split(/[,\s]+/).filter(Boolean);
        } else {
            ValidRequirements = [requirements.toString()];
        }
    }

    const newJob = await jobModel.create({
        title, 
        Position,
        description, 
        companyId, 
        requirements: ValidRequirements, 
        locationType, 
        jobType, 
        experienceLevel, 
        salary, 
        createdBy: userId, 
        screeningQuestions: screeningQuestions || [],
        rejectionSettings: rejectionSettings || { enabled: false, autoReject: false },
        MustHaveQualifications,
        PreferredQualifications,
        state: "open",
        applicationsCount: 0 
    });

    await redisClient.del([`User:CompanyPage:${companyId}`, `User:Dashboard:${companyId}`]);

    res.status(201).json({ status: "success", message: "Job post created successfully", data: newJob });
});
export const GetJobPostPublicPage = asyncHandler(async (req, res, next) => {
    const { JobPostId } = req.params;
     
    const CacheKey = `User:CompanyPage:JobPostInfo:${JobPostId}`;
    const CacheData = await redisClient.get(CacheKey);

    if (CacheData) {
       return res.status(200).json({ status: "Success", source: "Cache", data: JSON.parse(CacheData) });
    }

    const JobInfo = await jobModel.findById(JobPostId).populate("companyId", "CompanyName Location Logo Industry");
    if (!JobInfo) return next(new Error("Job post not found", { cause: 404 }));

    await redisClient.set(CacheKey, JSON.stringify(JobInfo), { EX: 3000 });

    res.status(200).json({ status: "Success", source: "DataBase", data: JobInfo });
});
export const UpdatePostedJobPost = asyncHandler(async (req, res, next) => {
    const { JobPostId, title,Position, description, requirements, locationType, jobType, experienceLevel, salary, screeningQuestions, rejectionSettings, MustHaveQualifications, PreferredQualifications, state } = req.body;
    const userId = req.user._id;

    const JobExists = await jobModel.findById(JobPostId);
    if (!JobExists) return next(new Error("Sorry Job Is not Exists", { cause: 404 }));

     
    const companyExists = await companyModel.findById(JobExists.companyId);
    if (!companyExists) return next(new Error("Sorry Company not Exists", { cause: 404 }));

    const CurrentAdmin = companyExists.Admins.some((a) => a.user.toString() === userId.toString());
    if (!CurrentAdmin) return next(new Error("Unauthorized: Only company admins can Update job posts information", { cause: 403 }));

    let validRequirements = [];
    if (requirements) {
        if (Array.isArray(requirements)) {
            validRequirements = requirements;
        } else if (typeof requirements === "string") {
            validRequirements = requirements.split(/[,\s]+/).filter(Boolean);
        } else {
            validRequirements = [requirements.toString()];
        }
    } else {
        validRequirements = JobExists.requirements;
    }

    JobExists.title = title || JobExists.title;
    JobExists.description = description || JobExists.description;
    JobExists.Position = Position || JobExists.Position;
    JobExists.requirements = validRequirements;
    JobExists.locationType = locationType || JobExists.locationType;
    JobExists.jobType = jobType || JobExists.jobType;
    JobExists.experienceLevel = experienceLevel || JobExists.experienceLevel;
    JobExists.salary = salary || JobExists.salary;
    JobExists.screeningQuestions = screeningQuestions || JobExists.screeningQuestions;
    JobExists.rejectionSettings = rejectionSettings || JobExists.rejectionSettings;
    JobExists.MustHaveQualifications = MustHaveQualifications || JobExists.MustHaveQualifications;
    JobExists.PreferredQualifications = PreferredQualifications || JobExists.PreferredQualifications;
    JobExists.state = state || JobExists.state;
    
    await JobExists.save();

  
    await redisClient.del([
        `User:CompanyPage:${JobExists.companyId}`, 
        `User:Dashboard:${JobExists.companyId}`,
        `User:CompanyPage:JobPostInfo:${JobPostId}`
    ]);

    res.status(200).json({ status: "success", Msg: "Updated Successfully" });
});
export const DeleteSpecificJobPost = asyncHandler(async (req, res, next) => {
    const { JobPostId } = req.params;
    const userId = req.user._id; 

    const JobPostExists = await jobModel.findById(JobPostId);
    if (!JobPostExists) return next(new Error("Sorry post is not Exists ", { cause: 404 }));

    const companyExists = await companyModel.findById(JobPostExists.companyId);
    if (!companyExists) return next(new Error("Sorry Company not Exists", { cause: 404 }));

    const CurrentAdmin = companyExists.Admins.some((a) => a.user.toString() === userId.toString());
    if (!CurrentAdmin) return next(new Error("Unauthorized: Only company admins can Delete job Post", { cause: 403 }));

    const companyId = JobPostExists.companyId;

    await jobModel.deleteOne({ _id: JobPostId });

    await redisClient.del([
        `User:CompanyPage:${companyId}`, 
        `User:Dashboard:${companyId}`,
        `User:CompanyPage:JobPostInfo:${JobPostId}`
    ]);

    res.status(200).json({ status: "success", Msg: "Deleted Successfully" });
});






