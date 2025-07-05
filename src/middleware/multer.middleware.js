import multer from "multer";
import cloudinary from "../utils/cloudianary.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// 📦 Set up Multer Storage with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "level-quest-images", // Folder name in Cloudinary
      allowed_formats: ["jpg", "png", "jpeg"],
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
    };
  },
});

const upload = multer({ storage });

export default upload;
