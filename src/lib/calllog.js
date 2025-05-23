/**
 * @file Manages the call log.
 */

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto'); // For generating unique IDs

const DATA_DIR = path.join(__dirname, '../../data');
const CALL_LOG_FILE_PATH = path.join(DATA_DIR, 'call_log.json');

/**
 * @typedef {object} CallLogEntry
 * @property {string} id - Unique ID for the call log entry.
 * @property {string} timestamp - ISO 8601 timestamp of the call.
 * @property {string} callerNumber - The caller's phone number.
 * @property {string} callerName - The caller's name.
 * @property {number|null} durationSeconds - Duration of the call in seconds, if applicable.
 * @property {string} actionTaken - Action taken for the call (e.g., 'ALLOWED', 'BLOCKED', 'VOICEMAIL_LEFT', 'HUNG_UP_WHILE_SCREENING').
 * @property {string|null} [voicemailId] - Optional ID of the voicemail if one was left.
 */

/**
 * Ensures the data directory exists.
 */
function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log(`Created data directory: ${DATA_DIR}`);
    } catch (error) {
      console.error(`Error creating data directory ${DATA_DIR}:`, error);
    }
  }
}

/**
 * Reads call logs from the JSON file.
 * @returns {Array<CallLogEntry>} An array of call log entries, or an empty array if file not found/invalid.
 */
function readCallLogsFromFile() {
  ensureDataDirectory();
  try {
    if (fs.existsSync(CALL_LOG_FILE_PATH)) {
      const fileContent = fs.readFileSync(CALL_LOG_FILE_PATH, 'utf-8');
      const logs = JSON.parse(fileContent);
      if (Array.isArray(logs)) {
        return logs;
      }
      console.warn(`Warning: Content of ${CALL_LOG_FILE_PATH} is not an array. Returning empty log.`);
      return [];
    }
  } catch (error) {
    console.warn(`Warning: Error reading or parsing ${CALL_LOG_FILE_PATH}. Returning empty log. Error: ${error.message}`);
  }
  return [];
}

/**
 * Writes call logs to the JSON file.
 * @param {Array<CallLogEntry>} logs - The array of call log entries to write.
 */
function writeCallLogsToFile(logs) {
  ensureDataDirectory();
  try {
    fs.writeFileSync(CALL_LOG_FILE_PATH, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing to ${CALL_LOG_FILE_PATH}:`, error);
  }
}

/**
 * Adds a new entry to the call log.
 * @param {object} entryData - Data for the new call log entry.
 * @param {string} entryData.callerNumber - The caller's phone number.
 * @param {string} entryData.callerName - The caller's name.
 * @param {number|null} [entryData.durationSeconds] - Duration of the call.
 * @param {string} entryData.actionTaken - Action taken for the call.
 * @param {string|null} [entryData.voicemailId] - Optional ID of the voicemail.
 * @param {string} [entryData.timestamp] - Optional ISO 8601 timestamp.
 * @returns {CallLogEntry|null} The added call log entry with ID and timestamp, or null if error.
 */
function addCallLogEntry(entryData) {
  if (!entryData || !entryData.callerNumber || !entryData.actionTaken) {
    console.error('Error: Missing required fields (callerNumber, actionTaken) for call log entry.');
    return null;
  }

  const logs = readCallLogsFromFile();
  const newEntry = {
    id: randomUUID(),
    timestamp: entryData.timestamp || new Date().toISOString(),
    callerNumber: entryData.callerNumber,
    callerName: entryData.callerName || 'Unknown Name',
    durationSeconds: entryData.durationSeconds !== undefined ? entryData.durationSeconds : null,
    actionTaken: entryData.actionTaken,
    voicemailId: entryData.voicemailId !== undefined ? entryData.voicemailId : null,
  };

  logs.push(newEntry);
  writeCallLogsToFile(logs);
  console.log(`Added call log entry: ID ${newEntry.id}, Number ${newEntry.callerNumber}, Action ${newEntry.actionTaken}`);
  return newEntry;
}

/**
 * Retrieves call logs, optionally limited to the most recent entries.
 * @param {number} [limit=50] - The maximum number of log entries to return.
 * @returns {Array<CallLogEntry>} An array of call log entries, sorted newest first (if limit applied).
 */
function getCallLogs(limit = 50) {
  const logs = readCallLogsFromFile();
  // Assuming logs are stored chronologically (oldest first)
  if (logs.length > limit) {
    return logs.slice(logs.length - limit).reverse(); // Get last 'limit' entries, then reverse to make newest first
  }
  return logs.reverse(); // Reverse all entries to make newest first
}

/**
 * Clears all call log entries.
 * Primarily for testing purposes.
 */
function _clearAllCallLogs_TEST_ONLY() {
  writeCallLogsToFile([]);
  console.log('All call logs cleared (for testing).');
}


module.exports = {
  addCallLogEntry,
  getCallLogs,
  _clearAllCallLogs_TEST_ONLY, // Export for test script
};

console.log('calllog.js loaded.');

// For direct testing:
if (require.main === module) {
  console.log("--- Direct Test of calllog.js ---");
  _clearAllCallLogs_TEST_ONLY();
  addCallLogEntry({ callerNumber: '111-222-3333', callerName: 'Test Caller 1', actionTaken: 'BLOCKED' });
  const entry2 = addCallLogEntry({ callerNumber: '444-555-6666', callerName: 'Test Caller 2', actionTaken: 'ALLOWED', durationSeconds: 60 });
  addCallLogEntry({ callerNumber: '777-888-9999', callerName: 'Test Caller 3', actionTaken: 'VOICEMAIL_LEFT', voicemailId: entry2 ? entry2.id : 'dummy_vm_id' }); // Example linking

  const logs = getCallLogs(2);
  console.log("Last 2 logs (newest first):", logs);
  _clearAllCallLogs_TEST_ONLY();
  console.log("--- Direct Test Finished ---");
}
