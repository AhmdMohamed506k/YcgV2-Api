
import nodemailer from "nodemailer";




  const transporter =  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "2the2killer2@gmail.com",
      pass: "xadornkrhdvqgebu"
    }, tls: {
      rejectUnauthorized :false
    }
  });
  
  
  export const sendEmail = async (to, subject, html) => {
    const info = await transporter.sendMail({
      from: '"Ycg_Company" ygcegcompany@gmail.com',
      to: to ? to : "",
      subject: subject ? subject : "Hello",
      text: "Hello world?",
      html: html ? html : "Hi"
    })
 
 

    


}
