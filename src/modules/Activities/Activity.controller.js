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
export const GetActivities = asyncHandler(async(req,res,next)=>{
    
    
    const {OwnerId}=req.params;
    const userId=req.user.Id
    

   
   const page = Math.max(1,parseInt(req.query.page) || 1 );
   const limit = Math.min(50,parseInt(req.query.page)|| 10)
   const skip = (page - 1) * limit;




     
    const CacheKey=`Activities:${OwnerId}:p:${page}:l:${limit}`
    const CachedData=await redisClient.get(CacheKey);

    if(CachedData){
        return res.status(200).json({Msg:"done",status:"success",source:"Cache",data:JSON.parse(CachedData)})
    }

  


   const Activities= await ActivityModel.find({CreatedBy:OwnerId})
  .sort({ createdAt: -1 }) 
  .skip(skip)
  .limit(limit)
  .populate({path:"CreatedBy",select:"firstName lastName userProfileImg CompanyName Logo "})
  .populate({path: "comments",
    populate: { path: "userId", select: "firstName lastName userProfileImg" }
  })


   

  
    await redisClient.set(CacheKey,JSON.stringify(Activities),{EX:300})
  

    res.status(200).json({Msg:"done",status:"success",source:"DB",count:Activities.length ,data:Activities})



})
export const GetSpecificActivityInfo = asyncHandler(async(req,res,next)=>{

  const {activityId}=req.params;
  const userId=req.user._id

  
  const CacheKey=`ActivityInfo:${activityId}`;
  const CachedData= await redisClient.get(CacheKey);

  if(CachedData){
  return res.status(200).json({msg:"Done", status:"success",source:"Cache",data:JSON.parse(CachedData)})
  }


  const ActivityExists=await ActivityModel.findById(activityId)
  .populate({path:"CreatedBy", select:"firstName lastName userProfileImg userProfileImg CompanyName Logo "})
  .populate({path:"comments",
    populate:{path:"userId",select:"firstName lastName userProfileImg"}
})  



  if (!ActivityExists) {
    return next(new Error("Sorry, Activity not Exists"),404)
  }

  await redisClient.set(CacheKey,JSON.stringify(ActivityExists),{EX:300})

  
  res.status(200).json({msg:"done", status:"success",source:"DB" ,data:ActivityExists})


})

