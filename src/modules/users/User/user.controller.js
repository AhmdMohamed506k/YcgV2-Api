import { asyncHandler } from "../../../middleware/asyncHandler/asyncHandler.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../../service/sendEmail/sendMail.js";
import cloudinary from "../../../utils/Cloudinary/Cloudinary.js";
import { customAlphabet, nanoid } from "nanoid";
import { userModel } from "../../../../DB/models/User/UserMainModel/user.model.js";
import { followModel } from "../../../../DB/models/Follow/follow.model.js";
import { viewModel } from "../../../../DB/models/Views/viewer.model.js";
import redisClient  from "../../../utils/redisClient/redisClient.js";
import MyPusher from "../../../service/Pusher/PusherConfig.js";


//GOLD =============Register&CreateAccountApis==================? //
export const Register = asyncHandler(async (req, res, next) => {
  // Register

  const { email, password, userPhoneNumber, dateofBirth } = req.body;

  //CheckIfEmailIsAvailable
  const userExist = await userModel.findOne({ email });
  if (userExist) {
    return next(new Error("Email already Exist"));
  }

  const PhoneExist = await userModel.findOne({ userPhoneNumber });
  if (PhoneExist) {
    return next(
      new Error("Phone already Exist already Exist please change it")
    );
  }

  const hashPass = await bcrypt.hash(password, 8); //PasswordEncryption

  const generateCode = customAlphabet("01234567ASK", 8);
  const code = generateCode();



  const user = await userModel.create({
    email,
    password: hashPass,
    userPhoneNumber,
    dateofBirth,
    Emailverificationcode: code,
  });



  
  sendEmail(email, "", `<h1>your code in ${code}</h1>`);




  if (user) {
    res.status(200).json({
      msg: "Success please check your email to verify your account",
      user,
    });
  } else {
    next(new Error("Sorry an Error happened"));
  }
});
export const VerifyUserAccount = asyncHandler(async (req, res, next) => {
  const { EmailVerificationCode } = req.body;
 
  
  const userExist = await userModel.findOne({EmailVerificationCode});
  if (!userExist) {
    return next(new Error("User Not Exist"));
  }

  if (userExist.EmailVerificationIsVerified == true ) {
     return next(new Error("Account already verified", 400));
  }

  if (userExist.EmailVerificationCode !== EmailVerificationCode) {
    return next(new Error("Sorry invalid verification code"));
  }

  userExist.EmailVerificationCode = "";
  userExist.EmailVerificationIsVerified = true;
  await userExist.save();

  const token = jwt.sign({ userId: userExist._id,email: userExist.email, },process.env.tokenKey,{ expiresIn: "7d" });
   
  const cacheKey = `user:profile:${userExist._id}`;
  await redisClient.del(cacheKey)
  
  res.status(200).json({ msg: "verified successfully" , userToken:token });
});
export const AddRegisteredUserName = asyncHandler(async (req, res, next) => {
  const { firstName, lastName } = req.body;



  const user = await userModel.findByIdAndUpdate(req.user._id,{ firstName, lastName },{ new: true, runValidators: true });
  if (!user) {return next(new Error("User not found"));}


  await redisClient.del(`user:profile:${user._id}`);

  res.status(200).json({ msg: "Username added successfully" });
});
export const AddRegisteredUserLocation = asyncHandler(async (req, res, next) => {
    const { country, city } = req.body;
   
    

    const user = await userModel.findByIdAndUpdate(req.user._id,{ "location.country": country, "location.city": city },{ new: true, runValidators: true });
    if (!user) {return next(new Error("User not found"));}

    await redisClient.del(`user:profile:${user._id}`);
    res.status(200).json({ msg: "User location added successfully" });
  }
);
export const AddRegisteredUserCurrentJob = asyncHandler(async (req, res, next) => {
    const { JopTitle, EmploymentType } = req.body;
  

    const user = await userModel.findByIdAndUpdate(req.user._id,{"UserCurrentJob.JopTitle": JopTitle,"UserCurrentJob.EmploymentType": EmploymentType,},{ new: true, runValidators: true });
    if (!user) { return next(new Error("User not found")); }
    
    await redisClient.del(`user:profile:${user._id}`);
      
    res.status(200).json({ msg: "User Current Job added successfully" });
  }
);
export const AddRegisteredUserOtherInformation = asyncHandler(async (req, res,next) => {
    const { userSubTitle } = req.body;


    const user = await userModel.findById(req.user._id);
    if (!user) return next(new Error("User does not exist"));


    if (!req.file){
      return next(new Error("Profile image is required"))
    };


    const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path,{
        folder: `Ycg/users/${req.user._id}/${req.user.firstName || ""}_${req.user.lastName || ""}/ProfileImage`,
      }
    );

    const updatedUser = await userModel.findByIdAndUpdate(req.user._id,{$set: { userSubTitle,userProfileImg: { secure_url, public_id },},},{ new: true });

    await redisClient.del(`user:profile:${updatedUser._id}`);
  
    res.status(200).json({msg: "User information updated successfully",user: updatedUser});
    
  }
);





