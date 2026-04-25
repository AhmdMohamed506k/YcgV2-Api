import { nanoid } from "nanoid";
import redisClient from "../../utils/redisClient/redisClient.js";
import {asyncHandler} from "../../middleware/asyncHandler/asyncHandler.js"
import cloudinary from "../../utils/Cloudinary/Cloudinary.js"
import { ActivityModel } from "../../../DB/models/Activitys/Activitys.model.js";
import { commentModel } from "../../../DB/models/Activitys/Comments.model.js";
import { followModel } from "../../../DB/models/Follow/follow.model.js";
import MyPusher  from "../../service/Pusher/PusherConfig.js";
import { userModel } from "../../../DB/models/User/UserMainModel/user.model.js";
import { notificationModel } from "../../../DB/models/notifications/Notifications.model.js";
import  companyModel  from "../../../DB/models/Company/Company.model.js";




//! create-Activity (Companies && users) !//
export const CreateActivity = asyncHandler(async (req, res, next) => {
    const { text, creatorType, companyId } = req.body;
    const userId = req.user._id;
    const files = req.files;


    const randomId = nanoid();
    let folderPath = "";
    
    let activityData = {
        text,
        ActivityType: "text",
        media: null,
        videoCover: null,
        creatorType: "user",
        CreatedBy: userId,
        addedBy: userId,
        isRepost: false
    };

  
    if (creatorType === "user") {
        folderPath = `Ycg/users/${userId}/${req.user.firstName}_${req.user.lastName}/UserActivity`;
    } 
    else if (creatorType === "Company") {
        const company = await companyModel.findOne({ _id: companyId, "Admins.user": userId });
        if (!company) return next(new Error("Company not found or access denied", 404));

        const currentAdmin = company.Admins.find(a => a.user.toString() === userId.toString());
        if (!currentAdmin || !["admin", "superAdmin"].includes(currentAdmin.role)) {
            return next(new Error("Unauthorized: Only admins can post", 403));
        }

        activityData.creatorType = "Company";
        activityData.CreatedBy = company._id;
        folderPath = `YCG/companys/${company._id}/Activities`;
    }

  
    if (!text?.trim() && (!files || Object.keys(files).length === 0)) {
        return next(new Error("Post content cannot be empty", 400));
    }
    if (files && Object.keys(files).length > 0) {
        if (files.video?.[0]) {
            const videoUpload = await cloudinary.uploader.upload(files.video[0].path, {
                folder: `${folderPath}/VideoActivitys/${randomId}`,
                resource_type: "video"
            });
            activityData.media = { secure_url: videoUpload.secure_url, public_id: videoUpload.public_id };
            activityData.ActivityType = "video";

            if (files.videoCover?.[0]) {
                const coverUpload = await cloudinary.uploader.upload(files.videoCover[0].path, {
                    folder: `${folderPath}/VideoActivitys/${randomId}/VideoCoverImage`
                });
                activityData.videoCover = { secure_url: coverUpload.secure_url, public_id: coverUpload.public_id };
            }
        } else if (files.image?.[0]) {
            const imageUpload = await cloudinary.uploader.upload(files.image[0].path, {
                folder: `${folderPath}/ImageActivitys/${randomId}`
            });
            activityData.media = { secure_url: imageUpload.secure_url, public_id: imageUpload.public_id };
            activityData.ActivityType = "image";
        }
    }


    const newPost = await ActivityModel.create(activityData);

    const cachePattern = activityData.creatorType === "Company"  ? `CompanyActivities:${activityData.CreatedBy}*`  : "Activitys:*";
    const keys = await redisClient.keys(cachePattern);
    if (keys.length > 0) await redisClient.del(keys);

    res.status(201).json({ status: "success", message: `Activity created successfully`, data: newPost });
});
//? Update-Activity (Companies && users) ?//
export const UpdateActivity = asyncHandler(async (req, res, next) => {

    const { ActivityId } = req.params;
    const { text , creatorType } = req.body;
    const userId = req.user._id;
      

 
       


     
    //  ? check if Post Description in Empty ? //
    if ((!text || text.trim().length === 0)) {
        return next(new Error("Post content cannot be empty", { cause: 400 }));
    }
    
   //? Check if Activity Exists
    const ActivityExists = await ActivityModel.findOne({_id:ActivityId });
    if(!ActivityExists){return next(new Error("Sorry, Activity not Exists"),404)}


  // TODO => For User posts
   if(creatorType === "user"){

    
    if(ActivityExists.CreatedBy.toString() !== userId.toString()){
    return next(new Error("Sorry, you are not authorized"),404)
    }

    // update Activity Text
    ActivityExists.text = text || activity.text;
    await ActivityExists.save();

    // clear cach
    const keys = await redisClient.keys("Activities:*");
    if (keys.length > 0) await redisClient.del(keys);

   }
    // ! For Company Posts
   else if(creatorType === "Company"){

    const CompanyExists = await companyModel.findOne({"Admins.user":userId})
    if (!CompanyExists) {
          return next(new Error("Company not found or access denied"),404)
    }
        
    const CurrentAdmin = await CompanyExists.Admins.find(a => a.user.toString()=== userId.toString());
    if(!CurrentAdmin || !["admin","superAdmin"].includes(CurrentAdmin.role)){
            return next(new Error("Unauthorized: Only admins can post", 403));
    }

    ActivityExists.text = text || activity.text;
    await ActivityExists.save();
      


    const keys = await redisClient.keys(`CompanyActivities:${ActivityExists.CreatedBy}`);
    if (keys.length > 0) {
    await redisClient.del(keys);
    }

   }

    res.status(200).json({  status: "success",  message: "Activity updated successfully"  });
});
//TODO: Delete-Activity (Companies && users) ?//   
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
    const CommentsCache_key =await redisClient.keys("Comments:*");
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

    
    const keys = await redisClient.keys(`CompanyActivities:${activity.CreatedBy}`);
    if (keys.length > 0) {
    await redisClient.del(keys);
    }


   }

    
    res.status(200).json({ status: "success", message: "Activity deleted successfully" });
});






