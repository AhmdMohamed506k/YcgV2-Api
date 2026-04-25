







//==> view_Operations
export const recordProfileView = asyncHandler(async(req,res,next)=>{

   const viewerId = req.user._id.toString(); //Logged in user
    const { profileId } = req.body; // watched profile


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


export const getMyViewers = asyncHandler(async (req,res,next)=>{

  const userId = req.user._id;//Logged in user

  const viewers = await viewModel.find({ profileId: userId }).populate("viewerId", "firstName lastName userProfileImg userSubTitle").sort({ createdAt: -1 }).limit(50); 

  
  
  const cleanedViewers = viewers.map(v => ({ visitor: v.viewerId, viewedAt: v.createdAt }));

  res.status(200).json({ status: "success", count: cleanedViewers.length,data: cleanedViewers});

});

