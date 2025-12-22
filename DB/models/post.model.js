
import mongoose, { Schema ,model} from "mongoose";

const PostsSchema = new Schema({
    PostTitle: {                              
        type: String,
        required:true

    },
    PostDescription: {                              
        type: String,
        required:true

    },
    seniorityLevel: {
        type: String,
        enum:["Junior","Mid-Level","Senior","Team-Lead","CTO"],
      

    },
    jobFeild: {
        type: String,
        required:true
    },
    Jobaddress : {                              
        type: String,
        required:true

    },
    ownerMobile : {                              
        type: String,
      

    },
    ownerName : {                              
        type: String,
      

    },
    Skills : {                              
        type: String,
        required:true

    },
    PostOwnerId:{
        type: String,
       
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "user",
       
  
       
    }
   

   


})

const PostsModel = model("Posts", PostsSchema);

export default PostsModel;