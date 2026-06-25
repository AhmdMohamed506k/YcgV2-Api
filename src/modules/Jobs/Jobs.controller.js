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
    const { title, description, companyId, requirements, locationType, jobType, experienceLevel, salary, screeningQuestions, rejectionSettings, MustHaveQualifications, PreferredQualifications } = req.body;
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
    const { JobPostId, title, description, requirements, locationType, jobType, experienceLevel, salary, screeningQuestions, rejectionSettings, MustHaveQualifications, PreferredQualifications, state } = req.body;
    const userId = req.user._id;

    const JobExists = await jobModel.findById(JobPostId);
    if (!JobExists) return next(new Error("Sorry Job Is not Exists", { cause: 404 }));

     console.log(JobExists)
     
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




//=======================================ApplyToJob(Users)=======================================================

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
    if (existingApplication) { return next(new Error("You have already applied for this job", { cause: 409 })); }

    let cvData = {};
    if (req.file) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, { folder: `YCG/Users/${applicantId}/Resumes` });
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

    await redisClient.del([
        `User:CompanyPage:${job.companyId}`,
        `User:Dashboard:${job.companyId}`,
        `JobApplications:${jobId}`,
        `User:CompanyPage:JobPostInfo:${jobId}`
    ]);

    const responseMessage = applicationStatus === "rejected" ? 
    "Application submitted, but unfortunately it does not match the mandatory criteria." : "Your application has been submitted successfully.";

    res.status(201).json({ status: "success", message: responseMessage, data: newApplication });
});

//=======================================ReViewApplication(Company-Admins)=======================================================

export const ReviewAndRespondToApplication = asyncHandler(async (req, res, next) => {
    const { applicationId } = req.params;
    const { status, emailBody } = req.body;
    const userId = req.user._id;

    if (!status || !["accepted", "rejected"].includes(status)) {
        return next(new Error("You must strictly provide a decision: 'accepted' or 'rejected'", { cause: 400 }));
    }
    if (!emailBody || emailBody.trim().length < 10) {
        return next(new Error("You must write a professional email response", { cause: 400 }));
    }

    const application = await applicationModel.findById(applicationId);
    if (!application) return next(new Error("Application not found", { cause: 404 }));

    const company = await companyModel.findById(application.companyId);
    const isAdmin = company?.Admins.some(a => a.user.toString() === userId.toString());
    if (!isAdmin) return next(new Error("Unauthorized", { cause: 403 }));

    if (application.status === "accepted" || application.status === "rejected") {
        return next(new Error("This application has already been processed", { cause: 400 }));
    }

    const applicant = await userModel.findById(application.applicantId);
    if (!applicant) return next(new Error("Applicant not found", { cause: 404 }));

    const emailSubject = status === "accepted" 
        ? `after reviewing your application for ${application.jobSnapshot.title} - We would love to move to the next step of the interview!`
        : `Update on your application for ${application.jobSnapshot.title}`;

    await sendEmail({
        to: applicant.email,
        subject: emailSubject,
        html: `<p>Dear ${applicant.name},</p><p>${emailBody}</p>`
    });

    const notification = await notificationModel.create({
        recipient: applicant._id,
        sender: company._id,
        type: "job_application_response",
        content: `${company.name} Company has responded to your application for ${application.jobSnapshot.title}. Status: ${status}`
    });

    const channelName = `private-user-${applicant._id.toString()}`;
    
    try {
        await MyPusher.trigger(channelName, "new_notification", {
            message: notification.content,
            status: status,
            jobTitle: application.jobSnapshot.title,
            createdAt: notification.createdAt
        });
    } catch (MyPusherError) {
        console.error("Pusher trigger failed:", MyPusherError);
    }

    application.status = status;
    await application.save();

    await redisClient.del([
        `Application:Details:${applicationId}`, 
        `User:Dashboard:${application.companyId}`, 
        `JobApplications:${application.jobId}`,  
        `user:profile:${applicant._id}`
    ]);

    res.status(200).json({
        status: "success",
        message: `Application processed successfully`,
        data: application
    });
});

export const GetApplicationDetails = asyncHandler(async (req, res, next) => {
    const { applicationId } = req.params;
    const userId = req.user._id;
    const cacheKey = `Application:Details:${applicationId}`;

    const cachedApplication = await redisClient.get(cacheKey);

    if (cachedApplication) {
        const applicationData = JSON.parse(cachedApplication);
        
        const company = await companyModel.findById(applicationData.companyId);
        const isAdmin = company?.Admins.some(a => a.user.toString() === userId.toString());
        if (!isAdmin) return next(new Error("Unauthorized", { cause: 403 }));

        return res.status(200).json({ status: "success", source: "cache", data: applicationData });
    }
    
    const application = await applicationModel.findById(applicationId).populate("applicantId", "name email profilePicture phoneNumber");    
    if (!application) return next(new Error("Application not found", { cause: 404 }));

    const company = await companyModel.findById(application.companyId);
    const isAdmin = company?.Admins.some(a => a.user.toString() === userId.toString());
    if (!isAdmin) return next(new Error("Unauthorized", { cause: 403 }));

    
    await redisClient.set(cacheKey, JSON.stringify(application), { EX: 86400 });

    res.status(200).json({ status: "success", source: "database", data: application });
});