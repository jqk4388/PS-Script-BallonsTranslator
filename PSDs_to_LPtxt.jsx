#target photoshop

/*
    用于将PSD档中的文本图层导出为LabelPlus脚本

    用法：
    1. 修改本脚本中的IMG_SUFFIX常量，为图片原本的后缀名
    2. 将脚本拖到Photoshop中执行
    3. 在弹出的对话框中选择包含PSD或TIF图片的文件夹
    4. 导出的"文件夹名.txt"将保存在所选文件夹下
*/

// 输出的图片后缀名
const IMG_SUFFIX = ".png";

// 全局变量，计数Label序号
var label_count = 0;
// 全局变量，当前处理的文档的尺寸
var g_docWidth = 0;
var g_docHeight = 0;

function main() {

    // 弹出文件夹选择对话框，让用户选择包含PSD/TIF图片的文件夹
    var srcFolder = Folder.selectDialog("请选择包含PSD或TIF图片的文件夹");
    if (!srcFolder) return;

    // 收集文件夹中所有的psd和tif文件
    var allFiles = srcFolder.getFiles();
    var targetFiles = [];
    for (var i = 0; i < allFiles.length; i++) {
        if (allFiles[i] instanceof File) {
            var lowerName = allFiles[i].name.toLowerCase();
            if (lowerName.match(/\.(psd|tif|tiff)$/)) {
                targetFiles.push(allFiles[i]);
            }
        }
    }

    if (!targetFiles.length) {
        alert("所选文件夹中没有找到PSD或TIF文件！");
        return;
    }

    // 输出文件保存在所选文件夹下，文件名与文件夹同名
    var f = new File(srcFolder.fsName + "/" + decodeURI(srcFolder.name) + ".txt");

    if (f) {
        // 以UTF-8编码写入，保证中文不乱码
        f.encoding = "UTF8";
        f.open("w");

        // LabelPlus文本格式头部
        // f.write("1,0\n-\n框内\n框外\n-\n备注备注备注\n");

        // 遍历所有找到的文件
        for (var i = 0; i < targetFiles.length; i++) {
            var doc = app.open(targetFiles[i]);

            // 将文档设置激活才能正常访问到图层
            app.activeDocument = doc;

            g_docWidth = doc.width;
            g_docHeight = doc.height;

            // LabelPlus 图片文件名
            var fileName = doc.name.replace(/\.[^\.]+$/, IMG_SUFFIX);
            f.write("\n>>>>>>>>[" + fileName + "]<<<<<<<<" + "\n");

            label_count = 0;
            f.write(scanLayerSets(doc));

            // 处理完毕关闭文档，不保存更改
            doc.close(SaveOptions.DONOTSAVECHANGES);
        }

        f.close();

        alert("所有图层上的文本已保存到：" + f.fullName);

    }

}

function scanLayerSets(el) {

    var mystr = "";

    //导出图层组
    for(var a=0; a<el.layerSets.length;a++){

        var ly=el.layerSets[a].typename;
        if (ly == "LayerSet") {

            mystr += scanLayerSets(el.layerSets[a]);

        }

    }

    //文本图层导出
    for(var j=0;j<el.artLayers.length;j++){

        var lk = el.artLayers[j].kind;

        if (lk == "LayerKind.TEXT") {
            var item = el.artLayers[j].textItem;
            var xPos = item.position[0] / g_docWidth;
            var yPos = item.position[1] / g_docHeight;            
            
            label_count += 1;
            mystr += "----------------[" + label_count + "]----------------[" + xPos.toFixed(3) + "," + yPos.toFixed(3) + ",1]\n";
            mystr += item.contents + "\n\n";
        }

    }
    //alert(mystr)
    return mystr;
}

main();