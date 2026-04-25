
//==> Follow_Operations
export const followUser = asyncHandler(async(req,res,next)=>{


    const followerId = req.user._id; //LoggedIn User
    const { followingId } = req.body;

    if (followerId.toString() === followingId) {
      return next(new Error("You cannot follow yourself",400))
    }

    
    const targetUser = await userModel.findById(followingId);
    if (!targetUser) {
      return next(new Error("User not found",404))
    }

   
    const existingFollow = await followModel.findOne({ followerId, followingId });
    if (existingFollow) { return next(new Error("You are already following this user",400))}


    await followModel.create({ followerId, followingId });
    
  



    res.status(200).json({ status: "success", message: "User followed successfully" });
});

export const unfollowUser = asyncHandler(async(req,res,next)=>{

  const followerId = req.user._id;//LoggedIn User
  const { followingId } = req.body;

   
  const result = await followModel.findOneAndDelete({ followerId, followingId });

  if (!result) {
     return next(new Error("You are not following this user",400))
  }

  res.status(200).json({ status: "success", message: "User unfollowed successfully" });
});