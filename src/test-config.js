/**
 * @file Tests the configuration loading mechanism.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const CONFIG_PATH = path.join(__dirname, '../config/config.json');
const TEMP_CONFIG_PATH = path.join(__dirname, '../config/config.json.tmp');

// Helper function to delete the config module from cache to force re-load
function requireUncached(module) {
  delete require.cache[require.resolve(module)];
  return require(module);
}

async function runTests() {
  console.log('--- Starting Configuration Loading Tests ---');

  let originalConfigContent = '';
  if (fs.existsSync(CONFIG_PATH)) {
    originalConfigContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
  } else {
    console.error('CRITICAL: Original config.json does not exist. Cannot run tests properly.');
    return;
  }

  // Test 1: Load valid configuration
  console.log('\n--- Test 1: Load Valid Configuration ---');
  try {
    const config = requireUncached('./lib/config');
    assert.ok(config, 'Test 1.1 FAILED: Config should be loaded.');
    assert.strictEqual(config.modem.port, '/dev/ttyACM0', 'Test 1.2 FAILED: Modem port mismatch.');
    assert.strictEqual(config.webServer.port, 5000, 'Test 1.3 FAILED: Web server port mismatch.');
    assert.deepStrictEqual(config.modem.initCommands, ["ATZ", "ATE0V1Q0", "AT+VCID=1"], 'Test 1.4 FAILED: Modem initCommands mismatch.');
    console.log('Test 1 PASSED: Valid configuration loaded and verified.');
    console.log('Loaded webServer.port:', config.webServer.port);
    console.log('Loaded modem.initCommands:', config.modem.initCommands);
    console.log('PASS: Test 1 successfully completed.');
  } catch (e) {
    console.error('Test 1 FAILED with error:', e);
  }

  // Test 2: Config file not found
  console.log('\n--- Test 2: Config File Not Found ---');
  if (fs.existsSync(CONFIG_PATH)) {
    fs.renameSync(CONFIG_PATH, TEMP_CONFIG_PATH); // Rename original to temp
    console.log(`Renamed ${CONFIG_PATH} to ${TEMP_CONFIG_PATH}`);
  }
  try {
    const config = requireUncached('./lib/config');
    assert.strictEqual(config, null, 'Test 2.1 FAILED: Config should be null when file is missing.');
    console.log('PASS: Test 2 successfully completed (missing file).');
  } catch (e) {
    console.error('Test 2 FAILED with error:', e);
  } finally {
    if (fs.existsSync(TEMP_CONFIG_PATH)) {
      fs.renameSync(TEMP_CONFIG_PATH, CONFIG_PATH); // Restore original
      console.log(`Restored ${CONFIG_PATH} from ${TEMP_CONFIG_PATH}`);
    }
  }

  // Test 3: Invalid JSON in config file
  console.log('\n--- Test 3: Invalid JSON in Config File ---');
  const invalidJsonContent = '{ "modem": { "port": "/dev/ttyACM0", "baudRate": 9600, MISSING_COMMA }';
  fs.writeFileSync(CONFIG_PATH, invalidJsonContent, 'utf-8');
  console.log(`Overwrote ${CONFIG_PATH} with invalid JSON content.`);
  try {
    const config = requireUncached('./lib/config');
    assert.strictEqual(config, null, 'Test 3.1 FAILED: Config should be null for invalid JSON.');
    console.log('PASS: Test 3 successfully completed (invalid JSON).');
  } catch (e) {
    console.error('Test 3 FAILED with error:', e);
  } finally {
    // Restore original content
    fs.writeFileSync(CONFIG_PATH, originalConfigContent, 'utf-8');
    console.log(`Restored ${CONFIG_PATH} with original valid content.`);
  }
  
  // Test 4: Re-load valid configuration to ensure restoration
  console.log('\n--- Test 4: Re-load Valid Configuration After Tests ---');
  try {
    const config = requireUncached('./lib/config');
    assert.ok(config, 'Test 4.1 FAILED: Config should be loaded after restoration.');
    assert.strictEqual(config.modem.port, '/dev/ttyACM0', 'Test 4.2 FAILED: Modem port mismatch after restoration.');
    console.log('PASS: Test 4 successfully completed (re-load valid).');
  } catch (e) {
    console.error('Test 4 FAILED with error:', e);
  }

  console.log('\n--- Configuration Loading Tests Finished ---');
}

runTests().catch(error => {
  console.error('!!! An unexpected error occurred during test execution !!!', error);
  // Restore config if temp file exists, in case of crash
  if (fs.existsSync(TEMP_CONFIG_PATH)) {
    fs.renameSync(TEMP_CONFIG_PATH, CONFIG_PATH);
    console.error(`Emergency restore of ${CONFIG_PATH} from ${TEMP_CONFIG_PATH}`);
  }
});
