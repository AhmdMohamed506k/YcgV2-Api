import { nanoid } from "nanoid";
import redisClient from "../../utils/redisClient/redisClient.js";
import {asyncHandler} from "../../middleware/asyncHandler/asyncHandler.js"
import cloudinary from "../../utils/Cloudinary/Cloudinary.js"
import { ActivityModel } from "../../../DB/models/Activities/Activities.model.js";
import { commentModel } from "../../../DB/models/Activities/Comments.model.js";
import { followModel } from "../../../DB/models/Follow/follow.model.js";
import MyPusher  from "../../service/Pusher/PusherConfig.js";
import { userModel } from "../../../DB/models/User/UserMainModel/user.model.js";
import { notificationModel } from "../../../DB/models/notifications/Notifications.model.js";
import  companyModel  from "../../../DB/models/Company/Company.model.js";
import { activityViewModel } from "../../../DB/models/Activities/ActivitiesView.model.js";








//WHITE========================================CRUD===================================================================///

//GREEN3 DisPlay (CompaniesPage && userProfile) !//
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
})
export const GetAllUserActivities = asyncHandler(async(req,res,next)=>{
    
    
    const {OwnerId}=req.params;
    const userId=req.user.Id
    

   
   const page = Math.max(1,parseInt(req.query.page) || 1 );
   const limit = Math.min(50,parseInt(req.query.page)|| 10)
   const skip = (page - 1) * limit;




     
    const CacheKey=`Activities:${OwnerId}:p:${page}:l:${limit}`
    const CachedData=await redisClient.get(CacheKey);

    
    if(CachedData){
        const data = JSON.parse(CachedData);
        return res.status(200).json({Msg:"done",status:"success",source:"Cache",count:JSON.parse(data.length),data:JSON.parse(CachedData)})
    }

  


   const Activities= await ActivityModel.find({CreatedBy:OwnerId})
  .sort({ createdAt: -1 }) 
  .skip(skip)
  .limit(limit)
  .populate({path:"CreatedBy",select:"firstName lastName userProfileImg CompanyName Logo "})
  .populate({path: "comments",populate: { path: "userId", select: "firstName lastName userProfileImg" } })
  .populate("views")
  .populate("viewsCount"); 


   

  
    await redisClient.set(CacheKey,JSON.stringify(Activities),{EX:300})
  

    res.status(200).json({Msg:"done",status:"success",source:"DB",count:Activities.length ,data:Activities})



})
export const GetSpecificActivityInfo = asyncHandler(async (req, res, next) => {

    
    const { activityId } = req.params;
    const { id: viewerId, type: viewerType } = req.identity; 

    const CacheKey = `ActivityInfo:${activityId}`;
    const CachedData = await redisClient.get(CacheKey);

    
     
 
    const viewCacheKey = `ActivityView:${activityId}:${viewerId}`;
    const alreadyViewed = await redisClient.get(viewCacheKey);

    if (!alreadyViewed) {
  
    const post = await ActivityModel.findById(activityId).select("CreatedBy creatorType");
    
    if (post && post.CreatedBy.toString() !== viewerId.toString()) {
      
        await activityViewModel.create({ activityId, viewerId, viewerType });
        
       
        await ActivityModel.findByIdAndUpdate(activityId, { $inc: { ViewsCount: 1 } });

     
        if (post.creatorType === "Company") {
            await companyModel.findByIdAndUpdate(post.CreatedBy, { $inc: { totalViews: 1 }  });
        }

      
        await redisClient.set(viewCacheKey, "true", { EX: 3600 });
        await redisClient.del(CacheKey); 
    }
    
    }

    if (CachedData) {
        return res.status(200).json({ status: "success", source: "Cache", data: JSON.parse(CachedData) });
    }


    const ActivityExists = await ActivityModel.findById(activityId)
        .populate({ path: "CreatedBy", select: "firstName lastName userProfileImg CompanyName Logo" })
        .populate({ path: "comments",populate: { path: "userId", select: "firstName lastName userProfileImg" }})
        .populate("views")
        .populate("viewsCount"); 

    if (!ActivityExists) {
        return next(new Error("Sorry, Activity not Exists", { cause: 404 }));
    }

    await redisClient.set(CacheKey, JSON.stringify(ActivityExists), { EX: 300 });

    res.status(200).json({ status: "success", source: "DB", data: ActivityExists });
});

//YELLOW2 Create (Companies && users) !//

