const path = require('path'),
    fs = require('fs'),
    rimraf = require("rimraf");

const CONFIG_FILE = 'config/general.json';
const REPLACEMENTS_FILE = 'config/replacements.json';

let generalConfig = JSON.parse(fs.readFileSync(CONFIG_FILE));
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

    let result = data;
    Object.keys(replacements).forEach(function (item) {
      let re = new RegExp(item,"g");
      result = result.replace(re, replacements[item]);
    });
    ensureDirectoryExistence(generalConfig.resultFolder.path + '/' + generalConfig.result.prefix + file + generalConfig.result.suffix);
    fs.writeFile(generalConfig.resultFolder.path + '/' + generalConfig.result.prefix + file + generalConfig.result.suffix, 
                result, 
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