/* istanbul ignore file */

const { safeLoad } = require('js-yaml'); // eslint-disable-line
const { readFileSync } = require('fs');
const { join } = require('path');

const { dynamoDB } = require('../client');

const loadYaml = () => safeLoad(readFileSync(join(__dirname, 'serverless.yml'), 'utf8'));

const index = async () => {
  const properties = [];

  const sls = loadYaml();

  Object.keys(sls.resources.Resources).forEach((name) => {
    properties.push({
      ...sls.resources.Resources[name].Properties,
      TableName: sls.resources.Resources[name].Properties.TableName.replace('${self:provider.stage}', 'dev'), // eslint-disable-line
    });
  });

  await Promise.all(properties.map((property) => dynamoDB.createTable(property).promise()));
};

const clear = async () => {
  const sls = loadYaml();

  const properties = [];

  Object.keys(sls.resources.Resources).forEach((name) => {
    properties.push({
      TableName: sls.resources.Resources[name].Properties.TableName.replace('${self:provider.stage}', 'dev'), // eslint-disable-line
    });
  });

  await Promise.all(properties.map((property) => dynamoDB.deleteTable(property).promise()));
};

module.exports = {
  init: index,
  clear,
};
