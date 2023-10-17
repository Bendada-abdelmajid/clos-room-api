const mongoose = require('mongoose')

const romeSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  creater:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  description: {
    type: String
  },
  image: {
    type: String,
  },
  cloud_id: {
    type: String,
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }],
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
})



module.exports = mongoose.model('Group', romeSchema)