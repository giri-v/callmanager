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

**Note**: Due to issues with `npm install` in the development environment, dependencies like `serialport`, `express`, `nodemailer`, `mqtt`, and `onoff` are not actually installed. Therefore, functionalities relying on these packages are implemented as placeholders that log their intended actions rather than performing them.

## MQTT Notifications

The application can publish real-time events via MQTT when configured. These notifications allow external systems or clients to react to call events.

### Configuration

MQTT notifications can be enabled and configured in the `config/config.json` file under the `notifications.mqtt` section. Key settings include:

*   `enabled`: Set to `true` to enable MQTT notifications.
*   `brokerUrl`: The URL of your MQTT broker (e.g., `mqtt://localhost:1883`).
*   `topicPrefix`: A string that will be prepended to all published topics (e.g., `callattendant`).

### Event: Ringing

*   **Topic**: `[topicPrefix]/ringing`
*   **Description**: Published when an incoming call is first detected by the modem (simulated). This event indicates that the phone is "ringing".
*   **Payload Structure**:
    *   If Caller ID is available at the time of ringing:
        ```json
        {
          "event": "ringing",
          "timestamp": "YYYY-MM-DDTHH:mm:ss.sssZ",
          "callerIdAvailable": true,
          "callerId": {
            "number": "15551234567",
            "name": "John Doe"
          }
        }
        ```
    *   If Caller ID is not yet available:
        ```json
        {
          "event": "ringing",
          "timestamp": "YYYY-MM-DDTHH:mm:ss.sssZ",
          "callerIdAvailable": false
        }
        ```
    *   **Fields**:
        *   `event` (string): Always "ringing".
        *   `timestamp` (string): ISO 8601 timestamp of the event.
        *   `callerIdAvailable` (boolean): Indicates if the `callerId` object is present and contains information.
        *   `callerId` (object, optional): Contains details of the caller if available.
            *   `number` (string): The caller's phone number.
            *   `name` (string | null): The caller's name (can be null if not provided by CID).

### Event: Caller ID Update

*   **Topic**: `[topicPrefix]/caller_id`
*   **Description**: Published when Caller ID information (number and name) becomes available or is updated for an incoming call. This might follow a "ringing" event where `callerIdAvailable` was `false`.
*   **Payload Structure**:
    ```json
    {
      "event": "caller_id_update",
      "timestamp": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "number": "15551234567",
      "name": "John Doe"
    }
    ```
    *   **Fields**:
        *   `event` (string): Always "caller_id_update".
        *   `timestamp` (string): ISO 8601 timestamp of the event.
        *   `number` (string): The caller's phone number.
        *   `name` (string | null): The caller's name (can be null if not provided).

### Conceptual Triggering

Currently, these MQTT events are triggered by simulated methods within the placeholder modem logic (`ModemCommunicator` class in `src/lib/modem.js`), specifically `simulateRingEvent()` and `simulateCallerIdEvent()`. In a production system, these would be triggered by actual modem events.

## Running Tests

A script is provided to run all test files:
```bash
./run_tests.sh
```
This will execute all `src/test-*.js` files using Node.js.