//YELLOW2 Create (Companies && users) !//
export const CreateActivity = asyncHandler(async (req, res, next) => {

    const { text ,creatorType } = req.body;
    var newPost={}
    const userId = req.user._id;
    const files = req.files;


    let activityData = {
        text,
        ActivityType: "text",
        media:null,
        videoCover:null,
        creatorType: "user",
        CreatedBy: userId,
        addedBy: userId,
        isRepost: false

    };


    const randomId = nanoid();
       
    //  ? check if Post Description in Empty ? //
    if (activityData.ActivityType === "text" && (!text || text.trim().length === 0)) {
        return next(new Error("Post content cannot be empty", { cause: 400 }));
    }

   

   

    // TODO => For User posts
    if(creatorType === "user" ){

   
    const folderPath = `Ycg/users/${userId}/${req.user.firstName}_${req.user.lastName}/UserActivity`;

    if (files) {


        if (files.video?.[0]) {

        const videoUpload = await cloudinary.uploader.upload(files.video[0].path, {
                folder: `Ycg/users/${userId}/${req.user.firstName}_${req.user.lastName}/UserActivities/VideoActivities/${randomId}`,
                resource_type: "video"
        });

        activityData.media = { secure_url: videoUpload.secure_url, public_id: videoUpload.public_id };
        activityData.ActivityType = "video";

        if (files.videoCover?.[0]) {

        const coverUpload = await cloudinary.uploader.upload(files.videoCover[0].path, {
        folder: `Ycg/users/${userId}/${req.user.firstName}_${req.user.lastName}/UserActivities/VideoActivities/${randomId}/VideoCoverImage`
        });

        activityData.videoCover = { secure_url: coverUpload.secure_url, public_id: coverUpload.public_id };

        }


        }


        else if (files.image?.[0]) {

            activityData.ActivityType = "image";
            const imageUpload = await cloudinary.uploader.upload(files.image[0].path, {
                folder: `Ycg/users/${userId}/${req.user.firstName}_${req.user.lastName}/UserActivities/ImageActivities/${randomId}`
            });
            activityData.media = { secure_url: imageUpload.secure_url, public_id: imageUpload.public_id };
        }


    }


    newPost = await ActivityModel.create(activityData);

    
    const keys = await redisClient.keys(`Activities:${userId}*`);

    await redisClient.del(keys);
   


    }
    // ! For Company Posts
    else if(creatorType === "Company"){

      activityData.creatorType = creatorType
        

      
        const CompanyExists = await companyModel.findOne({"Admins.user":userId})
        if (!CompanyExists) {
           return next(new Error("Company not found or access denied", { cause: 404 }))
        }
    
        const CurrentAdmin = await CompanyExists.Admins.find(a => a.user.toString()=== userId.toString());
        if(!CurrentAdmin || !["admin","superAdmin"].includes(CurrentAdmin.role)){
            return next(new Error("Unauthorized: Only admins can post", { cause: 404 }));
        }

        activityData.CreatedBy = CompanyExists._id;
        activityData.addedBy = userId


        if(files){

            if(files.video?.[0]){

            const {public_id,secure_url}= await cloudinary.uploader.upload(files.video[0].path,{
                resource_type:"video",
                folder:`Ycg/companys/${CompanyExists._id}/${CompanyExists.CompanyName}/CompanyActivity/videoActivities/${randomId}`

            })
            activityData.ActivityType="video";
            activityData.media={public_id,secure_url};

               
            if(req.files.videoCover?.[0]){
            const MediaCover =await cloudinary.uploader.upload(files.videoCover[0].path,{
                folder:`Ycg/companys/${CompanyExists._id}/${CompanyExists.CompanyName}/CompanyActivity/videoActivities/${randomId}/VideoCover`
            })

            activityData.videoCover={secure_url:MediaCover.secure_url ,public_id:MediaCover.public_id}

            }


            }


            if(files.image?.[0]){

                const {public_id,secure_url}=await cloudinary.uploader.upload(files.image[0].path,{
                folder:`Ycg/companys/${CompanyExists._id}/${CompanyExists.CompanyName}/CompanyActivity/ImageActivities/${randomId}`
                })

                activityData.media={public_id,secure_url}
                activityData.ActivityType="image"

            }

           


           

        }


        newPost = await ActivityModel.create(activityData);

         
        const keys = await redisClient.keys(`Activities:${CompanyExists._id}`);
        await redisClient.del(keys);
       

    }




    res.status(201).json({ status: "success", message: `Activity created successfully`, data: newPost});



 

});

