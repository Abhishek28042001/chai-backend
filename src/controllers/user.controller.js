import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async(userId) =>{
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return {accessToken, refreshToken};
    }
    catch (error){
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
}

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
});

const loginUser = asyncHandler( async (req, res) => {
    // get user detail
    // username, password from req.body
    // find the user
    // password match
    // access and refresh token
    // send cookies

    const {email, username, password} = req.body;

    if(!username && !email){
        throw new ApiError(400, "Username or email are required");
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid credentials");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refereshToken");

    const option = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
        new ApiResponse(
            200, {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully"
        )
    )
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const option = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "User logged Out"))
});

const refreshAccessToken = asyncHandler( async (req, res) => {
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const option = {
            httpOnly: true,
            secure: true
        }

        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)

        return res
        .status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", newRefreshToken, option)
        .json(
            new ApiResponse(200,
                {
                    accessToken,
                    refreshToken: newRefreshToken,
                    message: "Access token refreshed"
                }
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

export {registerUser, loginUser, logoutUser, refreshAccessToken};