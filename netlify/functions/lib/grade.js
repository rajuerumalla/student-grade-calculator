'use strict';

const SUBJECTS = [
  { key: 'mathematics', label: 'Mathematics' },
  { key: 'science', label: 'Science' },
  { key: 'english', label: 'English' },
  { key: 'computerScience', label: 'Computer Science' },
  { key: 'socialStudies', label: 'Social Studies' }
];

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
    if (Number(value) < 0 || Number(value) > 100) {
      return `${subject.label} must be between 0 and 100.`;
    }
  }
  return null;
}

function calculateGrades(marks, studentName = '') {
  const subjects = SUBJECTS.map((subject) => {
    const mark = Number(marks[subject.key]);
    return { key: subject.key, label: subject.label, mark, grade: gradeFor(mark), passed: mark >= 35 };
  });
  const total = subjects.reduce((sum, subject) => sum + subject.mark, 0);
  const average = total / subjects.length;
  const percentage = total / 5;
  const passed = subjects.every((subject) => subject.passed);
  return {
    studentName: typeof studentName === 'string' ? studentName.trim().slice(0, 80) : '',
    subjects,
    total,
    percentage,
    average,
    overallGrade: passed ? gradeFor(average) : 'F',
    passed
  };
}

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function json(statusCode, payload) {
  return { statusCode, headers, body: JSON.stringify(payload) };
}

module.exports = { calculateGrades, headers, json, validateMarks };