//CYAN2 Update (Companies && users) ?//
export const UpdateActivity = asyncHandler(async (req, res, next) => {

    const { ActivityId } = req.params;
    const { text , creatorType } = req.body;
    const userId = req.user._id;
      

 
    //  ? check if Post Description in Empty ? //
    if ((!text || text.trim().length === 0)) {
        return next(new Error("Post content cannot be empty", { cause: 400 }));
    }
   //? Check if Activity Exists
  
    const ActivityExists = await ActivityModel.findOne({_id:ActivityId});
    if(!ActivityExists){return next(new Error("Sorry, Activity not Exists"),404)}
   
     

  // TODO => For User posts
   if(creatorType === "user"){


    if(ActivityExists.CreatedBy.toString() !== userId.toString()){
    return next(new Error("Sorry, you are not authorized"),404)
    }

    // update Activity Text
    ActivityExists.text = text || ActivityExists.text;
    await ActivityExists.save();

    // clear cach
    const ActivityDetailsKey= await redisClient.keys(`ActivityInfo:${ActivityExists._id}`)
    const keys = await redisClient.keys(`Activities:${userId}:*`);


   
   if(keys.length >=1){ await redisClient.del(keys);}
   if(ActivityDetailsKey.length >=1){ await redisClient.del(ActivityDetailsKey);}
  
        
      

   }
    // ! For Company Posts
  else if(creatorType === "Company"){
    
    const CompanyExists = await companyModel.findOne({ _id: ActivityExists.CreatedBy, "Admins.user": userId });
    if (!CompanyExists) return next(new Error("Unauthorized: Access denied for this company"), 403);


    const CurrentAdmin = CompanyExists.Admins.find(a => a.user.toString() === userId.toString());
    if(!CurrentAdmin || !["admin", "superAdmin"].includes(CurrentAdmin.role)) {
        return next(new Error("Unauthorized: Insufficient permissions", 403));
    }

    ActivityExists.text = text;
    await ActivityExists.save();

    const keysToDel = [`ActivityInfo:${ActivityId}`, ...(await redisClient.keys(`Activities:${ActivityExists.CreatedBy}:*`)) ];
    if (keysToDel.length > 0) await redisClient.del(keysToDel);
}

    res.status(200).json({  status: "success",  message: "Activity updated successfully"  });
});
//RED3 Delete (Companies && users) ?//   
export const DeleteActivity = asyncHandler(async (req, res, next) => {

    const { activityId } = req.params;
    const userId = req.user._id;

    

    //? Check If Activity Exists
    const activity = await ActivityModel.findById(activityId);
    if (!activity) return next(new Error("Activity not found", { cause: 404 }));


    // TODO => For User posts
   if(activity.creatorType === "user"){

    // Check If User is authorized
    if (activity.CreatedBy.toString() !== userId.toString()) {
        return next(new Error("You are not authorized to delete this post", { cause: 403 }));
    }
    // Delete Video
    if (activity.media?.public_id) {
        await cloudinary.uploader.destroy(activity.media.public_id, {resource_type: activity.postType === "video" ? "video" : "image"});
    }
    // Delete video cover if it Exists
    if (activity.videoCover?.public_id) {
        await cloudinary.uploader.destroy(activity.videoCover.public_id);
    }
    
    await commentModel.deleteMany({ activityId });
    await ActivityModel.findByIdAndDelete(activityId);

    // delete Cache
    const ActivityDetailsKey= await redisClient.keys(`ActivityInfo:${activityId}`)
    const key = await redisClient.keys(`Activities:${userId}:*`);
    const CommentsCache_key =await redisClient.keys(`Comments:${activityId}`);

    if(ActivityDetailsKey.length >0) {await redisClient.del(ActivityDetailsKey)}
    if(key.length >0) {await redisClient.del(key)}
    if(CommentsCache_key.length >0) {await redisClient.del(CommentsCache_key)}
  

   }
   // ! For Company Posts
   else if(activity.creatorType === "Company"){
    

    const CompanyExists = await companyModel.findById(activity.CreatedBy)
    if (!CompanyExists) {return next(new Error("Company not found"),404)}


    const AdminExists = await companyModel.findOne({"Admins.user":userId})
    if (!AdminExists) {return next(new Error("access denied"),404)}
        

    const CurrentAdmin = await AdminExists.Admins.find(a => a.user.toString()=== userId.toString());
    if(!CurrentAdmin || !["admin","superAdmin"].includes(CurrentAdmin.role)){
        return next(new Error("Unauthorized: Only admins can post", 403));
    }

    // Delete Video
    if (activity.media?.public_id) {
        await cloudinary.uploader.destroy(activity.media.public_id, {resource_type: activity.postType === "video" ? "video" : "image"});
    }
    // Delete video cover if it Exists
    if (activity.videoCover?.public_id) {
        await cloudinary.uploader.destroy(activity.videoCover.public_id);
    }

    await commentModel.deleteMany({ activityId });
    await ActivityModel.findByIdAndDelete(activityId);

    
    const ActivityDetailsKey= await redisClient.keys(`ActivityInfo:${activityId}`)
    const key = await redisClient.keys(`Activities:${CompanyExists._id}`);
    const CommentsCache_key =await redisClient.keys(`Comments:${activityId}`);


    if (ActivityDetailsKey.length > 0) {await redisClient.del(ActivityDetailsKey);}
    if (key.length > 0) {await redisClient.del(key);}
    if (CommentsCache_key.length > 0) {await redisClient.del(CommentsCache_key);}


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
        return res.status(200).json({status:"Success",source:"Cash" ,comments:JSON.parse(CashedData) })
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

    const originalPost = await ActivityModel.findById(originalActivityId);
    if (!originalPost) return next(new Error("Original post not found", { cause: 404 }));

  
    const newRepost = await ActivityModel.create({
        content: content || "",
        isRepost: true,
        originalPost: originalActivityId,
        creatorType: activeType,
        CreatedBy: activeId,
        userId: req.user._id 
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