//GOLD =============LoggedUserApis================== 
//CYAN2==> create (1)
export const Login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
     

  const user = await userModel.findOne({email});

  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    next(new Error("Sorry wrong Email or Password"));
  }

  const token = jwt.sign({ userId: user._id,  email: user.email, }, process.env.tokenKey, { expiresIn: "7d" } );




  await userModel.findOneAndUpdate(
    { status: "offline", email },
    { status: "online" },
    { new: true }
  );
  res.status(200).json({ msg: "done", token });
});

//GREEN3==> Get (1)
export const getLoggedUserProfile = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const cacheKey = `user:profile:${userId}`;
  const cachedProfile = await redisClient.get(cacheKey);
  

  if (cachedProfile) {
    return res.status(200).json({status: "success",source:"Cache", data: { profile: JSON.parse(cachedProfile)}});
  }




  const userProfile = await userModel
    .findById(userId)
    .select("-password -EmailVerificationCode -EmailVerificationIsVerified -ForgetPassCode -isForgetCodeVerified") 
    .populate("followersCount")
    .populate("followingCount")
    .populate("viewsCount")
    .populate({ path: "Following", select: "followingId -_id" })
    .populate({ path: "Followers", select: "followerId -_id" });


  if (!userProfile) {
    return next(new Error("User not found", { cause: 404 }));
  }

  await redisClient.del(`user:cvs:${userId}`);

  await redisClient.set(cacheKey, JSON.stringify(userProfile), { EX: 3600});


  res.status(200).json({ status: "success", data: { profile: userProfile } });
});
//YELLOW1==> Update (3)
export const updateLoggedInUserdata = asyncHandler(async (req, res, next) => {
  const updates = {};

  if (req.body.firstName) updates.firstName = req.body.firstName;
  if (req.body.lastName) updates.lastName = req.body.lastName;
  if (req.body.userSubTitle) updates.userSubTitle = req.body.userSubTitle;

  if (req.body.country) updates["location.country"] = req.body.country;
  if (req.body.city) updates["location.city"] = req.body.city;

  const user = await userModel.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );
  
  if (!user) {
    return next(new Error("User not exist"));
  }
   await redisClient.del(`user:profile:${user._id}`);
  
  res.status(200).json({ msg: "Successfully updated", user });
});
export const updateLoggedInUserPassword = asyncHandler(async (req, res, next) => {
    const { password, RePassword } = req.body;

    if (password !== RePassword) {
      return next(new Error("RePassword does not match password", { cause: 400 }));
    }

    const userExist = await userModel.findById(req.user._id);
    if (!userExist) { return next(new Error("User not found", { cause: 404 })); }

  
    userExist.password = await bcrypt.hash(password, 8);
    await userExist.save();

   
    await redisClient.del(`user:profile:${userExist._id}`);

    return res.status(200).json({ msg: "Password updated successfully" });
});
export const refreshStatus = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    await userModel.findByIdAndUpdate(userId, {
        status: "online",
        lastSeen: new Date() 
    });

    res.status(200).json({ status: "success", message: "Status heartbeat received" });
});

//RED3==> ForgetPass (3)
export const ForgetPassWord = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const UserExist = await userModel.findOne({ email });
  if (!UserExist) {
    return next(new Error("Sorry User Not Exist"));
  }

  const generateOTP = customAlphabet("0123456789", 6);
  const OTP = generateOTP();

  UserExist.ForgetPassCode = OTP;
  await UserExist.save();

  await sendEmail( email,"Rest your password",`<h1> your code is ${OTP} </h1>`);


  

  res.status(200).json({ msg: "Code Sent successfully please Check your Email" });
});
export const CheckResetCode = asyncHandler(async (req, res, next) => {

  const { Code, email } = req.body; 

 
  if (!Code || Code.trim() === "") {
    return next(new Error("Invalid Code", { cause: 400 }));
  }

  const UserExist = await userModel.findOne({ email, ForgetPassCode: Code });
  if (!UserExist) {
    return next(new Error("Invalid Code or Email", { cause: 400 }));
  }

  
  UserExist.isForgetCodeVerified = true;
  await UserExist.save();
  
  res.status(200).json({ msg: "Code is valid" });
});
export const ResetPassword = asyncHandler(async (req, res, next) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return next(new Error("All fields are required", { cause: 400 }));
  }

  const useExist = await userModel.findOne({ email });
  if (!useExist) { return next(new Error("User not found", { cause: 404 })); }

  if (useExist.isForgetCodeVerified !== true) {
    return next(new Error("Please verify your reset code first", { cause: 400 }));
  }

 
  useExist.password = await bcrypt.hash(newPassword, 12);
  useExist.ForgetPassCode = "";
  useExist.isForgetCodeVerified = false; 
  await useExist.save();

 
  await redisClient.del(`user:profile:${useExist._id}`);

  res.status(200).json({ msg: "Password changed successfully" });
});




