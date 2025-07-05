// cloudinary.js
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDIANARY_CLOUD_NAME,
  api_key: process.env.CLOUDIANARY_API_KEY,
  api_secret: process.env.CLOUDIANARY_API_SECRET,
});

export default cloudinary;
