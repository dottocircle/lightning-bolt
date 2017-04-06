#!/usr/bin/env node

'use strict';

const utils = require('./utils');
let TestDataHandler = require('./testDataHelper');

let folder = process.argv[2] || '.';
let testEnv = process.argv[3] || 'qa';
let operation = process.argv[4];

let configFile = `/config/${testEnv}.yaml`;
let config = utils.loadYAMLOrParse(folder, configFile);

if (config.testDataPath !== undefined) {
  let s3configFile = process.env.file || `${config.s3configPath}`;
  let s3config = utils.loadYAMLOrParse(folder, s3configFile);
  let TestDataHandlerInstance = new TestDataHandler(`${folder}${config.testDataPath}`, s3config);

  if (operation === 'write') {
    TestDataHandlerInstance.writeObjectsToS3();
  } else if (operation === 'delete') {
    TestDataHandlerInstance.deleteObjectsFromS3();
  } else {
    console.log('Invalid Command');
  }
} else {
  console.log('Ops! No s3config');
}
