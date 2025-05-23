/**
 * @file Manages loading and providing application configuration.
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../../config/config.json');

/**
 * @typedef {object} ModemConfig
 * @property {string} port - The serial port for the modem (e.g., "/dev/ttyACM0").
 * @property {number} baudRate - The baud rate for the modem.
 * @property {string[]} initCommands - An array of initialization commands for the modem.
 */

/**
 * @typedef {object} CallScreeningConfig
 * @property {string} onlineLookupServiceUrl - URL for online caller ID lookup (can be empty).
 * @property {string} defaultActionUnknownCaller - Action for unknown callers ("VOICEMAIL", "SCREEN", "ALLOW", "BLOCK").
 */

/**
 * @typedef {object} VoicemailConfig
 * @property {number} maxDurationSeconds - Maximum duration for a voicemail recording.
 * @property {string} greetingMessagePath - Path to the voicemail greeting audio file.
 */

/**
 * @typedef {object} EmailNotificationConfig
 * @property {boolean} enabled - Whether email notifications are enabled.
 * @property {string} smtpHost - SMTP server host.
 * @property {number} smtpPort - SMTP server port.
 * @property {string} smtpUser - SMTP username.
 * @property {string} smtpPass - SMTP password.
 * @property {string} recipientEmail - Email address to send notifications to.
 * @property {boolean} sendAttachment - Whether to send voicemail audio as an attachment.
 */

/**
 * @typedef {object} MqttNotificationConfig
 * @property {boolean} enabled - Whether MQTT notifications are enabled.
 * @property {string} brokerUrl - URL of the MQTT broker.
 * @property {string} topicPrefix - Prefix for MQTT topics.
 */

/**
 * @typedef {object} GpioNotificationConfig
 * @property {boolean} enabled - Whether GPIO notifications are enabled.
 * @property {number} statusPin - GPIO pin number for general status.
 * @property {number} blockedPin - GPIO pin number for blocked call indication.
 * @property {number} permittedPin - GPIO pin number for permitted call indication.
 */

/**
 * @typedef {object} NotificationConfig
 * @property {EmailNotificationConfig} email - Email notification settings.
 * @property {MqttNotificationConfig} mqtt - MQTT notification settings.
 * @property {GpioNotificationConfig} gpio - GPIO notification settings.
 */

/**
 * @typedef {object} WebServerConfig
 * @property {number} port - Port for the web server.
 */

/**
 * @typedef {object} AppConfig
 * @property {ModemConfig} modem - Modem configuration.
 * @property {CallScreeningConfig} callScreening - Call screening configuration.
 * @property {VoicemailConfig} voicemail - Voicemail configuration.
 * @property {NotificationConfig} notifications - Notification settings.
 * @property {WebServerConfig} webServer - Web server settings.
 */

/**
 * Loads the application configuration from config/config.json.
 * @returns {AppConfig | null} The loaded configuration object, or null if an error occurs.
 *                             In a real application, this might throw an error or exit.
 */
function loadConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      console.error(`Error: Configuration file not found at ${CONFIG_PATH}`);
      return null;
    }
    const configFileContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const parsedConfig = JSON.parse(configFileContent);
    console.log('Configuration loaded successfully from:', CONFIG_PATH);
    return parsedConfig;
  } catch (error) {
    console.error(`Error loading or parsing configuration file ${CONFIG_PATH}:`, error.message);
    if (error instanceof SyntaxError) {
      console.error("This might be due to malformed JSON in the configuration file.");
    }
    return null; // Return null to indicate failure, allowing the caller to handle it.
  }
}

const config = loadConfig();

// Export the loaded config directly. If loading fails, 'config' will be null.
// Applications using this module should check if 'config' is null.
module.exports = config;

// For direct testing:
if (require.main === module) {
  if (config) {
    console.log('Config loaded directly for testing:');
    console.log('Modem Port:', config.modem.port);
    console.log('Web Server Port:', config.webServer.port);
  } else {
    console.log('Config loading failed during direct test.');
  }
}
