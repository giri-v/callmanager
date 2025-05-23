# Call Attendant (Node.js Version)

This project is a Node.js-based application designed to manage and screen incoming phone calls, similar to a traditional answering machine but with enhanced capabilities like block/permit lists and real-time notifications.

## Features (Placeholder Implementation)

*   **Call Screening**: Uses configurable block lists, permit lists (by number and name patterns) to decide whether to allow, block, or send a call to voicemail. (See `src/lib/screening.js`)
*   **Voicemail**: Placeholder functionality for recording and managing voicemails. (See `src/lib/voicemail.js`)
*   **Modem Interaction**: Placeholder logic for interacting with a modem for call handling. (See `src/lib/modem.js`)
*   **Configuration**: Application behavior is managed via `config/config.json`. (See `src/lib/config.js`)
*   **Notifications**: Supports placeholder notifications for various events via Email, MQTT, and GPIO. (See `src/lib/notifications.js`)
*   **Web Interface**: Basic HTTP server providing a placeholder UI for voicemails and settings. (See `src/app.js` and `public/`)
*   **Call Logging**: Persists a log of incoming calls and actions taken. (See `src/lib/calllog.js`)
*   **API Endpoints**: Placeholder functions for a RESTful API to manage the application. (See `src/routes/api.js`)

**Note**: Due to issues with `npm install` in the development environment, dependencies like `serialport`, `express`, `nodemailer`, `mqtt`, and `onoff` are not actually installed. Therefore, functionalities relying on these packages are implemented as placeholders that log their intended actions rather than performing them.

## Modem Simulation (Placeholder Logic)
The `src/lib/modem.js` module contains a `ModemCommunicator` class that simulates the behavior of a physical modem. This placeholder logic is crucial for developing and testing other parts of the application (like call flow management, screening, and notifications) without requiring a real modem or a functional `serialport` setup. All simulated actions and state transitions are logged to the console.
(Details on MODEM_STATES, Key Simulation Methods, and Orchestrated Call Handling are omitted here for brevity but exist in the file)

## API Endpoints (Placeholder Implementation)

Due to the `express` package not being installed (as noted above), the application's API is not exposed via a full HTTP server with conventional RESTful endpoints. Instead, the API is implemented as a set of placeholder functions within `src/routes/api.js`. These functions simulate the behavior of actual API handlers and can be called directly from other parts of the backend code, primarily for testing and internal logic.

The `src/app.js` file sets up a basic Node.js `http` server that provides a very limited set of HTTP-accessible API endpoints. Most API interactions are intended to be tested by directly invoking the functions in `src/routes/api.js`, as demonstrated in `src/test-server.js`.

### Placeholder API Functions in `src/routes/api.js`

These functions log their actions and simulate interactions with other modules:

*   **Voicemails:**
    *   `getVoicemails(req, res)`: Intended for `GET /api/voicemails`. Simulates fetching all voicemail metadata.
    *   `deleteVoicemail(req, res)`: Intended for `DELETE /api/voicemails/:id`. Simulates deleting a specific voicemail.
*   **Screening Lists:**
    *   `getBlockedNumbers(req, res)`: Intended for `GET /api/blockednumbers`. Simulates fetching the list of blocked numbers.
    *   `addBlockedNumber(req, res)`: Intended for `POST /api/blockednumbers`. Simulates adding a number to the blocklist.
    *   `deleteBlockedNumber(req, res)`: Intended for `DELETE /api/blockednumbers/:number`. Simulates removing a number from the blocklist.
    *   `getPermittedNumbers(req, res)`: Intended for `GET /api/permittednumbers`. Simulates fetching the list of permitted numbers.
    *   `addPermittedNumber(req, res)`: Intended for `POST /api/permittednumbers`. Simulates adding a number to the permitted list.
    *   `deletePermittedNumber(req, res)`: Intended for `DELETE /api/permittednumbers/:number`. Simulates removing a number from the permitted list.
*   **Call Logs:**
    *   `getCallLogs(req, res)`: Intended for `GET /api/calllogs`. Simulates fetching recent call log entries, supports a `limit` query parameter.
*   **Status:**
    *   `getApiStatus(req, res)`: Intended for `GET /api/status`. Simulates returning the current API status.

### HTTP-Accessible Endpoints (via `src/app.js`)

The basic `http` server in `src/app.js` exposes a few placeholder API endpoints:

*   `GET /api/voicemails`: Returns a JSON array of voicemail data (currently empty by default).
*   `GET /api/blockednumbers`: Returns a JSON array of blocked numbers.
*   `GET /api/status`: Returns a JSON object with the API status and timestamp.

For testing the full intended API logic, direct calls to the functions in `src/routes/api.js` are recommended, as shown in `src/test-server.js` under the "Testing API Placeholder Functions (Direct Calls)" section.

## MQTT Notifications
(Details on MQTT Notifications are omitted here for brevity but exist in the file)

## Running Tests

A script is provided to run all test files:
```bash
./run_tests.sh
```
This will execute all `src/test-*.js` files using Node.js.
