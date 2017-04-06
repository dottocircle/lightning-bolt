#!/usr/bin/env jasmine-node

'use strict';

const utils = require('./utils');
const Tosser = require('./tosser');
const fs = require('fs');

let folder = process.env.folder || '.';
let testEnv = process.env.testEnv || 'qa';

let configFile = `/config/${testEnv}.yaml`;
let config = utils.loadYAMLOrParse(folder, configFile);

config.basePath = folder;
config.testEnv = testEnv;

let docFile = `doc/setup.yaml`;
let doc = utils.loadYAMLOrParse(folder, docFile);

doc.basePath = folder;
utils.writeReadmeFile(doc);

let requestFolders = config.requestFolders || ['requests'];

for (let reqFolder of requestFolders) {
  let path = `${folder}/${reqFolder}`;
  let files = fs.readdirSync(path);
  for (let fileName of files) {
    let requests = utils.loadYAMLOrParse(path, fileName);
    let tosser = new Tosser(config, requests, path + '/' + fileName);
    tosser.tossAll();
  }
}

// Display uncaught Exception.
process.on('uncaughtException', (err) => {
  console.error((new Date()).toUTCString() + ' uncaughtException:', err.message);
  console.error(err.stack);
  process.exit(1);
});
