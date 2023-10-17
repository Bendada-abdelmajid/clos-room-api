const router = require("express").Router();
var jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Token = require("../models/token");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

router.post("/current-user", async (req, res) => {
  try {
    const token = jwt.decode(req.body.token);

    const user = await User.findById(token.id).select("-password");
 
    res.json({ user });
  } catch (error) {
    console.log(error);
    res.json("token not valide");
  }
});
router.post("/google", async (req, res) => {
  let alert, type;
  try {
    // Decode the JWT
    const { name, email, picture, email_verified } = jwt.decode(req.body.token);

    let user = await User.findOne({ email });
    if (!user) {
      user = await new User({
        username: name,
        email,
        image: picture,
        verified: email_verified,
      });
      try {
        await user.save();
        alert = "user create sucsfuly";
        type = "sucsses";
      } catch (error) {
        console.error("Error saving user :", error);
        alert = "somting rong plees try again";
        type = "error";
      }
    } else {
      alert = "loged with success";
      type = "success";
    }

    const token = user.generateAuthToken();
    res.json({ user, token, alert, type });
  } catch (error) {
    console.error("Error decoding JWT:", error);
    res.json({ alert: "Error decoding JWT", type: "error" });
  }
});
router.post("/login", async (req, res) => {
  try {
    console.log(req.body);
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.send({ type: "error", message: "Invalid Email" });
    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword)
      return res.send({ type: "error", message: "Invalid Password" });

    if (!user.verified) {
      let token = await Token.findOne({ userId: user._id });
      if (!token) {
        token = await new Token({
          userId: user._id,
          token: crypto.randomBytes(32).toString("hex"),
        }).save();

        const context = {
          name: user.username,
          link: `${process.env.CLIENT_URL}/users/${user.id}/verify/${token.token}`,
          host:process.env.BASE_URL
        };
    
        await sendEmail(user.email, "Verify Email", "confirme_email", context);
      }

      return res.send({
        type: "success",
        message: "An Email sent to your account please verify",
      });
    }

    const token = user.generateAuthToken();
    res.send({
      token: token,
      user: user,
      type: "success",
      message: "logged in successfully",
    });
  } catch (error) {
    res.send({ type: "error", message: "Internal Server Error" });
  }
});


router.post("/sing-up", async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    console.log(req.body);
    let user = await User.findOne({ email: email });
    console.log(user);
    console.log(password);
    console.log(email);
    console.log(confirmPassword);
    console.log(password === confirmPassword);
    if (!username || !email || !password || !confirmPassword) {
      return res.send({ type: "error", message: "Every field must be filled" });
    } else if (user) {
      return res.send({
        type: "error",
        message: "User with given email already Exist!",
      });
    } else if (password !== confirmPassword) {
      return res.send({
        type: "error",
        message: "Your password does not match the confirmation password",
      });
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(req.body.password, salt);
    user = await new User({ ...req.body, password: hashPassword }).save();
    const token = await new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    }).save();
   
    const context = {
      name: username,
      link: `${process.env.CLIENT_URL}/users/${user.id}/verify/${token.token}`,
      host:process.env.BASE_URL
    };

    await sendEmail(user.email, "Verify Email", "confirme_email", context);

    const usertoken = user.generateAuthToken();
    res.send({
      token: usertoken,
      user: user,
      type: "success",
      message: "An Email sent to your account please verify",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ type: "error", message: "Internal Server Error" });
  }
});


module.exports = router;
