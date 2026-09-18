const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'source-data', 'Saudi Projects Follow UP - Eslam Mohandes(1).xlsx');
const wb = XLSX.readFile(file, { cellDates: false });

function excelDateToDateStr(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    val = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    if (/^\d{5}$/.test(val)) {
      val = parseInt(val, 10);
    } else {
      const parsed = Date.parse(val);
      if (!isNaN(parsed)) return new Date(parsed).toISOString().split('T')[0];
      return null;
    }
  }
  if (typeof val === 'number') {
    if (val > 60000 || val < 40000) return null;
    const utcDays = Math.floor(val - 25569);
    const utcVal = utcDays * 86400;
    const dateInfo = new Date(utcVal * 1000);
    return dateInfo.toISOString().split('T')[0];
  }
  return null;
}

// 1. Projects Follow UP
const pSheet = wb.Sheets['Projects Follow UP'];
const pData = XLSX.utils.sheet_to_json(pSheet, { header: 1 });
const realProjects = [];

for (let i = 4; i < pData.length; i++) {
  const row = pData[i];
  if (!row || row.length === 0) continue;
  const pr = row[0] ? String(row[0]).trim() : '';
  const opp = row[1] ? String(row[1]).trim() : '';
  if (!opp || opp === '0') continue;

  const clientName = row[2] ? String(row[2]).trim() : '';
  const clientPhone = row[3] ? String(row[3]).trim() : '';
  const companyName = row[4] ? String(row[4]).trim() : '';
  const clientEmail = row[5] ? String(row[5]).trim() : '';
  const stage = row[6] ? String(row[6]).trim() : '';
  const location = row[7] ? String(row[7]).trim() : 'Western Region';
  const status = row[8] ? String(row[8]).trim() : '';
  
  let estValue = 0;
  const rawVal9 = Number(row[9]);
  const rawVal14 = Number(row[14]);
  if (!isNaN(rawVal14) && rawVal14 > 0) estValue = rawVal14;
  else if (!isNaN(rawVal9) && rawVal9 > 0) estValue = rawVal9;

  const actionDone = row[10] ? String(row[10]).trim() : '';
  const actionDate = excelDateToDateStr(row[11]);
  const followUp = row[12] ? String(row[12]).trim() : (row[17] ? String(row[17]).trim() : '');
  const followUpDate = excelDateToDateStr(row[13]) || excelDateToDateStr(row[18]);

  realProjects.push({
    rowIdx: i + 1,
    pr_number: pr,
    name: opp,
    client_name: clientName,
    client_phone: clientPhone,
    company_name: companyName,
    client_email: clientEmail,
    stage,
    location,
    status,
    estimated_value: estValue,
    action_done: actionDone,
    action_date: actionDate,
    follow_up: followUp,
    follow_up_date: followUpDate
  });
}

console.log('REAL PROJECTS COUNT:', realProjects.length);
realProjects.forEach((p, idx) => {
  console.log(`${idx+1}. [${p.pr_number}] ${p.name.slice(0, 40)} | Value: SAR ${p.estimated_value} | Client: ${p.client_name} (${p.company_name}) | Next: ${p.follow_up.slice(0, 30)} (${p.follow_up_date})`);
});

// 2. Hot Leads Headers
const hSheet = wb.Sheets['Hot Leads'];
const hData = XLSX.utils.sheet_to_json(hSheet, { header: 1 });
console.log('\nHOT LEADS ROW 0:', hData[0]);
console.log('HOT LEADS ROW 1:', hData[1]);
console.log('TOTAL HOT LEADS ROWS:', hData.length);
