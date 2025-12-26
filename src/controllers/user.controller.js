import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {USer} from ""
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiReponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
    // get user detail from frontend
    const {fullname, email, username, password} = req.body;
    console.log(`userName: ${username}, fullName: ${fullname}, email: ${email}`);


    // validation of user details - not empty
    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // check if user already exists: username and email should be unique
    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "User with given username or email already exists");
    }

    // check for images, check for avatar
    console.log("req.files:", req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLoalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }

    // upload image to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLoalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar file is required");
    }

    // create user object - create entry in db
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")


    // check for user creation
    if(!createdUser){
        throw new ApiError(500, "User creation failed, please try again");
    }

    // return response
    return res.status(201).json(
        new ApiReponse(201, createdUser, "User created successfully")
    )
})

export {registerUser};