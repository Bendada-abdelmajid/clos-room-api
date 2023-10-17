const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({
  message: {
    type: String
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rome: {
    type: String
  },
  cloud_id: {
    type: String,
  },
  type: {
    type: String,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  fromFriend: {
    type: Boolean,
   
  }

})


module.exports = mongoose.model('Message', MessageSchema)