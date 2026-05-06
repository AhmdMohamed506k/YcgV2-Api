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

    const { postId } = req.body;
    const userId = req.user._id;

    const post = await ActivityModel.findById(postId);
    if (!post) return next(new Error("Post not found", { cause: 404 }));


    const isLiked = post.likes.includes(userId);
    let messageContent = "";

    if (isLiked) {
        post.likes.pull(userId);
        post.LikesCount = Math.max(0, post.LikesCount - 1);
    } else {

        post.likes.push(userId);
        post.LikesCount += 1;




        if (post.CreatedBy.toString() !== userId.toString()) {

            //User Post
            if(post.creatorType == "user"){

            const LikedUser = await userModel.findById(userId).select("firstName lastName userProfileImg");
            messageContent = post.LikesCount <= 1 ? `${LikedUser.firstName} reacted to your activity` : `${LikedUser.firstName} and others reacted to your activity`;

        
            MyPusher.trigger(post.CreatedBy.toString(), "UserNotification", {
                UserIMG: LikedUser.userProfileImg?.secure_url, 
                Message: messageContent
            });

          
            await notificationModel.create({
                recipient: post.CreatedBy,
                sender: userId,
                senderProfileImg: LikedUser.userProfileImg,
                type: "like",
                content: messageContent
            });

            }
            //Company Post
            else if(post.creatorType == "Company"){
              
                const LikedUser = await userModel.findById(userId).select("firstName lastName userProfileImg");
                const OwnedCompany = await companyModel.findOne({_id:post.CreatedBy});

                messageContent = post.LikesCount <= 1 ? `${LikedUser.firstName} ${LikedUser.lastName} reacted to your ${OwnedCompany.CompanyName} activity` : `${LikedUser.firstName} ${LikedUser.lastName} and others reacted to your ${OwnedCompany.CompanyName} activity`;

                const AdminIds = OwnedCompany.Admins.find(a=>a.user._id.toString())
                 
                const notificationPromises = AdminIds.map(async (adminId)=>{

                       await MyPusher.trigger(adminId,"new-Notification",{
                         message:messageContent,
                         UserImg:LikedUser.userProfileImg?.secure_url
                       })

                         return notificationModel.create({
                            recipient: adminId,
                            sender: userId,
                            type: "like",
                            content: messageContent
                        });

                })
                
                await Promise.all(notificationPromises)
            }
        }
    }

    await post.save();

   
    const specificKeys = [`ActivityInfo:${postId}`,...(await redisClient.keys(`Activities:${post.CreatedBy}:*`)) ];
   
    if (specificKeys.length > 0) await redisClient.del(specificKeys);

    res.status(200).json({ status: "success", message: isLiked ? "Like removed" : "Like added", likesCount: post.LikesCount });
});
//ORANGE1 ==>Comment
export const AddComment = asyncHandler(async (req, res, next) => {

    const { ActivityId, text, parentId } = req.body;
    const userId = req.user._id;

 
    const post = await ActivityModel.findById(ActivityId);
    if (!post) return next(new Error("Activity not found", { cause: 404 }));

    const newComment = await commentModel.create({
        ActivityId,
        userId,
        text,
        parentId: parentId || null
    });

    const userWhoCommented = await userModel.findById(userId).select("firstName lastName userProfileImg");
    await ActivityModel.findByIdAndUpdate(ActivityId, { $inc: { CommentsCount: 1 } });


    const sendNotify = async (recipientId, msg, type) => {
        if (recipientId.toString() === userId.toString()) return; 

        // Pusher Real-time
        await MyPusher.trigger(recipientId.toString(), "UserNotification", {
            UserImg: userWhoCommented.userProfileImg?.secure_url || userWhoCommented.userProfileImg?.public_id,
            Message: msg,
            ActivityId: ActivityId
        });

        // DB Record
        await notificationModel.create({
            recipient: recipientId,
            sender: userId,
            senderProfileImg: userWhoCommented.userProfileImg,
            type: type,
            content: msg
        });
    };

  

    if (parentId) {
      
        const parentComment = await commentModel.findById(parentId);
        if (parentComment) {
            const message = `${userWhoCommented.firstName} replied to your comment`;
            await sendNotify(parentComment.userId, message, "reply");
        }
    } else {
    
        const message = `${userWhoCommented.firstName} ${userWhoCommented.lastName} commented on your post`;

        if (post.creatorType === "user") {
         
            await sendNotify(post.CreatedBy, message, "comment");
        } 
        else if (post.creatorType === "Company") {
        
            const company = await companyModel.findById(post.CreatedBy);
            if (company && company.Admins) {
                const adminNotifyPromises = company.Admins.map(admin => {
                    const companyMsg = `${userWhoCommented.firstName} commented on ${company.CompanyName}'s post`;
                    return sendNotify(admin.user, companyMsg, "comment");
                });
                await Promise.all(adminNotifyPromises);
            }
        }
    }

  
    const keysToDel = [`Comments:${ActivityId}`, `ActivityInfo:${ActivityId}`];
    const userKeys = await redisClient.keys(`Activities:${post.CreatedBy}:*`);
    if (userKeys.length > 0) keysToDel.push(...userKeys);
    
    await redisClient.del(keysToDel);

    res.status(201).json({ status: "success", data: newComment });
});
export const ToggleCommentLike = asyncHandler(async (req, res, next) => {


    const { commentId } = req.body;
    const userId = req.user._id; 

    

    const comment = await commentModel.findById(commentId);
    if (!comment) {return next(new Error("Comment not found", { cause: 404 })); }

    const isLiked = comment.likes.includes(userId);

    if (isLiked) {
        comment.likes.pull(userId);
        comment.LikesCount = Math.max(0,comment.LikesCount -1)
    } else {
        comment.likes.push(userId);
        comment.LikesCount += 1
          
          
        if(comment.userId.toString() !== userId.toString()){

         

            const LikedUser= await userModel.findById(userId).select("firstName userProfileImg");
            const MessageContent = comment.LikesCount < 1 ? `${LikedUser.firstName} Liked your Comment`:`${LikedUser.firstName} and others Liked your Comment`
            
            await MyPusher.trigger(comment.userId.toString(),"CommentLike",{
                UserImg:LikedUser.userProfileImg?.public_id,
                Message:MessageContent
            })
            
            await notificationModel.create({ recipient: comment.userId, sender: userId,senderProfileImg:LikedUser.userProfileImg ,type: "CommentLike", content: MessageContent });

        }


    }

    await comment.save();
    
       


    const activityOwner = await ActivityModel.findOne({_id:comment.ActivityId})
     
    const specificKeys = [`ActivityInfo:${comment.ActivityId}`,...(await redisClient.keys(`Activities:${activityOwner.CreatedBy}:*`,await redisClient.keys(`Comments:${userId}`))) ];
   
    if (specificKeys.length > 0) await redisClient.del(specificKeys);



    res.status(200).json({ status: "success", message: isLiked ? "Like removed from comment" : "Like added to comment", likesCount: comment.likes.length });
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


    const { commentId } = req.body;
    const { text } = req.body;
    const userId = req.user._id;



    if (!text || text.trim().length === 0) {
        return next(new Error("Comment text is required", { cause: 400 }));
    }

    const comment = await commentModel.findById(commentId);
    if (!comment) {
        return next(new Error("Comment not found", { cause: 404 }));
    }

    //check if user is authorized
    if (comment.userId.toString() !== userId.toString()) {
        return next(new Error("You are not authorized to update this comment", { cause: 403 }));
    }

    comment.text = text;
    await comment.save();



    const key =await redisClient.keys("Comments:*");
    if(key.length>0) {await redisClient.del(key)}

    res.status(200).json({status: "success", message: "Comment updated successfully", data: comment});
});
export const DeleteComment = asyncHandler(async (req, res, next) => {


    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await commentModel.findById(commentId);
    if (!comment) return next(new Error("Comment not found", { cause: 404 }));

   
    const activity = await ActivityModel.findById(comment.ActivityId);

   
   
    
    const isCommentOwner = comment.userId.toString() === userId.toString();
    const isActivityOwner = activity?.CreatedBy.toString() === userId.toString();



    if (!isCommentOwner && !isActivityOwner) {
        return next(new Error("Not authorized to delete this comment", { cause: 403 }));
    }

    await commentModel.findByIdAndDelete(commentId);
    await ActivityModel.findByIdAndUpdate(comment.ActivityId, { $inc: { CommentsCount: -1 } });

    const keysToDel = [ `Comments:${comment.ActivityId}`, `ActivityInfo:${comment.ActivityId}`, ...(await redisClient.keys(`Activities:${activity.CreatedBy}:*`)) ];
    await redisClient.del(keysToDel);

    res.status(200).json({ status: "success", message: "Comment deleted successfully" });
});
//LIME ==>Repost
export const CreateRepost = asyncHandler(async (req, res, next) => {


    const { ActivityId } = req.body; // The Original Activity
    const { text } = req.body;     // Optional Taxt That User can add it
    const userId = req.user._id;

    // Check if Activity Exists
    const originalPost = await ActivityModel.findById(ActivityId);
    if (!originalPost) { return next(new Error("Original post not found", { cause: 404 }));}

    // Add Reposted Activity on the Logged in User Profile
    const repost = await ActivityModel.create({
        text, 
        ActivityType: "repost",
        isRepost: true,
        originalActivity: ActivityId, 
        CreatedBy: userId
    });

    // Increment the Reposted Count on the Original Activity
    await ActivityModel.findByIdAndUpdate(ActivityId, {
        $inc: { repostsCount: 1 }
    });

    // Get the Reposted Activity data with the original Activity Informations
    const fullRepostData = await ActivityModel.findById(repost._id).populate({ path: "originalActivity",
        populate: { path: "CreatedBy", select: "firstName lastName userProfileImg" }
    });
     

    
    const key =await redisClient.keys("Activities:*");
    if(key.length>0) {await redisClient.del(key)}


    res.status(201).json({status: "success",message: "Activity reposted successfully", data: fullRepostData});
});