//==>Like
export const ActivityToggleLike = asyncHandler(async (req, res, next) => {


    const { postId } = req.body;
    const userId = req.user._id; //Logged in User

     

    const post = await ActivityModel.findById(postId);
    if (!post) { return next(new Error("Post not found", { cause: 404 })); }

    // check if User Already liked the post
    const isLiked = post.likes.includes(userId);
    let messageContent = "";






    if (isLiked) {
        //  Unlike
        post.likes.pull(userId);
        post.LikesCount = Math.max(0, post.LikesCount - 1);

         
         
    } else {
        // to like 
        post.likes.push(userId);
        post.LikesCount += 1;

     
        if (post.CreatedBy.toString() !== userId.toString()) {

           const LikedUser = await userModel.findById(userId).select("firstName userProfileImg");
           messageContent = post.LikesCount <= 1  ? `${LikedUser.firstName} reacted to your activity`: `${LikedUser.firstName} and others reacted to your activity`;
          
           
         
           const channelName = post.CreatedBy.toString();

           MyPusher.trigger(channelName, "UserNotification", {
                UserIMG: LikedUser.userProfileImg?.public_id,
                Message: messageContent
            });
         
            
     
            

            await notificationModel.create({ recipient: post.CreatedBy, sender: userId,senderProfileImg:LikedUser.userProfileImg, type: "like", content: messageContent });
        }
            
        
    }
      
    await post.save();


    //clear cash
    const key =await redisClient.keys("Activities:*");
    if(key.length > 0) {await redisClient.del(key)}


    res.status(200).json({status: "success", message: isLiked ? "Like removed" : "Like added", likesCount: post.likes.length });
});

