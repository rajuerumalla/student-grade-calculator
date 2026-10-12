(() => {
  'use strict';

  const subjects = [
    { key: 'mathematics', label: 'Mathematics', inputId: 'mathematics', errorId: 'mathematics-error' },
    { key: 'science', label: 'Science', inputId: 'science', errorId: 'science-error' },
    { key: 'english', label: 'English', inputId: 'english', errorId: 'english-error' },
    { key: 'computerScience', label: 'Computer Science', inputId: 'computer-science', errorId: 'computer-science-error' },
    { key: 'socialStudies', label: 'Social Studies', inputId: 'social-studies', errorId: 'social-studies-error' }
  ];

  const form = document.querySelector('#grade-form');
  const resetButton = document.querySelector('#reset-button');
  const printButton = document.querySelector('#print-button');
  const statusMessage = document.querySelector('#form-status');
  const breakdown = document.querySelector('#breakdown');
  const overallStatus = document.querySelector('#overall-status');
  const resultElements = {
    percentage: document.querySelector('#percentage-value'),
    total: document.querySelector('#total-value'),
    average: document.querySelector('#average-value'),
    grade: document.querySelector('#grade-value'),
    greeting: document.querySelector('#greeting'),
    note: document.querySelector('#score-note'),
    ring: document.querySelector('#score-ring')
  };
  const apiBaseUrl = String(window.GRADEPILOT_API_BASE_URL || '').trim().replace(/\/$/, '');

  const formatNumber = (value) => Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');

  function gradeFor(mark) {
    if (mark >= 90) return 'A+';
    if (mark >= 80) return 'A';
    if (mark >= 70) return 'B';
    if (mark >= 60) return 'C';
    if (mark >= 50) return 'D';
    if (mark >= 35) return 'E';
    return 'F';
  }

  function getMark(subject) {
    const input = document.getElementById(subject.inputId);
    const error = document.getElementById(subject.errorId);
    const field = input.closest('.field-group');
    const rawValue = input.value.trim();
    let message = '';
    let value = null;
    if (!rawValue) message = 'Enter a mark to continue.';
    else if (!Number.isFinite(Number(rawValue))) message = 'Use a valid number.';
    else if (Number(rawValue) < 0 || Number(rawValue) > 100) message = 'Marks must be between 0 and 100.';
    else { value = Number(rawValue); }
    error.textContent = message;
    field.classList.toggle('has-error', Boolean(message));
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    return value;
  }

  function renderResults(name, marks, apiResult = null) {
    const localTotal = marks.reduce((sum, mark) => sum + mark, 0);
    const localAverage = localTotal / marks.length;
    const localPercentage = localTotal / 5;
    const localPassed = marks.every((mark) => mark >= 35);
    const total = apiResult?.total ?? localTotal;
    const average = apiResult?.average ?? localAverage;
    const percentage = apiResult?.percentage ?? localPercentage;
    const passed = apiResult?.passed ?? localPassed;
    const overallGrade = apiResult?.overallGrade ?? (passed ? gradeFor(average) : 'F');
    resultElements.percentage.textContent = `${formatNumber(percentage)}%`;
    resultElements.total.innerHTML = `${formatNumber(total)} <small>/ 500</small>`;
    resultElements.average.innerHTML = `${formatNumber(average)} <small>/ 100</small>`;
    resultElements.grade.textContent = apiResult?.overallGrade || overallGrade;
    resultElements.greeting.textContent = name ? `${name}'s result is ready` : 'Your result is ready';
    resultElements.note.textContent = passed ? 'Every subject meets the 35-mark pass requirement.' : 'One or more subjects are below the 35-mark pass requirement.';
    resultElements.ring.style.background = `conic-gradient(var(--blue) ${percentage}%, #e6eaff ${percentage}% 100%)`;
    resultElements.ring.style.border = '8px solid transparent';
    resultElements.ring.style.backgroundClip = 'padding-box';
    overallStatus.textContent = passed ? 'Pass' : 'Fail';
    overallStatus.className = passed ? 'status-pass' : 'status-fail';
    printButton.disabled = false;

    breakdown.replaceChildren();
    subjects.forEach((subject, index) => {
      const apiSubject = apiResult?.subjects?.[index];
      const mark = apiSubject?.mark ?? marks[index];
      const subjectPassed = apiSubject?.passed ?? mark >= 35;
      const subjectGrade = apiSubject?.grade ?? gradeFor(mark);
      const row = document.createElement('div');
      row.className = 'subject-result';
      const label = document.createElement('span'); label.className = 'subject-result-name'; label.textContent = subject.label;
      const score = document.createElement('span'); score.className = 'subject-result-score'; score.textContent = `${formatNumber(mark)} / 100`;
      const grade = document.createElement('span'); grade.className = `grade-pill${subjectPassed ? '' : ' fail'}`; grade.textContent = subjectGrade;
      const result = document.createElement('span'); result.className = subjectPassed ? 'pass-label' : 'fail-label'; result.textContent = subjectPassed ? 'Pass' : 'Fail';
      row.append(label, score, grade, result);
      breakdown.append(row);
    });
  }

  async function calculateWithApi(name, marks) {
    if (!apiBaseUrl) return null;
    const markPayload = subjects.reduce((result, subject, index) => {
      result[subject.key] = marks[index];
      return result;
    }, {});
    const response = await fetch(`${apiBaseUrl}/api/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentName: name, marks: markPayload })
    });
    if (!response.ok) throw new Error('The grade API returned an error.');
    const payload = await response.json();
    if (!payload.success || !payload.data) throw new Error('The grade API returned an invalid response.');
    return payload.data;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const marks = subjects.map(getMark);
    const hasErrors = marks.some((mark) => mark === null);
    if (hasErrors) {
      statusMessage.textContent = 'Please correct the highlighted fields before calculating.';
      const firstInvalid = subjects.map((subject) => document.getElementById(subject.inputId)).find((input) => input.getAttribute('aria-invalid') === 'true');
      firstInvalid?.focus();
      return;
    }
    const studentName = document.querySelector('#student-name').value.trim();
    statusMessage.textContent = '';
    try {
      const apiResult = await calculateWithApi(studentName, marks);
      renderResults(studentName, marks, apiResult);
    } catch (error) {
      // The local calculator remains available if the API is not running or is temporarily unavailable.
      renderResults(studentName, marks);
      statusMessage.textContent = 'API unavailable; showing the locally calculated result.';
    }
    document.querySelector('#result-title').focus?.();
  });

  resetButton.addEventListener('click', () => {
    form.reset();
    subjects.forEach((subject) => { const input = document.getElementById(subject.inputId); input.setAttribute('aria-invalid', 'false'); document.getElementById(subject.errorId).textContent = ''; input.closest('.field-group').classList.remove('has-error'); });
    statusMessage.textContent = '';
    resultElements.percentage.textContent = '—'; resultElements.total.innerHTML = '— <small>/ 500</small>'; resultElements.average.innerHTML = '— <small>/ 100</small>'; resultElements.grade.textContent = '—'; resultElements.greeting.textContent = 'Your result will appear here'; resultElements.note.textContent = 'Complete all five subject fields to see your breakdown.'; resultElements.ring.removeAttribute('style'); overallStatus.textContent = 'Awaiting marks'; overallStatus.className = 'result-status status-neutral'; printButton.disabled = true;
    breakdown.replaceChildren(Object.assign(document.createElement('p'), { className: 'empty-breakdown', textContent: 'Calculate your result to see subject grades.' }));
    document.querySelector('#student-name').focus();
  });

  printButton.addEventListener('click', () => window.print());
  subjects.forEach((subject) => document.getElementById(subject.inputId).addEventListener('input', () => { if (document.getElementById(subject.inputId).getAttribute('aria-invalid') === 'true') getMark(subject); }));
})();
