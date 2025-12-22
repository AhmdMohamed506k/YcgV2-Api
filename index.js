import express  from 'express';
import connectionDB from './DB/contectionDB.js';
import cors from 'cors';
import userRouter from "./src/modules/users/user.routes.js"
import PostRouter from "./src/modules/posts/post.routes.js"
import ExperienceSectionRouter from './src/modules/sections/ExperienceSection/ExperienceSection.routes.js';
import AboutSectionRouter from './src/modules/sections/AboutSection/AboutSection.routes.js';
import 'dotenv/config'

export const app = express()

const port = process.env.port || 3000

app.use((error,req,res,next)=>{
     res.status(400).json({error})
})





app.use(express.json());



app.use(cors({origin : "*"}));


app.use("/", userRouter); 
app.use("/", ExperienceSectionRouter); 
app.use("/", AboutSectionRouter); 

app.use("/", PostRouter); 





connectionDB()

app.use('/', (req, res) => res.send('Hello World hi!'))



app.listen(port, () => console.log(`successfully connected`))