export const CreateActivity = asyncHandler(async (req, res, next) => {

    const { text } = req.body;
    const { id: senderId, type: senderType, name: senderName, img: senderImg } = req.identity;
    const authUserId = req.user._id; 

    
    if (!text || text.trim().length === 0) {
        return next(new Error("Post content cannot be empty", { cause: 400 }));
    }
  
    
    let activityData = {
        text,
        ActivityType: "text",
        media: null,
        videoCover: null,
        creatorType: senderType === "user" ? "user" : "Company",
        CreatedBy: senderId, 
        addedBy: authUserId,
        isRepost: false
    };

   
    const TargetModel = senderType === "user" ? userModel : companyModel;
    const targetInfo = await TargetModel.findById(senderId);
    
    if (!targetInfo) {
        return next(new Error(`Sorry, ${senderType === "user" ? "User" : "Company"} does not exist`, { cause: 404 }));
    }
    if (senderType === "Company") {
        const hasPostingPrivilege = targetInfo.Admins.some((admin) => admin.user.toString() === authUserId.toString() && ["admin", "superAdmin"].includes(admin.role));
        if (!hasPostingPrivilege) {
            return next(new Error("Unauthorized: Only admins can post on behalf of the company", { cause: 403 }));
        }
    }
    
    
    
    if (req.files) {
        const uniqueFolderId = nanoid(6); 
        
        
        const VideoPostFolderPath = senderType === "user"
            ? `Ycg/users/${senderId}/${req.user.firstName}_${req.user.lastName}/UserActivities/VideoActivities/${uniqueFolderId}`
            : `Ycg/Companies/${targetInfo.CompanyName}/videoPost/${uniqueFolderId}`;

        const VideoCoverPostFolderPath = senderType === "user"
            ? `Ycg/users/${senderId}/${req.user.firstName}_${req.user.lastName}/UserActivities/VideoActivities/${uniqueFolderId}/VideoCover`
            : `Ycg/Companies/${targetInfo.CompanyName}/videoPost/${uniqueFolderId}/VideoCover`;




        const ImgPostFolderPath = senderType === "user"
            ? `Ycg/users/${senderId}/${req.user.firstName}_${req.user.lastName}/UserActivities/ImgActivities/${uniqueFolderId}`
            : `Ycg/Companies/${targetInfo.CompanyName}/ImgPost/${uniqueFolderId}`;

     
        if (req.files.video?.[0]) { 
            const videoUpload = await cloudinary.uploader.upload(req.files.video[0].path, {
                folder: VideoPostFolderPath,
                resource_type: "video"
            });
            activityData.media = { secure_url: videoUpload.secure_url, public_id: videoUpload.public_id };
            activityData.ActivityType = "video";

          
            if (req.files.videoCover?.[0]) {
                const coverUpload = await cloudinary.uploader.upload(req.files.videoCover[0].path, {
                    folder: VideoCoverPostFolderPath
                });
                activityData.videoCover = { secure_url: coverUpload.secure_url, public_id: coverUpload.public_id };
            }
        }
    
        else if (req.files.image?.[0]) {
            const imageUpload = await cloudinary.uploader.upload(req.files.image[0].path, {
                folder: ImgPostFolderPath
            });
            activityData.media = { secure_url: imageUpload.secure_url, public_id: imageUpload.public_id };
            activityData.ActivityType = "image";
        }
    }

   
    const newPost = await ActivityModel.create(activityData);

    
    if (senderType === "user") {
    
        await redisClient.del(`user:profile:${senderId}`);
        await redisClient.del(`ActivityInfo:${activityData.CreatedBy}`);

        const userFeedKeys = await redisClient.keys(`Activities:${activityData.CreatedBy}*`);
        if (userFeedKeys.length > 0) await redisClient.del(userFeedKeys);

    } else {
       
        await redisClient.del([
            `User:CompanyPage:${senderId}`,
            `User:Dashboard:${senderId}`,
            `ActivityInfo:${activityData.CreatedBy}`,
            `Activities:${activityData.CreatedBy}*`
        ]);

    }

    res.status(201).json({ status: "success", message: "Activity created successfully", data: newPost });
});
//CYAN2 Update (Companies && users) ?//
export const UpdateActivity = asyncHandler(async (req, res, next) => {


    const { activityId } = req.params;
    const { text } = req.body;
    const { id: senderId, type: senderType } = req.identity;
    const authUserId = req.user._id;
    var userinfo
    var company


    const activity = await ActivityModel.findById(activityId);
    if (!activity) return next(new Error("Activity not found", { cause: 404 }));


 
    
   
   
    if (activity.creatorType == "user") {
             
        userinfo = await userModel.findById(activity.CreatedBy);
        if (!userinfo) return next(new Error("Company not found", { cause: 404 }));
      
        if (activity.CreatedBy.toString() !== senderId.toString()) {
            return next(new Error("Unauthorized: You can only update your own posts", { cause: 403 }));
        }
    } else {
       
        company = await companyModel.findById(activity.CreatedBy);
        if (!company) return next(new Error("Company not found", { cause: 404 }));

        const isCompanyAdmin = company.Admins.some((admin) => admin.user.toString() === authUserId.toString() && ["admin", "superAdmin"].includes(admin.role));
        if (!isCompanyAdmin) {
            return next(new Error("Unauthorized: Only company admins can update this post", { cause: 403 }));
        }
    }


    if (text) activity.text = text;

 
    if (req.files) {
        const uniqueFolderId = nanoid(6);

        
        const oldMediaId = activity.media?.public_id;
        const oldCoverId = activity.videoCover?.public_id;

        if (oldMediaId) await cloudinary.uploader.destroy(oldMediaId, { resource_type: activity.ActivityType === "video" ? "video" : "image" });
        if (oldCoverId) await cloudinary.uploader.destroy(oldCoverId);

     
        const VideoPostPrefix = activity.creatorType === "user"  ?
        `Ycg/users/${activity.CreatedBy}/${userinfo.firstName}_${userinfo.lastName}/UserActivities/VideoActivities/${uniqueFolderId}`
        : `Ycg/Companies/${company.CompanyName}/videoPost/${uniqueFolderId}`;

        const VideoCoverPostPrefix = activity.creatorType === "user"  ?
        `Ycg/users/${activity.CreatedBy}/${userinfo.firstName}_${userinfo.lastName}/UserActivities/VideoActivities/${uniqueFolderId}/VideoCover`
        : `Ycg/Companies/${company.CompanyName}/videoPost/${uniqueFolderId}/VideoCover`;

       
        const ImgPostPostPrefix = activity.creatorType === "user"  ?
        `Ycg/users/${activity.CreatedBy}/${userinfo.firstName}_${userinfo.lastName}/UserActivities/ImgActivities/${uniqueFolderId}`
        : `Ycg/Companies/${company.CompanyName}/videoPost/${uniqueFolderId}/ImgPost`;




        if (req.files.video?.[0]) {

            const videoUpload = await cloudinary.uploader.upload(req.files.video[0].path, {
                folder: VideoPostPrefix,
                resource_type: "video"
            });
            activity.media = { secure_url: videoUpload.secure_url, public_id: videoUpload.public_id };
            activity.ActivityType = "video";

            if (req.files.videoCover?.[0]) {
                const coverUpload = await cloudinary.uploader.upload(req.files.videoCover[0].path, {
                    folder: VideoCoverPostPrefix
                });
                activity.videoCover = { secure_url: coverUpload.secure_url, public_id: coverUpload.public_id };
            }




        } else if (req.files.image?.[0]) {
            const imageUpload = await cloudinary.uploader.upload(req.files.image[0].path, {
                folder: ImgPostPostPrefix
            });
            activity.media = { secure_url: imageUpload.secure_url, public_id: imageUpload.public_id };
            activity.ActivityType = "image";
            activity.videoCover = null; 
        }
    }

    const updatedActivity = await activity.save();

    
    if (activity.creatorType === "user") {

        await redisClient.del([`user:profile:${activity.CreatedBy}`,`ActivityInfo:${activity.CreatedBy}`]);
        const userFeedKeys = await redisClient.keys(`Activities:${activity.CreatedBy}*`);
        if (userFeedKeys.length > 0) await redisClient.del(userFeedKeys);


    } else {
        await redisClient.del([
            `User:CompanyPage:${senderId}`,
            `User:Dashboard:${senderId}`,
            `ActivityInfo:${activity.CreatedBy}`,
            `Activities:${activity.CreatedBy}*`
     ]);
    }

    res.status(200).json({ status: "success", message: "Activity updated successfully", data: updatedActivity });
});
//RED3 Delete (Companies && users) ?//   
export const DeleteActivity = asyncHandler(async (req, res, next) => {

    const { activityId } = req.params;
    const { id: senderId } = req.identity;
    const authUserId = req.user._id;

    const activity = await ActivityModel.findById(activityId);
    if (!activity) return next(new Error("Activity not found", { cause: 404 }));

     
    if (activity.creatorType === "user") {
        if (activity.CreatedBy.toString() !== senderId.toString()) {
            return next(new Error("Unauthorized: You can only delete your own posts", { cause: 403 }));
        }
    } else {
        const company = await companyModel.findById(activity.CreatedBy);
        if (!company) return next(new Error("Company not found", { cause: 404 }));

        const isCompanyAdmin = company.Admins.some((admin) => admin.user.toString() === authUserId.toString() && ["admin", "superAdmin"].includes(admin.role));
        if (!isCompanyAdmin) {
            return next(new Error("Unauthorized: Only company admins can delete this post", { cause: 403 }));
        }
    }

  
    const mediaToDelete = [];
    if (activity.media?.public_id) {
        
        if (activity.ActivityType === "video") {
            await cloudinary.uploader.destroy(activity.media.public_id, { resource_type: "video" });
        } else {
            mediaToDelete.push(activity.media.public_id);
        }

    }
    if (activity.videoCover?.public_id) mediaToDelete.push(activity.videoCover.public_id);

 
    if (mediaToDelete.length > 0) {
        await Promise.all(mediaToDelete.map(id => cloudinary.uploader.destroy(id)));
    }


    await ActivityModel.findByIdAndDelete(activityId);


    if (activity.creatorType === "user") {

        await redisClient.del([`user:profile:${activity.CreatedBy}`, `ActivityInfo:${activity.CreatedBy}`]);
        const userFeedKeys = await redisClient.keys(`Activities:${activity.CreatedBy}*`);
        if (userFeedKeys.length > 0) await redisClient.del(userFeedKeys);

    } else {

        await redisClient.del([
            `User:CompanyPage:${senderId}`,
            `User:Dashboard:${senderId}`,
            `ActivityInfo:${activity.CreatedBy}`,
            `Activities:${activity.CreatedBy}*`
       ]);

    }

    res.status(200).json({ status: "success", message: "Activity deleted successfully" });
});







