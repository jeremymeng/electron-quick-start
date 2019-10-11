// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

function reproTheBug() {
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const electron = require('electron');

    const filePath = path.join(os.tmpdir(), `${Date.now()}`);
    fs.writeFileSync(filePath, "This is a temporary file. Delete it whenever you want.");
    electron.remote.shell.openItem(filePath);
}
