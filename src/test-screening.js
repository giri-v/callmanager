/**
 * @file Tests the call screening logic, including persistence.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const screening = require('./lib/screening');

const DATA_DIR = path.join(__dirname, '../data');
const TEST_EXPORT_DIR = path.join(__dirname, '../data/test_export');
const PERMITTED_NUMBERS_PATH = path.join(DATA_DIR, 'permitted_numbers.json');
const BLOCKED_NUMBERS_PATH = path.join(DATA_DIR, 'blocked_numbers.json');
// Add paths for other list types if they are also managed by add/remove functions

// Helper to clean up data files and directory
function cleanupTestData() {
  console.log('Cleaning up test data files...');
  const filesToDelete = [
    PERMITTED_NUMBERS_PATH,
    BLOCKED_NUMBERS_PATH,
    path.join(DATA_DIR, 'permitted_names_regex.json'),
    path.join(DATA_DIR, 'blocked_names_regex.json'),
    path.join(DATA_DIR, 'permitted_number_patterns.json'),
    path.join(DATA_DIR, 'blocked_number_patterns.json'),
    // Exported files
    path.join(TEST_EXPORT_DIR, 'permitted_numbers_export.json'),
    path.join(TEST_EXPORT_DIR, 'blocked_numbers_export.json'),
    path.join(TEST_EXPORT_DIR, 'permitted_names_regex_export.json'),
    path.join(TEST_EXPORT_DIR, 'blocked_names_regex_export.json'),
    path.join(TEST_EXPORT_DIR, 'permitted_number_patterns_export.json'),
    path.join(TEST_EXPORT_DIR, 'blocked_number_patterns_export.json'),
  ];
  filesToDelete.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
  if (fs.existsSync(TEST_EXPORT_DIR)) {
    fs.rmdirSync(TEST_EXPORT_DIR, { recursive: true });
  }
  // It's generally not a good idea to remove the DATA_DIR itself in tests
  // unless it's exclusively for testing and not shared with other data.
  // For now, just delete its contents.
}

// Helper to require screening module uncached to get fresh state
function requireUncachedScreening() {
  delete require.cache[require.resolve('./lib/screening')];
  return require('./lib/screening');
}


async function runTests() {
  console.log('--- Starting Screening Logic Tests (with Persistence) ---');

  // Initial cleanup
  cleanupTestData();
  let currentScreening = requireUncachedScreening(); // Load with default/empty lists

  // --- Test Original Screening Logic (ensure it still works) ---
  console.log('\n--- Test 1: Original Screening Functions ---');
  // Default lists are loaded by screening.js itself, so they should contain example data
  // if no files existed.
  assert.strictEqual(currentScreening.screenCall({ number: '18005550000', name: 'Telemarketer' }), 'BLOCK', 'Test 1.1 FAILED: Default blocked number.');
  assert.strictEqual(currentScreening.screenCall({ number: '15551234567', name: 'John Doe' }), 'ALLOW', 'Test 1.2 FAILED: Default permitted number.');
  assert.strictEqual(currentScreening.screenCall({ number: '15550001111', name: 'Mom' }), 'ALLOW', 'Test 1.3 FAILED: Default permitted name.');
  console.log('Test 1 PASSED: Original screening functions work with initial/default lists.');

  // --- Test Persistence: saveLists and loadLists ---
  console.log('\n--- Test 2: saveLists and loadLists ---');
  // Modify lists, save, then reload screening module (which calls loadLists)
  currentScreening.addBlockedNumberToList('1112223333');
  currentScreening.addPermittedNumberToList('4445556666');
  // Note: addBlockedNumberToList and addPermittedNumberToList already call saveLists.

  currentScreening = requireUncachedScreening(); // Re-load module, which triggers loadLists

  assert.ok(currentScreening._internal_blockedNumbers_TEST_ONLY.has('1112223333'), 'Test 2.1 FAILED: Blocked number not loaded after save.');
  assert.ok(currentScreening._internal_permittedNumbers_TEST_ONLY.has('4445556666'), 'Test 2.2 FAILED: Permitted number not loaded after save.');
  console.log('Test 2 PASSED: saveLists and loadLists work for basic number lists.');

  // --- Test add/remove functions for numbers ---
  console.log('\n--- Test 3: add/remove Blocked/Permitted Numbers ---');
  // Blocked numbers
  assert.strictEqual(currentScreening.addBlockedNumberToList('7778889999'), true, 'Test 3.1 FAILED: Adding new blocked number.');
  assert.ok(currentScreening._internal_blockedNumbers_TEST_ONLY.has('7778889999'), 'Test 3.2 FAILED: New blocked number not in memory.');
  let rawBlocked = JSON.parse(fs.readFileSync(BLOCKED_NUMBERS_PATH, 'utf-8'));
  assert.ok(rawBlocked.includes('7778889999'), 'Test 3.3 FAILED: New blocked number not in saved file.');

  assert.strictEqual(currentScreening.removeBlockedNumberFromList('7778889999'), true, 'Test 3.4 FAILED: Removing existing blocked number.');
  assert.ok(!currentScreening._internal_blockedNumbers_TEST_ONLY.has('7778889999'), 'Test 3.5 FAILED: Removed blocked number still in memory.');
  rawBlocked = JSON.parse(fs.readFileSync(BLOCKED_NUMBERS_PATH, 'utf-8'));
  assert.ok(!rawBlocked.includes('7778889999'), 'Test 3.6 FAILED: Removed blocked number still in saved file.');

  assert.strictEqual(currentScreening.removeBlockedNumberFromList('0000000000'), false, 'Test 3.7 FAILED: Removing non-existent blocked number should return false.');

  // Permitted numbers
  assert.strictEqual(currentScreening.addPermittedNumberToList('1231231234'), true, 'Test 3.8 FAILED: Adding new permitted number.');
  assert.ok(currentScreening._internal_permittedNumbers_TEST_ONLY.has('1231231234'), 'Test 3.9 FAILED: New permitted number not in memory.');
  let rawPermitted = JSON.parse(fs.readFileSync(PERMITTED_NUMBERS_PATH, 'utf-8'));
  assert.ok(rawPermitted.includes('1231231234'), 'Test 3.10 FAILED: New permitted number not in saved file.');

  assert.strictEqual(currentScreening.removePermittedNumberFromList('1231231234'), true, 'Test 3.11 FAILED: Removing existing permitted number.');
  assert.ok(!currentScreening._internal_permittedNumbers_TEST_ONLY.has('1231231234'), 'Test 3.12 FAILED: Removed permitted number still in memory.');
  rawPermitted = JSON.parse(fs.readFileSync(PERMITTED_NUMBERS_PATH, 'utf-8'));
  assert.ok(!rawPermitted.includes('1231231234'), 'Test 3.13 FAILED: Removed permitted number still in saved file.');
  console.log('Test 3 PASSED: add/remove functions for number lists work and persist changes.');

  // --- Test Import/Export ---
  console.log('\n--- Test 4: Import/Export Block/Permit Lists ---');
  // Prepare for export: ensure some lists are populated.
  cleanupTestData(); // Clean slate
  currentScreening = requireUncachedScreening(); // Reload to get defaults
  currentScreening.addBlockedNumberToList('EXPORT_BLOCK_1');
  currentScreening.addPermittedNumberToList('EXPORT_PERMIT_1');
  // currentScreening.addBlockedNameRegexToList... etc. for other lists if desired

  // Export
  assert.strictEqual(currentScreening.exportBlockPermitLists(TEST_EXPORT_DIR), true, 'Test 4.1 FAILED: exportBlockPermitLists should return true.');
  assert.ok(fs.existsSync(path.join(TEST_EXPORT_DIR, 'blocked_numbers_export.json')), 'Test 4.2 FAILED: Exported blocked numbers file not found.');
  assert.ok(fs.existsSync(path.join(TEST_EXPORT_DIR, 'permitted_numbers_export.json')), 'Test 4.3 FAILED: Exported permitted numbers file not found.');
  const exportedBlocked = JSON.parse(fs.readFileSync(path.join(TEST_EXPORT_DIR, 'blocked_numbers_export.json'), 'utf-8'));
  assert.ok(exportedBlocked.includes('EXPORT_BLOCK_1'), 'Test 4.4 FAILED: Exported blocked list content incorrect.');
  console.log('Test 4.4a PASSED: Export function created files with correct content.');

  // Import: First, change current in-memory lists to something different or clear them
  cleanupTestData(); // Clean data/ files
  currentScreening = requireUncachedScreening(); // Reload to get empty/default lists again
  currentScreening.addBlockedNumberToList('TEMP_BLOCK_BEFORE_IMPORT'); // ensure current list is different

  // Now, import from TEST_EXPORT_DIR
  assert.strictEqual(currentScreening.importBlockPermitLists(TEST_EXPORT_DIR), true, 'Test 4.5 FAILED: importBlockPermitLists should return true.');
  assert.ok(currentScreening._internal_blockedNumbers_TEST_ONLY.has('EXPORT_BLOCK_1'), 'Test 4.6 FAILED: Imported blocked number not in memory.');
  assert.ok(!currentScreening._internal_blockedNumbers_TEST_ONLY.has('TEMP_BLOCK_BEFORE_IMPORT'), 'Test 4.7 FAILED: Old blocked number still present after import.');
  assert.ok(currentScreening._internal_permittedNumbers_TEST_ONLY.has('EXPORT_PERMIT_1'), 'Test 4.8 FAILED: Imported permitted number not in memory.');

  // Verify that imported lists were also saved to the main data/ directory
  const persistedBlockedAfterImport = JSON.parse(fs.readFileSync(BLOCKED_NUMBERS_PATH, 'utf-8'));
  assert.ok(persistedBlockedAfterImport.includes('EXPORT_BLOCK_1'), 'Test 4.9 FAILED: Imported blocked list not saved to main data file.');
  console.log('Test 4 PASSED: Import/Export functions work as expected.');


  // Final cleanup after all tests
  cleanupTestData();
  console.log('\n--- Screening Logic Tests (with Persistence) Finished ---');
}

runTests().catch(error => {
  console.error('!!! AN UNEXPECTED ERROR OCCURRED DURING SCREENING TESTS !!!', error);
  // Attempt cleanup even on error
  cleanupTestData();
});
