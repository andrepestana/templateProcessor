const path = require('path');
const fs = require('fs');
const escapeRegExp = require("escape-string-regexp");
const promptForFolderDeletion = require('./prompt');
const argv = require('./argv');

const CONFIG_FILE = 'config/general.json';
let generalConfig = JSON.parse(fs.readFileSync(CONFIG_FILE));
let resultFolder = path.resolve(process.cwd() + path.sep + generalConfig.resultFolder.path);
const REPLACEMENTS_FILE = generalConfig.replacements.fileName ||'config/replacements.json';
let replacements = JSON.parse(fs.readFileSync(REPLACEMENTS_FILE));

if(fs.existsSync(resultFolder)) {
  promptForFolderDeletion(resultFolder, 
                          processTemplate, 
                          () => console.log('Cancelled by the user')).start();
} else {
  processTemplate();
}

function checkDirAndThenApplyReplacements(basePath) {
  fs.readdir(basePath, function(err, items) {
    for (var i=0; i<items.length; i++) {
      if(is_dir(basePath +'/'+ items[i])) {
        checkDirAndThenApplyReplacements(basePath +'/'+ items[i]);
      } else {
        applyReplacements(basePath +'/'+ items[i]);
      }
    }
  });
}

function processTemplate() {
  if (argv.template_fileName) {
    console.log('Applying replacements to:', path.resolve(process.cwd() + path.sep + argv.template_fileName));
    applyReplacements(argv.template_fileName);
  } else {
    console.log('Applying replacements to template directory:', path.resolve(process.cwd() + path.sep + generalConfig.templateFolder.path));
    checkDirAndThenApplyReplacements(generalConfig.templateFolder.path);
  }
}

function applyReplacements(file) {
  fs.readFile(file, generalConfig.template.charEncoding, function (err, data) {
    if (err) {
      return console.log(err);
    }

    let resultFile = data;
    Object.keys(replacements).forEach(function (item) {
      if(typeof replacements[item] === "string") {
        let re = new RegExp(escapeRegExp(item),"g");
        resultFile = resultFile.replace(re, replacements[item]);
      } else if(typeof replacements[item] === "object") {
        let subTemplateResult = '';
        let subTemplatConf = replacements[item];
        
        subTemplatConf.replacements.forEach(function(subReplacements) {
          let _subReplacements = subReplacements;
          let _subTemplateResult = subTemplatConf.template;
          Object.keys(subReplacements).forEach(function (subItem) {
            let subRe = new RegExp(escapeRegExp(subItem),"g");
            _subTemplateResult = _subTemplateResult.replace(subRe, _subReplacements[subItem]);
          });
          subTemplateResult += _subTemplateResult;
        });

        let re = new RegExp(escapeRegExp(item),"g");
        resultFile = resultFile.replace(re, subTemplateResult);
      }
    });

    let partialResultFilePath = '';
    if(generalConfig.includeTemplateFolderInResult) {
      partialResultFilePath = (generalConfig.result.prefix + file + generalConfig.result.suffix).replace(/.+?\//, '');
    } else {
      partialResultFilePath = (generalConfig.result.prefix + file + generalConfig.result.suffix).replace(generalConfig.templateFolder.path, '');
    }
    
    let completeResultFolderName = generalConfig.resultFolder.path + '/' + partialResultFilePath;

    if(generalConfig.replacements.applyToFileAndDirNames) {
      Object.keys(replacements).forEach(function (item) {
        if(typeof replacements[item] === "string") {
          let re = new RegExp(escapeRegExp(item),"g");
          completeResultFolderName = completeResultFolderName.replace(re, replacements[item]);
        }
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