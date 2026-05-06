import { userModel } from "../../../../DB/models/User/UserMainModel/user.model";
import cloudinary from "../../../utils/Cloudinary/Cloudinary";







//GREEN3===> User_CV
export const UploadLoggedInUserCv = asyncHandler(async (req, res, next) => {
    const userExist = await userModel.findById(req.user._id);
    if (!userExist) {
      return next(new Error("User not found"));
    }

    if (!req.file) {
      return next(new Error("No file uploaded"));
    }


    const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path,{
        folder: `Ycg/users/${req.user._id}/${req.user.firstName || ""}_${
          req.user.lastName || ""
        }/UserCVs`,
      }
    );

    const upload = await userModel.findOneAndUpdate(
      { _id: req.user._id, status: "online" },
      { userCV: { secure_url, public_id } },
      { new: true }
    );

    if (!upload) {
      return next(
        new Error("You are offline or an error occurred while updating CV")
      );
    }

    res.status(201).json({ msg: "CV uploaded successfully", userCV: upload.userCV });
  


  
});
export const RemoveOldUserCV = asyncHandler(async (req,res,next)=>{

  const {publicId} = req.body;
   
  const UserExist = await userModel.findOneAndUpdate({"userCV.public_id": publicId},{"userCV.public_id":null ,"userCV.secure_url":null},{new:true})
  if(!UserExist){return next(new Error("User not found or Invalid Id"))}
   
 
  
  const result =  await cloudinary.uploader.destroy(publicId);

  res.status(200).json({msg:"Deleted Successfully"})

})



//GREEN3===> User_Banner
export const UploadLoggedInUserBanner = asyncHandler(async (req, res, next) => {
  try {
    const userExist = await userModel.findById(req.user._id);
    if (!userExist) {
      return next(new Error("User not found"));
    }

    if (!req.file) {
      return next(new Error("No file uploaded"));
    }


    const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path,{
        folder: `Ycg/users/${req.user._id}/${req.user.firstName || ""}_${req.user.lastName || "" }/userBanner`,
      }
    );

    const upload = await userModel.findOneAndUpdate(
      { _id: req.user._id, status: "online" },
      { userBanner: { secure_url, public_id } },
      { new: true }
    );

    if (!upload) {
      return next(
        new Error(
          "You are offline or an error occurred while updating userBanner"
        )
      );
    }

    res.status(201).json({
      msg: "userBanner uploaded successfully",
      userBanner: upload.userBanner,
    });
  } catch (error) {
    next(error);
  }
});
export const RemoveOldUserBanner = asyncHandler(async (req,res,next)=>{

  const {publicId} = req.body;
   
  const UserExist = await userModel.findOneAndUpdate({"userBanner.public_id": publicId},{"userBanner.public_id":null ,"userBanner.secure_url":null},{new:true})
  if(!UserExist){return next(new Error("User not found or Invalid Id"))}
   
 
  
  const result =  await cloudinary.uploader.destroy(publicId);

  res.status(200).json({msg:"Deleted Successfully"})

})



//GREEN3===> User_Profile_Image
export const UpdateLoggedInUserImageProfile = asyncHandler(async (req, res, next) => {
    try {
      const userExist = await userModel.findById(req.user._id);
      if (!userExist) {
        return next(new Error("User not found"));
      }

      if (!req.file) {
        return next(new Error("No file uploaded"));
      }

      if (userExist.userProfileImg.public_id) {
        await cloudinary.uploader.destroy(userExist.userProfileImg.public_id);
      }

      const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
          folder: `Ycg/users/${req.user._id}/${req.user.firstName || ""}_${ req.user.lastName || "" }/ProfileImage`,
        }
      );

      const upload = await userModel.findOneAndUpdate(
        { _id: req.user._id, status: "online" },
        { userProfileImg: { secure_url, public_id } },
        { new: true }
      );

      if (!upload) {
        return next(
          new Error(
            "You are offline or an error occurred while updating userProfileImg"
          )
        );
      }

      res.status(201).json({
        msg: "userProfileImg uploaded successfully",
        userProfileImg: upload.userProfileImg,
      });
    } catch (error) {
      next(error);
    }
  }
);
export const RemoveOldUserProfileImage = asyncHandler(async (req,res,next)=>{

  const {publicId} = req.body;
   
  const UserExist = await userModel.findOneAndUpdate({"userProfileImg.public_id": publicId},{"userProfileImg.public_id":null ,"userProfileImg.secure_url":null},{new:true})
  if(!UserExist){return next(new Error("User not found or Invalid Id"))}
   

  
  const result =  await cloudinary.uploader.destroy(publicId);

  res.status(200).json({msg:"Deleted Successfully"})

})