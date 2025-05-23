/**
 * @file Manages placeholder notification systems (Email, MQTT, GPIO).
 */

const config = require('./config'); // Loads config/config.json

/**
 * Initializes GPIO pins (placeholder).
 * Call this when the application starts if GPIO is enabled.
 */
function initializeGpio() {
  if (!config || !config.notifications || !config.notifications.gpio || !config.notifications.gpio.enabled) {
    console.log('GPIO_PLACEHOLDER: GPIO is disabled in config, not initializing.');
    return;
  }
  console.log(`GPIO_PLACEHOLDER: Initializing GPIO pins. (Would use 'onoff' and pins like status: ${config.notifications.gpio.statusPin})`);
}

/**
 * Sends an email notification (placeholder).
 * @param {string} subject - The subject of the email.
 * @param {string} body - The body content of the email.
 * @param {string} [attachmentPath] - Optional path to a file to attach.
 */
function sendEmailNotification(subject, body, attachmentPath) {
  if (!config || !config.notifications || !config.notifications.email || !config.notifications.email.enabled) {
    return; // Email notifications are disabled
  }

  let logMessage = `EMAIL_PLACEHOLDER: Sending email with subject '${subject}', body '${body}'`;
  if (attachmentPath) {
    logMessage += `, and attachment '${attachmentPath}'`;
  }
  logMessage += `. (Would use nodemailer with host: ${config.notifications.email.smtpHost})`;
  console.log(logMessage);
}

/**
 * Publishes an MQTT notification (placeholder).
 * @param {string} topic - The specific topic to publish to (will be prefixed).
 * @param {object} message - The message object to publish (will be JSON stringified).
 *
 * === MQTT Message Structures ===
 *
 * **Ringing Event:**
 * Published when an incoming call is first detected (ringing).
 * Topic: `[config.notifications.mqtt.topicPrefix]/ringing`
 * Payload Example:
 * ```json
 * {
 *   "event": "ringing",
 *   "timestamp": "2023-10-27T10:30:00Z",
 *   "callerIdAvailable": true,
 *   "callerId": {
 *     "number": "15551234567",
 *     "name": "John Doe"
 *   }
 * }
 * ```
 * If callerId is not available at the moment of ringing:
 * ```json
 * {
 *   "event": "ringing",
 *   "timestamp": "2023-10-27T10:30:00Z",
 *   "callerIdAvailable": false
 * }
 * ```
 *
 * **Caller ID Update Event:**
 * Published when caller ID information becomes available or is updated.
 * Topic: `[config.notifications.mqtt.topicPrefix]/caller_id`
 * Payload Example:
 * ```json
 * {
 *   "event": "caller_id_update",
 *   "timestamp": "2023-10-27T10:30:01Z",
 *   "number": "15551234567",
 *   "name": "John Doe"
 * }
 * ```
 */
function publishMqttNotification(topic, message) {
  if (!config || !config.notifications || !config.notifications.mqtt || !config.notifications.mqtt.enabled) {
    return; // MQTT notifications are disabled
  }

  const fullTopic = `${config.notifications.mqtt.topicPrefix}/${topic}`;
  console.log(`MQTT_PLACEHOLDER: Publishing to topic '${fullTopic}' message: ${JSON.stringify(message)}. (Would use MQTT client with broker: ${config.notifications.mqtt.brokerUrl})`);
}

/**
 * Sets the GPIO status indicator (placeholder).
 * @param {string} statusType - The type of status to indicate (e.g., 'IDLE', 'RINGING', 'BLOCKED').
 */
function setGpioStatus(statusType) {
  if (!config || !config.notifications || !config.notifications.gpio || !config.notifications.gpio.enabled) {
    return; // GPIO notifications are disabled
  }
  console.log(`GPIO_PLACEHOLDER: Setting GPIO status to '${statusType}'. (Would use 'onoff' and pins like status: ${config.notifications.gpio.statusPin}, blocked: ${config.notifications.gpio.blockedPin})`);
}

