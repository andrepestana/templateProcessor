var fs = require('fs')

const CONFIG_FILE = 'config/general.json';
const REPLACEMENTS_FILE = 'config/replacements.json';

let generalConfig = JSON.parse(fs.readFileSync(CONFIG_FILE));

fs.readFile(generalConfig.template.fileName, generalConfig.template.charEncoding, function (err, data) {
  if (err) {
    return console.log(err);
  }

  let replacements = JSON.parse(fs.readFileSync(REPLACEMENTS_FILE));

  let result = data;
  Object.keys(replacements).forEach(function (item) {
    let re = new RegExp(item,"g");
    result = result.replace(re, replacements[item]);
  });
    
  fs.writeFile(generalConfig.result.prefix + generalConfig.template.fileName + generalConfig.result.suffix, 
               result, 
               generalConfig.template.charEncoding, 
               function (err) {
     if (err) return console.log(err);
  });

});