//==>Comment
export const addComment = asyncHandler(async (req, res, next) => {


    const { ActivityId } = req.body;
    const { text } = req.body;
    const userId = req.user._id; // Logged in User



    //Check if User add text
    if (!text || text.trim().length === 0) {return next(new Error("Comment text is required", { cause: 400 })); }

    // Check if post exists before add comment
    const post = await ActivityModel.findOne({_id:ActivityId});
    if (!post) { return next(new Error("Activity not found", { cause: 404 })); }
  
 
    
    // create Comment
    const newComment = await commentModel.create({ ActivityId, userId, text});

    // to display user data in the comment
    const commentData = await commentModel.findById(newComment._id).populate("userId", "firstName lastName userProfileImg userSubTitle");




    if (post.CreatedBy.toString() !== userId.toString()) {
    // increse Post comment count
    await ActivityModel.findByIdAndUpdate(ActivityId,{ $inc:{CommentsCount:1}},{new:true})


    // Get user data who add comment
    const CommentedUser = await userModel.findById(userId).select("firstName userProfileImg")


    const MessageContent = post.CommentsCount < 1 ? `${CommentedUser.firstName} added new Comment on you post` :`${CommentedUser.firstName} and others added new Comment on you post`;


    await MyPusher.trigger(post.CreatedBy.toString(),"newComment",{
        UserImg:CommentedUser.userProfileImg?.public_id,
        MessageContent
    })


   
    await notificationModel.create({ recipient: post.CreatedBy, sender: userId, senderProfileImg:CommentedUser.userProfileImg, type: "comment", content: MessageContent });

    }
   
    const key =await redisClient.keys("Comments:*");
    if(key.length>0) {await redisClient.del(key)}

    
    const Activiykey =await redisClient.keys("Activities:*");
    if(Activiykey.length>0) {await redisClient.del(Activiykey)}


    res.status(201).json({status: "success",message: "Comment added successfully",data: commentData});
});
export const toggleCommentLike = asyncHandler(async (req, res, next) => {


    const { commentId } = req.body;
    const userId = req.user._id; // Logged in user

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
    

     
    const key =await redisClient.keys("Comments:*");
    if(key.length>0) {await redisClient.del(key)}



    res.status(200).json({
        status: "success",
        message: isLiked ? "Like removed from comment" : "Like added to comment",
        likesCount: comment.likes.length
    });
});
export const getPostComments = asyncHandler(async (req, res, next) => {

    
    const { postId } = req.body;

    
    const CashKey=`Comments:${req.user._id}`

    const CashedData = await redisClient.get(CashKey)

    if(CashedData){
        return res.status(200).json({status:"Success",source:"Cash" ,comments:JSON.parse(CashedData) })
    }


    const comments = await commentModel.find({ postId }).populate("userId", "firstName lastName userProfileImg userSubTitle").sort({ createdAt: -1 });
     

    await redisClient.set(CashKey,JSON.stringify(comments),{EX:3000})
     


    

    res.status(200).json({status: "success",source:"DataBase", count: comments.length, data: comments});
});
export const updateComment = asyncHandler(async (req, res, next) => {
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
export const deleteComment = asyncHandler(async (req, res, next) => {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await commentModel.findById(commentId);
    if (!comment) {
        return next(new Error("Comment not found", { cause: 404 }));
    }

    // //check if user is authorized
    if (comment.userId.toString() !== userId.toString()) {
        return next(new Error("You are not authorized to delete this comment", { cause: 403 }));
    }

    await commentModel.findByIdAndDelete(commentId);

    await ActivityModel.findByIdAndUpdate(comment.ActivityId,{ $inc:{CommentsCount:-1}},{new:true})


    const key =await redisClient.keys("Comments:*");
    if(key.length>0) {await redisClient.del(key)}

    const Activiykey =await redisClient.keys("Activities:*");
    if(Activiykey.length>0) {await redisClient.del(Activiykey)}


    res.status(200).json({ status: "success", message: "Comment deleted successfully" });
});
//======



//==>Repost
export const createRepost = asyncHandler(async (req, res, next) => {


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




//======
///////////////////////////////////////////////////////////////////////////////////////////
