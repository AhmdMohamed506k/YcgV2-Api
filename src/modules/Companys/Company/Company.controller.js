import { ActivityModel } from "../../../../DB/models/Activities/Activities.model.js";
import companyModel from "../../../../DB/models/Company/Company.model.js";
import { userModel } from "../../../../DB/models/User/UserMainModel/user.model.js";
import { JobApplicationModel } from "../../../../DB/models/ـJobApplication/JobApplication.model.js";
import { asyncHandler } from "../../../middleware/asyncHandler/asyncHandler.js";
import cloudinary from "../../../utils/Cloudinary/Cloudinary.js";
import redisClient from "../../../utils/redisClient/redisClient.js";






//RED3-> Company-Page-CRUD
export const CreateCompanyPage = asyncHandler(async (req, res, next) => {
  const { CompanyName, ContactEmail, Industry, OrganizationSize, OrganizationType, Website, Location, Description } = req.body;
  const userId = req.user._id;
  

   
  const UserOwnCompany= await companyModel.findOne({HrManager:userId});
  if(UserOwnCompany){return next(new Error("You can not own more then one company page"),{cause:409})};
  

  const isExist = await companyModel.findOne({ $or: [{ CompanyName }, { ContactEmail }] });
  if (isExist) return next(new Error("Company Name or Contact Email already exists", { cause: 409 }));
   
  

  let logoData = {};
  if (req.file) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
      folder: `YCG/Companies/${CompanyName}/CompanyLogo`,
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
    HrManager: userId,
    Employees: [userId],
    Admins: [{ user: userId, role: "superAdmin" }], 
  });
 

  await redisClient.del([`User:CompanyPage:${company._id}`,`User:Dashboard:${company._id}`,`CompanyEmployees:${companyId}`]);
  const companiesListKeys = await redisClient.keys('User:CompanyLists:page*');
  if (companiesListKeys.length > 0) {
    await redisClient.del(companiesListKeys);
  }

 

 
   
  return res.status(201).json({ status: "success", message: "Company registered successfully", company });
});
export const updateCompany = asyncHandler(async (req, res, next) => {
  
  const companyObject={}

  
  if(req.body.CompanyName) companyObject.CompanyName = req.body.CompanyName ;
  if(req.body.Industry) companyObject.Industry = req.body.Industry ;
  if(req.body.OrganizationSize) companyObject.OrganizationSize = req.body.OrganizationSize ;
  if(req.body.OrganizationType) companyObject.OrganizationType = req.body.OrganizationType ;
  if(req.body.Website) companyObject.Website = req.body.Website ;
  if(req.body.Location) companyObject.Location = req.body.Location ;
  if(req.body.Description) companyObject.Description = req.body.Description ;
  
  
  

  const { companyId } = req.params;
  const userId = req.user._id;


  const company = await companyModel.findById(companyId);
  if (!company) return next(new Error("Company not Exists", { cause: 404 }));
     
  const currentAdmin = company.Admins.find(a => a.user.toString() === userId.toString());
  if (!currentAdmin || !["admin", "superAdmin"].includes(currentAdmin.role)) {
      return next(new Error("Unauthorized: Only admins can update", { cause: 403 }));
  }

  if (companyObject.CompanyName && companyObject.CompanyName == company.CompanyName) {
    return next(new Error("Company name already exists", { cause: 409 }));
  }

 
  
  
  
  
  if (req.files) {
    if(req.files.Logo){
         if (company.Logo && company.Logo.public_id) {
      await cloudinary.uploader.destroy(company.Logo.public_id);
    }

    const { secure_url, public_id } = await cloudinary.uploader.upload(req.files.Logo[0].path, {
      folder: `YCG/Companies/${companyObject.CompanyName || company.CompanyName}/CompanyLogo`,
    });
    companyObject.Logo = { secure_url, public_id };
    }
    if (req.files.Banner) {
      if (company.Banner && company.Banner.public_id) {    
      await cloudinary.uploader.destroy(company.Banner.public_id);
    }

    const { secure_url, public_id } = await cloudinary.uploader.upload(req.files.Banner[0].path, {
    folder: `YCG/Companies/${companyObject.CompanyName || company.CompanyName}/CompanyBanner`,

    });
    companyObject.Banner = { secure_url, public_id };
    }
  }
   


  const updatedCompany = await companyModel.findByIdAndUpdate(companyId, companyObject, { new: true, runValidators: true });

  

  await redisClient.del([`User:CompanyPage:${company._id}`,`User:Dashboard:${company._id}`,`CompanyEmployees:${companyId}` ]);;


  const companiesListKeys = await redisClient.keys('User:CompanyLists:page*');
  if (companiesListKeys.length > 0) {
    await redisClient.del(companiesListKeys);
  }

 
  res.status(200).json({ status: "success", message: "information updated successfully", company: updatedCompany });
});
export const DeleteCompany = asyncHandler(async (req, res, next) => {

  const { companyId } = req.params;
  const userId = req.user._id;

  const company = await companyModel.findById(companyId);
  if (!company) return next(new Error("Company not found", { cause: 404 }));

  const currentAdmin = company.Admins.find((admin) => admin.user.toString() === userId.toString());
  if (!currentAdmin || currentAdmin.role !== "superAdmin") {
    return next(new Error("Unauthorized: Only an active Super Admin can delete the page", { cause: 403 }));
  }


  
  


  const mediaToDelete = [company.Logo?.public_id, company.Banner?.public_id].filter(Boolean);
  if (mediaToDelete.length > 0) { 
    await Promise.all(mediaToDelete.map(id => cloudinary.uploader.destroy(id)));
    const FolderPath= company.Logo.public_id.substring(0,company.Logo.public_id.lastIndexOf("/CompanyLogo"));
    await cloudinary.api.delete_folder(FolderPath);
  }


  await ActivityModel.deleteMany({ CreatedBy: companyId });
  await companyModel.findByIdAndDelete(companyId);



  await redisClient.del([`User:CompanyPage:${company._id}`,`User:Dashboard:${company._id}`,`CompanyEmployees:${companyId}` ]);;
  const companiesListKeys = await redisClient.keys('User:CompanyLists:page*');
  if (companiesListKeys.length > 0) {
    await redisClient.del(companiesListKeys);
  }


  res.status(200).json({ status: "success", message: "Company Deleted Successfully." });

});