//GOLD =============User-Files================== 


//GREEN3===> User_CV
export const UploadUserCv = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const { customName } = req.body; 
    const cacheKey = `user:cvs:${userId}`; 

    
    if (!req.file) {
        return next(new Error("Please upload a CV file", { cause: 400 }));
    }
    if (!customName) {
        return next(new Error("CV custom name is required", { cause: 400 }));
    }

    
    const user = await userModel.findById(userId).select("userCVs");
    if (user.userCVs && user.userCVs.length >= 4) {
        return next(new Error("You have reached the maximum limit of 4 CVs. Delete one to upload a new one.", { cause: 400 }));
    }

  
    const isNameDuplicate = user.userCVs.some(cv => cv.customName.trim().toLowerCase() === customName.trim().toLowerCase());
    if (isNameDuplicate) {
        return next(new Error("Please try a different CV name, this name already exists.", { cause: 400 }));
    }

  
    const folderPath = `Ycg/users/${userId}/${req.user.firstName || "user"}_${req.user.lastName || ""}/UserCVs/cv_${user.userCVs.length + 1}`;
    const cloudinaryResponse = await cloudinary.uploader.upload(req.file.path, {
        folder: folderPath,
        public_id: `${customName.replace(/\s+/g, '_')}_${Date.now()}` 
    });

  
    const updatedUser = await userModel.findByIdAndUpdate(
        userId,
        {
            $push: {
                userCVs: {
                    customName,
                    secure_url: cloudinaryResponse.secure_url,
                    public_id: cloudinaryResponse.public_id
                }
            }
        },
        { new: true, select: "userCVs" }
    );
   
  
    await redisClient.del(cacheKey);

    res.status(201).json({
        status: "success",
        message: "CV uploaded and cache updated successfully",
        data: updatedUser.userCVs
    });
});
export const GetUserCvs = asyncHandler(async (req, res, next) => {

  const userId = req.user._id;
  const cacheKey = `user:cvs:${userId}`;

  const cachedCvs = await redisClient.get(cacheKey);
    
  if (cachedCvs) {
  return res.status(200).json({ status: "success", source: "Cache", data: JSON.parse(cachedCvs)});
  }


  const user = await userModel.findById(userId).select("userCVs");
  if (!user) {return next(new Error("User not found", { cause: 404 }));}


  const cvsList = user.userCVs || [];

  
  await redisClient.set(cacheKey, JSON.stringify(cvsList), { EX: 3600 });

  res.status(200).json({status: "success",source: "Database", data: cvsList });
});
export const DeleteUserCv = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const { cvId } = req.body; 
    const cacheKey = `user:cvs:${userId}`;

    
    const user = await userModel.findOne({ _id: userId, "userCVs._id": cvId });
    if (!user) {
        return next(new Error("CV not found or you don't have permission to delete it", { cause: 404 }));
    }

  
    const targetCv = user.userCVs.id(cvId);


    await cloudinary.uploader.destroy(targetCv.public_id);

   
    const folderPath = targetCv.public_id.substring(0, targetCv.public_id.lastIndexOf("/"));

  
    try {
        await cloudinary.api.delete_folder(folderPath);

    } catch (folderError) {
        
        console.error("Cloudinary folder delete warning:", folderError.message);
    }


    const updatedUser = await userModel.findByIdAndUpdate(
        userId,
        {
            $pull: { userCVs: { _id: cvId } }
        },
        { new: true, select: "userCVs" }
    );


    await redisClient.del(cacheKey);

    res.status(200).json({
        status: "success",
        message: "CV and its folder deleted successfully, cache updated",
        data: updatedUser.userCVs
    });
});

