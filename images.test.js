
const request = require('supertest');
const fs = require('fs');
const {expect} = require('@jest/globals');

// set up variables that contains details of the image used throughout the tests
// (according to the data creation strategy described in README.MD)
let imageId;
// use a unique filename, based on current time
const filename = 'image-test-upload-'+Date.now()+'.dcm';

// check that users can upload a new image
test('upload a new image', async () => {
  // TODO: prepare image in base64
  const imageBase64 = fs.readFileSync('samples/image-00000.dcm', 'base64');

  // create the body for the upload request
  const body = {
    'filename': filename,
    'image_data': imageBase64,
    'tags': ['foo', 'bar'],
  };

  // TODO (improvement): put root url as a configuration variable in config.js
  // (to reach either local, UAT, or even PROD)
  const responseUpload = await request('localhost:8000')
      .post('/v1/upload')
      .set('Accept', 'application/json')
      .send(body);

  // check fields in response
  expect(responseUpload.headers['content-type']).toEqual('application/json');
  expect(responseUpload.status).toEqual(200);
  expect(responseUpload.body.filename).toEqual(filename);
  // TODO (improvement): check that tags are correct

  // store id for future verification in postgres and s3
  imageId = responseUpload.body.id;
  expect(imageId).not.toBeNull();

  // data persistence: check that the image was created correctly in postgres
  const responseGet = await request('localhost:8000')
      .get(`/v1/images/${imageId}`)
      .set('Accept', 'application/json');

  expect(responseGet.headers['content-type']).toEqual('application/json');
  expect(responseGet.status).toEqual(200);
  expect(responseGet.body.filename).toEqual(filename);
  // TODO (improvement): check that tags are correct
  const imageUrl = responseGet.body.url;
  expect(imageUrl).toMatch(new RegExp(`^http?`));
  expect(imageUrl).toContain(filename);

  // data persistence: check that the image was correctly uploaded to s3
  const responseGetS3 = await request(imageUrl)
      .get('');

  expect(responseGetS3.status).toEqual(200);
  // TODO (improvement): check that an actual file is downloaded
  // and size is not zero.
});

// TODO (improvement): add a test to check max size for uploaded file

// check that users can update tags for an uploaded image
// notes: we rely on the image uploaded in previous test
test('update tags for existing image', async () => {
  // create the body for the get image request
  const body = {
    'tags': ['foo-x', 'bar-x'],
  };

  const responseUpdate = await request('localhost:8000')
      .put(`/v1/images/${imageId}`)
      .set('Accept', 'application/json')
      .send(body);

  // optional: check that filename is correct,
  // to increase confidence that we are considering the correct image
  expect(responseUpdate.body.filename).toEqual(filename);

  expect(responseUpdate.status).toEqual(200);
  expect(responseUpdate.headers['content-type']).toEqual('application/json');

  // check that new tags are correct
  const newTags = responseUpdate.body.tags;
  expect(newTags).not.toBeNull();

  // store tags names in variable
  const newTagsNames = [];
  for (let i = 0; i < newTags.length; i++) {
    newTagsNames.push(newTags[i].name);
  }

  // check that new tags have been added,
  // and previous tags (foo, bar) are not present anymore
  expect(newTagsNames).toEqual(expect.arrayContaining(['foo-x', 'bar-x']));
  expect(newTagsNames).toEqual(expect.not.arrayContaining(['foo']));
  expect(newTagsNames).toEqual(expect.not.arrayContaining(['bar']));
});
