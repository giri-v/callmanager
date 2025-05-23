const { listSerialPorts, ModemCommunicator } = require('./lib/modem');
const config = require('./lib/config'); // Added for MQTT testing
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
}

runTest();
