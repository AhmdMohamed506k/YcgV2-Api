import multer from "multer";

export const validExtensions = {
  image: [
     "image/png",
     "image/jpg", 
     "image/jpeg"
  ],
  media: [
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ],
  cv: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpg",
    "image/jpeg",
  ],
};


export const MulterHost = (customvalidtion = []) => {



  const storage = multer.diskStorage({});

  const fileFilter = (req, file, cb) => {

    
    if (customvalidtion.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error("File type not supported"), false);
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB
    },
  });
};
