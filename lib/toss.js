'use strict';
const frisby = require('frisby');
const utils = require('./utils');
const handlebars = require('handlebars');
const zpad = require('zpad');
const Tester = require('./tester');
const querystring = require('querystring');
const traverse = require('traverse');

handlebars.registerHelper('json', (object) => {
  return JSON.stringify(object);
});

module.exports = class Toss {
  constructor(req, responses, config, plugins, fileName) {
    this.jwt = '';
    this.req = req;
    this.responses = responses;
    this.config = config;
    this.plugins = plugins;
    this.afterPlugin = this.req.afterPlugin;
    this.beforePlugin = this.req.beforePlugin;

    this.fileName = fileName;
    // output folder
    this.outputFolder = `${config.basePath}/output`;
    this.toss = frisby.create(`${fileName} ${req.id} ${req.description}`);
    // arrange request
    this.bindUrl(config.url, req.path, req.query);
    this.bindHeaders(config.basePath, req.headers);
    this.addJwtHeader(config.basePath, req.profile, config.tokenSecret);
    this.bindMethodAndBody(req.method, config.basePath, req.body);
    this.addValidations();
  }

  writeTestCases() {
    utils.writeOnExistingFile(this.config, this.req);
  }

  afterRequests(responses) {
    this.toss.after((err, res, body) => {
      if (err) {
        utils.writeFile(`${this.outputFolder}/errors/${zpad(this.req.id)}.json`, err);
      }
      if (res) {
        utils.writeFile(`${this.outputFolder}/responses/${zpad(this.req.id)}.json`, res);
      }
      if (body) {
        utils.writeFile(`${this.outputFolder}/responses/${zpad(this.req.id)}.body.json`, body);
      }
      let json = utils.parseJsonSafe(body);
      let output = {
        printResponse: JSON.stringify(json, null, 2),
        printJwt: this.jwt
      };

      let reqId = `${zpad(this.req.id)}`;
      this.processPlugins(reqId, output);

      if (this.req.childRequests) {
        responses[this.req.id] = json;
        this.req.childRequests.forEach((child) => {
          let toss = new Toss(child, responses, this.config, this.plugins, this.fileName);
          toss.afterRequests(responses);
          toss.run();
        });
      }
    });
  }

  processPlugins(reqId, output) {
    let func;
    let functionName;
    let args;
    if (this.afterPlugin) {
      if (typeof this.afterPlugin === 'object') {
        for (let plugin of this.afterPlugin) {
          func = plugin.split(',');
          functionName = func[0];
          args = func;

          args[0] = output[functionName];

          // request id will be provided to all plugins as last argument/parameter
          args.push(reqId);
          this.plugins[functionName].apply(null, args);
        }
      } else {
        func = this.afterPlugin.split(',');
        functionName = func[0];
        args = func;
        args[0] = output[functionName];

        // request id will be provided to all plugins as last argument/parameter
        args.push(reqId);
        this.plugins[functionName].apply(null, args);
      }
    }
  }

  addValidations() {
    let testerInstance = new Tester();
    let val = this.req.validate;

    // This will allow environment based custom
    // validation at any level of `req.validate` object
    let pathsArray = traverse(val).paths();
    for (let path of pathsArray) {
      for (let key of path) {
        if (key.includes('.')) {
          let env = key.split('.')[0];
          let customObj;
          for (let index = 0; index < path.length; index++) {
            if (!customObj) {
              customObj = val[path[index]];
              if (index === path.length - 1) {
                if (this.config.testEnv.includes(env)) {
                  // only overwrite if specified custom `env.key=value`
                  // node is defined for current test environment.
                  val[path[index].split('.')[1]] = customObj;
                }
                // delete custom `env.key=value` node
                // otherwise Frisby validation will throw Exception
                // because this node will not be present in actual response
                delete val[path[index]];
              }
            } else {
              if (index === path.length - 1) {
                if (env.includes(this.config.testEnv)) {
                  // only overwrite if specified custom `env.key=value`
                  // node is defined for current test environment.
                  customObj[path[index].split('.')[1]] = customObj[path[index]];
                }
                // delete custom `env.key=value` node
                delete customObj[path[index]];
              } else {
                customObj = customObj[path[index]];
              }
            }
          }
        }
      }
    }

    if (val.statusCode) {
      this.toss.expectStatus(parseInt(val.statusCode, 10));
    }
    if (val.headers) {
      let headers = this.bindResponses(val.headers);
      Object.keys(headers).forEach((key) => {
        this.toss.expectHeaderContains(key, headers[key]);
      });
    }
    if (val.jsonContains) {
      let json = utils.loadFile(this.config.basePath, val.jsonContains);
      let values = this.bindResponses(json);
      this.toss.expectJSON(values);
    }
    if (val.jsonNotContains) {
      let json = utils.loadFile(this.config.basePath, val.jsonNotContains);
      let values = this.bindResponses(json);
      this.toss.afterJSON(function after(body) {
        testerInstance.jsonNotContains(body, values);
      });
    }
    if (val.jsonSchema) {
      let json = utils.loadFile(this.config.basePath, val.jsonSchema);
      json = this.replaceValues(json);
      this.toss.expectJSONTypes(json);
    }
    if (val.jsonSchemaFile) {
      require(`${process.cwd()}/${this.config.basePath}/${val.jsonSchemaFile}`)(this.toss);
    }
  }

  replaceValues(json) {
    if (!json) {
      return json;
    }
    for (let key of Object.keys(json)) {
      let value = json[key];
      if (typeof(value) === 'object') {
        json[key] = this.replaceValues(json[key]);
      }
      if (value === 'undefined') {
        json[key] = undefined;
      }
      if (value === 'number') {
        json[key] = Number;
      }
      if (value === 'boolean') {
        json[key] = Boolean;
      }
      if (value === 'array') {
        json[key] = Array;
      }
      if (value === 'object') {
        json[key] = Object;
      }
      if (value === 'NaN') {
        json[key] = NaN;
      }
    }
    return json;
  }

  bindMethodAndBody(method, basePath, body) {
    let met = method.toLowerCase();
    if (met === 'put' || met === 'post' || met === 'delete') {
      let parsedBody = utils.loadJsonOrParse(basePath, body) || {};
      parsedBody = this.bindResponses(parsedBody);
      if (parsedBody) {
        utils.writeFile(`${this.outputFolder}/
          requestbody/${zpad(this.req.id)}.body.json`, parsedBody);
      }
      this.toss[met](this.fullUrl, parsedBody, {json: typeof parsedBody === 'object'});
    } else {
      this.toss[met](this.fullUrl);
    }
  }

  bindUrl(url, path, queryParams) {
    let defaultPath = this.config.defaultPath || '';
    let params = '';
    if (typeof queryParams === 'object') {
      params = querystring.stringify(queryParams);
    } else {
      params = queryParams;
    }

    let query = params ? '?' + params : '';
    this.fullUrl = `${url}/${defaultPath}${path}${query}`;
    this.fullUrl = this.bindResponses(this.fullUrl);
  }

  bindHeaders(basePath, headersOrJson) {
    if (headersOrJson) {
      let headers = utils.loadJsonOrParse(basePath, headersOrJson);
      headers = this.bindResponses(headers);
      this.toss.addHeaders(headers);
    }
  }

  bindResponses(input) {
    let template = input;
    let response = template;
    let isObj = typeof template === 'object';
    if (isObj) {
      template = JSON.stringify(template);
    }
    if (this.req.dependsOn) {
      let compiled = handlebars.compile(template);
      response = compiled(this.responses);
    }
    return utils.parseJsonSafe(response);
  }

  addJwtHeader(basePath, profileOrJson, secret) {
    if (profileOrJson) {
      let profile = utils.loadJsonOrParse(basePath + '/profiles', profileOrJson);
      profile = this.bindResponses(profile);
      let jwt = utils.createJwt(profile, secret);
      if (jwt) {
        this.toss.addHeader('authorization', `Bearer ${jwt}`);
        this.jwt = `Bearer ${jwt}`;
      }
    }
  }

  run() {
    this.toss.toss();
  }
};
