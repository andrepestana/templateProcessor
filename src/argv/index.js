const yargs = require('yargs');

module.exports.argv = yargs
    .option('template_fileName', {
        alias: 'tfn',
        description: 'Use a single file as a template',
        type: 'string',
    })
    .help()
    .alias('help', 'h')
    .argv;