/**
 * Cleans up GPIO pins (placeholder).
 * Call this when the application exits if GPIO was initialized.
 */
function cleanupGpio() {
  if (!config || !config.notifications || !config.notifications.gpio || !config.notifications.gpio.enabled) {
    // console.log('GPIO_PLACEHOLDER: GPIO is disabled in config, no cleanup needed.'); // Quieter when disabled
    return;
  }
  console.log("GPIO_PLACEHOLDER: Cleaning up GPIO pins. (Would release 'onoff' pins)");
}


/**
 * @description Publishes a "ringing" event MQTT notification.
 * Constructs the payload and calls `publishMqttNotification`.
 * @param {object} [callerIdInfo] - Optional caller ID information.
 * @param {string} [callerIdInfo.number] - The caller's phone number.
 * @param {string} [callerIdInfo.name] - The caller's name.
 */
function publishRingingEvent(callerIdInfo) {
  if (!config || !config.notifications || !config.notifications.mqtt || !config.notifications.mqtt.enabled) {
    return; // MQTT notifications are disabled
  }

  const timestamp = new Date().toISOString();
  let payload;

  if (callerIdInfo && callerIdInfo.number) {
    payload = {
      event: "ringing",
      timestamp: timestamp,
      callerIdAvailable: true,
      callerId: {
        number: callerIdInfo.number,
        name: callerIdInfo.name || null,
      }
    };
  } else {
    payload = {
      event: "ringing",
      timestamp: timestamp,
      callerIdAvailable: false
    };
  }
  publishMqttNotification('ringing', payload);
}

/**
 * @description Publishes a "caller_id_update" event MQTT notification.
 * Constructs the payload and calls `publishMqttNotification`.
 * @param {object} callerIdInfo - Required caller ID information.
 * @param {string} callerIdInfo.number - The caller's phone number.
 * @param {string} callerIdInfo.name - The caller's name.
 */
function publishCallerIdUpdateEvent(callerIdInfo) {
  if (!config || !config.notifications || !config.notifications.mqtt || !config.notifications.mqtt.enabled) {
    return; // MQTT notifications are disabled
  }

  if (!callerIdInfo || !callerIdInfo.number || typeof callerIdInfo.name === 'undefined') {
    console.error('NOTIFICATIONS_ERROR: Missing or invalid callerIdInfo for publishCallerIdUpdateEvent. Both number and name must be provided.');
    return;
  }

  const timestamp = new Date().toISOString();
  const payload = {
    event: "caller_id_update",
    timestamp: timestamp,
    number: callerIdInfo.number,
    name: callerIdInfo.name,
  };
  publishMqttNotification('caller_id', payload);
}


module.exports = {
  initializeGpio,
  sendEmailNotification,
  publishMqttNotification, // Still expose for other potential MQTT messages
  setGpioStatus,
  cleanupGpio,
  // New centralized functions
  publishRingingEvent,
  publishCallerIdUpdateEvent,
};

// For direct testing:
if (require.main === module) {
  if (!config) {
    console.error("CRITICAL: Configuration not loaded. Cannot run notification direct tests.");
  } else {
    console.log("--- Direct Test of Notifications (config dependent) ---");

    const originalMqttEnabled = config.notifications.mqtt.enabled;
    config.notifications.mqtt.enabled = true; // Ensure MQTT is enabled for this direct test

    console.log("\nTesting publishRingingEvent (with CID):");
    publishRingingEvent({ number: "15551234567", name: "Test User" });
    console.log("\nTesting publishRingingEvent (without CID):");
    publishRingingEvent();

    console.log("\nTesting publishCallerIdUpdateEvent (valid):");
    publishCallerIdUpdateEvent({ number: "15559876543", name: "Another User" });
    console.log("\nTesting publishCallerIdUpdateEvent (invalid - missing name):");
    publishCallerIdUpdateEvent({ number: "15550000000" });


    config.notifications.mqtt.enabled = originalMqttEnabled; // Restore
    console.log("\n--- Direct Test Finished ---");
  }
}
