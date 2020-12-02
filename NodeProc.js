console.log('Child process started.');

require("dotenv").config();

// uncomment to talk to fiddler
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
// process.env.HTTPS_PROXY = "http://127.0.0.1:8888";
// process.env.HTTP_PROXY = "http://127.0.0.1:8888";

const promises = [];
const ContainerSasUrl = process.env.CONTAINER_SAS_URL || "<container sas url>"

const count = 90;
const maxresults = 5000;

const node_fetch = require("node-fetch");
const fetchUrl = ContainerSasUrl + `&restype=container&comp=list&maxresults=${maxresults}`;
let fetchParams = {
  method: "GET",
  headers: {
    "x-ms-version": "2020-02-10",
  }
}

const {parseXML} = require("@azure/core-http");

async function doListingUntilDoneFetch(id) {
  try {
    let marker = undefined;
    while (true) {
      try {
        console.log(`listing blobs`, id);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        fetchParams.headers["x-ms-date"] = new Date().toUTCString();
        const url = marker ? fetchUrl + `&marker=${marker}` : fetchUrl;
        // console.log(`  fetching ${url}`);
        const response = await node_fetch(url, fetchParams);
        const obj = await parseXML(await response.text());
        // console.dir(obj);
        marker = obj.NextMarker;
        if (marker === "") {
          console.log(` done listing for ${id}`);
          break;
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
for (let i = 0; i < count; i++) {
    promises.push(doListingUntilDoneFetch(i));
}
console.log('For loop done');

Promise.all(promises)
    .then(() => {
        console.log('promises done', promises.length);
        listingDone = true;
    });
