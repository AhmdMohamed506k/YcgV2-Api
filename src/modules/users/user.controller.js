import { asyncHandler } from "../../middleware/asyncHandler/asyncHandler.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../service/sendEmail/sendMail.js";
import PostsModel from "./../../../DB/models/post.model.js";
import cloudinary from "../../utils/Cloudinary/Cloudinary.js";
import { customAlphabet, nanoid } from "nanoid";
import dotenv from "dotenv";
import { userModel } from "../../../DB/models/User/UserMainModel/user.model.js";
import "../../../DB/models/User/UserMainModel/SubModels/follower.model.js";

// =============Register&CreateAccountApis==================
export const Register = asyncHandler(async (req, res, next) => {
  // Register

  const { email, password, userPhoneNumber, dateofBirth } = req.body;

  //CheckIfEmailIsAvailable
  const userExist = await userModel.findOne({ email });
  if (userExist) {
    return next(new Error("Email already Exist"));
 
  }

  const PhoneExist = await userModel.findOne({ userPhoneNumber });
  if (PhoneExist) {return next(new Error("Phone already Exist already Exist please change it"));}

  var token = jwt.sign({ email: email }, process.env.tokenKey);
  const hashPass = bcrypt.hashSync(password, 8); //PasswordEncryption

  const generateCode = customAlphabet("0123456789", 4);
  const code = generateCode();

  sendEmail(email, "", `<h1>your code in ${code}</h1>`);

  const user = await userModel.create({ email, password: hashPass, userPhoneNumber, dateofBirth, Emailverificationcode: code,});



  if (user) {
    res.status(200).json({ msg: "Success please check your email to verify your account", user, usertoken: token,});
  } else {
    next(new Error("Sorry an Error happened"));
   
  }
});
export const VerfiyUserAccount = asyncHandler(async (req, res, next) => {
  const { Emailverificationcode } = req.body;

  const userExist = await userModel.findById(req.user._id);
  if (!userExist) {
     return  next(new Error("User Not Exist"));

  }

  if (userExist.Emailverificationcode != Emailverificationcode) {
     return  next(new Error("Sorry invalid verification code"));
 
  }

  userExist.Emailverificationcode = "";
  userExist.EmailverificationisVerified = true;
  userExist.save();

  res.status(200).json({ msg: "verified successfully" });
});
export const AddRegisteredUserName = asyncHandler(async (req, res) => {



  const { firstName, lastName } = req.body;


  const user = await userModel.findByIdAndUpdate( req.user._id, { firstName, lastName }, { new: true, runValidators: true });

  if (!user) {
    return  next(new Error("User not found"));
  }
  res.status(200).json({ msg: "Username added successfully" });
});
export const AddRegisteredUserLocation = asyncHandler(async (req, res) => {
  const { country, city } = req.body;

  const user = await userModel.findByIdAndUpdate(
    req.user._id,
    { "location.country": country, "location.city": city },
    { new: true, runValidators: true }
  );

  if (!user) {
      return  next(new Error("User not found"));

  }
  res.status(200).json({ msg: "User location added successfully" });
});
export const AddRegisteredUserCurrentJob = asyncHandler(async (req, res) => {
  const { JopTitle, EmploymentType } = req.body;

  const user = await userModel.findByIdAndUpdate(
    req.user._id,
    {
      "UserCurrentJob.JopTitle": JopTitle,
      "UserCurrentJob.EmploymentType": EmploymentType,
    },
    { new: true, runValidators: true }
  );

  if (!user) {

      return  next(new Error("User not found"));
  }
  res.status(200).json({ msg: "User Current Job added successfully" });
});
export const AddRegisteredUserOtherInformations = asyncHandler(async (req, res) => {
    const { userSubTitle } = req.body;

    const user = await userModel.findById(req.user._id);
    if (!user)  return  next(new Error("User does not exist"));
 
    if (!req.file) return  next(new Error("Profile image is required"));


    const userRandomId = nanoid();
    const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path,{
        folder: `Ycg/users/${req.user._id}/${req.user.firstName || "" }_${req.user.lastName || ""}/ProfileImage/${userRandomId}`,
      }
    );

    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          userSubTitle,
          userProfileImg: { secure_url, public_id },
        },
      },
      { new: true }
    );

    if (!updatedUser){
      return  next(new Error("Failed to update user information"));
    }else{
    res.status(200).json({  msg: "User information updated successfully",  user: updatedUser,});
    } 
  }
);

// =============LoggedUserApis==================
export const Login = asyncHandler(async (req, res, next) => {


  var { Email, password } = req.body;

  var user = await userModel.findOne( Email );

  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    next(new Error("Sorry wrong Email or Password"));
  }

  var token = jwt.sign( { Email: Email, userName: user.userName }, process.env.tokenKey);

  await userModel.findOneAndUpdate( { status: "offline", Email }, { status: "online" }, { new: true } );
  res.status(200).json({ msg: "done", token });
});
export const getLoggedinUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    //To get Logged in user profile with (followrs && followrs count) and (following && following count)
    const userProfile = await userModel
      .findById(userId)
      .select("-password -Emailverificationcode -EmailverificationisVerified")
      .populate("followersCount")
      .populate("followingCount")
      .populate({ path: "myFollowing", select: "followingId -_id" })
      .populate({ path: "myFollowers", select: "followerId -_id" });

    //Check if id in valid
    if (!userProfile) {  return  next(new Error("User not found"));}
    res.status(200).json({ status: "success", data: { profile: userProfile } });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
