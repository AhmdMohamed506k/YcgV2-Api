
import mongoose from "mongoose";
import PostsModel from "../../../DB/models/post.model.js";
import {userModel} from "../../../DB/models/User/UserMainModel/user.model.js";
import jwt, { decode } from "jsonwebtoken";






export const getPosts = async (req, res, next) =>{
  try {
  
      const posts = await PostsModel.find()
      
    
    
      res.status(200).json(posts)

  
  }
  catch (err) {
     console.log("catch Error",err);
 }

}




export const GetPostsByJobFeild = async (req,res,next)=>{
  try{
     const {jobFeild}=req.params
     
     const posts = await PostsModel.find({jobFeild})
      
    
      
     res.status(200).json({msg:"done",posts})
    

    
  
     
     

  }catch (err){
    console.log("err",err);
    
  }
  
}
export const GetPostsById = async (req,res,next)=>{
  try{
     const {id}=req.params
     
     const post = await PostsModel.findById(id)
      
     if(post != 0 ){
      
      return res.status(200).json({msg:"done",post})
     }else{
      res.status(400).json("invalid Id")

     }

    
  
     
     

  }catch (err){
    console.log("err",err);
    
  }
  
}



export const addpost = async (req, res, next) =>{
    
 
    
  const  {PostTitle, PostDescription, seniorityLevel, jobFeild, Skills ,Jobaddress} = req.body;
 

  const user= await userModel.findOne({ _id: req.user._id, status: "online" });
  
  if (!user) {
  return res.status(400).json({ msg: "sorry you cant Add right now :(" });
  }


  const post = await PostsModel.create({PostTitle, PostDescription,Jobaddress, seniorityLevel, jobFeild, Skills,ownerMobile:req.user.mobileNumber,ownerName:req.user.firstName + req.user.lastName ,PostOwnerId:req.user._id });

  res.status(200).json({msg:"done",post})
 
}
export const updatePost = async (req, res, next) =>{
    
  
  const {PostTitle, PostDescription, seniorityLevel, jobFeild, Skills} = req.body;
    

 
    

    const postOwner = await PostsModel.findOne({owner :req.user._id});
    if (!postOwner) {
      return res.status(400).json("sorry user only can update this post")
    }
 
    
    const postid = await PostsModel.findById({_id :postOwner._id});
    if (!postid) {
      return res.status(400).json("sorry user only can update this post")
    }

    const post = await PostsModel.findOneAndUpdate({ _id :postid}, {PostTitle, PostDescription, seniorityLevel, jobFeild, Skills} ,{new:true} )
    res.status(200).json({msg:"done",post})

  


}
export const deletPost = async (req, res, next) =>{

  const {id}=req.headers;
  

    
  const postid = await PostsModel.findById(id);
  if (!postid) {
    return res.status(400).json("invalid Id")
  }

  await PostsModel.deleteOne({ _id :postid},{new:true} )
  res.status(200).json({msg:"deleted successfully"})
}
