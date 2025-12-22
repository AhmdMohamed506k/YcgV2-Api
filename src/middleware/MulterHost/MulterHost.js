import multer from "multer";

export const validExtensions = {
  image: ["image/png", "image/jpg", "image/jpeg"],
  cv: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpg",
    "image/jpeg",
  ],
};


export const MulterHost = (customvalidtion) => {
  const storage = multer.diskStorage({});

  const fileFilter = function (req, file, cb) {
    if (customvalidtion.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error("File type not supported"), false);
  };

  const upload = multer({ storage, fileFilter });

  return upload;
};
