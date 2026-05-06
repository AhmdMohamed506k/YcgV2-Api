import companyModel from "../../../DB/models/Company/Company.model.js";
import { userModel } from "../../../DB/models/User/UserMainModel/user.model.js";
import { followModel } from "../../../DB/models/Follow/follow.model.js";
import { notificationModel } from "../../../DB/models/notifications/Notifications.model.js";
import {asyncHandler} from "../../middleware/asyncHandler/asyncHandler.js"
import redisClient from "../../utils/redisClient/redisClient.js";
import MyPusher from "../../service/Pusher/PusherConfig.js";
import { viewModel } from "../../../DB/models/Views/viewer.model.js";










//RED1:==================================================Follow_Operations===============================================================
//GREEN3==> Toggle-Follow
export const ToggleFollow = asyncHandler(async (req, res, next) => {
    const { followingId, onModel } = req.body; 
    const userId = req.user._id;

    if (followingId.toString() === userId.toString()) {
        return next(new Error("You cannot follow yourself", { cause: 400 }));
    }

    const TargetModel = onModel === 'User' ? userModel : companyModel;
    const targetExists = await TargetModel.findById(followingId);
    if (!targetExists) return next(new Error(`${onModel} not found`, { cause: 404 }));

    const existingFollow = await followModel.findOne({ followerId: userId, followingId, onModel });

    if (existingFollow) {
        // --- Unfollow Logic ---
        await followModel.deleteOne({ _id: existingFollow._id });
        await TargetModel.findByIdAndUpdate(followingId, { $inc: { followersCount: -1 } });
        await userModel.findByIdAndUpdate(userId, { $inc: { followingCount: -1 } });

        res.status(200).json({ status: "success", message: "Unfollowed successfully" });
    } else {
        // --- Follow Logic ---
        await followModel.create({ followerId: userId, followingId, onModel });
        await TargetModel.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } });
        await userModel.findByIdAndUpdate(userId, { $inc: { followingCount: 1 } });

        const followerUser = await userModel.findById(userId).select("firstName userProfileImg");
        const message = `${followerUser.firstName} started following ${onModel === 'User' ? 'you' : targetExists.CompanyName}`;

   
        if (onModel === 'User') {
           
            await MyPusher.trigger(followingId.toString(), "UserNotification", {
                Message: message,
                UserImg: followerUser.userProfileImg?.secure_url
            });
            await notificationModel.create({ recipient: followingId, sender: userId, type: "follow", content: message });
        } 
        else if (onModel === 'Company') {
         
            const adminIds = targetExists.Admins.map(admin => admin.user.toString());

            const notificationPromises = adminIds.map(async (adminId) => {
              
                await MyPusher.trigger(adminId, "UserNotification", {
                    Message: message,
                    UserImg: followerUser.userProfileImg?.secure_url,
                    CompanyId: followingId 
                });

       
                return notificationModel.create({
                    recipient: adminId,
                    sender: userId,
                    type: "follow",
                    content: message
                });
            });

            await Promise.all(notificationPromises);
        }

        res.status(200).json({ status: "success", message: "Followed successfully" });
    }

   
    const keys = await redisClient.keys(`NewsFeed:${userId}:*`);
    if (keys.length > 0) await redisClient.del(keys);
});


//RED1:==================================================View_Operation===============================================================
//YELLOW2==> Record-View
export const recordProfileView = asyncHandler(async(req,res,next)=>{

    const viewerId = req.user._id.toString(); //Logged in user
    const { profileId } = req.body; // watched profile

     console.log(profileId)
    if (viewerId === profileId) {
      return res.status(200).json({ message: "Self-view ignored" });
    }


    const viewCacheKey = `view:${viewerId}:${profileId}`;
    const isViewedRecently = await redisClient.get(viewCacheKey);



    if (!isViewedRecently) {
   
      await viewModel.create({ viewerId, profileId });


      await redisClient.set(viewCacheKey, "true", { EX: 3600  });

     
    } 

    res.status(200).json({ status: "success", message: "View processed" });


});


//RED1:==================================================People-You-May-Know===============================================================
//ORANGE1==> People-You-May-Know
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

