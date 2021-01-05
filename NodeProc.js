console.log('Child process started.');

require("dotenv").config();

// uncomment to talk to fiddler
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
// process.env.HTTPS_PROXY = "http://127.0.0.1:8888";
// process.env.HTTP_PROXY = "http://127.0.0.1:8888";

const promises = [];
const ContainerSasUrl = process.env.CONTAINER_SAS_URL || "<container sas url>"

const count = 120;
const maxresults = 5000;

const https = require("https");

const fetchUrl = ContainerSasUrl + `&restype=container&comp=list&maxresults=${maxresults}`;
const { parseXML } = require("@azure/core-http");

async function httpsGet(url) {
  return new Promise((resolve, reject) => {
	  // body is stream
	  // get ready to actually consume the body
	  let accum = [];
	  let accumBytes = 0;
    let hasOpenTag = false;
    let hasCloseTag = false;
    let lastChunkLength = 0;
    https.get(url, (res) => {
      res.on('data', (d) => {
        if (d.toString().indexOf("<EnumerationResults") >= 0) {
          hasOpenTag = true;
        }
        if (d.toString().indexOf("</EnumerationResults>") >= 0) {
          hasCloseTag = true;
        }
			  accumBytes += d.length;
        lastChunkLength = d.length;
        accum.push(d);
      });

		  res.on('error', (err) => {
				// other errors, such as incorrect content-encoding
				reject(new Error(`Invalid response body while trying to download`, 'system', err));
		  });

      res.on('close', () => {
        console.log(`stream closed ${url}`);
		  });

      res.on('timeout', () => {
        console.log(`stream timed out due to inactivity`);
		  });

      res.on('end', () => {
			  try {
          console.log(`  accumBytes: ${accumBytes}`);
          console.log(`  last chunk length: ${lastChunkLength}`);
          if (hasOpenTag && !hasCloseTag) {
            console.log(`  hasOpenTag: ${hasOpenTag} | hasCloseTag: ${hasCloseTag}`);
          }
				  resolve(Buffer.concat(accum, accumBytes));
			  } catch (err) {
				  reject(new Error(`Could not create Buffer from response body`, 'system', err));
			  }
      })
    }).on("error", (e) => {
      console.log(`error from https.get()`);
      console.dir(e);
      reject(new Error(`error from https.get()`, "system", e));
    });
  });
}

async function doListingUntilDoneHttpsGet(id) {
  try {
    let marker = undefined;
    let pageNum = 1;
    while (true) {
      try {
        const customId = `${id}-page${pageNum++}`;
        console.log(`listing blobs ${customId}`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const url = marker ? fetchUrl + `&marker=${marker}` : fetchUrl;
        // console.log(` getting ${url}`);
        const buffer = await httpsGet(url + `&customId=${customId}`);
        const str = await buffer.toString();
        if (str.indexOf("<EnumerationResults") >= 0 && str.indexOf("</EnumerationResults>") === -1) {
          throw new Error(`incomplete XML response when listing for ${customId}`)
        }
        const obj = await parseXML(str);
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
  promises.push(doListingUntilDoneHttpsGet(i));
}
console.log('For loop done');

Promise.all(promises)
    .then(() => {
        console.log('promises done', promises.length);
        listingDone = true;
    });
