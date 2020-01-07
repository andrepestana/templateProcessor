const path = require('path'),
    fs = require('fs'),
    rimraf = require("rimraf"),
    escapeRegExp = require("escape-string-regexp");

const CONFIG_FILE = 'config/general.json';
let generalConfig = JSON.parse(fs.readFileSync(CONFIG_FILE));

const REPLACEMENTS_FILE = generalConfig.replacementsFile ||'config/replacements.json';
let replacements = JSON.parse(fs.readFileSync(REPLACEMENTS_FILE));

if(generalConfig.deleteResultFolder) {
  if(fs.existsSync(generalConfig.resultFolder.path)) {
    rimraf.sync(generalConfig.resultFolder.path);
  }
}

function checkDir(basePath) {

  fs.readdir(basePath, function(err, items) {
    for (var i=0; i<items.length; i++) {
      if(is_dir(basePath +'/'+ items[i])) {
        checkDir(basePath +'/'+ items[i]);
      } else {
        applyReplacements(basePath +'/'+ items[i]);
      }
    }
  });
}

checkDir(generalConfig.templateFolder.path);

function applyReplacements(file) {
  fs.readFile(file, generalConfig.template.charEncoding, function (err, data) {
    if (err) {
      return console.log(err);
    }

    let resultFile = data;
    Object.keys(replacements).forEach(function (item) {
      let re = new RegExp(escapeRegExp(item),"g");
      resultFile = resultFile.replace(re, replacements[item]);
    });

    let partialResultFilePath = '';
    if(generalConfig.includeTemplateFolderInResult) {
      partialResultFilePath = (generalConfig.result.prefix + file + generalConfig.result.suffix).replace(/.+?\//, '');
    } else {
      partialResultFilePath = (generalConfig.result.prefix + file + generalConfig.result.suffix).replace(generalConfig.templateFolder.path, '');
    }
    
    let completeResultFolderName = generalConfig.resultFolder.path + '/' + partialResultFilePath;

    if(generalConfig.replaceFileAndDirNames) {
      Object.keys(replacements).forEach(function (item) {
        let re = new RegExp(escapeRegExp(item),"g");
        completeResultFolderName = completeResultFolderName.replace(re, replacements[item]);
      });
    }


    ensureDirectoryExistence(completeResultFolderName);
    fs.writeFile(completeResultFolderName, 
                resultFile, 
                generalConfig.template.charEncoding, 
                function (err) {
      if (err) return console.log(err);
    });
  });
}

function ensureDirectoryExistence(filePath) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function is_dir(path) {
  try {
      var stat = fs.lstatSync(path);
      return stat.isDirectory();
  } catch (e) {
      // lstatSync throws an error if path doesn't exist
      return false;
  }
}