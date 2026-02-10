import { nanoid } from "nanoid";
import redisClient from "../../../utils/redisClient/redisClient.js";
import {asyncHandler} from "../../../middleware/asyncHandler/asyncHandler.js"
import cloudinary from "../../../utils/Cloudinary/Cloudinary.js"
import { ActivityModel } from "../../../../DB/models/User/UserActivity/UserActivity.model.js";
import { commentModel } from "../../../../DB/models/User/UserActivity/Comments.model.js";



//////////////////////////////////Basic-Activity-Operations(Create - delete - update - Display)//////////////////////////////////////
export const createTextActivity = asyncHandler(async (req, res, next) => {
    const { text } = req.body;
    const userId = req.user._id;

 
    if (!text || text.trim().length === 0) {
        return next(new Error("Post content cannot be empty", { cause: 400 }));
    }

   
    const newPost = await ActivityModel.create({ 
        text,
        ActivityType: "text", 
        CreatedBy: userId,
        isRepost: false,
    });



    //clear cash
    const key =await redisClient.keys("Activitys:*");
    if(key.length>0) {await redisClient.del(key)}

    res.status(201).json({ status: "success", message: "Text post created successfully", data: newPost });
});
export const createImageActivity = asyncHandler(async (req, res, next) => {
    
    const { text } = req.body;
    const userId = req.user._id;

    // Check IF user Uploaded an image
    if (!req.file) {
        return next(new Error("Please upload an image file", { cause: 400 }));
    }
    
    const randomId = nanoid()

    //upload Activity Image to Cloudnary servers
    const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
        folder: `Ycg/users/${userId}/${req.user.firstName}_${req.user.lastName}/UserActivity/ImageActivitys/${randomId}`,
    });

    //Add Activity inside the DataBase
    const newPost = await ActivityModel.create({text,
        ActivityType: "image",
        media: { secure_url, public_id },
        CreatedBy: userId,
        isRepost: false 
    });
     

    //clear cash
    const key =await redisClient.keys("Activitys:*");
    if(key.length>0) {await redisClient.del(key)}

    res.status(201).json({status: "success", message: "Image Activity created successfully",data: newPost});
});
export const createVideoActivity = asyncHandler(async (req, res, next) => {


    const { text } = req.body;
    const userId = req.user._id;
    const files = req.files; // multer fields

    //Check if Video Exists
    if (!files?.video || !files.video[0]) {
        return next(new Error("Video file is required", { cause: 400 }));
    }
    
    const randomId = nanoid()


    //Upload Video in Cloudinary Server
    const videoUpload = await cloudinary.uploader.upload(files.video[0].path, {
        folder: `Ycg/users/${userId}/${req.user.firstName}_${req.user.lastName}/UserActivity/VideoActivitys/${randomId}`,
        resource_type: "video" 
    });



    // upload video Cover image if User attempted  to Upload it
    let videoCoverData = null;
    if (files?.cover && files.cover[0]) {
        const coverUpload = await cloudinary.uploader.upload(files.cover[0].path, {
          folder: `Ycg/users/${userId}/${req.user.firstName}_${req.user.lastName}/UserActivity/VideoActivitys/${randomId}/VideoCoverImage`
        });
        videoCoverData = {
            secure_url: coverUpload.secure_url,
            public_id: coverUpload.public_id
        };
    }

    //Add Post inside the DataBase
    const newPost = await ActivityModel.create({
        text,
        ActivityType: "video",
        media: { secure_url: videoUpload.secure_url, public_id: videoUpload.public_id }, 
        videoCover: videoCoverData,
        CreatedBy: userId,
        isRepost: false 
    });



    //clear cash
    const key =await redisClient.keys("Activitys:*");
    if(key.length>0) {await redisClient.del(key)}


    res.status(201).json({ status: "success",message: "Video Activity created successfully", data: newPost });
});


