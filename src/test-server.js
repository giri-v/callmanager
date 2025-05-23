/**
 * @file Tests the placeholder web server and API route handlers.
 */

const http = require('http');
const { startServer } = require('./app');
const api = require('./routes/api'); // Import placeholder API functions

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
      if (voicemailsApiResponse.message && voicemailsApiResponse.message.includes('API: Voicemails data from handler.')) {
        console.log('Test PASSED: GET /api/voicemails responded correctly.');
        console.log('Voicemails API Response:', voicemailsApiResponse);
      } else {
        console.error('Test FAILED: GET /api/voicemails did not respond as expected. Response:', voicemailsApiContent);
      }
    } catch (error) {
      console.error('Test FAILED: GET /api/voicemails request error:', error);
    }

    try {
      const blockedNumbersApiContent = await fetchUrl('/api/blockednumbers');
      const blockedNumbersApiResponse = JSON.parse(blockedNumbersApiContent);
      // Check if the response contains data that would come from `screening._internal_blockedNumbers_TEST_ONLY`
      // which should be the default example set by `screening.js` if no file existed.
      // Example: `new Set(['18005550000'])`
      if (blockedNumbersApiResponse.dataSent && JSON.parse(blockedNumbersApiResponse.dataSent).includes('18005550000')) {
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
