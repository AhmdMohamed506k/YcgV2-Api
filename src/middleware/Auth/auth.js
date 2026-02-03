
import jwt, { decode } from "jsonwebtoken";
import {userModel} from "../../../DB/models/User/UserMainModel/user.model.js";


export const auth = async (req, res, next) => {
    const { token } = req.headers;



    //Check if Token is valid
    if (!token) { return  res.status(400).json({ msg: "Sorry token not Exist" });}
    
    const decoded = jwt.verify(token, process.env.tokenKey);//Check if Decoding
    
    
    
   
      
     
   
    const user = await userModel.findOne({ email: decoded.email});
    

    if (!user ) { return res.status(400).json({ msg: "you are not authorised" });}
    req.user = user
    next()
}

