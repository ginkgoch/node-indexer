#! /usr/bin/env node

import yargs from 'yargs';
import { buildIndex } from "./commands/Build";

function main() {
    yargs.command('build', 
        'Build spatial index for a specific shapefile or all shapefiles in a folder',
        (args) => {
            return yargs.option('source', {
                alias: 's',
                desc: 'The source file or directly path to build index',
                required: true
            }).option('output', {
                alias: 'o',
                desc: 'The destination file or folder to store generated index files'
            }).option('overwrite', {
                alias: 'w',
                desc: 'Overwrite the files if exist',
                type: 'boolean',
                default: false
            });
        }, (args) => {
            buildIndex(args);
        })
        .help('h', 'Show help')
        .version('v', '1.0.0').argv;
}

main();