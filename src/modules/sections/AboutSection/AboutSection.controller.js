import { userModel } from "../../../../DB/models/User/UserMainModel/user.model.js";
import { asyncHandler } from "../../../middleware/asyncHandler/asyncHandler.js";




export const GetSpecificUserAboutSection = asyncHandler(async(req,res,next)=>{

    
    const user = await userModel.findById(req.user._id);
    if (!user) return next(new Error("User not found", 400));

    const UserAboutSection = user.userSections.userAboutSection;
    
    if(UserAboutSection.length == 0){
      return res.status(200).json({msg:"Sorry user doesn't has data in this section"})
    }
    

     res.status(200).json({UserAboutSection})
})
export const AddNewUserAboutSection = asyncHandler(async (req, res, next) => {

    const { userDescription } = req.body;
    


  

    // Initialize section if it doesn't exist
    if (!req.user.userSections.userAboutSection) {
        await userModel.findByIdAndUpdate(req.user._id, { $set: { 'UserSections.UseraboutSection': [] } }, { new: true });
    }
     




    if(req.user.userSections.userAboutSection.length < 1){
     const updatedUser = await userModel.findByIdAndUpdate(req.user._id, { $push: { 'userSections.userAboutSection': {userDescription , CreatedBy:req.user._id} } }, { new: true });


     if (!updatedUser) return next(new Error("Failed to add experience", 400));
     res.status(200).json({ msg: "added successfully" });


     
    }else{
       res.status(400).json({ msg: "Sorry you can not add more then 1 section" });
    }
      

  


})
export const updatAboutSectionData = asyncHandler(async (req, res, next) => {
    const { _id } = req.params;
    const { userDescription } = req.body;


 



    const aboutData = req.user.userSections.userAboutSection.find(exp => exp._id);

    if (!aboutData) { 
    return next(new Error("Sorry, you cant edit now :(", 400));
    
    }
     const result = await userModel.findOneAndUpdate( {"userSections.userAboutSection._id": _id,},{$set: {"userSections.userAboutSection.$[elem].userDescription": userDescription,}},
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

  
    const aboutSections = req.user.userSections.userAboutSection;

   
    const sectionIndex = aboutSections.findIndex(section => section._id.toString() === _id);
    if (sectionIndex === -1) {
        return next(new Error("Section not found or you do not have permission to delete it."));
    }


    aboutSections.splice(sectionIndex, 1);
    await req.user.save();

    res.status(200).json({ msg: "Deleted successfully" });

})