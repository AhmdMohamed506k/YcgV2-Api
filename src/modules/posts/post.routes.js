import { Router } from "express";
import * as p from "./post.controller.js"
import { auth } from "../../middleware/auth/auth.js";






const router = Router();


router.get("/getPosts",p.getPosts);
router.get("/getPostsByJobFeild/:jobFeild",p.GetPostsByJobFeild);
router.get("/getPostsbyId/:id",p.GetPostsById);
router.post("/addPosts",auth, p.addpost);
router.put("/updatePost",auth , p.updatePost);
router.delete("/deletPost",auth , p.deletPost);




export default router;