//WHITE========================================Post-Enter-Actions============================================== ====///



//YELLOW1 ==>Like
export const ActivityToggleLike = asyncHandler(async (req, res, next) => {
    const { ActivityId } = req.body;
    const userId = req.identity.id.toString(); 
    
    const post = await ActivityModel.findById(ActivityId);
    if (!post) return next(new Error("Post not found", { cause: 404 }));


    const isLiked = post.likes.map(id => id.toString()).includes(userId);

    if (isLiked) {
        post.likes.pull(userId);
        post.LikesCount = Math.max(0, (post.LikesCount || 0) - 1);
    } else {
        post.likes.push(userId);
        post.LikesCount = (post.LikesCount || 0) + 1;

     
        const messageContent = post.LikesCount <= 1  ? `${req.identity.name} reacted to your activity` : `${req.identity.name} and ${post.LikesCount - 1} others reacted to your activity`;

        if (post.CreatedBy.toString() !== userId) {
       
            const sendPushAndNotify = async (recipientId) => {
                await MyPusher.trigger(recipientId.toString(), "UserNotification", {
                    Message: messageContent,
                    UserImg: req.identity.img,
                    ActivityId: ActivityId 
                });
                await notificationModel.create({
                    recipient: recipientId,
                    sender: req.user._id, 
                    type: "like",
                    content: messageContent
                });
            };

            if (post.creatorType === "user") {
                await sendPushAndNotify(post.CreatedBy);
            } 
            else if (post.creatorType === "Company") {
                const company = await companyModel.findById(post.CreatedBy);
                if (company) {
                    const adminPromises = company.Admins.map(admin => sendPushAndNotify(admin.user));
                    await Promise.all(adminPromises);
                }
            }
        }
    }

    await post.save();

  
    const specificKeys = [`ActivityInfo:${ActivityId}`, ...(await redisClient.keys(`Activities:${post.CreatedBy}:*`))];
    if (specificKeys.length > 0) await redisClient.del(specificKeys);

    res.status(200).json({ 
        status: "success", 
        message: isLiked ? "Like removed" : "Like added", 
        likesCount: post.LikesCount 
    });
});
//ORANGE1 ==>Comment
export const AddComment = asyncHandler(async (req, res, next) => {
    const { ActivityId, text, parentId } = req.body;
    
    
    const { id: senderId, type: senderType, name: senderName, img: senderImg } = req.identity;

   
    const post = await ActivityModel.findById(ActivityId);
    if (!post) return next(new Error("Activity not found", { cause: 404 }));

  
    const newComment = await commentModel.create({
        ActivityId,
        userId: req.user._id ,
        text,
        parentId: parentId || null,
        creatorType: senderType, 
        CreatedBy: senderId,     
         
    });

    await ActivityModel.findByIdAndUpdate(ActivityId, { $inc: { CommentsCount: 1 } });

  
    
   
    const sendNotify = async (recipientId, msg, type) => {
        // متبعتش إشعار لنفسك (لو الشخص هو اللي بيرد على نفسه)
        if (recipientId.toString() === req.user._id.toString()) return;

        await MyPusher.trigger(recipientId.toString(), "UserNotification", {
            UserImg: senderImg,
            Message: msg,
            ActivityId: ActivityId
        });

        await notificationModel.create({
            recipient: recipientId,
            sender: req.user._id,
            type: type,
            content: msg
        });
    };

  
    if (parentId) {
        const parentComment = await commentModel.findById(parentId);
        if (parentComment) {
            const replyMsg = `${senderName} replied to your comment`;
         
            await sendNotify(parentComment.userId, replyMsg, "reply");
        }
    } 
    else {
        const commentMsg = `${senderName} commented on your post`;

        if (post.creatorType === "user") {
        
            await sendNotify(post.CreatedBy, commentMsg, "comment");
        } 
        else if (post.creatorType === "Company") {
         
            const company = await companyModel.findById(post.CreatedBy);
            if (company) {
                const adminPromises = company.Admins.map(admin => 
                    sendNotify(admin.user, commentMsg, "comment")
                );
                await Promise.all(adminPromises);
            }
        }
    }

   
    const keysToDel = [`Comments:${ActivityId}`, `ActivityInfo:${ActivityId}`];
    const userKeys = await redisClient.keys(`Activities:${post.CreatedBy}:*`);

    if (userKeys.length > 0) keysToDel.push(...userKeys);
    await redisClient.del(keysToDel);

    res.status(201).json({ status: "success", data: newComment });
});
export const CommentToggleLike = asyncHandler(async (req, res, next) => {

    const { commentId } = req.body;
    const { id: likerId, type: likerType, name: senderName, img: senderImg } = req.identity;

    const comment = await commentModel.findById(commentId);
    if (!comment) return next(new Error("Comment not found", { cause: 404 }));

    const isLiked = comment.likes.map(id => id.toString()).includes(likerId.toString());

    if (isLiked) {
        comment.likes.pull(likerId);
        if (comment.LikesCount !== undefined) comment.LikesCount = Math.max(0, comment.LikesCount - 1);

    } else {
        comment.likes.push(likerId);
        if (comment.LikesCount !== undefined) comment.LikesCount += 1;

     
        if (comment.CreatedBy.toString() !== likerId.toString()) {
            const likeMsg = `${senderName} liked your comment`;

        
            const sendPush = async (targetId) => {
                await MyPusher.trigger(targetId.toString(), "UserNotification", {
                    Message: likeMsg,
                    UserImg: senderImg,
                    ActivityId: comment.ActivityId
                });
                await notificationModel.create({
                    recipient: targetId,
                    sender: req.user._id,
                    type: "like",
                    content: likeMsg
                });
            };

      
            if (comment.creatorType === "user") {
                await sendPush(comment.CreatedBy);
            } 
         
            else if (comment.creatorType === "Company") {
                const company = await companyModel.findById(comment.CreatedBy);
                if (company && company.Admins) {
                    const adminPromises = company.Admins.map(admin => sendPush(admin.user));
                    await Promise.all(adminPromises);
                }
            }
        }
    }

    await comment.save();
    await redisClient.del(`Comments:${comment.ActivityId}`);

    res.status(200).json({ 
        status: "success", 
        message: isLiked ? "Like removed" : "Like added",
        likesCount: comment.LikesCount 
    });
});
export const GetPostComments = asyncHandler(async (req, res, next) => {

    
    const { ActivityId } = req.body;

    
    const CashKey=`Comments:${ActivityId}`;
    const CashedData = await redisClient.get(CashKey);


    if(CashedData){
      const Data=JSON.parse(CashedData)
        
        return res.status(200).json({status:"Success",source:"Cash", count: Data.length,comments:Data })
    }


    const comments = await commentModel.find({ ActivityId }).populate("userId", "firstName lastName userProfileImg userSubTitle").sort({ createdAt: -1 });
     

    await redisClient.set(CashKey,JSON.stringify(comments),{EX:3000})
     


    

    res.status(200).json({status: "success",source:"DataBase", count: comments.length, data: comments});
});
export const UpdateComment = asyncHandler(async (req, res, next) => {

    const { commentId, text } = req.body;
    const { id: activeId } = req.identity; 

    
    const comment = await commentModel.findById(commentId);
    if (!comment) return next(new Error("Comment not found", { cause: 404 }));

  
    if (comment.CreatedBy.toString() !== activeId.toString()) {
        return next(new Error("You are not authorized to update this comment", { cause: 403 }));
    }


    comment.text = text;
    comment.isUpdated = true; 
    await comment.save();

  
    await redisClient.del(`Comments:${comment.ActivityId}`);

    res.status(200).json({ status: "success", message: "Comment updated", data: comment });
});
export const DeleteComment = asyncHandler(async (req, res, next) => {
    const { commentId } = req.body;
    const { id: activeId } = req.identity;

    const comment = await commentModel.findById(commentId);
    if (!comment) return next(new Error("Comment not found", { cause: 404 }));


    if (comment.CreatedBy.toString() !== activeId.toString()) {
        return next(new Error("You are not authorized to delete this comment", { cause: 403 }));
    }


    const repliesCount = await commentModel.countDocuments({ parentId: commentId });
    const totalToDelete = repliesCount + 1;


    await commentModel.deleteMany({ 
        $or: [
            { _id: commentId }, 
            { parentId: commentId }
        ] 
    });

   
    await ActivityModel.findByIdAndUpdate(comment.ActivityId, { 
        $inc: { CommentsCount: -totalToDelete } 
    });


    await redisClient.del(`Comments:${comment.ActivityId}`);
    await redisClient.del(`ActivityInfo:${comment.ActivityId}`);

    res.status(200).json({ status: "success", message: "Comment and its replies deleted" });
});
//LIME ==>Repost
export const ActivityRepost = asyncHandler(async (req, res, next) => {


    const { originalActivityId, content } = req.body;
    const { id: activeId, type: activeType, name: senderName, img: senderImg } = req.identity;
     
    console.log(req.identity);
    
    const originalPost = await ActivityModel.findById(originalActivityId);
    if (!originalPost) return next(new Error("Original post not found", { cause: 404 }));

    console.log(originalPost);
  
    const newRepost = await ActivityModel.create({
        RepostContent: content || "",
        isRepost: true,
        originalActivity: originalActivityId,
        creatorType: activeType,
        CreatedBy: activeId,
        userId: req.user._id,
        addedBy:originalPost.addedBy,
        ActivityType:"repost"
    });

 
    await ActivityModel.findByIdAndUpdate(originalActivityId, { 
        $inc: { repostCount: 1 } 
    });

   
    if (originalPost.CreatedBy.toString() !== activeId.toString()) {
        const repostMsg = `${senderName} shared your post`;

        const sendNotify = async (recipientId) => {
            await MyPusher.trigger(recipientId.toString(), "UserNotification", {
                Message: repostMsg,
                UserImg: senderImg,
                ActivityId: newRepost._id 
            });
            await notificationModel.create({
                recipient: recipientId,
                sender: req.user._id,
                type: "repost",
                content: repostMsg
            });
        };

        if (originalPost.creatorType === "user") {
            await sendNotify(originalPost.CreatedBy);
        } else if (originalPost.creatorType === "Company") {
            const company = await companyModel.findById(originalPost.CreatedBy);
            if (company) {
                const adminPromises = company.Admins.map(admin => sendNotify(admin.user));
                await Promise.all(adminPromises);
            }
        }
    }

   
    const keysToDel = [`Activities:${activeId}:*` , `ActivityInfo:${originalActivityId}`];
    const userKeys = await redisClient.keys(`Activities:${activeId}:*`);
    if (userKeys.length > 0) await redisClient.del(userKeys);
    await redisClient.del(`ActivityInfo:${originalActivityId}`);

    res.status(201).json({ status: "success", data: newRepost });
});




