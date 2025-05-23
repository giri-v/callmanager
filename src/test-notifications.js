/**
 * @file Tests the placeholder notification systems.
 */

const assert = require('assert');
const config = require('./lib/config'); // Import the actual loaded config
const {
  initializeGpio,
  sendEmailNotification,
  publishMqttNotification,
  setGpioStatus,
  cleanupGpio,
} = require('./lib/notifications');

// Helper to capture console.log output
function captureConsoleLog(action) {
  const logs = [];
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    logs.push(args.join(' '));
  };
  try {
    action();
  } finally {
    console.log = originalConsoleLog; // Restore original console.log
  }
  return logs;
}

async function runTests() {
  console.log('--- Starting Notification System Tests ---');

  if (!config) {
    console.error('CRITICAL: Configuration not loaded. Cannot run notification tests properly.');
    console.log('--- Notification System Tests Aborted ---');
    return;
  }

  // Store original config states
  const originalEmailConfig = JSON.parse(JSON.stringify(config.notifications.email));
  const originalMqttConfig = JSON.parse(JSON.stringify(config.notifications.mqtt));
  const originalGpioConfig = JSON.parse(JSON.stringify(config.notifications.gpio));

  // --- Test Email Notifications ---
  console.log('\n--- Testing Email Notifications ---');
  // Test 1: Email enabled
  config.notifications.email.enabled = true;
  let logs = captureConsoleLog(() => {
    sendEmailNotification('Test Subject 1', 'Test Body 1', 'att1.wav');
  });
  assert.ok(logs.some(log => log.includes("EMAIL_PLACEHOLDER: Sending email with subject 'Test Subject 1', body 'Test Body 1', and attachment 'att1.wav'")), 'Test 1.1 FAILED: Email log not found when enabled.');
  console.log('Test 1.1 PASSED: Email sent when enabled (placeholder).');

  logs = captureConsoleLog(() => {
    sendEmailNotification('Test Subject 2', 'Test Body 2');
  });
  assert.ok(logs.some(log => log.includes("EMAIL_PLACEHOLDER: Sending email with subject 'Test Subject 2', body 'Test Body 2'") && !log.includes("and attachment")), 'Test 1.2 FAILED: Email log (no attachment) not found when enabled.');
  console.log('Test 1.2 PASSED: Email sent (no attachment) when enabled (placeholder).');

  // Test 2: Email disabled
  config.notifications.email.enabled = false;
  logs = captureConsoleLog(() => {
    sendEmailNotification('Disabled Test Subject', 'Disabled Test Body');
  });
  assert.strictEqual(logs.length, 0, 'Test 2.1 FAILED: Email function should not log when disabled.');
  console.log('Test 2.1 PASSED: Email function does nothing when disabled.');

  // --- Test MQTT Notifications ---
  console.log('\n--- Testing MQTT Notifications ---');
  // Test 3: MQTT enabled
  config.notifications.mqtt.enabled = true;
  config.notifications.mqtt.topicPrefix = 'callattendant/test';
  const testMessage = { number: '5551234', name: 'MQTT Caller' };
  logs = captureConsoleLog(() => {
    publishMqttNotification('incoming_call', testMessage);
  });
  assert.ok(logs.some(log => log.includes(`MQTT_PLACEHOLDER: Publishing to topic 'callattendant/test/incoming_call' message: ${JSON.stringify(testMessage)}`)), 'Test 3.1 FAILED: MQTT log not found when enabled.');
  console.log('Test 3.1 PASSED: MQTT message published when enabled (placeholder).');

  // Test 4: MQTT disabled
  config.notifications.mqtt.enabled = false;
  logs = captureConsoleLog(() => {
    publishMqttNotification('disabled_topic', { data: 'disabled' });
  });
  assert.strictEqual(logs.length, 0, 'Test 4.1 FAILED: MQTT function should not log when disabled.');
  console.log('Test 4.1 PASSED: MQTT function does nothing when disabled.');

  // --- Test GPIO Notifications ---
  console.log('\n--- Testing GPIO Notifications ---');
  // Test 5: GPIO enabled
  config.notifications.gpio.enabled = true;
  logs = captureConsoleLog(() => {
    initializeGpio();
  });
  assert.ok(logs.some(log => log.includes('GPIO_PLACEHOLDER: Initializing GPIO pins.')), 'Test 5.1 FAILED: GPIO init log not found.');
  console.log('Test 5.1 PASSED: initializeGpio logs when enabled.');

  logs = captureConsoleLog(() => {
    setGpioStatus('RINGING');
  });
  assert.ok(logs.some(log => log.includes("GPIO_PLACEHOLDER: Setting GPIO status to 'RINGING'")), 'Test 5.2 FAILED: setGpioStatus log not found.');
  console.log('Test 5.2 PASSED: setGpioStatus logs when enabled.');

  logs = captureConsoleLog(() => {
    cleanupGpio();
  });
  assert.ok(logs.some(log => log.includes('GPIO_PLACEHOLDER: Cleaning up GPIO pins.')), 'Test 5.3 FAILED: GPIO cleanup log not found.');
  console.log('Test 5.3 PASSED: cleanupGpio logs when enabled.');

  // Test 6: GPIO disabled
  config.notifications.gpio.enabled = false;
  logs = captureConsoleLog(() => {
    initializeGpio();
    setGpioStatus('IDLE_DISABLED');
    cleanupGpio();
  });
  assert.ok(logs.some(log => log.includes('GPIO_PLACEHOLDER: GPIO is disabled in config, not initializing.')), 'Test 6.1 FAILED: GPIO init disabled log not found.');
  assert.ok(logs.some(log => log.includes('GPIO_PLACEHOLDER: GPIO is disabled in config, no cleanup needed.')), 'Test 6.2 FAILED: GPIO cleanup disabled log not found.');
  assert.ok(!logs.some(log => log.includes("Setting GPIO status to 'IDLE_DISABLED'")), 'Test 6.3 FAILED: setGpioStatus should not log when GPIO disabled.');
  console.log('Test 6 PASSED: GPIO functions log appropriately or do nothing when disabled.');


  // Restore original config states
  config.notifications.email = originalEmailConfig;
  config.notifications.mqtt = originalMqttConfig;
  config.notifications.gpio = originalGpioConfig;
  console.log('\nOriginal configuration restored.');

  console.log('\n--- Notification System Tests Finished ---');
}

runTests().catch(error => {
  console.error('!!! An unexpected error occurred during test execution !!!', error);
  // Attempt to restore config in case of error during tests
  if (config && config.notifications) {
    // This assumes originalConfig values were captured correctly.
    // This part is tricky if the error happened before originals were captured or if config itself is null.
    // For robustness, this restoration might need to be more complex or rely on re-reading from file.
    // For now, this is a best-effort.
    console.warn('Attempting to restore config to a known state...');
  }
});
