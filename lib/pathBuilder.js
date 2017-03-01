'use strict';

class PathBuilder {
  constructor(config) {
    this.config = config;
    this.env = config.services.s3.bucketEnv;
    this.biz = config.services.s3.biz;
    this.sbu = config.services.s3.sbu;
    this.accessKeyId = config.services.s3.accessKeyReadWrite;
    this.secretAccessKey = config.services.s3.secretKeyReadWrite;
    this.region = config.services.s3.region;
  }

  getBucketName() {
    let path = `${this.config.services.s3.bucketPrefix}-${this.env}-${this.biz}-${this.sbu}`;
    return path.toLowerCase();
  }

  getAccessKeyReadWrite() {
    return this.accessKeyId;
  }

  getSecretKeyReadWrite() {
    return this.secretAccessKey;
  }

  getRegion() {
    return this.region;
  }
}

module.exports = PathBuilder;
