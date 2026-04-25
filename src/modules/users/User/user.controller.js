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
import { ActivityModel } from "../../../../DB/models/Activitys/Activitys.model.js";

// ?=============Register&CreateAccountApis==================? //
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
export const VerfiyUserAccount = asyncHandler(async (req, res, next) => {
  const { Emailverificationcode } = req.body;
  
  const userExist = await userModel.findOne({Emailverificationcode});
  if (!userExist) {
    return next(new Error("User Not Exist"));
  }


  

 

  if (userExist.EmailverificationisVerified == true ) {
     return next(new Error("Account already verified", 400));
  }

  if (userExist.Emailverificationcode !== Emailverificationcode) {
    return next(new Error("Sorry invalid verification code"));
  }

  userExist.Emailverificationcode = "";
  userExist.EmailverificationisVerified = true;
  await userExist.save();

   const token = jwt.sign(
    {
      userId: userExist._id,
      email: userExist.email,
    },
    process.env.tokenKey,
    { expiresIn: "7d" }
  );
  
  res.status(200).json({ msg: "verified successfully" , usertoken:token });
});
export const AddRegisteredUserName = asyncHandler(async (req, res, next) => {
  const { firstName, lastName } = req.body;



  const user = await userModel.findByIdAndUpdate(req.user._id,{ firstName, lastName },{ new: true, runValidators: true });

  if (!user) {
    return next(new Error("User not found"));
  }
  res.status(200).json({ msg: "Username added successfully" });
});
export const AddRegisteredUserLocation = asyncHandler(async (req, res, next) => {
    const { country, city } = req.body;

    const user = await userModel.findByIdAndUpdate(
      req.user._id,
      { "location.country": country, "location.city": city },
      { new: true, runValidators: true }
    );

    if (!user) {
      return next(new Error("User not found"));
    }
    res.status(200).json({ msg: "User location added successfully" });
  }
);
export const AddRegisteredUserCurrentJob = asyncHandler(async (req, res, next) => {
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
      return next(new Error("User not found"));
    }
    res.status(200).json({ msg: "User Current Job added successfully" });
  }
);
export const AddRegisteredUserOtherInformations = asyncHandler(async (req, res,next) => {
    const { userSubTitle } = req.body;

    const user = await userModel.findById(req.user._id);
    if (!user) return next(new Error("User does not exist"));

    if (!req.file) return next(new Error("Profile image is required"));

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `Ycg/users/${req.user._id}/${req.user.firstName || ""}_${
          req.user.lastName || ""
        }/ProfileImage`,
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

    if (!updatedUser) {
      return next(new Error("Failed to update user information"));
    } else {
      res.status(200).json({
        msg: "User information updated successfully",
        user: updatedUser,
      });
    }
  }
);

//todo: =============LoggedUserApis================== 
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

//==> Forget_Password
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

  await sendEmail(
    email,
    "Rest your password",
    `<h1> your code is ${OTP} </h1>`
  );

  res
    .status(200)
    .json({ msg: "Code Sent successfully please Check your Email" });
});
export const CheckResetCode = asyncHandler(async (req, res, next) => {
  const { Code } = req.body;

  const UserExist = await userModel.findOne({ ForgetPassCode: Code });
  if (!UserExist) {
    return next(new Error("Sorry User Not Exist"));
  }

  if (!UserExist) {
    return next(new Error("Invalid Code"));
  }

  UserExist.ForgetPassCode = "";
  await UserExist.save();

  res.status(200).json({ msg: "Code is valid" });
});
export const ResetPassword = asyncHandler(async (req, res, next) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return next(new Error("All fields are required"));
  }

  const useExist = await userModel.findOne({ email });
  if (!useExist) {
    return next(new Error("User not found"));
  }

  // Verify reset code
  if (useExist.ForgetPassCode !== "") {
    return next(new Error("Sorry there is an Error please try again later"));
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  useExist.password = hashedPassword;
  await useExist.save();

  res.status(200).json({ msg: "Password changed successfully" });
});

//==> Get_User_Profile
export const getLoggedinUserProfile = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  //To get Logged in user profile with (followrs && followrs count) and (following && following count)
  const userProfile = await userModel
    .findById(userId)
    .select("-password -Emailverificationcode -EmailverificationisVerified")
    .populate("followersCount")
    .populate("followingCount")
    .populate("ViewersCount")
    .populate({ path: "myFollowing", select: "followingId -_id" })
    .populate({ path: "myFollowers", select: "followerId -_id" });

  //Check if id in valid
  if (!userProfile) {
    return next(new Error("User not found"));
  }
  res.status(200).json({ status: "success", data: { profile: userProfile } });
});
//==> Update_User_ProfileInfo
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

  res.status(200).json({ msg: "Successfully updated", user });
});
//==> Change_Loggedin_User_Password
export const updateLoggedInUserPassword = asyncHandler( async (req, res, next) => {
    const { password, repassword } = req.body;

    const userExist = await userModel.findById(req.user._id);
    if (!userExist) {
      return next(new Error("User not found"));
    }

    if (password !== repassword) {
      return next(new Error("Repassword does not match password"));
    }

    // ✅ await bcrypt.hash
    const hash = await bcrypt.hash(password, 8);

    const updatePass = await userModel.findByIdAndUpdate(
      req.user._id,
      { password: hash },
      { new: true }
    );

    if (!updatePass) {
      return res.status(400).json({ msg: "Sorry, there is an error" });
    }

    return res.status(200).json({ msg: "Password updated successfully" });
  }
);

