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
    console.log('GPIO_PLACEHOLDER: GPIO is disabled in config, no cleanup needed.');
    return;
  }
  console.log("GPIO_PLACEHOLDER: Cleaning up GPIO pins. (Would release 'onoff' pins)");
}

module.exports = {
  initializeGpio,
  sendEmailNotification,
  publishMqttNotification,
  setGpioStatus,
  cleanupGpio,
};

// For direct testing:
if (require.main === module) {
  if (!config) {
    console.error("CRITICAL: Configuration not loaded. Cannot run notification direct tests.");
  } else {
    console.log("--- Direct Test of Notifications (config dependent) ---");

    // Simulate enabling all for direct test
    const originalEmailEnabled = config.notifications.email.enabled;
    const originalMqttEnabled = config.notifications.mqtt.enabled;
    const originalGpioEnabled = config.notifications.gpio.enabled;

    config.notifications.email.enabled = true;
    config.notifications.mqtt.enabled = true;
    config.notifications.gpio.enabled = true;

    initializeGpio();
    sendEmailNotification('Test Subject', 'Test Body', '/path/to/test_attachment.wav');
    publishMqttNotification('call/incoming', { number: '1234567890', name: 'Test Caller' });
    setGpioStatus('RINGING');
    cleanupGpio();

    // Restore original config states
    config.notifications.email.enabled = originalEmailEnabled;
    config.notifications.mqtt.enabled = originalMqttEnabled;
    config.notifications.gpio.enabled = originalGpioEnabled;
    console.log("--- Direct Test Finished ---");
  }
}
