'use strict';

const fs = require('fs');
const path = require('path');
const ext = require('extfs');

let PathBuilder = require('./pathBuilder');
let S3TestingHandler = require('./s3Helper');

let PathBuilderInstance = '';
let S3TestingHandlerInstance = '';

class TestDataHandler {

  constructor(dataDir, s3config) {
    this.dataDir = dataDir;
    PathBuilderInstance = new PathBuilder(s3config);
    S3TestingHandlerInstance = new S3TestingHandler(PathBuilderInstance);
  }

  writeObjectsToS3() {
    let fileBuffer = '';
    let data = this.getFiles(this.dataDir);
    console.log('Start Write');
    for (let index in data) {
      if (data.hasOwnProperty(index)) {
        if (!path.isAbsolute(data[index])) {
          fileBuffer = fs.readFileSync(__dirname + '/../' + data[index], 'utf-8');
        } else {
          fileBuffer = fs.readFileSync(data[index], 'utf-8');
        }
        let objectPath = data[index].substr(data[index].indexOf('data') + 5);
        // put our yaml file on s3
        S3TestingHandlerInstance.putObject(objectPath, fileBuffer);
      }
    }
  }

  deleteObjectsFromS3() {
    let data = this.getFiles(this.dataDir);
    console.log('Start Delete');
    for (let index in data) {
      if (data.hasOwnProperty(index)) {
        let objectPath = data[index].substr(data[index].indexOf('data') + 5);
        // delete file from s3
        S3TestingHandlerInstance.deleteObject(objectPath);
      }
    }
  }

  getFiles(dir, files_) {
    let getFiles = files_ || [];
    let files = fs.readdirSync(dir);
    for (let index in files) {
      if (files.hasOwnProperty(index)) {
        let name = dir + '/' + files[index];
        if (fs.statSync(name).isDirectory()) {
          this.getFiles(name, getFiles);
          if (ext.isEmptySync(name)) {
            // files_.push(name.substr(2));
          }
        } else {
          // if (path.extname(files[index]) === '.yaml') {
          getFiles.push(name);
          // }
        }
      }
    }
    return getFiles;
  }
}

module.exports = TestDataHandler;
