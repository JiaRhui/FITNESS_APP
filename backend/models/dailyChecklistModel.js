const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'dailyChecklist.json');

function getDailyChecklistConfig() {
  const rawData = fs.readFileSync(dataPath, 'utf8');
  return JSON.parse(rawData);
}

module.exports = {
  getDailyChecklistConfig,
};
