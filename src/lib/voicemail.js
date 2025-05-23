/**
 * @file Manages voicemail operations (placeholder implementation).
 */

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto'); // For generating unique IDs

/**
 * @type {Array<object>}
 * @description Stores metadata for all voicemails.
 * Each object has: { id: string, timestamp: Date, callerNumber: string, callerName: string, durationSeconds: number|null, filePath: string|null }
 */
let voicemails = [];

// Ensure the voicemails directory exists
const voicemailDir = path.join('data', 'voicemails');
if (!fs.existsSync(voicemailDir)) {
  fs.mkdirSync(voicemailDir, { recursive: true });
}

/**
 * Starts a new voicemail recording (placeholder).
 * @param {object} callerIdInfo - Information about the caller.
 * @param {string} callerIdInfo.number - The caller's phone number.
 * @param {string} callerIdInfo.name - The caller's name.
 * @returns {string} The ID of the newly created voicemail entry.
 */
function startVoiceMessage(callerIdInfo) {
  const voicemailId = randomUUID();
  const timestamp = new Date();
  const newVoicemail = {
    id: voicemailId,
    timestamp,
    callerNumber: callerIdInfo.number || 'Unknown Number',
    callerName: callerIdInfo.name || 'Unknown Name',
    durationSeconds: null,
    filePath: null,
  };
  voicemails.push(newVoicemail);
  console.log(`Starting voicemail recording for ${newVoicemail.callerNumber} - ID: ${voicemailId}. (Placeholder - actual recording depends on modem interaction)`);
  return voicemailId;
}

/**
 * Stops a voicemail recording (placeholder).
 * @param {string} voicemailId - The ID of the voicemail to stop.
 * @param {number} durationSeconds - The duration of the voicemail in seconds.
 * @returns {boolean} True if the voicemail was found and updated, false otherwise.
 */
function stopVoiceMessage(voicemailId, durationSeconds) {
  const voicemail = voicemails.find(vm => vm.id === voicemailId);
  if (!voicemail) {
    console.error(`Voicemail with ID: ${voicemailId} not found to stop recording.`);
    return false;
  }

  voicemail.durationSeconds = durationSeconds;
  voicemail.filePath = path.join(voicemailDir, `vm_${voicemailId}.wav`);

  try {
    // Simulate file creation by creating an empty file
    fs.closeSync(fs.openSync(voicemail.filePath, 'w'));
    console.log(`Stopping voicemail recording for ID: ${voicemailId}. Duration: ${durationSeconds}s. File: ${voicemail.filePath}. (Placeholder - file created)`);
    return true;
  } catch (err) {
    console.error(`Error creating placeholder file for voicemail ID ${voicemailId}:`, err);
    // Still mark as successful for metadata purposes if file creation fails in this placeholder
    return true;
  }
}

/**
 * Lists all voicemail metadata.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of voicemail metadata objects.
 */
async function listVoicemails() {
  return Promise.resolve([...voicemails]); // Return a copy
}

/**
 * Deletes a voicemail entry and its associated placeholder file.
 * @param {string} voicemailId - The ID of the voicemail to delete.
 * @returns {boolean} True if the voicemail was found and deleted, false otherwise.
 */
function deleteVoicemail(voicemailId) {
  const index = voicemails.findIndex(vm => vm.id === voicemailId);
  if (index === -1) {
    console.warn(`Voicemail with ID: ${voicemailId} not found for deletion.`);
    return false;
  }

  const [deletedVoicemail] = voicemails.splice(index, 1);
  console.log(`Deleted voicemail metadata for ID: ${voicemailId}.`);

  if (deletedVoicemail.filePath) {
    try {
      if (fs.existsSync(deletedVoicemail.filePath)) {
        fs.unlinkSync(deletedVoicemail.filePath);
        console.log(`Deleted placeholder voicemail file: ${deletedVoicemail.filePath}`);
      } else {
        console.warn(`Placeholder file not found for deleted voicemail ID ${voicemailId}: ${deletedVoicemail.filePath}`);
      }
    } catch (err) {
      console.error(`Error deleting placeholder file for voicemail ID ${voicemailId}:`, err);
    }
  }
  return true;
}

/**
 * Clears all voicemails and their placeholder files.
 * Primarily for testing purposes.
 */
function _clearAllVoicemails_TEST_ONLY() {
  voicemails.forEach(vm => {
    if (vm.filePath && fs.existsSync(vm.filePath)) {
      try {
        fs.unlinkSync(vm.filePath);
      } catch (err) {
        console.error(`Error deleting placeholder file during clear: ${vm.filePath}`, err);
      }
    }
  });
  voicemails = [];
  console.log('All voicemails and placeholder files cleared (for testing).');
}


module.exports = {
  startVoiceMessage,
  stopVoiceMessage,
  listVoicemails,
  deleteVoicemail,
  _clearAllVoicemails_TEST_ONLY, // Export for test script
  // Expose 'voicemails' array for direct inspection in tests if needed, though prefer functions
  _internal_voicemails_TEST_ONLY: voicemails
};

console.log('voicemail.js loaded with placeholder functions.');
