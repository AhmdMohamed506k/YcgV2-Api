
import {jobModel} from "../../../DB/models/Jobs/JobPost/Job.model.js"
import {applicationModel} from "../../../DB/models/Jobs/JobApplication/JobApplication.model.js"
import companyModel from "../../../DB/models/Company/Company.model.js"
import { asyncHandler } from "../../middleware/asyncHandler/asyncHandler.js";
import cloudinary from "../../utils/Cloudinary/Cloudinary.js";
import redisClient from "../../utils/redisClient/redisClient.js";



//RED1 Page-Jobs-Posts
export const CreateJobPost = asyncHandler(async (req, res, next) => {

    const { title, description, companyId,requirements, locationType, jobType, experienceLevel,  salary, screeningQuestions, rejectionSettings,MustHaveQualifications,PreferredQualifications } = req.body;
    
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

    res.status(201).json({status: "success",message: "Job post created successfully",data: newJob });
});


//ORANGE1 Page-Jobs-Posts
export const ApplyToJob = asyncHandler(async (req, res, next) => {


    const { jobId } = req.params;
    const { answers, coverLetter } = req.body; 
    const { id: applicantId } = req.identity;

   
    const job = await jobModel.findById(jobId);
    if (!job) return next(new Error("Job not found", { cause: 404 }));
    
    
    if (job.state === "closed") {
      return next(new Error("This job is closed and no longer accepting applications", { cause: 400 }));
    }

   
    const existingApplication = await applicationModel.findOne({ jobId, applicantId });
    if (existingApplication) { return next(new Error("You have already applied for this job", { cause: 409 }));}

  
    let cvData = {};
    if (req.file) {

      const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {folder: `YCG/Users/${applicantId}/Resumes`});
      cvData = { secure_url, public_id };

    } else if (req.body.cv) {

      cvData = req.body.cv; 

    } else {
      return next(new Error("CV file is required to apply", { cause: 400 }));
    }

    
  
    let applicationStatus = "pending";

    if (job.rejectionSettings?.enabled && job.rejectionSettings?.autoReject) {

        for (const q of job.screeningQuestions) {
           
          const userAns = answers?.find(a => a.question === q.question);
            
          if (q.idealAnswer && userAns?.answer !== q.idealAnswer) {
              applicationStatus = "rejected";
              break; 
          }
        }
    }

  
    const newApplication = await applicationModel.create({
        jobId,
        applicantId,
        companyId: job.companyId,
        jobSnapshot: {
            title: job.title,
            description: job.description,
            requirements: job.requirements,
            locationType: job.locationType,
            jobType: job.jobType,
            experienceLevel: job.experienceLevel,
            salary: job.salary
        },
        screeningQuestions: job.screeningQuestions,
        answers: answers || [],
        rejectionSettings: job.rejectionSettings,
        cv: cvData,
        coverLetter,
        status: applicationStatus,
        addedBy: job.createdBy
    });

    
    await jobModel.findByIdAndUpdate(jobId, { $inc: { applicationsCount: 1 } });

    
    await redisClient.del([`User:Dashboard:${job.companyId}`,`JobApplications:${jobId}`]);

    
    const responseMessage = applicationStatus === "rejected" ? 
    "Application submitted, but unfortunately it does not match the mandatory criteria." : "Your application has been submitted successfully.";

    res.status(201).json({status: "success",message: responseMessage,data: newApplication });
});

