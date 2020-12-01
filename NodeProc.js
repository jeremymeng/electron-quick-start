console.log('Child process started.');

// uncomment to talk to fiddler
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
// process.env.HTTPS_PROXY = "http://127.0.0.1:8888";
// process.env.HTTP_PROXY = "http://127.0.0.1:8888";

const StorageBlob = require('@azure/storage-blob');
const promises = [];
const ContainerSasUrl = "";

async function doListingUntilDone(id) {
    try {
        let containerClient = new StorageBlob.ContainerClient(ContainerSasUrl);
        let iterator = containerClient.listBlobsFlat().byPage({ maxPageSize: 5000 });
        while (true) {
            try {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                let next = await iterator.next();
                if (next.done) {
                    break;
                } else {
                    console.log('did a list', next.value.segment.blobItems.length, id);
                }
            } catch (err) {
                console.log('listing failed!', err);
                break;
            }
        }
    } catch (err) {
        console.log('intial listing failed!', err);
    }
}

console.log('Starting to list lots of blobs');

let listingDone = false;
for (let i = 0; i < 40; i++) {
    promises.push(doListingUntilDone(i));
}
console.log('For loop done');

Promise.all(promises)
    .then(() => {
        console.log('promises done', promises.length);
        listingDone = true;
    });
