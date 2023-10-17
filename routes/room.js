const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Room = require("../models/Room");
const multerConfig = require("../utils/multer");
const cloud = require('../utils/cloudinaryConfig');
const verify = require("../utils/verfiy");
const fs = require("fs");
router.get('/:friend',verify, async (req, res) => { 
  let data = {};
 
    try {
      const user = req.user;
      const friend = await User.findById(req.params.friend).select('-password')
      
      const sortUsers=[user.id, friend.id].sort()
     let room=  await Room.find({users: sortUsers}).populate("messages").exec()
    
      if(room.length > 0) {
        const messages = []
        const times=[]
        for (let m of room[0].messages) {
          let fulltime=m.createdAt.toLocaleString('default', {month:"long"})+" "+m.createdAt.getDate()+","+m.createdAt.getFullYear()
            messages.push({
              id:m.id,
              type: m.type,
              message: m.message,
              sender: await User.findById(m.sender).select('email').select('image').select('username'),
              createdAt: m.createdAt.getHours() + ":"+m.createdAt.getMinutes(),
              fullTime:fulltime
            })
            if(!times.includes(fulltime)) {
              times.push(fulltime)
            }
          }
        const allmessages=[]
        for(let t of times) {
              allmessages[times.indexOf(t)]={time:t, messages:[]}
              for(let m of messages) {
               if(m.fullTime == t) {
                  allmessages[times.indexOf(t)].messages.push(m)
               }
              }
          }
        data = {resiver:friend, allmessages:allmessages , id:room[0].id};
       
        
      } else {
      
        const newroom = await new Room({
          users:sortUsers,
          messages:[]
        });
        try {
          room = await newroom.save();
          user.friends.push(friend);
          friend.friends.push(user);
          await user.save();
          await friend.save();
          data = {resiver:friend, allmessages:newroom.messages, id:newroom.id};
        } catch (e){
          
          data.alert = "somting rong plees try again";
          data.type = "error";
        }
      }
    } catch (e){
      console.log(e)
      data.alert = `somting Wrong plees try again`;
      data.type = "error";
  
    }
    res.json( data );
});




module.exports = router;