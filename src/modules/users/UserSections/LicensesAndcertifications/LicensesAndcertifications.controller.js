import { asyncHandler } from "../../../../middleware/asyncHandler/asyncHandler.js";
import {userModel} from "../../../../../DB/models/User/UserMainModel/user.model.js"
import cloudinary from "../../../../utils/Cloudinary/Cloudinary.js";
import { LicensesAndcertificationsModel } from "../../../../../DB/models/User/UserSections/LicensesAndCertifications.model.js";
import redisClient from "../../../../utils/redisClient/redisClient.js";
import { nanoid } from "nanoid";






export const AddLicensesAndcertifications = asyncHandler(async ( req, res ,next)=>{

   
    const UserID=req.user._id;

    // check if user Exists or not
    const UserExists= await userModel.findById(UserID);
    if (!UserExists) { return next(new Error("Sorry User not Exists"),{ cause: 400 })}



    //IF user Exists Create object and put inside it the Required Informations
    const LincenseObject = {Name:req.body.Name , organization:req.body.organization ,CreatedBy:UserID};

    //if user attempted to add CertificationURL(optional) add it,and IF not dont add it
    if(req.body.CertificationURL){LincenseObject.CertificationURL =req.body.CertificationURL}
     



    // IF attempted to add lincense Image (optional) add it,and IF not dont add it
    if(req.file){
      const randomId = nanoid();

       // Upload Lincense in Cloudinary  servers
       const  {secure_url ,public_id} = await cloudinary.uploader.upload(req.file.path ,{
        folder:`Ycg/users/${UserID}/${req.user.firstName}_${req.user.lastName}/UserLicensesAndcertifications/${randomId}/LicensesAndcertifications`,
       })
        
       // put the license in the object
       LincenseObject.CertificationImage={
        secure_url ,
        public_id
       }
        

    }

    
    

     
    // Add the new Licenses into the DataBase
    const NewUserLicense= await LicensesAndcertificationsModel.create(LincenseObject);
   


    // Clear Cash
    const key= await redisClient.keys("Licenses:*");
    if(key.length >0){await redisClient.del(key)}

    
    if(!NewUserLicense){
      return  res.status(400).json("faild to add License")
    }
    res.status(200).json({status:"Success", msg:"Added successfully"})




})

export const GetUserLicenses = asyncHandler(async(req,res,next)=>{

  
    const CashKey= `Licenses:${req.user._id}`
    
    //Check if Licesnses are cashed or Not
    const CashedData= await redisClient.get(CashKey);
    if(CashedData){
       // IF Licesnses are Cashed display them
       return res.status(200).json({status:"Success",source:"Cash",UserLicencses:JSON.parse(CashedData)});

    }
   // IF Licesnses are not cashed ==> get user licesnces
    const UserLicencses = await LicensesAndcertificationsModel.find({CreatedBy:req.user._id});
    if(UserLicencses.length === 0){
        return next(new Error("Sorry you dont have Licencses yet"),{cause:400});
    }
    
    // then cash them
    await redisClient.set(CashKey,JSON.stringify(UserLicencses),"EX",300);
   
    //display Licesnses
    res.status(200).json({status:"Success",source:"DataBase",msg:"done",UserLicencses})



})

export const UpdateUserLicenseByID = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;



  //Check if License Exist or not
  const license = await LicensesAndcertificationsModel.findById(id);
  if (!license) {return next(new Error("License not found",{cause:400}))}

  // if Lincense Exists check the Ownership 
  if (license.CreatedBy.toString() !== userId.toString()) {
    return next(new Error("You are not allowed to update this license",{cause:403}))
  }
   


  // Update required fields then optional fields
    license.Name = req.body.Name;
    license.organization = req.body.organization;
    if (req.body.CertificationURL) {license.CertificationURL = req.body.CertificationURL;}




  // Replace image if provided
  if (req.file) {

    
    // Delete old image from Cloudinary servers
    if (license.CertificationImage?.public_id) {
      await cloudinary.uploader.destroy( license.CertificationImage.public_id);
    }
    const randomId = nanoid();

    // upload the new lincense Image in Cloudinary servers
    const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
    folder:`Ycg/users/${userId}/${req.user.firstName}_${req.user.lastName}/UserLicensesAndcertifications/${randomId}/LicensesAndcertifications`,

    });

    license.CertificationImage = {
      secure_url,
      public_id,
    };
  }
  

  // add the new licenses in the dataBase
  await license.save();



  // Clear cache
  const key= await redisClient.keys("Licenses:*");
  if(key.length >0){await redisClient.del(key)}


  res.status(200).json({ status: "Success",message: "License updated successfully",license,});
});

export const DeleteUserLicenseById = asyncHandler(async (req, res, next) => {

  const { id } = req.params;
  const userId = req.user._id;


  //Check if License Exist or not
  const license = await LicensesAndcertificationsModel.findById(id);
  if (!license) {
   return next(new Error("License not found",404))
  }

  // if Lincense Exists check the Ownership 
  if (license.CreatedBy.toString() !== userId.toString()) {
    return next(new Error("You are not allowed to delete this license",403))
  }

  // Delete image from Cloudinary
  if (license.CertificationImage?.public_id) {
    await cloudinary.uploader.destroy(license.CertificationImage.public_id);
  }
  
  //Delete license From Database
  await license.deleteOne();

  // Clear cache
  const key= await redisClient.keys("Licenses:*");
  if(key.length >0){await redisClient.del(key)}

  res.status(200).json({status: "Success",msg: "License deleted successfully", });
});

