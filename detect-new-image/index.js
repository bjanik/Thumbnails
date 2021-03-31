module.exports = async function (context, myBlob) {
    context.log("JavaScript blob trigger function processed blob \n Blob:", context.bindingData.blobTrigger, "\n Blob Size:", myBlob.length, "Bytes");
    const blobUrl = context.bindingData.data.url;
    const blobName = blobUrl.slice(blobUrl.lastIndexOf("/")+1);
    context.log(blobUrl, blobName)
};