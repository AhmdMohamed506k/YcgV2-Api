import mongoose, { model, Types ,Schema} from "mongoose";




const LicensesAndcertificationsShema = new Schema({
    Name:{
        type:String,
        required:true,
    },
    organization:{
        type:String,
        required:true,
    }, 
    CertificationImage:{
    secure_url: { type: String, default: null ,},
    public_id: { type: String, default: null , },
    },
    CertificationURL:{
        type:String,
    },
    CreatedBy:{
      type: Types.ObjectId,
      ref:"user",
      required: true,
    }

});
const LicensesAndcertificationsModel = model('LicensesAndcertificationsShema' , LicensesAndcertificationsShema);
export {LicensesAndcertificationsShema ,LicensesAndcertificationsModel}