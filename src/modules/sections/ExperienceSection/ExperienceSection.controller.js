import { nanoid } from "nanoid/non-secure";
import { userModel } from "../../../../DB/models/User/UserMainModel/user.model.js";
import { experienceSectionModel } from "../../../../DB/models/User/UserSections/ExperienceSection.model.js";
import { asyncHandler } from "../../../middleware/asyncHandler/asyncHandler.js";
import { customAlphabet } from "nanoid";
import mongoose from "mongoose";



export const GetSpecificUserExperienc = asyncHandler(async(req,res,next)=>{

    
    const user = await userModel.findById(req.user._id);
    if (!user) return next(new Error("User not found", 400));

    const UserExperience = user.UserSections.userExperienceSection;
     if(UserExperience.length == 0){
      return res.status(200).json({msg:"Sorry user doesn't has data in this section"})
    }
    

    

    return res.status(200).json({UserExperience})
})


export const newUserExperiencSection = asyncHandler(async (req, res, next) => {

    const { Experiencetype, JobTitle, CompanyName, StartFrom, EndingIn, StealWorking } = req.body;


    if (StartFrom > EndingIn) {
        return res.status(400).json({ msg: "Start date must be before end date" })
    }
    if (StealWorking !== "false") {






        const ObjectData = {  Experiencetype, JobTitle, CompanyName, StealWorking, CreatedBy: req.user._id };

        const user = await userModel.findById(req.user._id);
        if (!user) return next(new Error("User not found", 400));

        const sectionPath = "UserSections.userExperienceSection";


        // Initialize section if it doesn't exist
        if (!user.UserSections.userExperienceSection) {

            await userModel.findByIdAndUpdate(req.user._id, { $set: { [sectionPath]: [] } }, { new: true });
        }

        // Push experience data
        const updatedUser = await userModel.findByIdAndUpdate(req.user._id, { $push: { [sectionPath]: ObjectData } }, { new: true });

        if (!updatedUser) return next(new Error("Failed to add experience", 400));
        res.status(200).json({ msg: "Experience added successfully" });
    } else {

    


        const ObjectData = {  Experiencetype, JobTitle, CompanyName, StartFrom, EndingIn, StealWorking, CreatedBy: req.user._id };

        const user = await userModel.findById(req.user._id);
        if (!user) return next(new Error("User not found", 400));

        const sectionPath = "UserSections.userExperienceSection";

        // Initialize section if it doesn't exist
        if (!user.UserSections?.userExperienceSection) { await userModel.findByIdAndUpdate(req.user._id, { $set: { [sectionPath]: [] } }, { new: true }); }

        // Push experience data
        const updatedUser = await userModel.findByIdAndUpdate(req.user._id, { $push: { [sectionPath]: ObjectData } }, { new: true });

        if (!updatedUser) return next(new Error("Failed to add experience", 400));
        res.status(200).json({ msg: "Experience added successfully" });
    }

})

