const cloudinary = require('cloudinary')
const router = require("express").Router();
const User = require("../models/User");
const Token = require("../models/token");
const multerConfig = require("../utils/multer");
const cloud = require('../utils/cloudinaryConfig');
const nodemailer = require("nodemailer");
const fs = require("fs");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const verify = require("../utils/verfiy");
router.get("/:id/verify/:token/", async (req, res) => {
  try {
    console.log("verfiy")
    const user = await User.findById(req.params.id);
    if (!user) return res.send({valideUrl:false, message: "Invalid link" });
    console.log(user)
    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    console.log(token);
    if (!token) return res.send({valideUrl:false, message: "Invalid link" });

    user.verified = true;
    await user.save();
    console.log(user);

    await token.deleteOne({ _id: token._id });
    const usertoken = user.generateAuthToken();
    res.send({valideUrl:true, message: "Email verified successfully", user, token:usertoken });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

router.post("/forget-password", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return res.send({
        type: "error",
        message: "no user found with this email",
      });
    console.log(req.body.email);
    const token = await new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    }).save();
    const url = `${process.env.CLIENT_URL}/users/${user.id}/reset-password/${token.token}`;
    // Define the actual link
    const context = {
      name: user.username,
      link: url,
    };
    await sendEmail(
      req.body.email,
      "reset password",
      "forget_password",
      context
    );
    res.send({ message: "Email verified successfully" });
  } catch (error) {
    console.log(error);
    res.send({ message: "Internal Server Error" });
  }
});
router.get("/:id/reset-password/:token/", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    if (!user || !token) {
      return res.send({ access: false });
    }
    res.send({ access: true, name: user.username });
  } catch (error) {
    console.log(error);
    res.status(500).send({ access: false });
  }
});
router.post("/:id/reset-password/:token/", async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.send({ type: "error", message: "Invalid link" });

    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    console.log(token);
    if (!token) return res.send({ type: "error", message: "Invalid link" });
    if (!password || !confirmPassword) {
      return res.send({ type: "error", message: "Every field must be filled" });
    }
    if (password !== confirmPassword) {
      return res.send({
        type: "error",
        message: "Your password does not match the confirmation password",
      });
    }
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(password, salt);
    user.password = hashPassword;
    await user.save();
    console.log(user);

    await token.deleteOne({ _id: token._id });

    res.send({ type: "success", message: "password reset  successfully" });
  } catch (error) {
    console.log(error);
    res.send({ type: "error", message: "Internal Server Error" });
  }
});
router.get("/search/:q", verify, async (req, res) => {
  let usersList = [];
  let users = [];
  if (req.params.q == "friends") {
    console.log("friends");
    usersList = await User.find({
      _id: { $in: req.user.friends },
    });
    console.log(usersList);
  } else {
    const terms = req.params.q.trim();
    usersList = await User.find({
      username: { $regex: new RegExp(terms, "i") },
    }).select("-password");
  }
  for (let u of usersList) {
    users.push({
      username: u.username,
      image: u.image,
      id: u.id,
      mes: 0,
      oreder: "",
    });
  }
  res.send({ users });
});
router.post("/editUsername/:id", verify, async (req, res) => {
  const data = {};

  const { username } = req.body;

  try {
    let authUser = req.user;
    if (authUser.id == req.params.id) {
      authUser.username = username;
      await authUser.save();
      data.alert = `Your user name has been successfully modified`;
      data.type = "success";
      data.user = authUser;
    } else {
      data.alert = `You are not allowed to edit user name`;
      data.type = "error";
      data.user = authUser;
    }
  } catch (error) {
    data.alert = `somting Wrong plees try again`;
    data.type = "error";
  }

  res.json( data );
});
router.post(
  "/editImage/:id",
  verify,
  multerConfig.single("userImage"),
  async (req, res) => {
    const data = {};

    const { userImage } = req.body;
    try {
      console.log("hi from image")
    
      let authUser = req.user;
      if (authUser.id == req.params.id) {
        console.log("hi from im age 2")
        if (userImage !== "undefined" && userImage !== "") {
          console.log("hi from im age 3")
          if (authUser.cloud_id) {
            console.log("hi from im age 4")
            await cloudinary.uploader.destroy(authUser.cloud_id);
          }
          console.log("hi from im age 5")
          const result = await cloud.uploads(req.file.path);
          console.log("hi from im age 6")
          console.log(result)
          authUser.image = result.url;
          authUser.cloud_id = result.id;
          await authUser.save();
          data.alert = `Your profile image has been successfully modified`;
        data.type = "success";
        }
        
      } else {
        data.alert = `You are not allowed to edit user name`;
        data.type = "error";
      }
      data.user = authUser;
    } catch (error) {
      console.log(error)
      data.alert = `somting Wrong plees try again`;
      data.type = "error";
    }
    res.json( data );
  }
);
module.exports = router;