//GREEN3===> User_Banner
export const ToggleUpdateUserBanner = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const cacheKey = `user:profile:${userId}`;


    if (!req.file) {
        return next(new Error("Please upload a banner image file", { cause: 400 }));
    }

  
    const user = await userModel.findById(userId).select("userBanner firstName lastName");
    if (!user) { return next(new Error("User not found", { cause: 404 }));}

    const uploadBanner = async () => {

        const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
            folder: `Ycg/users/${userId}/${user.firstName || "user"}_${user.lastName || ""}/userBanner`,
        });

        const updatedUser = await userModel.findByIdAndUpdate(userId,  { userBanner: { secure_url, public_id } },{ new: true, select: "userBanner" });
        
        await redisClient.del(cacheKey);
        return updatedUser; 
    };

    let finalUser;

  
    if (user.userBanner !=null && user.userBanner.public_id !=null) {
        try {
        
          await cloudinary.uploader.destroy(user.userBanner.public_id);
          const FolderPath = user.userBanner.public_id.substring(0, user.userBanner.public_id.lastIndexOf('/'));
          await cloudinary.api.delete_folder(FolderPath);
        
        } catch (cloudinaryError) {
          console.error("Warning: Failed to delete old banner or folder:", cloudinaryError.message);
        }

     
        finalUser = await uploadBanner();

        return res.status(200).json({ status: "success", message: "User banner successfully replaced and cached the new banner", userBanner: finalUser.userBanner });

    } else {
  
        finalUser = await uploadBanner();

        return res.status(200).json({
            status: "success",
            message: "User banner uploaded successfully and cache cleared",
            userBanner: finalUser.userBanner
        });
    }
});

//GREEN3===> User_Profile_Image
export const ToggleUpdateUserProfileImage = asyncHandler(async (req, res, next) => {

    const userId = req.user._id;
    const cacheKey = `user:profile:${userId}`;

  
    if (!req.file) {
        return next(new Error("Please upload a profile image file", { cause: 400 }));
    }

   
    const user = await userModel.findById(userId).select("userProfileImg firstName lastName");
    if (!user) {
        return next(new Error("User not found", { cause: 404 }));
    }

   
    const uploadProfileImage = async () => {
        const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
            folder: `Ycg/users/${userId}/${user.firstName || "user"}_${user.lastName || ""}/ProfileImage`,
        });

        const updatedUser = await userModel.findByIdAndUpdate(userId, { userProfileImg: { secure_url, public_id } },{ new: true, select: "userProfileImg" });

        await redisClient.del(cacheKey);
        
        return updatedUser;
    };

    let finalUser;

   
    if (user.userProfileImg !=null && user.userProfileImg.public_id !=null ) {
        try {
            
          await cloudinary.uploader.destroy(user.userProfileImg.public_id);
          const FolderPath = user.userProfileImg.public_id.substring(0, user.userProfileImg.public_id.lastIndexOf('/'));
          await cloudinary.api.delete_folder(FolderPath);
            
          console.log(`Old profile image and folder deleted from Cloudinary: ${user.userProfileImg.public_id}`);

        } catch (cloudinaryError) {
          console.error("Warning: Failed to delete old profile image or folder:", cloudinaryError.message);
        }

      
        finalUser = await uploadProfileImage();

        return res.status(200).json({ status: "success", message: "User profile image successfully replaced and cache cleared", userProfileImg: finalUser.userProfileImg });

    } else {

        finalUser = await uploadProfileImage();

        return res.status(200).json({status: "success",message: "User profile image uploaded successfully and cache cleared",userProfileImg: finalUser.userProfileImg});
    }
});









// ==============AdminApis=================
export const getAllUsers = asyncHandler(async (req, res, next) => {



  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const users = await userModel.find({}).select("-password -__v -ForgetPassCode").skip(skip).limit(limit);

  const totalUsers = await userModel.countDocuments();

  res.status(200).json({
    page,
    totalUsers,
    results: users.length,
    users
  });
});




//==> AddSkills
export const addLoggedInUserSkills = asyncHandler(async (req, res, next) => {
  const { skill } = req.body;

  if (req.user.Userskills.includes(skill)) {
    return next(new Error("Sorry Skill allready exist"));
  }

  if (!skill || (Array.isArray(skill) && skill.length === 0)) {
    return next(new Error("Skill is required"));
  }

  const NewUserSkill = await userModel.findOneAndUpdate(
    { _id: req.user._id, status: "online" },
    { $addToSet: { Userskills: skill } },
    { new: true }
  );

  res.status(201).json({ msg: "added Successfully" });
});


