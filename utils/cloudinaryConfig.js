const cloudinary = require('cloudinary')

cloudinary.config({
    cloud_name : 'bencod',
    api_key : '931798593994766',
    api_secret: 'Ju_QTccw-DJusx6YE-L9M1Myp6k'
})

exports.uploads = (file) =>{
    return new Promise(resolve => {
    cloudinary.uploader.upload(file, (result) =>{
    resolve({url: result.url, id: result.public_id})
    }, {resource_type: "auto"})
    })
}