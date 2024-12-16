/*
Script for stacking PSD and PNG files with the same name,
setting PNG layers to "Screen" blend mode, and saving as PSD.
*/

#target photoshop

var psdFolder, pngFolder;

// Create main dialog
var dialog = new Window("dialog", "Batch Stack PSD and PNG");

// PSD folder selection
var psdGroup = dialog.add("group");
psdGroup.add("statictext", undefined, "PSD Folder:");
var psdInput = psdGroup.add("edittext", undefined, "");
psdInput.size = [300, 25];
var psdBrowse = psdGroup.add("button", undefined, "Browse");

psdBrowse.onClick = function () {
    psdFolder = Folder.selectDialog("Select PSD folder");
    if (psdFolder) psdInput.text = psdFolder.fsName;
};

// PNG folder selection
var pngGroup = dialog.add("group");
pngGroup.add("statictext", undefined, "PNG Folder:");
var pngInput = pngGroup.add("edittext", undefined, "");
pngInput.size = [300, 25];
var pngBrowse = pngGroup.add("button", undefined, "Browse");

pngBrowse.onClick = function () {
    pngFolder = Folder.selectDialog("Select PNG folder");
    if (pngFolder) pngInput.text = pngFolder.fsName;
};

// OK and Cancel buttons
var buttonGroup = dialog.add("group");
buttonGroup.alignment = "center";
buttonGroup.add("button", undefined, "OK", { name: "ok" });
buttonGroup.add("button", undefined, "Cancel", { name: "cancel" });

if (dialog.show() != 1) exit();

// Validate folders
if (!psdFolder || !pngFolder) {
    alert("Both PSD and PNG folders must be selected.");
    exit();
}

// Get file lists
var psdFiles = psdFolder.getFiles("*.psd");
var pngFiles = pngFolder.getFiles("*.png");

if (psdFiles.length === 0 || pngFiles.length === 0) {
    alert("No PSD or PNG files found in the selected folders.");
    exit();
}

// Process files
for (var i = 0; i < psdFiles.length; i++) {
    var psdFile = psdFiles[i];
    var baseName = psdFile.name.replace(/\.psd$/i, "");
    var matchingPng;
    for (var j = 0; j < pngFiles.length; j++) {
        if (pngFiles[j].name.replace(/\.png$/i, "") === baseName) {
            matchingPng = pngFiles[j];
            break;
        }
    }

    if (matchingPng) {
        processFiles(psdFile, matchingPng);
    }
}

function processFiles(psdFile, pngFile) {
    try {
        // Open PSD
        var doc = app.open(psdFile);

        // Place PNG
        var pngDoc = app.open(pngFile);
        pngDoc.activeLayer.duplicate(doc);
        pngDoc.close(SaveOptions.DONOTSAVECHANGES);

        // Set PNG layer blend mode
        doc.activeLayer.blendMode = BlendMode.SCREEN;

        // Save as PSD
        var saveOptions = new PhotoshopSaveOptions();
        doc.saveAs(psdFile, saveOptions, true, Extension.LOWERCASE);

        // Close PSD document
        doc.close(SaveOptions.DONOTSAVECHANGES);
    } catch (e) {
        alert("Error processing files: " + psdFile.name + " and " + pngFile.name + "\n" + e.message);
    }
}
