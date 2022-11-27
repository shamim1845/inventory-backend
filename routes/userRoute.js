const express = require("express");
const { registerUser, loginUser, logoutUser, getUser, loginStatus, updateUser, changePassword, forgotPassword, resetPassword } = require("../controllers/userController");
const { authenticated } = require("../middleWare/authenticated");

const router = express.Router();


router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);
router.get("/getuser", authenticated, getUser);
router.get("/loggedin", loginStatus);
router.patch("/updateuser", authenticated, updateUser);
router.patch("/changepassword", authenticated, changePassword);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resetToken", resetPassword);

module.exports = router;