//GREEN3-> CompanyPage-Display
export const getCompanyPublicPage = asyncHandler(async (req, res, next) => {

  const { companyId } = req.params;

  
  const cacheKey = `User:CompanyPage:${companyId}`;
  
  
  const cachedCompanyData = await redisClient.get(cacheKey);
  
  if (cachedCompanyData) {
    return res.status(200).json({status: "success",source: "Cache",data: JSON.parse(cachedCompanyData)});
  }

  
  const company = await companyModel.findById(companyId)
    .select("-ContactEmail -Admins -HRManagers") 
    .populate("followersCount") 
    .populate("viewsCount")
    .populate("Employees", "firstName lastName userProfileImg userSubTitle"); 

  if (!company) {
    return next(new Error("Company not found", { cause: 404 }));
  }

  
  const companyPosts = await ActivityModel.find({ CreatedBy: companyId }).sort({ createdAt: -1 }); 


  const resultObject = { companyInfo: company, posts: companyPosts, postsCount: companyPosts.length};

  await redisClient.set(cacheKey, JSON.stringify(resultObject), { EX: 3600 });

  res.status(200).json({ status: "success", source: "DB", data: resultObject });
});
export const getAllCompanies = asyncHandler(async (req, res, next) => {
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

 
  const cacheKey = `User:CompanyLists:page${page}:limit:${limit}`;


  const cachedList = await redisClient.get(cacheKey);
  if (cachedList) {

    return res.status(200).json({ status: "success",source: "Cache",...JSON.parse(cachedList)});

  }

 
  const totalCompanies = await companyModel.countDocuments();

  const companies = await companyModel.find().skip(skip).limit(limit).sort({ createdAt: -1 }); 

  const resultData = {
    
    companies,
    pagination: {
      currentPage: page,
      limit,
      totalCompanies,
      totalPages: Math.ceil(totalCompanies / limit)
    }
  };

 
  await redisClient.set(cacheKey, JSON.stringify(resultData), { EX: 600 });

  res.status(200).json({ status: "success", source: "DB", ...resultData });
});

// need Edit
export const GetSpecificCompanyDashBoard = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  
  const company = await companyModel.findOne({ "Admins.user": userId })
    .populate("Followers")
    .populate("followersCount")
    .populate("Following")
    .populate("followingCount")
    .populate("viewsCount");


  if (!company) {
    return next(new Error("Company not found or you don't have access", { cause: 404 }));
  }


  const currentAdmin = company.Admins.find(a => a.user.toString() === userId.toString());
  if (!currentAdmin || !["admin", "superAdmin"].includes(currentAdmin.role)) {
    return next(new Error("Unauthorized: Access denied", { cause: 403 }));
  }


  const CashKey = `User:Dashboard:${company._id}`;
  const cachedData = await redisClient.get(CashKey);
  if (cachedData) {
    return res.status(200).json({ status: "success", source: "cache", data: JSON.parse(cachedData) });
  }

 
  const companyPosts = await ActivityModel.find({ CreatedBy: company._id });

  const resultObject = {
    CompanyInfo: company,
    companyPosts: companyPosts,
    companyPostsCount: companyPosts.length
  };

 
  await redisClient.set(CashKey, JSON.stringify(resultObject), { EX: 300 });

  res.status(200).json({ status: "Success", source: "DB", data: resultObject });
});



