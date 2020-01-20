const prompt = require('prompt');
const rimraf = require("rimraf");
const promptForFolderDeletion = function promptForFolderDeletion(folderToDelete, 
                                                                 actionInAffirmativeCase, 
                                                                 actionInNegativeCase) {

    prompt.message = '';
    prompt.delimiter = '';
    prompt.colors = false;
    // wait for user confirmation
    prompt.get({
        properties: {
            confirm: {
                // allow yes, no, y, n, YES, NO, Y, N as answer
                pattern: /^(yes|no|y|n)$/gi,
                description: `Do you really want to delete folder: ${folderToDelete} ?`,
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
            actionInNegativeCase();
            return;
        }

        // confirmed
        console.log('Action confirmed');
        rimraf.sync(folderToDelete);
        actionInAffirmativeCase();
    });   
    return prompt;
}

module.exports = promptForFolderDeletion;