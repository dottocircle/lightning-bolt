'use strict';

let aws = require('aws-sdk');

class S3TestingHandler {
  constructor(pathBuilder) {
    this.pathBuilder = pathBuilder;

    this.s3 = new aws.S3({
      // TODO: We will need to support read only and read-write keys eventually
      accessKeyId: pathBuilder.getAccessKeyReadWrite(),
      secretAccessKey: pathBuilder.getSecretKeyReadWrite(),
      region: pathBuilder.getRegion()
    });
  }

  putObject(key, body) {
    let params = {
      Bucket: this.pathBuilder.getBucketName(),
      Key: key,
      Body: body,
      ACL: 'public-read'
    };

    return new Promise((resolve, reject) => {
      this.s3.putObject(params, (err, data) => {
        console.log('Write: ' + key);
        if (err) {
          reject(err);
        } else {
          resolve({
            // fileName: fileName,
            data: data
          });
        }
      });
    });
  }

  deleteObject(key) {
    let params = {
      Bucket: this.pathBuilder.getBucketName(),
      Key: key
    };

    return new Promise((resolve, reject) => {
      this.s3.deleteObject(params, (err, data) => {
        console.log('Delete: ' + key);
        if (err) {
          reject(err);
        } else {
          resolve({
            // fileName: fileName,
            data: data
          });
        }
      });
    });
  }
}

module.exports = S3TestingHandler;
