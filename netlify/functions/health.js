'use strict';

const { json } = require('./lib/grade');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(204, {});
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed.' });
  return json(200, { status: 'ok', service: 'gradepilot-api' });
};
