import { ActivityModel } from "../../../../DB/models/Activities/Activities.model.js";
import companyModel from "../../../../DB/models/Company/Company.model.js";
import { userModel } from "../../../../DB/models/User/UserMainModel/user.model.js";
import { asyncHandler } from "../../../middleware/asyncHandler/asyncHandler.js";
import cloudinary from "../../../utils/Cloudinary/Cloudinary.js";
import redisClient from "../../../utils/redisClient/redisClient.js";






// Company_Page_CRUD
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
export const GetSpecificCompanyDashBoard = asyncHandler(async (req, res, next) => {//Need Editing


  const userId = req.user._id;
  const resultObject={
    CompanyInfo:{
      
    },
    companyPostsCount:0,
    companyPosts:{}
  }



  const CashKey = `CompanyDashboard:${userId}`;
  const cachedData = await redisClient.get(CashKey);
  if (cachedData) {
    return res.status(200).json({status: "success",source: "cache",data: JSON.parse(cachedData),});
  }
 


  
  const companyExists = await companyModel.findOne({"Admins.user":userId});
  if (!companyExists) return next(new Error("Company not found", 404));  
     
  const currentAdmin = companyExists.Admins.find(a => a.user.toString() === userId.toString());
  if (!currentAdmin || !["admin", "superAdmin"].includes(currentAdmin.role)) {
    return next(new Error("Unauthorized: Only admins can post", 403));
  }




  const company = await companyModel.findOne({ "Admins.user": userId })
  .populate("Followers")
  .populate("followersCount")
  .populate("Following")
  .populate("followingCount")
  .populate("viewsCount");

  resultObject.CompanyInfo=company;


  const companyPosts = await ActivityModel.find({CreatedBy:company._id})

  
  resultObject.companyPosts=companyPosts;
  resultObject.companyPostsCount=companyPosts.length


  if (!company) {
    return next(new Error("Company not found or you don't have access"), 404);
  }

  

  await redisClient.set(CashKey, JSON.stringify(resultObject), { EX: 300 });

  res.status(200).json({ status: "Success", source: "DB", data: resultObject });
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
export const deleteCompany = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const userId = req.user._id;


  const company = await companyModel.findById(companyId);
  if (!company) return next(new Error("Company not found", 404));

  
  const isEmployeeValid = company.HRManagers?.some((hr) => hr.user.toString() === userId.toString() && hr.status === "active");
  if (!isEmployeeValid) {return next(new Error("Security Alert: User not found in HR records or inactive", 401));}

 
  const currentAdmin = company.Admins.find((admin) => admin.user.toString() === userId.toString());
  if (!currentAdmin || currentAdmin.role !== "superAdmin") {
    return next(new Error("Unauthorized: Only an active Super Admin can delete the page", 403));
  }

  const mediaToDelete = [company.Logo?.public_id, company.Banner?.public_id].filter(Boolean);
  if (mediaToDelete.length > 0) { await Promise.all(mediaToDelete.map(id => cloudinary.uploader.destroy(id)));}

  
  await ActivityModel.deleteMany({ CreatedBy: companyId });

 
  await companyModel.findByIdAndDelete(companyId);


  const keys = await redisClient.keys(`Feed:${companyId}*`);
  if (keys.length > 0) await redisClient.del(keys);

  res.status(200).json({status: "success",message: "Company deleted securely after multi-factor authorization."});
});
//////////////






// Page_Services 
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