export const updatExperiencData = asyncHandler(async (req, res, next) => {
    const { _id } = req.params;
    const { Experiencetype, JobTitle, CompanyName, StartFrom, EndingIn, StealWorking } = req.body;


    const userExist = await userModel.findById(req.user._id);
    if (!userExist) { return next(new Error("Sorry, only the owner can edit section data", 400)); }

    const experience = userExist.UserSections.userExperienceSection.find(exp => exp._id.toString() == _id);

    if (experience.StealWorking = "true" && StealWorking == "false") {



        const result = await userModel.findOneAndUpdate(
            {
                "UserSections.userExperienceSection._id": _id,

            },
            {
                $set: {
                    "UserSections.userExperienceSection.$[elem].ExperienceType": Experiencetype,
                    "UserSections.userExperienceSection.$[elem].JobTitle": JobTitle,
                    "UserSections.userExperienceSection.$[elem].CompanyName": CompanyName,
                    "UserSections.userExperienceSection.$[elem].StartFrom": StartFrom,
                    "UserSections.userExperienceSection.$[elem].EndingIn": EndingIn,
                    "UserSections.userExperienceSection.$[elem].StealWorking": StealWorking
                }
            },
            {
                arrayFilters: [
                    {
                        "elem._id": new mongoose.Types.ObjectId(_id)
                    }
                ],
                new: true // return the updated doc
            }
        );



        if (!result) {
          return  next(new Error("sorry can not update now"))
        } else {
           return res.status(200).json({ message: "Experience updated successfully",});
        }

    } if (experience.StealWorking = "true" && StealWorking == "true") {

        const result = await userModel.findOneAndUpdate(
            {
                "UserSections.userExperienceSection._id": _id,

            },
            {
                $set: {
                    "UserSections.userExperienceSection.$[elem].ExperienceType": Experiencetype,
                    "UserSections.userExperienceSection.$[elem].JobTitle": JobTitle,
                    "UserSections.userExperienceSection.$[elem].CompanyName": CompanyName,
                    "UserSections.userExperienceSection.$[elem].StealWorking": StealWorking
                }
            },
            {
                arrayFilters: [
                    {
                        "elem._id": new mongoose.Types.ObjectId(_id)
                    }
                ],
                new: true // return the updated doc
            }
        );

        
        if (!result) {
          return  next(new Error("sorry can not update now"))
        } else {
           return res.status(200).json({ message: "Experience updated successfully",});
        }






    } if (experience.StealWorking = "false" && StealWorking == "true") {


        const result = await userModel.findOneAndUpdate(
            {
                "UserSections.userExperienceSection._id": _id,

            },
            {
                $set: {
                    "UserSections.userExperienceSection.$[elem].ExperienceType": Experiencetype,
                    "UserSections.userExperienceSection.$[elem].JobTitle": JobTitle,
                    "UserSections.userExperienceSection.$[elem].CompanyName": CompanyName,
                    "UserSections.userExperienceSection.$[elem].StealWorking": StealWorking
                }
            },
            {
                arrayFilters: [
                    {
                        "elem._id": new mongoose.Types.ObjectId(_id)
                    }
                ],
                new: true // return the updated doc
            }
        );


        if (!result) {
          return  next(new Error("sorry can not update now"))
        } else {
           return res.status(200).json({ message: "Experience updated successfully",});
        }

    } else if (experience.StealWorking = "false" && StealWorking == "false") {







        const result = await userModel.findOneAndUpdate(
            {
                "UserSections.userExperienceSection._id": _id,

            },
            {
                $set: {
                    "UserSections.userExperienceSection.$[elem].ExperienceType": Experiencetype,
                    "UserSections.userExperienceSection.$[elem].JobTitle": JobTitle,
                    "UserSections.userExperienceSection.$[elem].CompanyName": CompanyName,
                    "UserSections.userExperienceSection.$[elem].StartFrom": StartFrom,
                    "UserSections.userExperienceSection.$[elem].EndingIn": EndingIn,
                    "UserSections.userExperienceSection.$[elem].StealWorking": StealWorking
                }
            },
            {
                arrayFilters: [
                    {
                        "elem._id": new mongoose.Types.ObjectId(_id)
                    }
                ],
                new: true // return the updated doc
            }
        );


        if (!result) {
          return  next(new Error("sorry can not update now"))
        } else {
           return res.status(200).json({ message: "Experience updated successfully",});
        }














    }


})


export const DeletUserExperienceSection = asyncHandler(async (req, res, next) => {
    const { _id } = req.params;

    const user = await userModel.findById(req.user._id);
    if (!user) {
        return next(new Error("User not found."));
    }

    const Experience = user.UserSections.userExperienceSection;

    // Check if section exists
    const sectionIndex = Experience.findIndex(section => section._id.toString() === _id);
    if (sectionIndex === -1) {
        return next(new Error("Section not found or you do not have permission to delete it."));
    }

    // Remove section from array
    Experience.splice(sectionIndex, 1);

    // Save the user document after modification
    await user.save();

    res.status(200).json({ msg: "Deleted successfully" });

})
