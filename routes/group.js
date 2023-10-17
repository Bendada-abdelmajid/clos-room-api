const express = require("express");
const cloudinary = require('cloudinary')
const router = express.Router();
const User = require("../models/User");
const Group = require("../models/Group");
const Message = require("../models/Message");

const multerConfig = require("../utils/multer");
const cloud = require('../utils/cloudinaryConfig');
const verify = require("../utils/verfiy");
const fs = require("fs");
router.get("/search/:q",verify, async (req, res) => {
  
    let Groups =[]
    if(req.params.q == "myGroups") {
     const user = await User.findById(req.user._id).populate('groups');
     
     Groups=user.groups
     
    }else{
      const terms = req.params.q.trim();
      Groups = await Group.find({
        title: { $regex: new RegExp(terms, "i") },
      }).select("-password");
    }
    res.send({ Groups });
  });

router.get('/:id',verify, async(req, res)=>{
    let data = {};
  
    data.isAdmin=false
    data.isParticipant =false
    data.users=[]
 
    if(req.user){
        const user = req.user;
        const mainGroup = await  Group.findById(req.params.id)
        const group = await  Group.findById(req.params.id).populate('messages').populate('users');
        const creater = await User.findById( group.creater).select('image').select('username');
         console.log(group)
         console.log(mainGroup)
         console.log("id: "+ user.id )
         console.log("group.creater: "+ group.creater)
         console.log("group.creater: "+ user.id == group.creater)
        if(user.id == group.creater) {
            data.isAdmin=true
            data.isParticipant =true
            data.users=group.users
        } else if(mainGroup.users.includes(user.id)) {
            
            data.isParticipant =true
            data.users=group.users
        }
        const times=[]

        const messages = []
        for (let m of group.messages) {
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
        let files=[]
        let images=[]
        let audios=[]
        for(let t of times ) {
            allmessages[times.indexOf(t)]={time:t, messages:[]}
            files[times.indexOf(t)]={time:t, messages:[]}
            images[times.indexOf(t)]={time:t, messages:[]}
            audios[times.indexOf(t)]={time:t, messages:[]}
            for(let m of messages) {
             if(m.fullTime == t) {
                allmessages[times.indexOf(t)].messages.push(m)
                if(m.type == "file") {
                    files[times.indexOf(t)].messages.push({type: m.type,message: m.message,createdAt:m.createdAt})
                } else if(m.type == "image") {
                    images[times.indexOf(t)].messages.push({type: m.type,message: m.message,createdAt:m.createdAt})
                }else if(m.type == "audio") {
                    audios[times.indexOf(t)].messages.push({type: m.type,message: m.message,createdAt:m.createdAt})
                }
             }

            }
        }
       
        images = images.filter(el=>{
            return el.messages.length>0
        })
        files = files.filter(el=>{
            return el.messages.length>0
        })
        audios = audios.filter(el=>{
            return el.messages.length>0
        })
     
     
        data.group={title:group.title, description:group.description,image:group.image}
        data.allmessages=allmessages
       data.media=[files,images,audios]
        data.creater=creater
        data.id=group.id
    
    } else {
        data="you are not authnicated"
    }
  
    res.json( data );
})
router.post('/new',verify, multerConfig.single("image"), async(req, res) => {
    let data = {};
    
    const { title, description } = req.body;
    if(req.user){
        const result = await cloud.uploads(req.file.path)
        const user = req.user;
        let newgroup = await new Group({
            creater:user,
            title,
            description,
            image:result.url,
            cloud_id:result.id,
        });
        try {
            newgroup = await newgroup.save();
            user.groups.push(newgroup)
            await user.save()
            data.alert = "The group was successfully created";
            data.type = "success";
            data.group = newgroup;
            fs.unlinkSync(req.file.path)
            
        } catch (e){
           console(e)
          data.alert = "somting rong plees try again";
          data.type = "error";
        }
    } else {
        data="you are not authnicated"
    }
      
      
    
    res.send( data );
})
router.post('/join/:id',verify, async(req, res)=>{
    let data = {};
    if(req.user){
        const user = req.user;
        const group = await  Group.findById(req.params.id);
        if(!group.users.includes(user.id)) {
            try {
                group.users.push(user)
                await group.save()
                user.groups.push(group)
                await user.save()
                data={alert:`welcom to the group ${user.username}`, type:"success", joind:true}
           
            } catch (e){
             
                data.alert = "somting rong plees try again";
                data.type = "error";
            }
        }
        
    } else {
        data.alert="you are not authnicated"
        data.type = "error";
    }
    res.json(data);
})
router.post('/exit/:id/:user',verify, async(req, res)=>{
    let data = {};

    if(req.user){
        const authUser = req.user;
        const user = await User.findById(req.params.user);
        const group = await  Group.findById(req.params.id);
        if(authUser.id === group.creater || authUser.id == user.id ) {
            if(group.users.includes(user.id)) {
                try {
                    group.users.pop(user)
                    await group.save()
                    user.groups.pop(group)
                    await user.save()
                    data={alert:`exit from the group with success`, type:"success", joind:false}

                } catch (e){
                
                    data.alert = "somting rong plees try again";
                    data.type = "error";
                }
            } else {
                data="you are not particiption"
                data.type = "error";
            }
        } else {
            data="you are not allowd"
            data.type = "error";
        }
    }
    else {
        data="you are not authenticated"
        data.type = "error";
    }
    
    res.json(data);
})
router.post('/delete/:id',verify, async(req, res)=>{
    let data = {};
   
    if(req.user){
        const user = req.user;
        const group = await  Group.findById(req.params.id);
        if(user.id == group.creater) {
            try {
                for(let m of group.messages) {
                    const mes=await  Message.findById(m)
                    console.log("mes")
                    console.log(mes)
                    if(mes){
                        if(mes.cloud_id) {
                            await cloudinary.uploader.destroy(mes.cloud_id)
                        }
                        await mes.deleteOne({ _id: mes._id });
                    }
                   
                }
                await cloudinary.uploader.destroy(group.cloud_id)
                await group.deleteOne({ _id: group._id });
                data.alert = `The group  has been successfully deleted`;
                data.type = "success";
            } catch (e){
                console.log(e)
                data.alert = "somting rong plees try again";
                data.type = "error";
              }
        } else {
            data.alert = "you are not allowd to delete this group";
            data.type = "error";
        }
        
    } else {
        data="you are not authnicated"
    }
    res.json(data);
})

module.exports = router;