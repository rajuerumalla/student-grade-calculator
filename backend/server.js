'use strict';

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const SUBJECTS = [
  { key: 'mathematics', label: 'Mathematics' },
  { key: 'science', label: 'Science' },
  { key: 'english', label: 'English' },
  { key: 'computerScience', label: 'Computer Science' },
  { key: 'socialStudies', label: 'Social Studies' }
];

function allowedOrigins() {
  return (process.env.FRONTEND_ORIGIN || process.env.CORS_ORIGIN || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const origins = allowedOrigins();
app.use(cors({
  origin(origin, callback) {
    if (!origin || origins.includes('*') || origins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS.'));
  }
}));
app.use(express.json({ limit: '10kb' }));

function gradeFor(mark) {
  if (mark >= 90) return 'A+';
  if (mark >= 80) return 'A';
  if (mark >= 70) return 'B';
  if (mark >= 60) return 'C';
  if (mark >= 50) return 'D';
  if (mark >= 35) return 'E';
  return 'F';
}

function validateMarks(marks) {
  if (!marks || typeof marks !== 'object' || Array.isArray(marks)) {
    return 'marks must be an object containing all five subjects.';
  }

  for (const subject of SUBJECTS) {
    const value = marks[subject.key];
    if (value === '' || value === null || value === undefined || !Number.isFinite(Number(value))) {
      return `${subject.label} must be a number from 0 to 100.`;
    }
    const numericValue = Number(value);
    if (numericValue < 0 || numericValue > 100) {
      return `${subject.label} must be between 0 and 100.`;
    }
  }

  return null;
}

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'gradepilot-api' });
});

app.post('/api/calculate', (request, response) => {
  const { marks, studentName = '' } = request.body || {};
  const validationError = validateMarks(marks);
  if (validationError) {
    return response.status(400).json({ error: validationError });
  }

  const subjects = SUBJECTS.map((subject) => {
    const mark = Number(marks[subject.key]);
    return { key: subject.key, label: subject.label, mark, grade: gradeFor(mark), passed: mark >= 35 };
  });
  const total = subjects.reduce((sum, subject) => sum + subject.mark, 0);
  const average = total / subjects.length;
  const percentage = total / 5;
  const passed = subjects.every((subject) => subject.passed);

  return response.json({
    success: true,
    data: {
      studentName: typeof studentName === 'string' ? studentName.trim().slice(0, 80) : '',
      subjects,
      total,
      percentage,
      average,
      overallGrade: passed ? gradeFor(average) : 'F',
      passed
    }
  });
});

app.use((_request, response) => {
  response.status(404).json({ error: 'Route not found.' });
});

app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return response.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  if (error.message === 'Origin is not allowed by CORS.') {
    return response.status(403).json({ error: error.message });
  }
  return response.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`GradePilot API listening on port ${PORT}`);
});
