import { Router } from "express";
import { registerUser, loginUser, logoutUser,
        refreshAccessToken, changeCurrentPassword,
        getCurrentUser, updateAccountDetails, updateUserAvatar,
        updateUserCoverImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { verifiyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);

router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifiyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifiyJWT, changeCurrentPassword)
router.route("/current-user").get(verifiyJWT, getCurrentUser)
router.route("/update-account").patch(verifiyJWT, updateAccountDetails)
router.route("/avatar").patch(verifiyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifiyJWT, upload.single("coverImage"), updateUserCoverImage)
router.route("/c/:username").get(verifiyJWT, getUserChannelProfile)
router.route("/history").get(verifiyJWT, getWatchHistory)

export default router;