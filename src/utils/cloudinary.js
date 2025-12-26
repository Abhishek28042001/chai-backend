import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


// seeing the clodinary config
// console.log("Cloudinary ENV:", {
//   cloud: process.env.CLOUDINARY_CLOUD_NAME,
//   key: process.env.CLOUDINARY_API_KEY,
//   secret: process.env.CLOUDINARY_API_SECRET ? "LOADED" : "MISSING"
// });


const uploadOnCloudinary = async (localFilePath) => {
    try {
        console.log(`cloudninary.js: localPath: ${localFilePath}`);

        if(!localFilePath) {
            return null;
        }

        console.log("xxxx");
        // STEP 1: upload file on CLoudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        console.log("sds");

        // STEP 2: file has been uploaded
        console.log("URL of file is uploaded on cloudinary ", response.url);
        console.log("Response of file is uploaded on cloudinary ", response);

        fs.unlinkSync(localFilePath);  // remove file from local storage
        return response;

    } catch (error) {
        // STEP 3: remove file from local storage
        // console.log("clodinary.js catch block");
        console.log(`Error while uploading on cloudinary: ${error}`);

        fs.unlinkSync(localFilePath);
        return null;
    }
}

export {uploadOnCloudinary};