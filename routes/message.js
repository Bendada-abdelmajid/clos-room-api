const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const Group = require("../models/Group");
const Message = require("../models/Message");
const multerConfig = require("../utils/multer");
const cloud = require('../utils/cloudinaryConfig');
const verify = require("../utils/verfiy");
const fs = require("fs");
router.post("/new/:room",verify, multerConfig.single("file"), async (req, res) => {
    let data = {};
    let chatRoom;
    const { mess , isRoom, type, file} = req.body;
    let fromFriend= true;
    console.log(req.user)
    if(req.user) {
      
      const user = req.user;
      console.log("isRoom :" + isRoom)
      console.log(typeof isRoom)      
      if(isRoom === true || isRoom === "true" ) {
        chatRoom = await Room.findById(req.params.room);
        fromFriend= true;
      } else {
        console.log("group")
        console.log(req.params.room)
        chatRoom = await Group.findById(req.params.room);
        fromFriend= false;
      }
      console.log("isRoom :" + isRoom)
      console.log("chatRoom :" + chatRoom)

    
      let newmess = await new Message({
        message:mess, 
        rome: chatRoom._id,
        type,
        sender:user,
        fromFriend,
      });
      console.log("mssage creted success")
      if (file!== "undefined" && file!== "") {
        const result = await cloud.uploads(req.file.path)
        newmess.cloud_id=result.id;
        newmess.message=result.url;
      }

      try {
        newmess = await newmess.save();
        chatRoom.messages.push(newmess)
        await chatRoom.save()
      
        data=newmess
        console.log("hi finshed")
        // delete image local
        if (file!== "undefined" && file!== "") {
          fs.unlinkSync(req.file.path)
        }

       
      } catch(error) {
        // console.log(error)
        data.alert = "somting rong plees try again";
        data.type = "error";
      }
    }
    res.send({ responce: data });
});
module.exports = router;