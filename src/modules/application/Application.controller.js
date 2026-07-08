
//Model_imports
import { applicationModel } from "../../../DB/models/Jobs/job_application/job_application.model.js";
import { notificationModel } from "../../../DB/models/notifications/notifications.model.js";
import { userModel } from "../../../DB/models/User/user_main_model/user.model.js";
import { jobModel } from "../../../DB/models/Jobs/job_post/job.model.js";
import companyModel from "../../../DB/models/company/company.model.js";


// project service imports
import { asyncHandler } from "../../middleware/asyncHandler/asyncHandler.js";
import cloudinary from "../../utils/cloudinary/cloudinary.js";
import redisClient from "../../utils/redis_client/redis_client.js";
import { sendEmail } from "../../service/send_email/send_email.js"; 
import MyPusher from "../../service/pusher/pusher_config.js"; 





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
            Position: job.Position,
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
export const GetJobApplications = asyncHandler(async (req, res, next) => {


    const { jobId } = req.params;
    const userId = req.user._id;
    const cacheKey = `JobApplications:${jobId}`;

   
    const cachedApplications = await redisClient.get(cacheKey);
    if (cachedApplications) {
        const applicationsData = JSON.parse(cachedApplications);

      
        if (applicationsData.length > 0) {
            const company = await companyModel.findById(applicationsData[0].companyId);
            const isAdmin = company?.Admins.some(a => a.user.toString() === userId.toString());
            if (!isAdmin) return next(new Error("Unauthorized: You are not an admin of this company", { cause: 403 }));
        }

        return res.status(200).json({ status: "success", source: "cache", count: applicationsData.length, data: applicationsData });
    }

  
    const job = await jobModel.findById(jobId);
    if (!job) return next(new Error("Job post not found", { cause: 404 }));

    const company = await companyModel.findById(job.companyId);
    const isAdmin = company?.Admins.some(a => a.user.toString() === userId.toString());
    if (!isAdmin) return next(new Error("Unauthorized: Only company admins can view applications", { cause: 403 }));

  
    const applications = await applicationModel.find({ jobId }).populate("applicantId", "name email profilePicture phoneNumber") .sort({ createdAt: -1 }); 


    await redisClient.set(cacheKey, JSON.stringify(applications), { EX: 600 });

    res.status(200).json({status: "success",source: "database",count: applications.length,data: applications  });
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
export const ReviewAndRespondToApplication = asyncHandler(async (req, res, next) => {


    const { applicationId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    if (!status || !["accepted", "rejected"].includes(status)) {
        return next(new Error("You must strictly provide a decision: 'accepted' or 'rejected'", { cause: 400 }));
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

    const targetEmail = applicant.email || applicant.Email || applicant._doc?.email || applicant._doc?.Email;     

    console.log(targetEmail);
     

    const emailSubject = status === "accepted" 
        ? ` Thank you for your interest in ${application.jobSnapshot.Position} at ${company.CompanyName} after reviewing your application We would love to move to the next step of the interview!`
        : `Thank you for your interest in ${application.jobSnapshot.Position} at ${company.CompanyName}  Unfortunately, we will not be moving forward with your application, but we appreciate your time and interest in ${company.CompanyName}  `;

        
    await sendEmail({
        to: targetEmail,
        subject: emailSubject,
        html:`<table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background-color: #f3f2ef; padding: 24px 0;">
    <tr>
        <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; max-width: 600px; width: 100%;">
                
                <tr>
                    <td style="padding: 24px 28px 20px; border-bottom: 1px solid #e0e0e0;">
                        <p style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #0a66c2;">
                            YCG<span style="background-color: #0a66c2; color: #ffffff; padding: 2px 6px; border-radius: 3px; font-size: 14px; margin-left: 4px; vertical-align: middle;">Platform</span>
                        </p>
                        <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #1d1d1d;">
                            Update from ${company.CompanyName}
                        </h1>
                    </td>
                </tr>

                <tr>
                    <td style="padding: 20px 28px; border-bottom: 1px solid #e0e0e0; background-color: #fafafa;">
                        <table cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td style="width: 52px; vertical-align: top;">
                                    ${company?.Logo?.secure_url ? `<img src="${company.Logo.secure_url}" alt="${company.CompanyName} Logo" width="52" height="52" style="border: 1px solid #e0e0e0; border-radius: 6px; display: block; object-fit: contain;" />` : `<div style="width: 52px; height: 52px; background-color: #e8f4fd; border: 1px solid #cce4f6; border-radius: 6px; text-align: center; line-height: 52px; font-size: 12px; font-weight: 600; color: #0a66c2;">💼</div>`}
                                </td>
                                <td style="padding-left: 14px; vertical-align: middle;">
                                    <h2 style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #0a66c2;">
                                        ${application.jobSnapshot.title}
                                    </h2>
                                    <p style="margin: 0; font-size: 14px; color: #666666; font-weight: 500;">
                                        ${company.CompanyName}
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <tr>
                    <td style="padding: 28px 28px 24px;">
                        <p style="margin: 0 0 10px; font-size: 15px; color: #333333; line-height: 1.6;">
                            Dear ${applicant.firstName} ${applicant.lastName} ,
                        </p>
                        <p style="margin: 0 0 24px; font-size: 15px; color: #444444; line-height: 1.6; white-space: pre-line;">
                            ${emailSubject}
                        </p>
                        <p style="margin: 0; font-size: 15px; color: #333333; line-height: 1.6; font-weight: 600;">
                            Regards,<br>
                            <span style="color: #0a66c2;">${company.CompanyName} Team</span>
                        </p>
                    </td>
                </tr>

                <tr>
                    <td style="padding: 20px 28px; background-color: #f9f9f9; border-top: 1px solid #e0e0e0; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #888888; line-height: 1.6;">
                            This email was sent because you applied for a job on the YCG Platform.<br>
                            All rights reserved &copy; ${new Date().getFullYear()}.
                        </p>
                    </td>
                </tr>

            </table>
            </td>
    </tr>
</table>` 
    });



    const notification = await notificationModel.create({
        recipient: applicant?._id,
        sender: company?._id,
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

