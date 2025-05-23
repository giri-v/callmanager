/**
 * @file Tests the placeholder web server and API route handlers.
 */

const http = require('http');
const { startServer } = require('./app');
const api = require('./routes/api'); // Import placeholder API functions
const assert = require('assert'); // For direct API function tests

const PORT = process.env.PORT || 5000; // Ensure consistent port

/**
 * Fetches content from a given URL.
 * @param {string} urlPath - The path to request (e.g., '/', '/settings').
 * @returns {Promise<string>} A promise that resolves with the response body or an error message.
 */
function fetchUrl(urlPath) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: 'localhost',
      port: PORT,
      path: urlPath,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(`Request to ${urlPath} failed with status ${res.statusCode}: ${data}`);
        }
      });
    }).on('error', (err) => {
      reject(`Request to ${urlPath} errored: ${err.message}`);
    });
  });
}

/**
 * Runs all tests.
 */
async function runTests() {
  console.log('--- Starting Server and API Tests ---');

  let server;
  try {
    // 1. Start the server
    console.log('\nAttempting to start the server...');
    server = startServer(); // startServer from app.js should listen on PORT
    console.log('Server started (or at least, startServer() was called).');

    // 2. Test serving HTML files
    console.log('\n--- Testing HTML Serving ---');
    try {
      const indexHtmlContent = await fetchUrl('/');
      if (indexHtmlContent.includes('<title>Call Attendant</title>') && indexHtmlContent.includes('<h1>Voicemails</h1>')) {
        console.log('Test PASSED: GET / serves index.html content correctly.');
      } else {
        console.error('Test FAILED: GET / did not serve expected index.html content.');
        console.log('Received:', indexHtmlContent.substring(0, 200) + '...'); // Log snippet
      }
    } catch (error) {
      console.error('Test FAILED: GET / request error:', error);
    }

    try {
      const settingsHtmlContent = await fetchUrl('/settings');
      if (settingsHtmlContent.includes('<title>Call Attendant - Settings</title>') && settingsHtmlContent.includes('<h1>Settings</h1>')) {
        console.log('Test PASSED: GET /settings serves settings.html content correctly.');
      } else {
        console.error('Test FAILED: GET /settings did not serve expected settings.html content.');
        console.log('Received:', settingsHtmlContent.substring(0, 200) + '...'); // Log snippet
      }
    } catch (error) {
      console.error('Test FAILED: GET /settings request error:', error);
    }
    
    try {
      const notFoundContent = await fetchUrl('/nonexistentpage');
      // This will likely reject, which is the expected behavior for a 404.
      // The fetchUrl function is designed to reject on non-2xx status codes.
      console.error('Test FAILED: GET /nonexistentpage should have resulted in a rejection (404), but resolved with:', notFoundContent.substring(0,100));
    } catch (error) {
      if (error.includes && error.includes('failed with status 404')) {
         console.log('Test PASSED: GET /nonexistentpage correctly resulted in a 404 error as expected.');
      } else {
         console.error('Test FAILED: GET /nonexistentpage errored, but not with the expected 404:', error);
      }
    }


    // 3. Test placeholder API functions (direct calls are now replaced by HTTP calls)
    console.log('\n--- Testing API Routes via HTTP ---');
    try {
      const voicemailsApiContent = await fetchUrl('/api/voicemails');
      const voicemailsApiResponse = JSON.parse(voicemailsApiContent);
      // app.js now directly sends the data from the API handler, not the wrapper object.
      // The api.getVoicemails returns an array (currently empty by default from voicemail.listVoicemails).
      if (Array.isArray(voicemailsApiResponse)) {
        console.log('Test PASSED: GET /api/voicemails responded with an array as expected.');
        console.log('Voicemails API Response:', voicemailsApiResponse);
      } else {
        console.error('Test FAILED: GET /api/voicemails did not respond with an array. Response:', voicemailsApiContent);
      }
    } catch (error) {
      console.error('Test FAILED: GET /api/voicemails request error:', error);
    }

    try {
      const blockedNumbersApiContent = await fetchUrl('/api/blockednumbers');
      const blockedNumbersApiResponse = JSON.parse(blockedNumbersApiContent);
      // app.js now directly sends the data from the API handler.
      // api.getBlockedNumbers returns an array (e.g., ['18005550000']).
      if (Array.isArray(blockedNumbersApiResponse) && blockedNumbersApiResponse.includes('18005550000')) {
         console.log('Test PASSED: GET /api/blockednumbers responded with expected data.');
         console.log('Blocked Numbers API Response:', blockedNumbersApiResponse);
      } else {
        console.error('Test FAILED: GET /api/blockednumbers did not respond with expected data. Response:', blockedNumbersApiContent);
      }
    } catch (error) {
      console.error('Test FAILED: GET /api/blockednumbers request error:', error);
    }
    
    try {
      await fetchUrl('/api/unknown');
      console.error('Test FAILED: GET /api/unknown should have resulted in a 404, but resolved.');
    } catch (error) {
      if (error.includes && error.includes('failed with status 404')) {
         console.log('Test PASSED: GET /api/unknown correctly resulted in a 404 error as expected.');
      } else {
         console.error('Test FAILED: GET /api/unknown errored, but not with the expected 404:', error);
      }
    }

    try {
      const statusApiContent = await fetchUrl('/api/status');
      const statusApiResponse = JSON.parse(statusApiContent);
      if (statusApiResponse.status && statusApiResponse.status.includes('API is running (placeholder mode)')) {
        console.log('Test PASSED: GET /api/status responded correctly.');
        console.log('Status API Response:', statusApiResponse);
      } else {
        console.error('Test FAILED: GET /api/status did not respond as expected. Response:', statusApiContent);
      }
    } catch (error) {
      console.error('Test FAILED: GET /api/status request error:', error);
    }


    // 4. Test API placeholder functions (direct calls to check logging and simulated behavior)
    console.log('\n--- Testing API Placeholder Functions (Direct Calls) ---');
    let apiResult;
    let capturedLogs = [];
    const originalConsoleLogForDirectCalls = console.log; // Store original console.log
    const consoleSpy = (...args) => { 
      capturedLogs.push(args.join(' ')); 
      // originalConsoleLogForDirectCalls.apply(console, args); // Optionally log to console during spy
    };
    
    // Mock response object for direct calls
    const mockRes = {
      send: (data) => { originalConsoleLogForDirectCalls('MockRes.send called with:', data); },
      json: (data) => { originalConsoleLogForDirectCalls('MockRes.json called with:', data); },
      status: function(statusCode) { 
        originalConsoleLogForDirectCalls(`MockRes.status called with: ${statusCode}`);
        return this; // Allow chaining like res.status(200).send()
      }
    };

    // Test getVoicemails
    console.log = consoleSpy; capturedLogs = [];
    apiResult = await api.getVoicemails({ /* simulated req */ }, mockRes);
    console.log = originalConsoleLogForDirectCalls;
    assert.ok(Array.isArray(apiResult), 'Test 4.1.1 FAILED: api.getVoicemails should return an array.');
    assert.ok(capturedLogs.some(log => log.includes("API_PLACEHOLDER: getVoicemails called")), 'Test 4.1.2 FAILED: getVoicemails did not log call.');
    assert.ok(capturedLogs.some(log => log.includes("API_PLACEHOLDER: Calling voicemail.listVoicemails().")), 'Test 4.1.3 FAILED: getVoicemails did not log correct voicemail module interaction message.');
    console.log('Test 4.1 PASSED: api.getVoicemails placeholder executed as expected.');

    // Test deleteVoicemail
    console.log = consoleSpy; capturedLogs = [];
    apiResult = await api.deleteVoicemail({ params: { id: 'test-vm-id' } }, mockRes);
    console.log = originalConsoleLogForDirectCalls;
    assert.deepStrictEqual(typeof apiResult, 'object', 'Test 4.2.1 FAILED: api.deleteVoicemail should return an object.');
    assert.ok(capturedLogs.some(log => log.includes("API_PLACEHOLDER: deleteVoicemail called for ID: test-vm-id")), 'Test 4.2.2 FAILED: deleteVoicemail did not log call.');
    assert.ok(capturedLogs.some(log => log.includes("API_PLACEHOLDER: Calling voicemail.deleteVoicemail('test-vm-id').")), 'Test 4.2.3 FAILED: deleteVoicemail did not log correct voicemail module interaction message.');
    console.log('Test 4.2 PASSED: api.deleteVoicemail placeholder executed as expected.');

    // Test getBlockedNumbers
    console.log = consoleSpy; capturedLogs = [];
    apiResult = api.getBlockedNumbers({ /* simulated req */ }, mockRes);
    console.log = originalConsoleLogForDirectCalls;
    assert.ok(Array.isArray(apiResult), 'Test 4.3.1 FAILED: api.getBlockedNumbers should return an array.');
    assert.ok(capturedLogs.some(log => log.includes("API_PLACEHOLDER: getBlockedNumbers called")), 'Test 4.3.2 FAILED: getBlockedNumbers did not log call.');
    assert.ok(capturedLogs.some(log => log.includes("API_PLACEHOLDER: Accessing screening module for blocked numbers list.")), 'Test 4.3.3 FAILED: getBlockedNumbers did not log screening interaction.');
    console.log('Test 4.3 PASSED: api.getBlockedNumbers placeholder executed as expected.');

    // Test addBlockedNumber
    console.log = consoleSpy; capturedLogs = [];
    const testBlockNumber = '1112223333';
    apiResult = api.addBlockedNumber({ body: { number: testBlockNumber } }, mockRes);
    console.log = originalConsoleLogForDirectCalls;
    assert.deepStrictEqual(typeof apiResult, 'object', 'Test 4.4.1 FAILED: api.addBlockedNumber should return an object.');
    assert.ok(apiResult.success, 'Test 4.4.2 FAILED: api.addBlockedNumber success flag not true.');
    assert.ok(capturedLogs.some(log => log.includes(`API_PLACEHOLDER: addBlockedNumber called for number: ${testBlockNumber}`)), 'Test 4.4.3 FAILED: addBlockedNumber did not log correct call message.');
    assert.ok(capturedLogs.some(log => log.includes(`API_PLACEHOLDER: Calling screening.addBlockedNumberToList('${testBlockNumber}')`)), 'Test 4.4.4 FAILED: addBlockedNumber did not log screening interaction.');
    // Verify list reflects change (simulated, as screening.js has persistence)
    let currentBlocked = api.getBlockedNumbers({}, { send: () => {} }); // Call get to check
    assert.ok(currentBlocked.includes(testBlockNumber), 'Test 4.4.5 FAILED: Blocked list does not reflect addition.');
    console.log('Test 4.4 PASSED: api.addBlockedNumber placeholder executed and list updated.');

    // Test deleteBlockedNumber
    console.log = consoleSpy; capturedLogs = [];
    apiResult = api.deleteBlockedNumber({ params: { number: testBlockNumber } }, mockRes);
    console.log = originalConsoleLogForDirectCalls;
    assert.deepStrictEqual(typeof apiResult, 'object', 'Test 4.5.1 FAILED: api.deleteBlockedNumber should return an object.');
    assert.ok(apiResult.success, 'Test 4.5.2 FAILED: api.deleteBlockedNumber success flag not true.');
    assert.ok(capturedLogs.some(log => log.includes(`API_PLACEHOLDER: deleteBlockedNumber called for number: ${testBlockNumber}`)), 'Test 4.5.3 FAILED: deleteBlockedNumber did not log correct call message.');
    assert.ok(capturedLogs.some(log => log.includes(`API_PLACEHOLDER: Calling screening.removeBlockedNumberFromList('${testBlockNumber}')`)), 'Test 4.5.4 FAILED: deleteBlockedNumber did not log screening interaction.');
    currentBlocked = api.getBlockedNumbers({}, { send: () => {} }); // Call get to check
    assert.ok(!currentBlocked.includes(testBlockNumber), 'Test 4.5.5 FAILED: Blocked list still contains deleted number.');
    console.log('Test 4.5 PASSED: api.deleteBlockedNumber placeholder executed and list updated.');
    
    // Test getPermittedNumbers
    console.log = consoleSpy; capturedLogs = [];
    apiResult = api.getPermittedNumbers({ /* simulated req */ }, mockRes);
    console.log = originalConsoleLogForDirectCalls;
    assert.ok(Array.isArray(apiResult), 'Test 4.6.1 FAILED: api.getPermittedNumbers should return an array.');
    assert.ok(capturedLogs.some(log => log.includes("API_PLACEHOLDER: getPermittedNumbers called")), 'Test 4.6.2 FAILED: getPermittedNumbers did not log call.');
    assert.ok(capturedLogs.some(log => log.includes("API_PLACEHOLDER: Accessing screening module for permitted numbers list.")), 'Test 4.6.3 FAILED: getPermittedNumbers did not log screening interaction.');
    console.log('Test 4.6 PASSED: api.getPermittedNumbers placeholder executed as expected.');

    // Test addPermittedNumber
    console.log = consoleSpy; capturedLogs = [];
    const testPermitNumber = '4445556666';
    apiResult = api.addPermittedNumber({ body: { number: testPermitNumber } }, mockRes);
    console.log = originalConsoleLogForDirectCalls;
    assert.deepStrictEqual(typeof apiResult, 'object', 'Test 4.7.1 FAILED: api.addPermittedNumber should return an object.');
    assert.ok(apiResult.success, 'Test 4.7.2 FAILED: api.addPermittedNumber success flag not true.');
    assert.ok(capturedLogs.some(log => log.includes(`API_PLACEHOLDER: addPermittedNumber called for number: ${testPermitNumber}`)), 'Test 4.7.3 FAILED: addPermittedNumber did not log correct call message.');
    assert.ok(capturedLogs.some(log => log.includes(`API_PLACEHOLDER: Calling screening.addPermittedNumberToList('${testPermitNumber}')`)), 'Test 4.7.4 FAILED: addPermittedNumber did not log screening interaction.');
    let currentPermitted = api.getPermittedNumbers({}, { send: () => {} });
    assert.ok(currentPermitted.includes(testPermitNumber), 'Test 4.7.5 FAILED: Permitted list does not reflect addition.');
    console.log('Test 4.7 PASSED: api.addPermittedNumber placeholder executed and list updated.');

    // Test deletePermittedNumber
    console.log = consoleSpy; capturedLogs = [];
    apiResult = api.deletePermittedNumber({ params: { number: testPermitNumber } }, mockRes);
    console.log = originalConsoleLogForDirectCalls;
    assert.deepStrictEqual(typeof apiResult, 'object', 'Test 4.8.1 FAILED: api.deletePermittedNumber should return an object.');
    assert.ok(apiResult.success, 'Test 4.8.2 FAILED: api.deletePermittedNumber success flag not true.');
    assert.ok(capturedLogs.some(log => log.includes(`API_PLACEHOLDER: deletePermittedNumber called for number: ${testPermitNumber}`)), 'Test 4.8.3 FAILED: deletePermittedNumber did not log correct call message.');
    assert.ok(capturedLogs.some(log => log.includes(`API_PLACEHOLDER: Calling screening.removePermittedNumberFromList('${testPermitNumber}')`)), 'Test 4.8.4 FAILED: deletePermittedNumber did not log screening interaction.');
    currentPermitted = api.getPermittedNumbers({}, { send: () => {} });
    assert.ok(!currentPermitted.includes(testPermitNumber), 'Test 4.8.5 FAILED: Permitted list still contains deleted number.');
    console.log('Test 4.8 PASSED: api.deletePermittedNumber placeholder executed and list updated.');

    // Test getCallLogs
    console.log = consoleSpy; capturedLogs = [];
    apiResult = await api.getCallLogs({ query: { limit: 7 } }, mockRes);
    console.log = originalConsoleLogForDirectCalls;
    assert.ok(Array.isArray(apiResult), 'Test 4.9.1 FAILED: api.getCallLogs should return an array.');
    assert.ok(capturedLogs.some(log => log.includes("API_PLACEHOLDER: getCallLogs called with limit: 7")), 'Test 4.9.2 FAILED: getCallLogs did not log call.');
    assert.ok(capturedLogs.some(log => log.includes("API_PLACEHOLDER: Calling callLog.getCallLogs().")), 'Test 4.9.3 FAILED: getCallLogs did not log correct callLog module interaction message.');
    console.log('Test 4.9 PASSED: api.getCallLogs placeholder executed as expected.');

    // Test getApiStatus
    console.log = consoleSpy; capturedLogs = [];
    apiResult = api.getApiStatus({ /* simulated req */ }, mockRes);
    console.log = originalConsoleLogForDirectCalls;
    assert.ok(apiResult && apiResult.status, 'Test 4.10.1 FAILED: api.getApiStatus should return an object with status.');
    assert.ok(capturedLogs.some(log => log.includes("API_PLACEHOLDER: getApiStatus called")), 'Test 4.10.2 FAILED: getApiStatus did not log call.');
    console.log('Test 4.10 PASSED: api.getApiStatus placeholder executed as expected.');

  } catch (error) {
    console.error('!!! An unexpected error occurred during tests !!!', error);
  } finally {
    if (server && server.close) {
      console.log('\nClosing the server...');
      server.close(() => {
        console.log('Server closed.');
        console.log('\n--- Server and API Tests Finished ---');
      });
    } else {
      console.log('\nServer not available to close or already closed.');
      console.log('\n--- Server and API Tests Finished ---');
    }
  }
}

runTests();
