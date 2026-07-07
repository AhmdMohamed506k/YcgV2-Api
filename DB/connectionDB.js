import mongoose from "mongoose";

const connectionDB = async () => {
    return await mongoose.connect("mongodb://127.0.0.1:27017/Ycg")
        .then(() => console.log("successfully connected  :)"))
        .catch((error) => console.log("catch Error", error));





}

export default connectionDB;