/**
 * @file Tests the placeholder notification systems.
 */

const assert = require('assert');
const config = require('./lib/config'); // Import the actual loaded config
const notifications = require('./lib/notifications'); // Import the notifications module

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

// Helper to capture console.error output
function captureConsoleError(action) {
  const errors = [];
  const originalConsoleError = console.error;
  console.error = (...args) => {
    errors.push(args.join(' '));
  };
  try {
    action();
  } finally {
    console.error = originalConsoleError; // Restore original console.error
  }
  return errors;
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
  // Test 1: Email enabled, with attachment, with smtpUser
  config.notifications.email.enabled = true;
  config.notifications.email.smtpUser = 'testuser@example.com'; // Ensure smtpUser for this test
  config.notifications.email.smtpHost = 'smtp.test.host'; // For clarity in logs
  config.notifications.email.smtpPort = 587; // For clarity in logs

  let logs = captureConsoleLog(() => {
    notifications.sendEmailNotification('Test Subject 1', 'Test Body 1', 'att1.wav');
  });
  assert.ok(logs.some(log => log.includes(`EMAIL_PLACEHOLDER: Attempting to connect to SMTP server ${config.notifications.email.smtpHost}:${config.notifications.email.smtpPort}...`)), 'Test 1.1.1 FAILED: Missing SMTP connect attempt log.');
  assert.ok(logs.some(log => log.includes("EMAIL_PLACEHOLDER: Successfully connected to SMTP server (simulated).")), 'Test 1.1.2 FAILED: Missing SMTP connect success log.');
  assert.ok(logs.some(log => log.includes(`EMAIL_PLACEHOLDER: Authenticating as user ${config.notifications.email.smtpUser} (simulated)...`)), 'Test 1.1.3 FAILED: Missing SMTP auth log when smtpUser is set.');
  assert.ok(logs.some(log => log.includes("EMAIL_PLACEHOLDER: Sending email with subject 'Test Subject 1', body 'Test Body 1', and attachment 'att1.wav'")), 'Test 1.1.4 FAILED: Email sending log not found.');
  assert.ok(logs.some(log => log.includes("EMAIL_PLACEHOLDER: Email sent successfully (simulated).")), 'Test 1.1.5 FAILED: Missing email sent success log.');
  assert.ok(logs.some(log => log.includes("EMAIL_PLACEHOLDER: Disconnecting from SMTP server (simulated).")), 'Test 1.1.6 FAILED: Missing SMTP disconnect log.');
  console.log('Test 1.1 PASSED: Email sent with full lifecycle logs (with attachment, with auth).');

  // Test 2: Email enabled, no attachment, no smtpUser
  config.notifications.email.smtpUser = ''; // Clear smtpUser for this test
  logs = captureConsoleLog(() => {
    notifications.sendEmailNotification('Test Subject 2', 'Test Body 2');
  });
  assert.ok(logs.some(log => log.includes(`EMAIL_PLACEHOLDER: Attempting to connect to SMTP server ${config.notifications.email.smtpHost}:${config.notifications.email.smtpPort}...`)), 'Test 1.2.1 FAILED: Missing SMTP connect attempt log (no auth).');
  assert.ok(logs.some(log => log.includes("EMAIL_PLACEHOLDER: Successfully connected to SMTP server (simulated).")), 'Test 1.2.2 FAILED: Missing SMTP connect success log (no auth).');
  assert.ok(!logs.some(log => log.includes(`EMAIL_PLACEHOLDER: Authenticating as user`)), 'Test 1.2.3 FAILED: SMTP auth log found when smtpUser is not set.');
  assert.ok(logs.some(log => log.includes("EMAIL_PLACEHOLDER: Sending email with subject 'Test Subject 2', body 'Test Body 2'") && !log.includes("and attachment")), 'Test 1.2.4 FAILED: Email sending log (no attachment) not found.');
  assert.ok(logs.some(log => log.includes("EMAIL_PLACEHOLDER: Email sent successfully (simulated).")), 'Test 1.2.5 FAILED: Missing email sent success log (no auth).');
  assert.ok(logs.some(log => log.includes("EMAIL_PLACEHOLDER: Disconnecting from SMTP server (simulated).")), 'Test 1.2.6 FAILED: Missing SMTP disconnect log (no auth).');
  console.log('Test 1.2 PASSED: Email sent with full lifecycle logs (no attachment, no auth).');

  // Test 3: Email disabled
  config.notifications.email.enabled = false;
  logs = captureConsoleLog(() => {
    notifications.sendEmailNotification('Disabled Test Subject', 'Disabled Test Body');
  });
  assert.strictEqual(logs.length, 0, 'Test 2.1 FAILED: Email function should not log when disabled.'); // Renumbered from original Test 2.1
  console.log('Test 2.1 PASSED: Email function does nothing when disabled.'); // Renumbered

  // --- Test MQTT Notifications (General publishMqttNotification) ---
  console.log('\n--- Testing MQTT Notifications (General) ---');
  config.notifications.mqtt.enabled = true;
  config.notifications.mqtt.topicPrefix = 'callattendant/generaltest';
  const testMessage = { number: '5551234', name: 'MQTT Caller' };
  logs = captureConsoleLog(() => {
    notifications.publishMqttNotification('custom_topic', testMessage);
  });
  assert.ok(logs.some(log => log.includes(`MQTT_PLACEHOLDER: Attempting to connect to broker at ${config.notifications.mqtt.brokerUrl}...`)), 'Test 3.1 FAILED: Missing MQTT connect attempt log.');
  assert.ok(logs.some(log => log.includes("MQTT_PLACEHOLDER: Successfully connected to MQTT broker (simulated).")), 'Test 3.2 FAILED: Missing MQTT connect success log.');
  assert.ok(logs.some(log => log.includes(`MQTT_PLACEHOLDER: Publishing to topic 'callattendant/generaltest/custom_topic' message: ${JSON.stringify(testMessage)}`)), 'Test 3.3 FAILED: General MQTT publish log not found when enabled.');
  assert.ok(logs.some(log => log.includes("MQTT_PLACEHOLDER: Disconnecting from MQTT broker (simulated).")), 'Test 3.4 FAILED: Missing MQTT disconnect log.');
  console.log('Test 3 PASSED: General MQTT message published with full lifecycle logs (placeholder).');

  config.notifications.mqtt.enabled = false;
  logs = captureConsoleLog(() => {
    notifications.publishMqttNotification('disabled_topic', { data: 'disabled' });
  });
  assert.strictEqual(logs.length, 0, 'Test 4.1 FAILED: General MQTT function should not log when disabled.');
  console.log('Test 4.1 PASSED: General MQTT function does nothing when disabled.');

  // --- Test GPIO Notifications ---
  console.log('\n--- Testing GPIO Notifications ---');
  config.notifications.gpio.enabled = true;
  logs = captureConsoleLog(() => { notifications.initializeGpio(); });
  assert.ok(logs.some(log => log.includes('GPIO_PLACEHOLDER: Initializing GPIO pins.')), 'Test 5.1 FAILED: GPIO init log not found.');
  console.log('Test 5.1 PASSED: initializeGpio logs when enabled.');

  logs = captureConsoleLog(() => { notifications.setGpioStatus('RINGING'); });
  assert.ok(logs.some(log => log.includes("GPIO_PLACEHOLDER: Setting GPIO status to 'RINGING'")), 'Test 5.2 FAILED: setGpioStatus log not found.');
  console.log('Test 5.2 PASSED: setGpioStatus logs when enabled.');

  logs = captureConsoleLog(() => { notifications.cleanupGpio(); });
  assert.ok(logs.some(log => log.includes('GPIO_PLACEHOLDER: Cleaning up GPIO pins.')), 'Test 5.3 FAILED: GPIO cleanup log not found.');
  console.log('Test 5.3 PASSED: cleanupGpio logs when enabled.');

  config.notifications.gpio.enabled = false;
  logs = captureConsoleLog(() => {
    notifications.initializeGpio();
    notifications.setGpioStatus('IDLE_DISABLED');
    notifications.cleanupGpio();
  });
  assert.ok(!logs.some(log => log.includes('Initializing GPIO pins.')), 'Test 6.1 FAILED: GPIO init should not log when disabled.');
  assert.ok(!logs.some(log => log.includes("Setting GPIO status to 'IDLE_DISABLED'")), 'Test 6.2 FAILED: setGpioStatus should not log when GPIO disabled.');
  assert.ok(!logs.some(log => log.includes('Cleaning up GPIO pins.')), 'Test 6.3 FAILED: GPIO cleanup should not log when disabled.');
  console.log('Test 6 PASSED: GPIO functions do nothing when disabled (quieter logs).');

  // Restore original config states before specific MQTT event tests
  config.notifications.email = originalEmailConfig;
  config.notifications.mqtt = JSON.parse(JSON.stringify(originalMqttConfig)); // Deep copy for safety
  config.notifications.gpio = originalGpioConfig;
  console.log('\nOriginal configuration for general tests restored.');

  // --- Test new centralized MQTT Event Functions ---
  console.log('\n--- Testing Centralized MQTT Event Functions ---');
  if (!config || !config.notifications || !config.notifications.mqtt) {
    console.error('CRITICAL_MQTT_TEST: MQTT config not found. This should not happen if config loaded.');
    return;
  }

  // Ensure MQTT is enabled for these specific tests
  const specificMqttTestOriginalEnabled = config.notifications.mqtt.enabled;
  const specificMqttTestOriginalPrefix = config.notifications.mqtt.topicPrefix;
  config.notifications.mqtt.enabled = true;
  config.notifications.mqtt.topicPrefix = 'callattendant/testevents';

  // Test publishRingingEvent
  console.log('\nTesting publishRingingEvent...');
  const checkLogForPayload = (logContent, expectedParts) => expectedParts.every(part => logContent.includes(part));

  let ringLogs = captureConsoleLog(() => {
    notifications.publishRingingEvent({ number: '5551112222', name: 'Ring Tester' });
  });
  const expectedRingPartsWithCID = [`"event":"ringing"`, `"callerIdAvailable":true`, `"callerId":{"number":"5551112222","name":"Ring Tester"}`];
  assert.ok(ringLogs.some(log => log.includes(`MQTT_PLACEHOLDER: Attempting to connect to broker at ${config.notifications.mqtt.brokerUrl}...`)), 'Test 7.1.1 FAILED: publishRingingEvent missing connect attempt log.');
  assert.ok(ringLogs.some(log => log.includes("MQTT_PLACEHOLDER: Successfully connected to MQTT broker (simulated).")), 'Test 7.1.2 FAILED: publishRingingEvent missing connect success log.');
  assert.ok(ringLogs.some(log => log.includes("MQTT_PLACEHOLDER: Publishing to topic 'callattendant/testevents/ringing'") && checkLogForPayload(log, expectedRingPartsWithCID)), 'Test 7.1.3 FAILED: publishRingingEvent with CID did not log expected MQTT publish message.');
  assert.ok(ringLogs.some(log => log.includes("MQTT_PLACEHOLDER: Disconnecting from MQTT broker (simulated).")), 'Test 7.1.4 FAILED: publishRingingEvent missing disconnect log.');
  console.log('Test 7.1 PASSED: publishRingingEvent with CID and full lifecycle logs.');

  ringLogs = captureConsoleLog(() => {
    notifications.publishRingingEvent(); // No CID
  });
  const expectedRingPartsNoCID = [`"event":"ringing"`, `"callerIdAvailable":false`];
  assert.ok(ringLogs.some(log => log.includes(`MQTT_PLACEHOLDER: Attempting to connect to broker at ${config.notifications.mqtt.brokerUrl}...`)), 'Test 7.2.1 FAILED: publishRingingEvent (no CID) missing connect attempt log.');
  assert.ok(ringLogs.some(log => log.includes("MQTT_PLACEHOLDER: Successfully connected to MQTT broker (simulated).")), 'Test 7.2.2 FAILED: publishRingingEvent (no CID) missing connect success log.');
  assert.ok(ringLogs.some(log => log.includes("MQTT_PLACEHOLDER: Publishing to topic 'callattendant/testevents/ringing'") && checkLogForPayload(log, expectedRingPartsNoCID) && !log.includes('"callerId":')), 'Test 7.2.3 FAILED: publishRingingEvent without CID did not log expected MQTT publish message.');
  assert.ok(ringLogs.some(log => log.includes("MQTT_PLACEHOLDER: Disconnecting from MQTT broker (simulated).")), 'Test 7.2.4 FAILED: publishRingingEvent (no CID) missing disconnect log.');
  console.log('Test 7.2 PASSED: publishRingingEvent without CID and full lifecycle logs.');

  // Test publishCallerIdUpdateEvent
  console.log('\nTesting publishCallerIdUpdateEvent...');
  let cidLogs = captureConsoleLog(() => {
    notifications.publishCallerIdUpdateEvent({ number: '5553334444', name: 'CID Updater' });
  });
  const expectedCIDParts = [`"event":"caller_id_update"`, `"number":"5553334444"`, `"name":"CID Updater"`];
  assert.ok(cidLogs.some(log => log.includes(`MQTT_PLACEHOLDER: Attempting to connect to broker at ${config.notifications.mqtt.brokerUrl}...`)), 'Test 7.3.1 FAILED: publishCallerIdUpdateEvent missing connect attempt log.');
  assert.ok(cidLogs.some(log => log.includes("MQTT_PLACEHOLDER: Successfully connected to MQTT broker (simulated).")), 'Test 7.3.2 FAILED: publishCallerIdUpdateEvent missing connect success log.');
  assert.ok(cidLogs.some(log => log.includes("MQTT_PLACEHOLDER: Publishing to topic 'callattendant/testevents/caller_id'") && checkLogForPayload(log, expectedCIDParts)), 'Test 7.3.3 FAILED: publishCallerIdUpdateEvent did not log expected MQTT publish message.');
  assert.ok(cidLogs.some(log => log.includes("MQTT_PLACEHOLDER: Disconnecting from MQTT broker (simulated).")), 'Test 7.3.4 FAILED: publishCallerIdUpdateEvent missing disconnect log.');
  console.log('Test 7.3 PASSED: publishCallerIdUpdateEvent with valid data and full lifecycle logs.');
  
  // Test publishCallerIdUpdateEvent with invalid data (missing name)
  console.log('\nTesting publishCallerIdUpdateEvent (invalid data)...');
  let errorLogs = captureConsoleError(() => {
    cidLogs = captureConsoleLog(() => { // Capture console.log to ensure no MQTT message is sent
        notifications.publishCallerIdUpdateEvent({ number: '555incomplete' }); // Missing name
    });
  });
  assert.ok(errorLogs.some(log => log.includes("NOTIFICATIONS_ERROR: Missing or invalid callerIdInfo for publishCallerIdUpdateEvent")), 'Test 7.4 FAILED: publishCallerIdUpdateEvent with invalid data did not log an error to console.error.');
  assert.ok(!cidLogs.some(log => log.includes("MQTT_PLACEHOLDER: Publishing to topic")), 'Test 7.5 FAILED: MQTT message sent despite invalid data in publishCallerIdUpdateEvent.');
  assert.ok(!cidLogs.some(log => log.includes("Attempting to connect to broker")), 'Test 7.6 FAILED: MQTT connection lifecycle logs appeared for invalid data.');
  console.log('Test 7.4, 7.5 & 7.6 PASSED: publishCallerIdUpdateEvent with invalid data logged error and sent no MQTT message or lifecycle logs.');

  // Restore MQTT config to its state before these specific tests
  config.notifications.mqtt.enabled = specificMqttTestOriginalEnabled;
  config.notifications.mqtt.topicPrefix = specificMqttTestOriginalPrefix;
  console.log('\nMQTT configuration for specific event tests restored.');

  console.log('\n--- Notification System Tests Finished ---');
}

runTests().catch(error => {
  console.error('!!! An unexpected error occurred during test execution !!!', error);
  // Attempt to restore config in case of error during tests
  if (config && config.notifications) {
    // This is a simplified restoration. A more robust one would involve
    // re-assigning originalEmailConfig, originalMqttConfig, originalGpioConfig.
    console.warn('Attempting to restore config to a known state... (Full restoration logic might be needed if test failed mid-modification)');
  }
});
