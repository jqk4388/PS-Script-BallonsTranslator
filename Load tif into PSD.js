/*
Script for stacking PSD and TIF files with the same name,
setting TIF layers to "Difference" blend mode, and saving as PSD.
*/

#target photoshop

var psdFolder, tifFolder;

// Create main dialog
var dialog = new Window("dialog", "Batch Merge PSD and TIF");
dialog.alignChildren = "fill";

// PSD folder selection
var psdGroup = dialog.add("group");
psdGroup.add("statictext", undefined, "PSD Folder:");
var psdInput = psdGroup.add("edittext", undefined, "");
psdInput.size = [340, 25];
var psdBrowse = psdGroup.add("button", undefined, "Browse");

psdBrowse.onClick = function () {
    var selected = Folder.selectDialog("Select PSD folder");
    if (selected) {
        psdFolder = selected;
        psdInput.text = psdFolder.fsName;
    }
};

// TIF folder selection
var tifGroup = dialog.add("group");
tifGroup.add("statictext", undefined, "TIF Folder:");
var tifInput = tifGroup.add("edittext", undefined, "");
tifInput.size = [340, 25];
var tifBrowse = tifGroup.add("button", undefined, "Browse");

tifBrowse.onClick = function () {
    var selected = Folder.selectDialog("Select TIF folder");
    if (selected) {
        tifFolder = selected;
        tifInput.text = tifFolder.fsName;
    }
};

// OK and Cancel buttons
var buttonGroup = dialog.add("group");
buttonGroup.alignment = "center";
buttonGroup.add("button", undefined, "OK", { name: "ok" });
buttonGroup.add("button", undefined, "Cancel", { name: "cancel" });

if (dialog.show() != 1) exit();

if (!psdInput.text || !tifInput.text) {
    alert("Please provide both PSD and TIF folder paths.");
    exit();
}

psdFolder = new Folder(psdInput.text);
tifFolder = new Folder(tifInput.text);

if (!psdFolder.exists || !tifFolder.exists) {
    alert("One or both folder paths are invalid. Please check the paths and try again.");
    exit();
}

var psdFiles = psdFolder.getFiles("*.psd");
var tifFiles = tifFolder.getFiles("*.tif").concat(tifFolder.getFiles("*.tiff"));

if (psdFiles.length === 0) {
    alert("No PSD files found in the selected PSD folder.");
    exit();
}

if (tifFiles.length === 0) {
    alert("No TIF/TIFF files found in the selected TIF folder.");
    exit();
}

var processedCount = 0;
for (var i = 0; i < psdFiles.length; i++) {
    var psdFile = psdFiles[i];
    var baseName = psdFile.name.replace(/\.psd$/i, "");
    var matchingTif = null;

    for (var j = 0; j < tifFiles.length; j++) {
        if (tifFiles[j].name.replace(/\.tif{1,2}$/i, "") === baseName) {
            matchingTif = tifFiles[j];
            break;
        }
    }

    if (matchingTif) {
        processFiles(psdFile, matchingTif);
        processedCount++;
    }
}

if (processedCount === 0) {
    alert("No matching PSD and TIF pairs were found. Make sure files share the same base name.");
} else {
    alert("Processed " + processedCount + " PSD file(s) successfully.");
}

function processFiles(psdFile, tifFile) {
    try {
        var doc = app.open(psdFile);
        var tifDoc = app.open(tifFile);

        if (tifDoc.mode === DocumentMode.BITMAP) {
            tifDoc.changeMode(ChangeMode.GRAYSCALE);
        }

        var importedLayer = tifDoc.activeLayer.duplicate(doc, ElementPlacement.PLACEATBEGINNING);
        tifDoc.close(SaveOptions.DONOTSAVECHANGES);

        importedLayer.blendMode = BlendMode.DIFFERENCE;
        importedLayer.name = "Merged TIF - Difference";
        doc.activeLayer = importedLayer;

        var saveOptions = new PhotoshopSaveOptions();
        saveOptions.layers = true;
        saveOptions.embedColorProfile = true;

        var outputFolder = new Folder(tifFolder.fsName + "/PSD_check");
        if (!outputFolder.exists) {
            outputFolder.create();
        }

        var outputFile = new File(outputFolder.fsName + "/" + psdFile.name);
        doc.saveAs(outputFile, saveOptions, true, Extension.LOWERCASE);

        doc.close(SaveOptions.DONOTSAVECHANGES);
    } catch (e) {
        alert("Error processing " + psdFile.name + " and " + tifFile.name + ":\n" + e.message);
        try {
            if (app.documents.length > 0) {
                app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
            }
        } catch (cleanupError) {
            // ignore cleanup failure
        }
    }
}
