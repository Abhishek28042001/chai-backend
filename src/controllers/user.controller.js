import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
    // console.log("BODY:", req.body);
    // console.log("FILES:", req.files);


    // STEP 1: get user detail from frontend
    const {fullName, email, username, password} = req.body;
    console.log(`userName: ${username}, fullName: ${fullName}, email: ${email}`);


    // STEP 2: validation of user details - not empty
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // STEP 3: check if user already exists: username and email should be unique
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "User with given username or email already exists");
    }

    // STEP 4: check for images, check for avatar
    console.log("req.files:", req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    // console.log(`userController.js: avatarLocalPath: ${avatarLocalPath}`);

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }


    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }

    // STEP 5: upload image to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    console.log("user.controller.js file ");
    console.log(`avatar: ${avatar}\n coverImage: ${coverImage}`);

    if(!avatar){
        throw new ApiError(400, "Avatar file is required");
    }

    // STEP 6: create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // STEP 7: remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")


    // STEP 8: check for user creation
    if(!createdUser){
        throw new ApiError(500, "User creation failed, please try again");
    }

    // STEP 9: return response
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User created successfully")
    )
})

export {registerUser};