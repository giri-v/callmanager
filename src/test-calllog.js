/**
 * @file Tests the call log management system.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const calllog = require('./lib/calllog');

const DATA_DIR = path.join(__dirname, '../data');
const CALL_LOG_FILE_PATH = path.join(DATA_DIR, 'call_log.json');

// Helper to clean up data files
function cleanupTestData() {
  console.log('Cleaning up call log test data file...');
  if (fs.existsSync(CALL_LOG_FILE_PATH)) {
    fs.unlinkSync(CALL_LOG_FILE_PATH);
  }
  // Ensure data directory exists for subsequent tests
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Helper to require calllog module uncached to get fresh state if needed (though less critical here)
function requireUncachedCalllog() {
  delete require.cache[require.resolve('./lib/calllog')];
  return require('./lib/calllog');
}

async function runTests() {
  console.log('--- Starting Call Log Management Tests ---');

  // Initial cleanup
  cleanupTestData();
  let currentCalllog = requireUncachedCalllog();

  // Test 1: Add Call Log Entries
  console.log('\n--- Test 1: Add Call Log Entries ---');
  const entry1Data = { callerNumber: '5550001111', callerName: 'Caller Alpha', actionTaken: 'BLOCKED' };
  const entry1 = currentCalllog.addCallLogEntry(entry1Data);
  assert.ok(entry1 && entry1.id, 'Test 1.1 FAILED: addCallLogEntry should return the entry with an ID.');
  assert.strictEqual(entry1.callerNumber, entry1Data.callerNumber, 'Test 1.2 FAILED: Caller number mismatch.');
  assert.strictEqual(entry1.actionTaken, entry1Data.actionTaken, 'Test 1.3 FAILED: Action taken mismatch.');

  // Verify file content directly
  let rawLogs = JSON.parse(fs.readFileSync(CALL_LOG_FILE_PATH, 'utf-8'));
  assert.strictEqual(rawLogs.length, 1, 'Test 1.4 FAILED: Log file should contain 1 entry.');
  assert.strictEqual(rawLogs[0].id, entry1.id, 'Test 1.5 FAILED: Log file content ID mismatch.');

  const entry2Data = { callerNumber: '5550002222', callerName: 'Caller Beta', actionTaken: 'ALLOWED', durationSeconds: 120 };
  const entry2 = currentCalllog.addCallLogEntry(entry2Data);
  assert.ok(entry2 && entry2.id, 'Test 1.6 FAILED: Second entry should have an ID.');
  rawLogs = JSON.parse(fs.readFileSync(CALL_LOG_FILE_PATH, 'utf-8'));
  assert.strictEqual(rawLogs.length, 2, 'Test 1.7 FAILED: Log file should contain 2 entries.');
  assert.strictEqual(rawLogs[1].callerName, entry2Data.callerName, 'Test 1.8 FAILED: Second entry name mismatch in file.');
  assert.strictEqual(rawLogs[1].durationSeconds, 120, 'Test 1.9 FAILED: Second entry duration mismatch in file.');

  const entry3Data = { callerNumber: '5550003333', actionTaken: 'VOICEMAIL_LEFT', voicemailId: 'vm-id-123' };
  const entry3 = currentCalllog.addCallLogEntry(entry3Data);
  assert.ok(entry3 && entry3.id, 'Test 1.10 FAILED: Third entry should have an ID.');
  rawLogs = JSON.parse(fs.readFileSync(CALL_LOG_FILE_PATH, 'utf-8'));
  assert.strictEqual(rawLogs.length, 3, 'Test 1.11 FAILED: Log file should contain 3 entries.');
  assert.strictEqual(rawLogs[2].voicemailId, 'vm-id-123', 'Test 1.12 FAILED: Third entry voicemailId mismatch in file.');
  assert.strictEqual(rawLogs[2].callerName, 'Unknown Name', 'Test 1.13 FAILED: Default caller name not set.');

  console.log('Test 1 PASSED: addCallLogEntry works and persists to file.');

  // Test 2: Get Call Logs
  console.log('\n--- Test 2: Get Call Logs ---');
  let fetchedLogs = currentCalllog.getCallLogs(); // Default limit 50
  assert.strictEqual(fetchedLogs.length, 3, 'Test 2.1 FAILED: getCallLogs should return 3 entries.');
  // getCallLogs returns newest first
  assert.strictEqual(fetchedLogs[0].id, entry3.id, 'Test 2.2 FAILED: Logs not sorted newest first by default.');
  assert.strictEqual(fetchedLogs[2].id, entry1.id, 'Test 2.3 FAILED: Oldest log incorrect in default get.');

  // Test with limit
  fetchedLogs = currentCalllog.getCallLogs(2);
  assert.strictEqual(fetchedLogs.length, 2, 'Test 2.4 FAILED: getCallLogs with limit 2 should return 2 entries.');
  assert.strictEqual(fetchedLogs[0].id, entry3.id, 'Test 2.5 FAILED: Newest log incorrect with limit 2.');
  assert.strictEqual(fetchedLogs[1].id, entry2.id, 'Test 2.6 FAILED: Second newest log incorrect with limit 2.');

  // Test with limit greater than available logs
  fetchedLogs = currentCalllog.getCallLogs(10);
  assert.strictEqual(fetchedLogs.length, 3, 'Test 2.7 FAILED: getCallLogs with limit 10 should return all 3 entries.');
  console.log('Test 2 PASSED: getCallLogs works with and without limit, and sorts correctly.');

  // Test 3: Missing required fields for addCallLogEntry
  console.log('\n--- Test 3: Add Call Log Entry with Missing Fields ---');
  const missingFieldEntry = currentCalllog.addCallLogEntry({ callerName: 'No Number', actionTaken: 'ERROR_TEST' });
  assert.strictEqual(missingFieldEntry, null, 'Test 3.1 FAILED: Entry with missing callerNumber should return null.');
  rawLogs = JSON.parse(fs.readFileSync(CALL_LOG_FILE_PATH, 'utf-8'));
  assert.strictEqual(rawLogs.length, 3, 'Test 3.2 FAILED: Log file should still contain 3 entries after failed add.');
  console.log('Test 3 PASSED: addCallLogEntry handles missing required fields.');
  
  // Test 4: _clearAllCallLogs_TEST_ONLY
  console.log('\n--- Test 4: Clear All Call Logs (for testing) ---');
  currentCalllog._clearAllCallLogs_TEST_ONLY();
  rawLogs = JSON.parse(fs.readFileSync(CALL_LOG_FILE_PATH, 'utf-8'));
  assert.strictEqual(rawLogs.length, 0, 'Test 4.1 FAILED: Log file should be empty after _clearAllCallLogs_TEST_ONLY.');
  fetchedLogs = currentCalllog.getCallLogs();
  assert.strictEqual(fetchedLogs.length, 0, 'Test 4.2 FAILED: getCallLogs should return empty array after clear.');
  console.log('Test 4 PASSED: _clearAllCallLogs_TEST_ONLY works.');


  // Final cleanup after all tests
  cleanupTestData();
  console.log('\n--- Call Log Management Tests Finished ---');
}

runTests().catch(error => {
  console.error('!!! AN UNEXPECTED ERROR OCCURRED DURING CALL LOG TESTS !!!', error);
  // Attempt cleanup even on error
  cleanupTestData();
});