export const UploadLoggedInUserCv = asyncHandler(async (req, res, next) => {
  try {
  const userExist = await userModel.findById(req.user._id);
  if (!userExist) { return next(new Error("User not found"));}

 
  
  if (!req.file) {
    return next(new Error("No file uploaded"));
  }


  
  const userRandomId = nanoid();
  const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
  folder: `Ycg/users/${req.user._id}/${req.user.firstName || ""}_${req.user.lastName || ""}/UserCVs/${userRandomId}`,
  });

 
  const upload = await userModel.findOneAndUpdate({ _id: req.user._id, status: "online" },{ userCV: { secure_url, public_id } }, { new: true } );

  if (!upload) {
   return next(new Error("You are offline or an error occurred while updating CV"));
  }

  res.status(201).json({ msg: "CV uploaded successfully", userCV: upload.userCV });
  } catch (error) {
    next(error);
  }
});

















// ===============================

export const getAllUsers = asyncHandler(async (req, res, next) => {
  const user = await userModel.find({});
  res.status(200).json(user);
});

export const UploadUserImage = asyncHandler(async (req, res, next) => {
  const userRandomid = nanoid();

  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    { folder: `Ycg/users/${req.user.userName}/ProfileImage/${userRandomid}` }
  );

  const upload = await userModel.findOneAndUpdate(
    { _id: req.user._id, status: "online" },
    { UserProfileImg: { secure_url, public_id } },
    { new: true }
  );
  if (!upload) {
    next(new Error("You are certainly offline or there an Error"));
  }

  res.status(201).json({ msg: "done" });
});

export const addUserSkills = asyncHandler(async (req, res, next) => {
  const { skill } = req.body;

  if (!skill || (Array.isArray(skill) && skill.length === 0)) {
    return res.status(400).json({ msg: "Skill is required" });
  }

  const NewUserSkill = await userModel.findOneAndUpdate(
    { _id: req.user._id, status: "online" },
    { $addToSet: { Skills: skill } },
    { new: true }
  );

  res.status(201).json({ msg: "done", NewUserSkill });
});

export const addUserNewEducationFeild = asyncHandler(async (req, res, next) => {
  const { degree, FieldOfStudy, StartAt, EndAt, StillStudent } = req.body;

  if (StillStudent == "true") {
    const StillStudentObject = {
      degree,
      FieldOfStudy,
      StillStudent: "true",
    };
    const newExperience = await userModel.findOneAndUpdate(
      { _id: req.user._id },
      { $addToSet: { education: StillStudentObject } },
      { new: true }
    );

    if (!newExperience) {
      next(new Error("faild to add ", 400));
    }

    res.status(200).json({ msg: "added successfully" });
  } else {
    if (StartAt > EndAt) {
      return res
        .status(400)
        .json({ msg: "Start date must be before end date" });
    }

    const NewUserEducationObject = {
      degree,
      FieldOfStudy,
      StartAt,
      EndAt,
      StillStudent: "false",
    };

    const newExperience = await userModel.findOneAndUpdate(
      { _id: req.user._id },
      { $addToSet: { education: NewUserEducationObject } },
      { new: true }
    );

    if (!newExperience) {
      next(new Error("faild to add ", 400));
    }

    res.status(200).json({ msg: "added successfully" });
  }
});

//================================

export const updateAccount = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, userName, mobileNumber } = req.body;

  if (!req.user) {
    res.status(400).json({ msg: "sorry only owner can update  account" });
  }
  const usernameExist = await userModel.findOne({
    userName: req.user.userName,
  });
  if (usernameExist) {
    res.status(400).json({ msg: "sorry userName already exist" });
  }
  const phoneExist = await userModel.findOne({
    mobileNumber: req.user.mobileNumber,
  });
  if (phoneExist) {
    res.status(400).json({ msg: "sorry phone number already exist" });
  }

  const user = await userModel.findOneAndUpdate(
    { _id: req.user._id },
    { firstName, lastName, userName, mobileNumber },
    { new: true }
  );

  res.status(200).json({ msg: "successfully updated :)" });
});

export const updatePassword = asyncHandler(async (req, res, next) => {
  const { Email, password } = req.body;

  const userExist = await userModel.findOne({ Email });
  if (!userExist) {
    res.status(400).json({ msg: "user not found" });
  }

  const hash = bcrypt.hashSync(password, 8);
  const updatePass = await userModel.findOneAndUpdate(
    { Email: req.user.Email },
    { password: hash },
    { new: true }
  );

  res.status(200).json({ msg: "done", updatePass });
});