export const getHybridFeed = asyncHandler(async (req, res, next) => {



    const userId = req.user._id;


    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;




    // 1-Get User following IDs
    const myFollowing = await followModel.find({ followerId: userId }).distinct("followingId");
    const authorIds = [...myFollowing, userId];


     
    const Cashkey = `Activities:${userId}:page:${page}`;
    const CashedData = await redisClient.get(Cashkey);

    if(CashedData){

       return res.status(200).json({status:"Success",source:"Cash",data:JSON.parse(CashedData)});

    }

 





    // 2. bring in Activitys from User inner circle
    let posts = await ActivityModel.find({ CreatedBy: { $in: authorIds } }).sort({ createdAt: -1 }).skip(skip).limit(limit)
    .populate("CreatedBy", "firstName lastName userProfileImg userSubTitle")
    .populate({path: "originalActivity",populate: { path: "CreatedBy", select: "firstName lastName userProfileImg" }});





    //3.If user Following Activitys are little continue Displaying Globle Activitys
    if (posts.length < limit) {

        const remainingLimit = limit - posts.length;
        const excludedIds = posts.map(p => p._id); // To make sure not repeat the same posts

        const globalPosts = await ActivityModel.find({


            _id: { $nin: excludedIds }, // To exclude the Posts that displayed in the past
            CreatedBy: { $nin: authorIds } // to get people who's are outside following circle


        }).sort({ createdAt: -1 }).limit(remainingLimit)
        .populate("CreatedBy", "firstName lastName userProfileImg userSubTitle")
        .populate({ path: "originalActivity",
            populate: { path: "CreatedBy", select: "firstName lastName userProfileImg" }
        });

        posts = [...posts, ...globalPosts];
    }
     

    await redisClient.set(Cashkey,JSON.stringify(posts),{EX:3000})



    res.status(200).json({status: "success", results: posts.length,data: posts});
});














/////////////////////Activitys-Operations(Like-Comment-Repost)/////////////////////////////
//==>Like
export const ActivityToggleLike = asyncHandler(async (req, res, next) => {
    const { postId } = req.body;
    const userId = req.user._id;

     

    const post = await ActivityModel.findById(postId);
    if (!post) {
        return next(new Error("Post not found", { cause: 404 }));
    }

    // check if User Already liked the post
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
        // if User Liked post and wants to Unlike
        post.likes.pull(userId);
    } else {
        // if User Unliked post by mistake and he wants to like Again
        post.likes.push(userId);
    }

    await post.save();

    res.status(200).json({status: "success", message: isLiked ? "Like removed" : "Like added", likesCount: post.likes.length });
});
//======


//==>Comment
export const addComment = asyncHandler(async (req, res, next) => {


    const { ActivityId } = req.body;
    const { text } = req.body;
    const userId = req.user._id;

    //Check if User add text
    if (!text || text.trim().length === 0) {
        return next(new Error("Comment text is required", { cause: 400 }));
    }

    // Check if post exists before add comment
    const post = await ActivityModel.findOne({_id:ActivityId});
    if (!post) {
   
        
        return next(new Error("Activity not found", { cause: 404 }));
    }
  
 
    
    // create Comment
    const newComment = await commentModel.create({ ActivityId, userId, text});

    // to display user data in the comment
    const commentData = await commentModel.findById(newComment._id).populate("userId", "firstName lastName userProfileImg userSubTitle");
    


    const key =await redisClient.keys("Comments:*");
    if(key.length>0) {await redisClient.del(key)}




    res.status(201).json({status: "success",message: "Comment added successfully",data: commentData});
});
export const toggleCommentLike = asyncHandler(async (req, res, next) => {
    const { commentId } = req.body;
    const userId = req.user._id;

    const comment = await commentModel.findById(commentId);
    if (!comment) {
        return next(new Error("Comment not found", { cause: 404 }));
    }

    const isLiked = comment.likes.includes(userId);

    if (isLiked) {
        comment.likes.pull(userId);
    } else {
        comment.likes.push(userId);
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

    res.status(200).json({
        status: "success",
        message: "Comment updated successfully",
        data: comment
    });
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


    const key =await redisClient.keys("Comments:*");
    if(key.length>0) {await redisClient.del(key)}

    res.status(200).json({
        status: "success",
        message: "Comment deleted successfully"
    });
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
     


    const key =await redisClient.keys("Activitys:*");
    if(key.length>0) {await redisClient.del(key)}

    res.status(201).json({status: "success",message: "Activity reposted successfully", data: fullRepostData});
});




//======
///////////////////////////////////////////////////////////////////////////////////////////
