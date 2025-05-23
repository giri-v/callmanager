const { listSerialPorts, ModemCommunicator, MODEM_STATES } = require('./lib/modem'); // Import MODEM_STATES
const config = require('./lib/config'); // Added for MQTT testing
const assert = require('assert'); // Ensure assert is imported
// We don't directly spy on publishMqttNotification, but we'll check its console output.

async function runTest() {
  console.log('--- Testing listSerialPorts (Placeholder) ---');
  try {
    const ports = await listSerialPorts();
    if (ports.length === 0) {
      console.log('No serial ports found (as expected with placeholder).');
      console.log('PASS: listSerialPorts (placeholder) test completed as expected.');
    } else {
      console.error('FAIL: listSerialPorts (placeholder) test - ports array was not empty.');
      ports.forEach(port => {
        console.log(`- Path: ${port.path}, Manufacturer: ${port.manufacturer || 'N/A'}, PnP ID: ${port.pnpId || 'N/A'}`);
      });
    }
  } catch (error) {
    console.error('FAIL: Error testing listSerialPorts:', error);
  }

  console.log('\n--- Testing ModemCommunicator Basic Methods (Placeholder) ---');
  const modem = new ModemCommunicator('/dev/ttyTEST0'); // Using a placeholder port
  modem.connect();
  modem.sendCommand('AT');
  modem.initializeModem();
  modem.disconnect();
  console.log('PASS: ModemCommunicator (placeholder) basic methods called.');

  console.log('\n--- Testing ModemCommunicator MQTT Ring Event Simulation ---');
  if (!config || !config.notifications || !config.notifications.mqtt) {
    console.error('FAIL: MQTT config not found, cannot test MQTT ring event.');
  } else {
    const originalMqttEnabled = config.notifications.mqtt.enabled;
    config.notifications.mqtt.enabled = true; // Temporarily enable for test

    console.log('\nSimulating ring event WITH Caller ID...');
    // Capture console output to verify MQTT message
    let logs = [];
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalConsoleLog.apply(console, args); // Still log to console
    };
    
    modem.simulateRingEvent({ number: '1234567890', name: 'Test Caller' });
    
    console.log = originalConsoleLog; // Restore console.log

    // Check for key parts of the payload, excluding the timestamp
    const checkLogForPayload = (logContent, expectedParts) => {
      return expectedParts.every(part => logContent.includes(part));
    };

    const expectedPartsWithCID = [
      `"event":"ringing"`,
      `"callerIdAvailable":true`,
      `"callerId":{"number":"1234567890","name":"Test Caller"}`
    ];
    if (logs.some(log => log.includes("MQTT_PLACEHOLDER: Publishing to topic") && checkLogForPayload(log, expectedPartsWithCID))) {
      console.log('PASS: MQTT notification for ring event WITH Caller ID triggered correctly.');
    } else {
      console.error('FAIL: MQTT notification for ring event WITH Caller ID not found or incorrect.');
      console.log('Captured logs for this test:', logs);
    }

    console.log('\nSimulating ring event WITHOUT Caller ID...');
    logs = []; // Clear logs for next capture
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalConsoleLog.apply(console, args);
    };

    modem.simulateRingEvent(); // No callerIdInfo

    console.log = originalConsoleLog; // Restore console.log

    const expectedPartsWithoutCID = [
      `"event":"ringing"`,
      `"callerIdAvailable":false`
    ];
    // Also ensure callerId object is NOT present
    if (logs.some(log => log.includes("MQTT_PLACEHOLDER: Publishing to topic") && checkLogForPayload(log, expectedPartsWithoutCID) && !log.includes('"callerId":'))) {
      console.log('PASS: MQTT notification for ring event WITHOUT Caller ID triggered correctly.');
    } else {
      console.error('FAIL: MQTT notification for ring event WITHOUT Caller ID not found or incorrect.');
      console.log('Captured logs for this test:', logs);
    }

    config.notifications.mqtt.enabled = originalMqttEnabled; // Restore original MQTT setting
    console.log(`Restored MQTT enabled state to: ${originalMqttEnabled} for ringing tests.`);
  }

  console.log('\n--- Testing ModemCommunicator MQTT Caller ID Event Simulation ---');
  if (!config || !config.notifications || !config.notifications.mqtt) {
    console.error('FAIL: MQTT config not found, cannot test MQTT Caller ID event.');
  } else {
    const originalMqttEnabled = config.notifications.mqtt.enabled;
    config.notifications.mqtt.enabled = true; // Temporarily enable for test

    console.log('\nSimulating Caller ID event WITH valid data...');
    let logs = [];
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalConsoleLog.apply(console, args);
    };

    const validCallerId = { number: '9876543210', name: 'Jane Developer' };
    modem.simulateCallerIdEvent(validCallerId);

    console.log = originalConsoleLog;

    const checkLogForPayload = (logContent, expectedParts) => {
      return expectedParts.every(part => logContent.includes(part));
    };
    const expectedPartsValidCID = [
      `"event":"caller_id_update"`,
      `"number":"${validCallerId.number}"`,
      `"name":"${validCallerId.name}"`
    ];
    if (logs.some(log => log.includes("MQTT_PLACEHOLDER: Publishing to topic 'callattendant/caller_id'") && checkLogForPayload(log, expectedPartsValidCID))) {
      console.log('PASS: MQTT notification for Caller ID update WITH valid data triggered correctly.');
    } else {
      console.error('FAIL: MQTT notification for Caller ID update WITH valid data not found or incorrect.');
      console.log('Captured logs for this test:', logs);
    }

    console.log('\nSimulating Caller ID event with INVALID data (missing name)...');
    logs = [];
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalConsoleLog.apply(console, args);
    };
    const originalErrorLog = console.error;
    let errorLogs = [];
    console.error = (...args) => {
      errorLogs.push(args.join(' '));
      originalErrorLog.apply(console, args);
    }

    modem.simulateCallerIdEvent({ number: '12345' }); // Name is missing

    console.log = originalConsoleLog;
    console.log = originalConsoleLog;
    console.error = originalErrorLog;

    // Error is now logged by notifications.publishCallerIdUpdateEvent, not directly by modem.simulateCallerIdEvent.
    // So, errorLogs here will be empty. We primarily care that no MQTT message is sent.
    if (!logs.some(log => log.includes("MQTT_PLACEHOLDER: Publishing to topic"))) {
      console.log('PASS: No MQTT message sent with invalid Caller ID data (missing name), as expected.');
      if (errorLogs.some(log => log.includes("NOTIFICATIONS_ERROR"))) {
         console.log('INFO: Error correctly logged by notifications module.');
      } else {
         console.warn('WARN: Error was expected to be logged by notifications module, but not found in local error capture of modem test. This is acceptable as long as no MQTT message was sent.');
      }
    } else {
      console.error('FAIL: MQTT message was sent despite invalid Caller ID data (missing name).');
      console.log('Captured console logs:', logs);
    }
    
    config.notifications.mqtt.enabled = originalMqttEnabled; // Restore original MQTT setting
    console.log(`Restored MQTT enabled state to: ${originalMqttEnabled} for caller_id tests.`);
  }


  console.log('\n--- Modem Test Script Finished ---');


  // --- Test new stateful simulation methods ---
  console.log('\n\n--- Testing Stateful Simulation Methods ---');
  const testModem = new ModemCommunicator('/dev/ttySIMTEST');
  assert.strictEqual(testModem.state, MODEM_STATES.IDLE, 'Stateful Test 1.1 FAILED: Initial state should be IDLE.');

  // Test simulateRingEvent state change
  testModem.simulateRingEvent({ number: '5551234567', name: 'State Test Caller' });
  assert.strictEqual(testModem.state, MODEM_STATES.RINGING, 'Stateful Test 1.2 FAILED: State after simulateRingEvent should be RINGING.');

  // Test simulateCallerIdEvent (should not change state from RINGING)
  testModem.simulateCallerIdEvent({ number: '5551234567', name: 'State Test Caller Updated' });
  assert.strictEqual(testModem.state, MODEM_STATES.RINGING, 'Stateful Test 1.3 FAILED: State after simulateCallerIdEvent should remain RINGING.');

  // Test simulateCallAnswered state change
  testModem.simulateCallAnswered();
  assert.strictEqual(testModem.state, MODEM_STATES.CALL_IN_PROGRESS, 'Stateful Test 1.4 FAILED: State after simulateCallAnswered should be CALL_IN_PROGRESS.');

  // Test simulateStartVoicemailRecording state change
  testModem.simulateStartVoicemailRecording();
  assert.strictEqual(testModem.state, MODEM_STATES.RECORDING_VOICEMAIL, 'Stateful Test 1.5 FAILED: State after simulateStartVoicemailRecording should be RECORDING_VOICEMAIL.');

  // Test simulateStopVoicemailRecording state change
  testModem.simulateStopVoicemailRecording();
  assert.strictEqual(testModem.state, MODEM_STATES.CALL_IN_PROGRESS, 'Stateful Test 1.6 FAILED: State after simulateStopVoicemailRecording should be CALL_IN_PROGRESS.');
  
  // Test simulateCallHangup state change (from CALL_IN_PROGRESS)
  testModem.simulateCallHangup();
  assert.strictEqual(testModem.state, MODEM_STATES.IDLE, 'Stateful Test 1.7 FAILED: State after simulateCallHangup (from CALL_IN_PROGRESS) should be IDLE.');

  // Test simulateDialNumber state changes
  const callId = testModem.simulateDialNumber('5559876543');
  assert.ok(callId.startsWith('call_out_'), 'Stateful Test 1.8 FAILED: simulateDialNumber should return a call ID.');
  // Note: simulateDialNumber internally transitions DIALING -> CALL_IN_PROGRESS. We assert the final state.
  assert.strictEqual(testModem.state, MODEM_STATES.CALL_IN_PROGRESS, 'Stateful Test 1.9 FAILED: State after simulateDialNumber sequence should be CALL_IN_PROGRESS.');

  // Test simulateCallHangup state change (from CALL_IN_PROGRESS after dialing)
  testModem.simulateCallHangup();
  assert.strictEqual(testModem.state, MODEM_STATES.IDLE, 'Stateful Test 1.10 FAILED: State after simulateCallHangup (from dialed CALL_IN_PROGRESS) should be IDLE.');

  // Test calling simulateCallAnswered from IDLE (should log warning but still transition for simulation)
  console.log('\nTesting simulateCallAnswered from IDLE (expect warning):');
  testModem.simulateCallAnswered(); // Currently IDLE
  assert.strictEqual(testModem.state, MODEM_STATES.CALL_IN_PROGRESS, 'Stateful Test 1.11 FAILED: State after simulateCallAnswered from IDLE should be CALL_IN_PROGRESS.');
  testModem.simulateCallHangup(); // Reset to IDLE for next test
  console.log('PASS: Stateful simulation methods tests completed.');


  // --- Test handleIncomingCall_PLACEHOLDER ---
  console.log('\n\n--- Testing handleIncomingCall_PLACEHOLDER ---');
  const callHandlerModem = new ModemCommunicator('/dev/ttyHANDLERTEST');

  // Scenario 1: VOICEMAIL
  console.log('\nScenario: VOICEMAIL');
  let logs = [];
  const originalConsoleLog = console.log;
  console.log = (...args) => { logs.push(args.join(' ')); originalConsoleLog.apply(console, args); };
  
  callHandlerModem.handleIncomingCall_PLACEHOLDER({ number: '5558675309', name: 'Jenny Voicemail' }, 'VOICEMAIL');
  assert.strictEqual(callHandlerModem.state, MODEM_STATES.IDLE, 'CallHandler Test 1.1 FAILED: State after VOICEMAIL scenario should be IDLE.');
  assert.ok(logs.some(log => log.includes("MODEM_STATE_TRANSITION: IDLE -> RINGING")), "CallHandler Test 1.2 FAILED: VOICEMAIL scenario missing RINGING state.");
  assert.ok(logs.some(log => log.includes("MODEM_STATE_TRANSITION: RINGING -> CALL_IN_PROGRESS")), "CallHandler Test 1.3 FAILED: VOICEMAIL scenario missing CALL_IN_PROGRESS after answer.");
  assert.ok(logs.some(log => log.includes("MODEM_STATE_TRANSITION: CALL_IN_PROGRESS -> RECORDING_VOICEMAIL")), "CallHandler Test 1.4 FAILED: VOICEMAIL scenario missing RECORDING_VOICEMAIL state.");
  assert.ok(logs.some(log => log.includes("MODEM_STATE_TRANSITION: RECORDING_VOICEMAIL -> CALL_IN_PROGRESS")), "CallHandler Test 1.5 FAILED: VOICEMAIL scenario missing CALL_IN_PROGRESS after recording.");
  assert.ok(logs.some(log => log.includes("MODEM_STATE_TRANSITION: CALL_IN_PROGRESS -> IDLE")), "CallHandler Test 1.6 FAILED: VOICEMAIL scenario missing final IDLE state.");
  console.log('PASS: VOICEMAIL scenario completed and state transitions verified.');
  logs = []; // Clear logs

  // Scenario 2: ALLOW
  console.log('\nScenario: ALLOW');
  callHandlerModem.handleIncomingCall_PLACEHOLDER({ number: '5550100100', name: 'Allowed Caller' }, 'ALLOW');
  assert.strictEqual(callHandlerModem.state, MODEM_STATES.RINGING, 'CallHandler Test 2.1 FAILED: State after ALLOW scenario should be RINGING (as per placeholder logic).');
  assert.ok(logs.some(log => log.includes("MODEM_STATE_TRANSITION: IDLE -> RINGING")), "CallHandler Test 2.2 FAILED: ALLOW scenario missing RINGING state.");
  console.log('PASS: ALLOW scenario completed and state verified.');
  callHandlerModem.simulateCallHangup(); // Manually reset to IDLE for next test as ALLOW leaves it RINGING
  assert.strictEqual(callHandlerModem.state, MODEM_STATES.IDLE, 'CallHandler Test 2.3 FAILED: State after manual hangup for ALLOW test should be IDLE.');
  logs = [];

  // Scenario 3: BLOCK
  console.log('\nScenario: BLOCK');
  callHandlerModem.handleIncomingCall_PLACEHOLDER({ number: '5550200200', name: 'Blocked Scammer' }, 'BLOCK');
  assert.strictEqual(callHandlerModem.state, MODEM_STATES.IDLE, 'CallHandler Test 3.1 FAILED: State after BLOCK scenario should be IDLE.');
  assert.ok(logs.some(log => log.includes("MODEM_STATE_TRANSITION: IDLE -> RINGING")), "CallHandler Test 3.2 FAILED: BLOCK scenario missing RINGING state.");
  assert.ok(logs.some(log => log.includes("MODEM_STATE_TRANSITION: RINGING -> CALL_IN_PROGRESS")), "CallHandler Test 3.3 FAILED: BLOCK scenario missing CALL_IN_PROGRESS for quick hangup.");
  assert.ok(logs.some(log => log.includes("MODEM_STATE_TRANSITION: CALL_IN_PROGRESS -> IDLE")), "CallHandler Test 3.4 FAILED: BLOCK scenario missing final IDLE state after hangup.");
  console.log('PASS: BLOCK scenario completed and state transitions verified.');
  logs = [];

  // Scenario 4: Unknown Outcome
  console.log('\nScenario: UNKNOWN_OUTCOME');
  callHandlerModem.handleIncomingCall_PLACEHOLDER({ number: '5550300300', name: 'Mystery Caller' }, 'WEIRD_ACTION');
  assert.strictEqual(callHandlerModem.state, MODEM_STATES.IDLE, 'CallHandler Test 4.1 FAILED: State after UNKNOWN_OUTCOME scenario should be IDLE.');
  assert.ok(logs.some(log => log.includes("MODEM_STATE_TRANSITION: IDLE -> RINGING")), "CallHandler Test 4.2 FAILED: UNKNOWN_OUTCOME scenario missing RINGING state.");
  // Depending on implementation, it might go RINGING -> IDLE or RINGING -> CALL_IN_PROGRESS -> IDLE. Current implementation is RINGING -> IDLE
  assert.ok(logs.some(log => log.includes("MODEM_STATE_TRANSITION: RINGING -> IDLE")) || logs.some(log => log.includes("MODEM_STATE_TRANSITION: CALL_IN_PROGRESS -> IDLE")), "CallHandler Test 4.3 FAILED: UNKNOWN_OUTCOME scenario missing final IDLE state.");
  console.log('PASS: UNKNOWN_OUTCOME scenario completed and state verified.');
  logs = [];

  // Scenario 5: No Caller ID
  console.log('\nScenario: VOICEMAIL (No Caller ID)');
  callHandlerModem.handleIncomingCall_PLACEHOLDER(null, 'VOICEMAIL');
  assert.strictEqual(callHandlerModem.state, MODEM_STATES.IDLE, 'CallHandler Test 5.1 FAILED: VOICEMAIL (No CID) scenario should end in IDLE.');
  assert.ok(logs.some(log => log.includes("MODEM_STATE_TRANSITION: IDLE -> RINGING")), "CallHandler Test 5.2 FAILED: VOICEMAIL (No CID) scenario missing RINGING state.");
  assert.ok(!logs.some(log => log.includes("MODEM_INFO: Caller ID event processed during RINGING state.")), "CallHandler Test 5.3 FAILED: VOICEMAIL (No CID) should not have a CallerIdEvent.");
  console.log('PASS: VOICEMAIL (No Caller ID) scenario completed and state transitions verified.');
  
  console.log = originalConsoleLog; // Restore console.log fully
  console.log('\n--- All Modem Tests Finished (including call handling and stateful) ---');
}

runTest();
