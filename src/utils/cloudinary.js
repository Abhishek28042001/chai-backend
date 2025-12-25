import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        // upload file on CLoudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        // file has been uploaded
        console.log("file is uploaded on cloudinary ", response.url);
        console.log("file is uploaded on cloudinary ", response);

        return response.url;

    } catch (error) {
        // remove file from local storage
        fs.unlinkSync(localFilePath);
        return null;
    }
}