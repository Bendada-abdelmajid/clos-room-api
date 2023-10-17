if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const cors = require("cors");
const Pusher = require("pusher");
const User = require("./models/User");
const authRoute = require("./routes/auth");
const usersRoute = require("./routes/user");
const roomRouter = require("./routes/room");
const groupRouter = require("./routes/group");
const messageRouter = require("./routes/message");
const app = express();
app.use(express.static("public"));
app.use(express.json());
console.log(process.env.CLIENT_URL)
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization',
  })
);

app.use("/auth", authRoute);
app.use("/users", usersRoute);
app.use("/room", roomRouter);
app.use("/group", groupRouter);
app.use("/message", messageRouter);

app.get("/", (req, res) => {
  res.send("Welcome, Guest");
});
console.log(process.env.DATABASE_URL)

const pusher = new Pusher({
  appId: process.env.PUSHER_APPID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: "eu",
  useTLS: true
});


/// database
const mongoose = require("mongoose");

mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology:true,
}); 
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
 db.once("open",  () => {
  
  const msgCollection = db.collection("messages");

  
  const changeStreame = msgCollection.watch();
 

   changeStreame.on("change", async (change) => {
   
    if(change.operationType === "insert") {
      
      const  messDeatils = change.fullDocument;
      console.log(messDeatils)
      pusher.trigger("messages", "inserted", {time:null,
         messages:[{
          message: messDeatils.message,
          sender: await User.findById(messDeatils.sender).select('email').select('image').select('username'),
          room: messDeatils.rome,
          type:messDeatils.type,
          createdAt: messDeatils.createdAt.getHours() + ":"+ messDeatils.createdAt.getMinutes(),
          fromFriend:messDeatils.fromFriend,
        }]}
        
      );
    }
  });
 
});

app.listen(process.env.PORT || 3500);
