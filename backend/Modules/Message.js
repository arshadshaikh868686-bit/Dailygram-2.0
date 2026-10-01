const mongoose  = require('mongoose')

const MessageSchema = new mongoose.Schema({
    appointmentId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Appointment',
        required:true
    }, 

    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User', 
        required:true
    }, 

    text:{
        type:String,
        required:true
    }
},{timestamps:true})

const Message = mongoose.model('Message' , MessageSchema)
module.exports = Message;