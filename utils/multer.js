const multer = require('multer')

// stores file on disk
const fileStorage = multer.diskStorage({
   
    destination: './public/Bcovers',
    filename : (req,file,cb)=>{

        
        cb(null,file.originalname)
    }
})




module.exports = multer({storage: fileStorage})
