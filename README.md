# hometest-annalise.ai

### Description
This repository contains smoke tests covering the image tagging system requirements. Those tests "hit" the image tagging system's API, following user-like scenarios. The different objects manipulated in those scenarios are images' metadata and image tags (both persisted in a postgres database), as well as actual image files (stored in s3). Those tests not only check the behaviour of the API's endpoints, but also validate that data is persisted.

### Technical considerations  
It was built in Node.js and relies on the jest test framework.
The http requests are built and executed using the supertest module, and the asynchronous nature of those tests is handled using async/await.

## General approach

### Check data persistency
Different strategies are generally available to check data persistency. System level tests "usually" consider the system under test as a black box, with no access to databases. Therefore a choice has been made to <b>use the endpoints themselves within each test, to check that data is persisted</b>. Typically, the creation of an image via the upload endpoint will be verified by using the GET /v1/images/{id} endpoint. It is also a convenient way to check data persistency regardless of the environment under test (local, UAT, PROD). Cons: if the GET /v1/images endpoint fails, the upload test will fail as well.

### Prepare data required for tests
Some tests require already existing images to be present on the API server. We cater for this by <b>using the image created in the first test</b>. This is a convenient way not to rely on pre-existing data (manually created or via scripts), that could be accidentally deleted. Cons: this strongly ties the tests together. Example: if the upload test fails, the following test will fail. A better way to handle this would probably be the automatic creation/cleaning of images/tags each time the tests run.

### How and when to run these tests
Those tests need an actual instance of the image tagging server to run. It seems relevant to run these <b>tests everytime a new version of this API is deployed</b>. This will give direct feedback to the engineer building this new version. They should also run whether the API build is local, on UAT, or even in production. Indeed, those tests will fail if there is any failure in the chain (hardware, network, ..), not only if the code is "broken". Therefore it is valuable to run them in production, where they could not only detect a problem unrelated to the code logic (example: local config pushed by mistake,..), but also problems related to the infratructure (example: server can not connect to database).

A way to achieve that is to <b>trigger a build of the current repository with the right environment variable (not catered for in this hometest), from the API pipeline</b>, right after the API is deployed. 

We can also <b>schedule a recurrent build of this pipeline to run in UAT or PROD</b>, to increase confidence that those environments are stable regarding those system requirements. 

### Limitations and room for improvement
-more complete tests (example: check all fields in responses returned by server)  
-handling of an environment variable (local/UAT/PROD) in config.js file  
-better handling of required data (creation/deletion) before/after tests run (example of side effect with current tests: the "upload" test will keep on creating images, and the "retrieve images" tests will take longer and longer to execute)  
-downloading image file from s3 currently only checks status code (could check that we receive an actual file with correct title and size)  
-check that parameters and requests body are correctly handled by server (400 bad request should be sent)   
-add a test to check that images above 3.96 MB can't be uploaded   

## Installation

### Install Node.js, npm

Node.js/npm: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm

### Install nvm and use Node.js version 12
`$nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.2/install.sh | bash`

`$nvm install 12`

`$nvm use 12`

### Clone this repository

`$ git clone git@github.com:jeremyrovelli/hometest-annalise.ai.git`

### Change to repo directory and install all dependencies

`$ cd hometest-annalise.ai`

`$ npm i`

## Run tests

### Set up the server

Make sure the Image Tagging API is running on http://127.0.0.1:8000

### Script to run smoke tests

The below line will run eslint and jest

`$ npm run test`
