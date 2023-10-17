const User = require("../models/User");
var jwt = require("jsonwebtoken");
module.exports = async (req, res, next) => {
  try {
   
    const auth = req.headers.authorization.split(" ")[1];

    if (auth) {
      const token = jwt.decode(auth);

      
      const user = await User.findById(token.id).select("-password");
   
      req.user = user;

      next();
    } else {
      res.json("You are not authenticated!");
    }
  } catch (error) {
    console.log(error);
    res.json("You are not authenticated!");
  }
};
