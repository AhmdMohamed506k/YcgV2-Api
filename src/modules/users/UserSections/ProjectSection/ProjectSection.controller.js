
import { nanoid } from "nanoid";
import { userModel } from "../../../../../DB/models/User/UserMainModel/user.model.js";
import {asyncHandler} from "../../../../middleware/asyncHandler/asyncHandler.js"
import cloudinary from "../../../../utils/Cloudinary/Cloudinary.js"
import { ProjectsSectionModel } from "../../../../../DB/models/User/UserSections/ProjectsSection.model.js";
import redisClient from "../../../../utils/redisClient/redisClient.js";





export const AddUserNewProject = asyncHandler(async (req, res, next) => {

  const userId = req.user._id;

  const userExist = await userModel.findById(userId);
  if (!userExist) {return next(new Error("User Not Exist", { cause: 400 }));}
  
  if (!req.files?.Media?.length) {
    return next(new Error("Project media is required", { cause: 400 }));
  }

  const randomId = nanoid();

  const newProject = { ProjectName: req.body.ProjectName,CreatedBy: userId};

  if (req.body.Description) {newProject.Description = req.body.Description;}

  if (req.body.UsedSkills) {
    newProject.UsedSkills = Array.isArray(req.body.UsedSkills)
      ? req.body.UsedSkills
      : req.body.UsedSkills.split(",");
  }

  /** Upload Media in parallel */
  const uploads = [];

  uploads.push(await cloudinary.uploader.upload(req.files.Media[0].path, {
      resource_type: "auto",
      folder: `Ycg/users/${userId}/${req.user.firstName}_${req.user.lastName}/UserProjects/${randomId}/Media`,
    })
  );

  if (req.files.MediaCoverImage?.length) {
    uploads.push(await cloudinary.uploader.upload(req.files.MediaCoverImage[0].path, {
        resource_type: "image",
        folder: `Ycg/users/${userId}/${req.user.firstName}_${req.user.lastName}/UserProjects/${randomId}/MediaCoverImage`,
      })
    );
  }

  const [mediaUpload, coverUpload] = await Promise.all(uploads);

  newProject.Media = {
    secure_url: mediaUpload.secure_url,
    public_id: mediaUpload.public_id,
  };

  if (coverUpload) {
    newProject.MediaCoverImage = {
      secure_url: coverUpload.secure_url,
      public_id: coverUpload.public_id,
    };
  }
 
  
  const project = await ProjectsSectionModel.create(newProject);

 const Key = await redisClient.keys(`Language:*`);
  if(Key.length > 0){ await redisClient.del(Key)};

  res.status(201).json({msg: "Project added successfully",project});


});

export const GetUserProjects = asyncHandler(async (req,res,next)=>{

  

  const CashKey = `Language:${req.user._id}`



  //Check if User Project are Cashed or not
  const CashData= await redisClient.get(CashKey);
  if (CashData) {
    return res.status("200").json({status:"success" , source:"Cash",UserProjects:JSON.parse(CashData)});
  }
 
  //IF project not Cashed Get All User Projects
 const UserProjects = await ProjectsSectionModel.find({CreatedBy:req.user._id})
  if(!UserProjects){
    return next(new Error("Sorry you dont have Projects",400))
  }

  //then cash Projects
  await redisClient.set(CashKey,JSON.stringify(UserProjects),"EX",300)


  //Display Projects
  res.status(200).json({msg:"done",status:"success",source:"DataBase",UserProjects})




})
export const UpdateSpecificProject = asyncHandler(async (req, res, next) => {

  const { ProjectID } = req.params;
  const UserID = req.user._id;

  const projectExists = await ProjectsSectionModel.findOne({
    _id: ProjectID,
    CreatedBy: UserID
  });

  if (!projectExists) {
    return next(new Error("Project not found or you are not authorized", { cause: 400 }));
  }

  const UpdatedProjectObject = {};

  if (req.body.ProjectName) {
    UpdatedProjectObject.ProjectName = req.body.ProjectName;
  }

  if (req.body.Description) {
    UpdatedProjectObject.Description = req.body.Description;
  }

  if (req.body.UsedSkills) {
    UpdatedProjectObject.UsedSkills = Array.isArray(req.body.UsedSkills)
      ? req.body.UsedSkills
      : req.body.UsedSkills.split(",");
  }

  const randomId = nanoid();

  console.log(projectExists.Media.public_id);
  // ===== Media =====
  if (req.files?.Media?.length) {
   
    
    await cloudinary.uploader.destroy(projectExists.Media.public_id ,{ resource_type: "video" });
 

    const { public_id, secure_url } = await cloudinary.uploader.upload(
      req.files.Media[0].path,
      {
        resource_type: "auto",
        folder: `Ycg/users/${UserID}/${req.user.firstName}_${req.user.lastName}/UserProjects/${randomId}/Media`,
      }
    );

    UpdatedProjectObject.Media = {
      secure_url,
      public_id
    };
  }

  // ===== Cover Image =====
  if (req.files?.MediaCoverImage?.length) {
    
    await cloudinary.uploader.destroy(projectExists.MediaCoverImage.public_id , { resource_type: "image" });
  
    const { public_id, secure_url } = await cloudinary.uploader.upload(
      req.files.MediaCoverImage[0].path,
      {
        resource_type: "image",
        folder: `Ycg/users/${UserID}/${req.user.firstName}_${req.user.lastName}/UserProjects/${randomId}/MediaCoverImage`,
      }
    );

    UpdatedProjectObject.MediaCoverImage = {
      secure_url,
      public_id
    };
  }

  await ProjectsSectionModel.findOneAndUpdate( { _id: ProjectID }, UpdatedProjectObject, { new: true });
   
  
 const Key = await redisClient.keys(`Language:*`);
  if(Key.length > 0){ await redisClient.del(Key)};


  res.status(200).json({ msg: "Updated successfully" });
});

export const DeleteSpecificProject = asyncHandler(async (req, res, next) => {


  const { ProjectID } = req.body;
  const UserID = req.user._id;


  const project = await ProjectsSectionModel.findOne({_id: ProjectID, CreatedBy: UserID, });
  if (!project) { return next(new Error("Project not found or you are not authorized", { cause: 404 }));}


  if (project.Media?.public_id) {
    await cloudinary.uploader.destroy(project.Media.public_id,{
        resource_type: project.Media.resource_type || "video",
      }
    );
  }


  if (project.MediaCoverImage?.public_id) {
    await cloudinary.uploader.destroy( project.MediaCoverImage.public_id,{
        resource_type: "image",
      }
    );
  }



  await ProjectsSectionModel.deleteOne({ _id: ProjectID });

 
  const Key = await redisClient.keys(`Language:*`);
  if(Key.length > 0){ await redisClient.del(Key)};

  res.status(200).json({msg: "Project deleted successfully",});
});
