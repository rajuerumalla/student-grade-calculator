'use strict';

const { calculateGrades, json, validateMarks } = require('./lib/grade');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(204, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });

  let body;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (_error) {
    return json(400, { error: 'Request body must be valid JSON.' });
  }

  const validationError = validateMarks(body.marks);
  if (validationError) return json(400, { error: validationError });
  return json(200, { success: true, data: calculateGrades(body.marks, body.studentName) });
};
