import { nanoid } from "nanoid/non-secure";
import { userModel } from "../../../../DB/models/User/UserMainModel/user.model.js";
import { asyncHandler } from "../../../middleware/asyncHandler/asyncHandler.js";
import { customAlphabet } from "nanoid";
import mongoose from "mongoose";



export const GetSpecificUserAboutSection = asyncHandler(async(req,res,next)=>{

    
    const user = await userModel.findById(req.user._id);
    if (!user) return next(new Error("User not found", 400));

    const UserAboutSection = user.UserSections.UseraboutSection;
    
    if(UserAboutSection.length == 0){
      return res.status(200).json({msg:"Sorry user doesn't has data in this section"})
    }
    

     res.status(200).json({UserAboutSection})
})


export const newUserAboutSection = asyncHandler(async (req, res, next) => {

    const { userDescription } = req.body;
    


  
    const user = await userModel.findById(req.user._id);
    if (!user) return next(new Error("User not found", 400));

   


    // Initialize section if it doesn't exist
    if (!user.UserSections.UseraboutSection) {

        await userModel.findByIdAndUpdate(req.user._id, { $set: { 'UserSections.UseraboutSection': [] } }, { new: true });
    }
     
    if(user.UserSections.UseraboutSection.length < 1){
        
     const updatedUser = await userModel.findByIdAndUpdate(req.user._id, { $push: { 'UserSections.UseraboutSection': {userDescription , CreatedBy:req.user._id} } }, { new: true });
     if (!updatedUser) return next(new Error("Failed to add experience", 400));
     res.status(200).json({ msg: "added successfully" });


     
    }else{
       res.status(400).json({ msg: "Sorry you can not add more then 1 section" });
    }
      

  


})

export const updatAboutSectionData = asyncHandler(async (req, res, next) => {
    const { _id } = req.params;
    const { userDescription } = req.body;


    const userExist = await userModel.findById(req.user._id);
    if (!userExist) { return next(new Error("Sorry, only the owner can edit section data", 400)); }



    const aboutData = userExist.UserSections.UseraboutSection.find(exp => exp._id);

    if (!aboutData) { 
    return next(new Error("Sorry, you cant edit now :(", 400));
    
    }
     const result = await userModel.findOneAndUpdate( {"UserSections.UseraboutSection._id": _id,},{$set: {"UserSections.UseraboutSection.$[elem].userDescription": userDescription,}},
            {
                arrayFilters: [
                    {
                        "elem._id": _id
                    }
                ],
                new: true // return the updated doc
            }
        );
  


      res.status(200).json({msg:"Updated successfully"})


})

export const DeletUserAboutSection = asyncHandler(async (req, res, next) => {
    const { _id } = req.params;

    const user = await userModel.findById(req.user._id);
    if (!user) {
        return next(new Error("User not found."));
    }

    const aboutSections = user.UserSections.UseraboutSection;

    // Check if section exists
    const sectionIndex = aboutSections.findIndex(section => section._id.toString() === _id);
    if (sectionIndex === -1) {
        return next(new Error("Section not found or you do not have permission to delete it."));
    }

    // Remove section from array
    aboutSections.splice(sectionIndex, 1);

    // Save the user document after modification
    await user.save();

    res.status(200).json({ msg: "Deleted successfully" });

})