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
    const { id: activeId, type: activeType, name: activeName, img: activeImg } = req.identity;

    if (followingId.toString() === activeId.toString()) {
        return next(new Error("You cannot follow yourself", { cause: 400 }));
    }

    const TargetModel = onModel === 'user' ? userModel : companyModel;
    const targetExists = await TargetModel.findById(followingId);
    if (!targetExists) return next(new Error(`${onModel} not found`, { cause: 404 }));

    const existingFollow = await followModel.findOne({ followerId: activeId, followingId, onModel });

    const cacheKeysToDel = [];

    if (activeType === "user") {
        cacheKeysToDel.push(`user:profile:${activeId}`);
    } else {
        cacheKeysToDel.push(`User:CompanyPage:${activeId}`, `User:Dashboard:${activeId}`); 
    }

   
    if (onModel === "user" || onModel === "User") {
        cacheKeysToDel.push(`user:profile:${followingId}`);
    } else {
        cacheKeysToDel.push(`User:CompanyPage:${followingId}`, `User:Dashboard:${followingId}`);
    }

    if (existingFollow) {
        // --- Unfollow Logic ---
        await followModel.deleteOne({ _id: existingFollow._id });

        // decrease target followers 
        await TargetModel.findByIdAndUpdate(followingId, { $inc: { followersCount: -1 } });
        
        // decrease people that i follow
        const MeModel = activeType === 'user' ? userModel : companyModel;
        await MeModel.findByIdAndUpdate(activeId, { $inc: { followingCount: -1 } });

        if (cacheKeysToDel.length > 0) {
            await redisClient.del(cacheKeysToDel);
        }

        return res.status(200).json({ status: "success", message: "Unfollowed successfully" });
    } else {
        // --- Follow Logic ---
        await followModel.create({ followerId: activeId, followerType: activeType, followingId, onModel });

        // increase target followers 
        await TargetModel.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } });

        // increase people that i follow
        const MeModel = activeType === 'user' ? userModel : companyModel;
        await MeModel.findByIdAndUpdate(activeId, { $inc: { followingCount: 1 } });

        if (cacheKeysToDel.length > 0) {
            await redisClient.del(cacheKeysToDel);
        }

        const message = `${activeName} started following ${onModel === 'User' || onModel === 'user' ? 'you' : targetExists.CompanyName || targetExists.name}`;
        const sendNotify = async (recipientId) => {
            await MyPusher.trigger(recipientId.toString(), "UserNotification", {
                Message: message,
                UserImg: activeImg
            });
            await notificationModel.create({
                recipient: recipientId,
                sender: activeId, 
                type: "follow",
                content: message
            });
        };

        if (onModel === 'User' || onModel === 'user') {
            await sendNotify(followingId);
        } else if (onModel === 'Company') {
            const adminPromises = targetExists.Admins.map(admin => sendNotify(admin.user));
            await Promise.all(adminPromises);
        }

        return res.status(200).json({ status: "success", message: "Followed successfully" });
    }
});

//RED1:==================================================View_Operation===============================================================
//YELLOW2==> Record-View
export const recordProfileView = asyncHandler(async(req, res, next) => {
    const { id: viewerId, type: viewerType } = req.identity; 
    const { profileId, onModel } = req.body; 

    if (viewerId.toString() === profileId.toString()) {
        return res.status(200).json({ message: "Self-view ignored" });
    }
     
    const viewCacheKey = `view:limit:${viewerId}:${profileId}`; 
    const isViewedRecently = await redisClient.get(viewCacheKey);

    if (!isViewedRecently) {
        await viewModel.create({ viewerId, viewerType, profileId });
        await redisClient.set(viewCacheKey, "true", { EX: 3600 });
        
        if (onModel === "user") {
            await redisClient.del(`user:profile:${profileId}`);
        } else {
          
            await redisClient.del([`User:CompanyPage:${profileId}`, `User:Dashboard:${profileId}`]);
        }
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

