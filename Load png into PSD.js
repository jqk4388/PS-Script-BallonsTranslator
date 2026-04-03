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

// Get file lists (PSD + TIFF)
var targetFiles = psdFolder.getFiles("*.psd").concat(psdFolder.getFiles("*.tif")).concat(psdFolder.getFiles("*.tiff"));
var pngFiles = pngFolder.getFiles("*.png");

if (targetFiles.length === 0 || pngFiles.length === 0) {
    alert("No PSD/TIFF or PNG files found in the selected folders.");
    exit();
}

// Process files
for (var i = 0; i < targetFiles.length; i++) {
    var targetFile = targetFiles[i];
    var baseName = targetFile.name.replace(/\.psd$/i, "").replace(/\.tif{1,2}$/i, "");
    var matchingPng;
    for (var j = 0; j < pngFiles.length; j++) {
        if (pngFiles[j].name.replace(/\.png$/i, "") === baseName) {
            matchingPng = pngFiles[j];
            break;
        }
    }

    if (matchingPng) {
        processFiles(targetFile, matchingPng);
    }
}

function processFiles(targetFile, pngFile) {
    try {
        // Open target document (PSD or TIFF)
        var doc = app.open(targetFile);

        // Open PNG and duplicate active layer into target
        var pngDoc = app.open(pngFile);
        var placedLayer = pngDoc.activeLayer.duplicate(doc, ElementPlacement.PLACEATBEGINNING);
        pngDoc.close(SaveOptions.DONOTSAVECHANGES);

        // Set blend mode for placed layer
        placedLayer.blendMode = BlendMode.SCREEN;

        // Ensure placed layer is selected (needed for transform operations)
        doc.activeLayer = placedLayer;

        // Get target document pixel dimensions
        var targetW = doc.width.as('px');
        var targetH = doc.height.as('px');

        // Get placed layer bounds in px
        var bounds = placedLayer.bounds;
        var layerW = bounds[2].as('px') - bounds[0].as('px');
        var layerH = bounds[3].as('px') - bounds[1].as('px');

        if (layerW <= 0 || layerH <= 0) {
            throw new Error('Placed PNG layer has invalid dimensions.');
        }

        // Scale up layer if smaller than target canvas
        if (layerW < targetW || layerH < targetH) {
            var scale = Math.max(targetW / layerW, targetH / layerH);
            placedLayer.resize(scale * 100, scale * 100, AnchorPosition.MIDDLECENTER);

            bounds = placedLayer.bounds;
            layerW = bounds[2].as('px') - bounds[0].as('px');
            layerH = bounds[3].as('px') - bounds[1].as('px');
        }

        // Center placed layer in target
        var layerCenterX = bounds[0].as('px') + layerW / 2;
        var layerCenterY = bounds[1].as('px') + layerH / 2;
        var targetCenterX = targetW / 2;
        var targetCenterY = targetH / 2;
        var deltaX = targetCenterX - layerCenterX;
        var deltaY = targetCenterY - layerCenterY;

        placedLayer.translate(UnitValue(deltaX, 'px'), UnitValue(deltaY, 'px'));

        // Save document in original format
        var extension = targetFile.name.toLowerCase().replace(/^.*\./, "");
        if (extension === 'psd') {
            var saveOptions = new PhotoshopSaveOptions();
            saveOptions.layers = true;
            doc.saveAs(targetFile, saveOptions, true, Extension.LOWERCASE);
        } else if (extension === 'tif' || extension === 'tiff') {
            var tiffOptions = new TiffSaveOptions();
            tiffOptions.layers = true;
            tiffOptions.imageCompression = TIFFEncoding.NONE;
            tiffOptions.saveImagePyramid = false;
            tiffOptions.spotColors = false;
            doc.saveAs(targetFile, tiffOptions, true, Extension.LOWERCASE);
        } else {
            throw new Error('Unsupported target format: ' + extension);
        }

        doc.close(SaveOptions.DONOTSAVECHANGES);

    } catch (e) {
        alert("Error processing files: " + targetFile.name + " and " + pngFile.name + "\n" + e.message);
        try {
            if (app.documents.length > 0 && app.activeDocument.fullName.fsName === targetFile.fsName) {
                app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
            }
        } catch (e2) {
            // ignore cleanup error
        }
    }
}
