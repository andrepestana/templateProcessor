const path = require('path');
const fs = require('fs');
const rimraf = require("rimraf");
const escapeRegExp = require("escape-string-regexp");
const yargs = require('yargs');
const prompt = require('prompt');

// TODO Refactor: place it in a separate file
const argv = yargs
    .option('template_fileName', {
        alias: 'tfn',
        description: 'Use a single file as a template',
        type: 'string',
    })
    .help()
    .alias('help', 'h')
    .argv;

const CONFIG_FILE = 'config/general.json';
let generalConfig = JSON.parse(fs.readFileSync(CONFIG_FILE));
let resultFolder = path.resolve(process.cwd() + path.sep + generalConfig.resultFolder.path);
const REPLACEMENTS_FILE = generalConfig.replacements.fileName ||'config/replacements.json';
let replacements = JSON.parse(fs.readFileSync(REPLACEMENTS_FILE));

if(fs.existsSync(resultFolder)) {
  prompt.message = '';
  prompt.delimiter = '';
  prompt.colors = false;
  // wait for user confirmation
  prompt.get({
      properties: {
          confirm: {
              // allow yes, no, y, n, YES, NO, Y, N as answer
              pattern: /^(yes|no|y|n)$/gi,
              description: `Do you really want to delete result folder: ${resultFolder} ?`,
              message: 'Type yes/no',
              required: true,
              default: 'no'
          }
      }
    }, 
    function (err, result){
      // transform to lower case
      var c = result.confirm.toLowerCase();
      // yes or y typed ? otherwise abort
      if (c!='y' && c!='yes'){
          console.log('Cancelled by the user');
          return;
      }

      // confirmed
      console.log('Action confirmed');
      rimraf.sync(resultFolder);
      processTemplate();
  });   
  prompt.start();
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

    if(generalConfig.replacements.applyToFileAndDirNames) {
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