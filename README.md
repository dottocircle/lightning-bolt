# lightning-bolt

## What is this?
lightning-bolt is a jasmine-node based API test framework using Frisby.

## Features
* Support custom request in YAML file.
* Ability to process multiple request files.
* Can validate Headers, Response Code and Content (Positive and Negative).
* Supports command line switch of Test Environment (default QA).
* Can write and delete Test Data in s3 Bucket.
* Supports custom plugins.
* Supports multiple dependent request.
* Supports multiple query and path parameters.
* Can outputs responses body, jwt.
* Auto generate test doc as README.md
* Supports JWTs

## Regression Suite Folder Structure

    .
    ├── ...
    ├── config                            # Config files for different test env.
    │   ├── qa.yaml                       # Config for QA test env.
    │   ├── stg.yaml                      # Config for Staging test env.
    │   ├── prod.yaml                     # Config for Production test env.
    │   ├── gateway-qa.yaml               # Config for Gateway QA test env.
    │   ├── gateway-stg.yaml              # Config for Gateway Staging test env.
    │   ├── gateway-prod.yaml             # Config for Gateway Production test env.
    │   └── ...
    ├── data                              # Test data files for s3 bucket [optional]
    │   └── ...
    ├── doc                               # Files contain data for auto generated Readme.md file
    │   ├── setup.yaml                    # Contain Business Rules and Run command
    │   └── ...
    ├── request                           # Request files (YAML) for API calls
    │   ├── requestOne.yaml               # YAML file contains api request parameters (id, method, path, profile...)
    │   ├── requestTwo.yaml               # YAML file contains api request parameters (id, method, path, profile...)
    │   └── ...
    ├── s3config                          # Contains s3 bucket config files, required for Test Data Write
    │   ├── default.yaml                  # s3 bucket config for default env (QA)
    │   ├── qa.yaml                       # s3 bucket config for QA env
    │   ├── stg.yaml                      # s3 bucket config for STG env
    │   ├── prod.yaml                     # s3 bucket config for PROD env
    │   └── ...
    ├── schema                            # Contains JSON schema files, used for response validation
    │   ├── schema.json
    │   └── ...
    ├── profile                           # Contains JSON user-profile files, used for JWT creation
    │   ├── user-profile.json
    │   └── ...
    ├── plugins                           # Contains plugins JS files, used for custom response validation
    │   ├── plugins.js
    │   └── ...
    └── ...
    
## Request Template
[template.yaml] (https://github.com/mkhan004/lightning-bolt/blob/develop/template.yaml) Specifies all supported configuration for request file.

## Integration & Setup Instructions for Supported API
* Collect latest Matching Regression Test suite from [Api.Automation.Suite] (https://github.com/mkhan004/Api.Automation.Suite).
* For First Time Setup
    * Locally install `lightning-bolt` and save as devDependency.
    ```
    npm install lightning-bolt --save
    npm install -g jasmine-node
    ```
    * Add following Script argument in package.json
    ```
    "scripts": {
        "test": "./node_modules/.bin/lightning-bolt . --config folder :regressionSuitePath --config testEnv :targetTestEnv"
    }
    ```
* For Existing Setup
    * Just run `npm install`
* To Execute Test `npm test`.

## Run Test Locally From [Api.Automation.Suite] (https://github.com/mkhan004/Api.Automation.Suite)
* Clone [Api.Automation.Suite] (https://github.com/mkhan004/Api.Automation.Suite)
* `cd` to [Api.Automation.Suite] (https://github.com/mkhan004/Api.Automation.Suite)
* To run test using `npm`
    * Update package.json Script's `test` argument value for target API
    ```
    "scripts": {
        "test": "./node_modules/.bin/lightning-bolt . --config folder :regressionSuitePath --config testEnv :targetTestEnv"
    }
    ```
    * To run test
    ```
    npm install
    npm test
    ```
* To run test from Command Line:
    * To run test
    ```
    npm install -g jasmine-node
    npm install
    ./node_modules/.bin/lightning-bolt . --config folder :regressionSuitePath --config testEnv :targetTestEnv
    ```

## Run Test directly from `lightning-bolt`
* Clone this [lightning-bolt] (https://github.com/mkhan004/lightning-bolt) repo.
* `cd` within `lightning-bolt`.
* To Run Test
```
npm install -g jasmine-node
npm install
npm link
lightning-bolt . --config folder :regressionSuitePath --config testEnv :targetTestEnv
```

## bolt-writer
If you want to publish fresh copy of your Test Data in s3 bucket then first you need to `delete` existing Test Data then `write` new data.
<b>Note:</b> You may need to wait until default caching time is over to get new data in API response.

### To Write Test Data
```
bolt-writer :regressionSuitePath :env write
```

### To Delete Test Data
```
bolt-writer :regressionSuitePath :env delete
```