//ORANGE1 Page-Jobs-Posts
export const CreateJobPost = asyncHandler(async (req, res, next) => {
  
    const { title, description, companyId, requirements, locationType, jobType, experienceLevel, salary, screeningQuestions, rejectionSettings,MustHaveQualifications,PreferredQualifications } = req.body;
    
    const userId = req.user._id;

    const company = await companyModel.findById(companyId);
    if (!company) return next(new Error("Company not found", { cause: 404 }));

    
    const isAdmin = company.Admins.some(a => a.user.toString() === userId.toString());
    if (!isAdmin) return next(new Error("Unauthorized", { cause: 403 }));
    
     
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
    

    const newJob = await JobApplicationModel.create({
       companyId, "jobSnapshot.title":title, "jobSnapshot.description":description,
       "jobSnapshot.Requirements":ValidRequirements,"jobSnapshot.locationType": locationType, 
       "jobSnapshot.jobType":jobType,"jobSnapshot.experienceLevel": experienceLevel,
       "jobSnapshot.salary":salary, createdBy: userId,
        screeningQuestions: screeningQuestions || [],
        rejectionSettings: rejectionSettings || { enabled: false, autoReject: false },
        addedBy:userId,MustHaveQualifications,PreferredQualifications
    });

    await redisClient.del([`User:CompanyPage:${companyId}`, `User:Dashboard:${companyId}`]);

    res.status(201).json({ status: "success", data: newJob });
});











// Page_Services 
export const addAdminToCompany = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const { newUserEmail, role } = req.body;
  const currentUserId = req.user._id;

  const company = await companyModel.findById(companyId);
  if (!company) return next(new Error("Company not Exists", { cause: 404 }));

  const currentAdmin = company.Admins.find(admin => admin.user.toString() === currentUserId.toString());
  if (!currentAdmin || currentAdmin.role !== "superAdmin") {
    return next(new Error("Sorry, you must be a Super Admin", { cause: 403 }));
  }

  const userToAdd = await userModel.findOne({ email: newUserEmail });
  if (!userToAdd) return next(new Error("User not Exist", { cause: 404 }));

  company.Admins.push({ user: userToAdd._id, role: role || "admin" });
  await company.save();

  await redisClient.del([ `User:CompanyPage:${companyId}`,`User:Dashboard:${companyId}`]);

  res.status(200).json({ status: "success", message: "Admin added successfully" });
});
export const GetCurrentCompanyAdmins = asyncHandler(async (req, res, next) => {
    const { companyId } = req.params;
    const userId = req.user._id;

    const company = await companyModel.findById(companyId).populate("Admins.user", "firstName lastName userProfileImg email").select("Admins");

    if (!company) return next(new Error("Company not found", { cause: 404 }));

    const isAuthorized = company.Admins.some(a => a.user._id.toString() === userId.toString());
    if (!isAuthorized) return next(new Error("Unauthorized: Only admins can view admin list", { cause: 403 }));

    res.status(200).json({ status: "success", data: company.Admins });
});



export const addEmployeesToCompany = asyncHandler(async (req, res, next) => {

    const { companyId } = req.params;
    const { employeeId } = req.body; 
    const currentUserId = req.user._id;

    const company = await companyModel.findById(companyId);
    if (!company) return next(new Error("Company not found", { cause: 404 }));


    const currentAdmin = company.Admins.find((admin) => admin.user.toString() === currentUserId.toString());

    if (!currentAdmin || !["admin", "superAdmin"].includes(currentAdmin.role)) {
      return next(new Error("Unauthorized: Only admins can manage employees", { cause: 403 }));
    }

    const isAlreadyEmployee = company.Employees.includes(employeeId);
    if (isAlreadyEmployee) {return next(new Error("User is already an employee in this company", { cause: 400 }));}


    await companyModel.findByIdAndUpdate(companyId, {$addToSet: { Employees: employeeId }});

    await userModel.findByIdAndUpdate(employeeId, { $set: { currentCompany: companyId }});

    await redisClient.del([`User:CompanyPage:${companyId}`,`User:Dashboard:${companyId}`,`CompanyEmployees:${companyId}`]);

    res.status(200).json({ status: "success",  message: "Employee added successfully to the company" });
});
export const GetCurrentCompanyEmployees = asyncHandler(async (req, res, next) => {

    const { companyId } = req.params;
    const cacheKey = `CompanyEmployees:${companyId}`;

    const cachedEmployees = await redisClient.get(cacheKey);
    if (cachedEmployees) {
      const dataCount= JSON.parse(cachedEmployees)
      return res.status(200).json({ status: "success", source: "Cache",count:dataCount.length, data: JSON.parse(cachedEmployees) });
    }

    const company = await companyModel.findById(companyId).populate("Employees", "firstName lastName userProfileImg userSubTitle jobTitle").select("Employees");

    if (!company) return next(new Error("Company not found", { cause: 404 }));

    await redisClient.set(cacheKey, JSON.stringify(company.Employees), { EX: 1800 });

    res.status(200).json({ status: "success", source: "DB",count:company.Employees.length , data: company.Employees });

});