//==> People_That_user_May_Know 
export const getPeopleYouMayKnow = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;


  const myFollowing = await followModel.find({ followerId: userId }).distinct("followingId");

  const suggestions = await followModel.aggregate([
    {

      $match: {
        followerId: { $in: myFollowing },
        followingId: { $ne: userId, $nin: myFollowing }
      }

    },
    {

      $group: {
        _id: "$followingId",
        mutualFriendsCount: { $sum: 1 }
      }

    },
    { 

      $sort: {
         mutualFriendsCount: -1
       }

    },
    { 

      $limit: 10 

    },
    {

      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userInfo"
      }

    },
    { 

      $unwind: "$userInfo" 

    },
    {

      $project: {
        _id: 1,
        mutualFriendsCount: 1,
        "userInfo.firstName": 1,
        "userInfo.lastName": 1,
        "userInfo.userProfileImg": 1,
        "userInfo.userSubTitle": 1

      }
    }
  ]);


  if (suggestions.length === 0) {
    const fallbackSuggestions = await userModel.find({ _id: { $ne: userId, $nin: myFollowing }, "location.country": req.user.location.country })
    .select("firstName lastName userProfileImg userSubTitle")
    .limit(5);


    return res.status(200).json({ status: "success", data: fallbackSuggestions });
  }


  res.status(200).json({ status: "success", data: suggestions });
});
//==> RefreshUserStatus
export const refreshStatus = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    await userModel.findByIdAndUpdate(userId, {
        status: "online",
        lastSeen: new Date() 
    });

    res.status(200).json({ status: "success", message: "Status heartbeat received" });
});


//!==================================UserActivities========================================!//


export const getHybridFeed = asyncHandler(async (req, res, next) => {

    const userId = req.user._id;



    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;



    const Cashkey = `Activities:${userId}:page:${page}22`;
    const CachedData = await redisClient.get(Cashkey);

    if (CachedData) {
        return res.status(200).json({ status: "Success", source: "Cash", data: JSON.parse(CachedData) });
    }
    


    // 1-Get User following IDs
    const myFollowing = await followModel.find({ followerId: userId }).distinct("followingId");
    const authorIds = [...myFollowing, userId];




    // 2. bring in Activitys from User inner circle
    let posts = await ActivityModel.find({ CreatedBy: { $in: authorIds } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("CreatedBy", "firstName lastName userProfileImg userSubTitle")
        .populate({  path: "originalActivity",  populate: { path: "CreatedBy", select: "firstName lastName userProfileImg" } 
    });







    //3.If user Following Activitys are little continue Displaying Globle Activitys
    if (posts.length < limit) {

        const remainingLimit = limit - posts.length;
        const excludedIds = posts.map(p => p._id); // To make sure not repeat the same posts


        const globalPosts = await ActivityModel.find({
            _id: { $nin: excludedIds },// To exclude the Posts that displayed in the past
            CreatedBy: { $nin: authorIds }// to get people who's are outside following circle
        })
        .sort({ createdAt: -1 })
        .limit(remainingLimit)
        .populate("CreatedBy", "firstName lastName userProfileImg userSubTitle")
        .populate({  path: "originalActivity",  populate: { path: "CreatedBy", select: "firstName lastName userProfileImg" } });

        posts = [...posts, ...globalPosts];
    }

    if (posts.length > 0) {
        await redisClient.set(Cashkey, JSON.stringify(posts), { EX: 300 });
    }

    res.status(200).json({  status: "success", results: posts.length,  data: posts  });
});
export const getUserActivity = asyncHandler(async (req, res, next) => {


    const { userId } = req.params; // Logged in User Profile ID


    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;



    const UserActivitys = await ActivityModel.find({ CreatedBy: userId })
    
        .sort({ createdAt: -1 }) // the newer Activty First
        .skip(skip)
        .limit(limit)
        .populate("CreatedBy", "firstName lastName userProfileImg userSubTitle")
        .populate({ path: "originalActivity",populate: { path: "CreatedBy", select: "firstName lastName userProfileImg" }

    });



    res.status(200).json({status: "success", results: UserActivitys.length, data: UserActivitys});
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


