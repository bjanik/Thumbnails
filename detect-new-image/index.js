const { BlobServiceClient } = require('@azure/storage-blob');
const Jimp = require('jimp');
const nodemailer = require('nodemailer')

const suffix = "_thumb"

async function send_mail(originalBlob, thumbnailBlob, context) {

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.EMAIL,
        to: process.env.EMAIL_RCV,
        subject: 'Azure storage container update',
        text: 'Hi, a new blob was uploaded in your container. Please find it and its thumbnail version in attachements',
        attachments: [
            // originalBlob,
            // thumbnailBlob
        ],
    };

    transporter.sendMail(mailOptions, function(error, info) {
        context.log("SENDING MAIL")
        if (error) {
            context.log(error);
        } else {
            context.log('Email sent: ' + info.response);
        }
    });
}

module.exports = async function (context, myBlob) {
    context.log("JavaScript blob trigger function processed blob \n Blob:", context.bindingData.blobTrigger, "\n Blob Size:", myBlob.length, "Bytes");

    const {uri} = context.bindingData;
    const {blobTrigger} = context.bindingData;
    const name = blobTrigger.split('/')[1];

    // naive way to prevent infinite loops: if myblob's name contains '_thumb.', we know it's a generated file from a previous trigger, then we simply return
    if (name.includes(suffix)) return
    
    const ext = name.split('.')[1]
    const path = uri.substring(0, uri.lastIndexOf("/"))
    const thumbnailName = `${name.split('.')[0]}${suffix}.${ext}`

    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING)
    const containerClient = blobServiceClient.getContainerClient('app-thumbnails');
    const blockBlobClient = containerClient.getBlockBlobClient(thumbnailName)

    const originalBlob = {
        path: `${path}/${name}`,
        filename: name
    }
    const thumbnailBlob = {
        filename: thumbnailName,
        path: `${path}/${thumbnailName}`,
    }

    Jimp.read(myBlob)
    .then(img => {
        img
        .clone()
        .resize(120, 120)
        .getBuffer(Jimp.MIME_JPEG, (err, buffer) => {
            if (!err) {
                blockBlobClient.upload(buffer, buffer.length)
                send_mail(originalBlob, thumbnailBlob, context)
            }
        })
    })
    .catch(error => {
        context.log(error)
    })
};