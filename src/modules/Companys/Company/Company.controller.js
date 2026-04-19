import { ActivityModel } from "../../../../DB/models/Activitys/Activitys.model.js";
import companyModel from "../../../../DB/models/Company/Company.model.js";
import { userModel } from "../../../../DB/models/User/UserMainModel/user.model.js";
import { asyncHandler } from "../../../middleware/asyncHandler/asyncHandler.js";
import cloudinary from "../../../utils/Cloudinary/Cloudinary.js";
import redisClient from "../../../utils/redisClient/redisClient.js";

export const CreateCompanyPage = asyncHandler(async (req, res, next) => {
  const { CompanyName, ContactEmail, Industry, OrganizationSize, OrganizationType, Website, Location, Description,} = req.body;
  
  
  
  
  const isExist = await companyModel.findOne({ $or: [{ CompanyName }, { ContactEmail }],});
  if (isExist) {return next(new Error("Company Name or Contact Email already exists", 409)); }

    



  let logoData = {};
  if (req.file) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
      folder: `YCG/Companies/CompanyLogo/${CompanyName}`,
    });

    logoData = { secure_url, public_id };
  }

  const company = await companyModel.create({
    CompanyName,
    ContactEmail,
    Industry,
    OrganizationSize,
    OrganizationType,
    Website,
    Description,
    Location,
    Logo: logoData,
    HrManager: req.user._id,
    Employees: [req.user._id],
    Admins: { user: req.user._id, role: "superAdmin" },
  });

  return res.status(201).json({status: "success",message: "Company registered successfully",company,});
});

//Need Editing
export const GetSpeceficCompanyInfo = asyncHandler(async (req, res, next) => {


  const userId = req.user._id;


  const CashKey = `CompanyDashboard:${userId}`;
  const cachedData = await redisClient.get(CashKey);
  if (cachedData) {
    return res.status(200).json({status: "success",source: "cache",data: JSON.parse(cachedData),});
  }

     
    const currentAdmin = company.Admins.find(a => a.user.toString() === userId.toString());
    if (!currentAdmin || !["admin", "superAdmin"].includes(currentAdmin.role)) {
      return next(new Error("Unauthorized: Only admins can post", 403));
    }

  const company = await companyModel.findOne({ "Admins.user": userId }).populate("CompanyFollowers").populate("CompanyFollowersCount").populate("CompanyFollowingCount").populate("CompanyViewsCount");
  if (!company) {
    return next(new Error("Company not found or you don't have access"), 404);
  }








  await redisClient.set(CashKey, JSON.stringify(company), { EX: 300 });

  res.status(200).json({ status: "Success", source: "DB", data: company });
});

export const updateCompany = asyncHandler(async (req, res, next) => {


  const { companyId } = req.params;
  const { CompanyName, Industry, OrganizationSize, OrganizationType, Website, Location, Description,} = req.body;
  const userId = req.user._id;

  const company = await companyModel.findById(companyId);
  if (!company) return next(new Error("Company not Exists", 404));




     
    const currentAdmin = company.Admins.find(a => a.user.toString() === userId.toString());
    if (!currentAdmin || !["admin", "superAdmin"].includes(currentAdmin.role)) {
      return next(new Error("Unauthorized: Only admins can post", 403));
    }

  if (CompanyName && CompanyName !== company.CompanyName) {
    const nameExist = await companyModel.findOne({ CompanyName });
    if (nameExist) return next(new Error("Company name already exists", 409));
  }

  if (req.file) {
    if (company.Logo && company.Logo.public_id) {
      await cloudinary.uploader.destroy(company.Logo.public_id);
    }

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `YCG/Companies/CompanyLogo/${CompanyName || company.CompanyName}`,
      },
    );

    req.body.Logo = { secure_url, public_id };
  }

  const updatedCompany = await companyModel.findByIdAndUpdate(
    companyId,
    req.body,
    { new: true, runValidators: true },
  );

  if (updatedCompany) {
    const CashKey = `Company:${req.user._id}`;
    await redisClient.del(CashKey);
  }

  res.status(200).json({
    status: "success",
    message: "information updated successfully",
    company: updatedCompany,
  });
});

export const createActivity = asyncHandler(async (req, res, next) => {
  const { text, creatorType, companyId } = req.body;
  const userId = req.user._id;


  let activityData = {
    text,
    addedBy: userId,
    ActivityType: "text",
    creatorType: creatorType || "user",
    CreatedBy: userId, 
  };


  if (creatorType === "Company") {
    const company = await companyModel.findOne({ "Admins.user": userId, _id: companyId });
    if (!company) return next(new Error("Company not found or access denied", 404));

    const currentAdmin = company.Admins.find(a => a.user.toString() === userId.toString());
    if (!currentAdmin || !["admin", "superAdmin"].includes(currentAdmin.role)) {
      return next(new Error("Unauthorized: Only admins can post", 403));
    }
    activityData.CreatedBy = companyId;
  }


  if (req.files) {
    if (req.files.video) {
      const { public_id, secure_url } = await cloudinary.uploader.upload(req.files.video[0].path, {
        resource_type: "video",
        folder: `YCG/companys/${companyId}/Activities/videos`
      });
      activityData.media = { public_id, secure_url };
      activityData.ActivityType = "video";

      if (req.files.cover) {
        const cover = await cloudinary.uploader.upload(req.files.cover[0].path, {
          folder: `YCG/companys/${companyId}/Activities/videoCovers`
        });
        activityData.videoCover = { secure_url: cover.secure_url, public_id: cover.public_id };
      }
    } 
  
    else if (req.files.image) {
      const { public_id, secure_url } = await cloudinary.uploader.upload(req.files.image[0].path, {
        folder: `YCG/companys/${companyId}/Activities/ImageActivitys`
      });
      activityData.media = { public_id, secure_url };
      activityData.ActivityType = "image";
    }
  }

  const activity = await ActivityModel.create(activityData);
  await redisClient.del(`Feed:${companyId}`);

  res.status(201).json({ status: "success", data: activity });
});


export const addAdminToCompany = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const { newUserEmail, role } = req.body;
  const currentUserId = req.user._id;
  const CashKey = `CompanyDashboard:${userId}`;

  const company = await companyModel.findById(companyId);
  if (!company) return next(new Error("Company not Exists", 404));

  const currentAdmin = company.Admins.find(
    (admin) => admin.user.toString() === currentUserId.toString(),
  );

  if (!currentAdmin || currentAdmin.role !== "superAdmin") {
    return next(
      new Error("Sorry, you must be a Super Admin to add new managers", 403),
    );
  }

  const userToAdd = await userModel.findOne({ email: newUserEmail });
  if (!userToAdd) return next(new Error("Sorry, User not Exist", 404));

  const isAlreadyAdmin = company.Admins.some(
    (admin) => admin.user.toString() === userToAdd._id.toString(),
  );

  if (isAlreadyAdmin)
    return next(new Error("This user already exists in admins list", 400));

  company.Admins.push({ user: userToAdd._id, role: role || "admin" });

  await company.save();

  await redisClient.set(CashKey, JSON.stringify(company), { EX: 300 });

  res.status(200).json({
    status: "success",
    message: `${userToAdd.firstName + userToAdd.lastName}  add successfully as a ${role}`,
  });
});
