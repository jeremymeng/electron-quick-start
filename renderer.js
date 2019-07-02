// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { remote } = require('electron');
var count = 0;

window.addEventListener("keyup", (e) => {
    if (e.keyCode === 27) {
        document.getElementById(`test-span`).innerText = `Count: ${++count}`;
    }
});

document.getElementById(`test-a`).onclick = function () {
    var callback = function() {
        console.log("Dialog closed!");
    };
    remote.dialog.showOpenDialog(remote.BrowserWindow.getFocusedWindow(), {}, callback);
}