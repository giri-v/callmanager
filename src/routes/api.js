/**
 * @file API route handlers for managing screening lists and voicemails.
 * Uses functions from screening.js for list management.
 */

// const { listVoicemails, deleteVoicemail: removeVoicemail } = require('../lib/voicemail'); // Placeholder
const screening = require('../lib/screening'); // Import the screening module

console.log('src/routes/api.js loaded - Uses screening.js for list management.');

/**
 * Placeholder for getting voicemails.
 * @param {object} req - Simulated request object.
 * @param {object} res - Simulated response object (unused in placeholder).
 */
function getVoicemails(req, res) {
  console.log('API: Get Voicemails called.');
  // In a real app:
  // listVoicemails()
  //   .then(data => res.json(data))
  //   .catch(err => res.status(500).send('Error fetching voicemails'));
  if (res && typeof res.send === 'function') {
    res.send('API_PLACEHOLDER: Get Voicemails - Data would be here.');
  }
}

/**
 * Placeholder for deleting a voicemail.
 * @param {object} req - Simulated request object, expecting req.params.id.
 * @param {object} res - Simulated response object (unused in placeholder).
 */
function deleteVoicemail(req, res) {
  const id = req && req.params ? req.params.id : 'unknown_id';
  console.log(`API: Delete Voicemail ${id} called.`);
  // In a real app:
  // if (removeVoicemail(id)) {
  //   res.status(200).send({ message: 'Voicemail deleted' });
  // } else {
  //   res.status(404).send({ message: 'Voicemail not found' });
  // }
  if (res && typeof res.send === 'function') {
    res.send(`API_PLACEHOLDER: Voicemail ${id} deletion status would be here.`);
  }
}

/**
 * Gets the list of blocked numbers.
 * @param {object} req - Simulated request object.
 * @param {object} res - Simulated response object.
 */
function getBlockedNumbers(req, res) {
  console.log('API: Get Blocked Numbers called.');
  // Accessing the in-memory list directly (as it's updated by load/save)
  const numbers = Array.from(screening._internal_blockedNumbers_TEST_ONLY || []);
  if (res && typeof res.json === 'function') {
    res.json(numbers);
  } else if (res && typeof res.send === 'function') { // Fallback for placeholder
    res.send(JSON.stringify(numbers));
  }
}

/**
 * Adds a number to the blocked list.
 * @param {object} req - Simulated request object, expecting req.body.number.
 * @param {object} res - Simulated response object.
 */
function addBlockedNumber(req, res) {
  const number = req && req.body ? req.body.number : null;
  console.log(`API: Add Blocked Number ${number} called.`);
  if (!number) {
    return res && res.status ? res.status(400).send({ message: 'Number is required.' }) : console.error('API Error: Number is required for addBlockedNumber');
  }
  if (screening.addBlockedNumberToList(number)) {
    res && res.status ? res.status(201).send({ message: `Number ${number} added to blocklist.` }) : console.log(`Number ${number} added.`);
  } else {
    res && res.status ? res.status(409).send({ message: `Number ${number} might already be in the list or an error occurred.` }) : console.log(`Number ${number} might already be in list.`);
  }
}

/**
 * Deletes a number from the blocked list.
 * @param {object} req - Simulated request object, expecting req.params.number.
 * @param {object} res - Simulated response object.
 */
function deleteBlockedNumber(req, res) {
  const number = req && req.params ? req.params.number : null;
  console.log(`API: Delete Blocked Number ${number} called.`);
   if (!number) {
    return res && res.status ? res.status(400).send({ message: 'Number is required.' }) : console.error('API Error: Number is required for deleteBlockedNumber');
  }
  if (screening.removeBlockedNumberFromList(number)) {
    res && res.status ? res.status(200).send({ message: `Number ${number} removed from blocklist.` }) : console.log(`Number ${number} removed.`);
  } else {
    res && res.status ? res.status(404).send({ message: `Number ${number} not found in blocklist.` }) : console.log(`Number ${number} not found.`);
  }
}

/**
 * Gets the list of permitted numbers.
 * @param {object} req - Simulated request object.
 * @param {object} res - Simulated response object.
 */
function getPermittedNumbers(req, res) {
  console.log('API: Get Permitted Numbers called.');
  const numbers = Array.from(screening._internal_permittedNumbers_TEST_ONLY || []);
  if (res && typeof res.json === 'function') {
    res.json(numbers);
  } else if (res && typeof res.send === 'function') {
    res.send(JSON.stringify(numbers));
  }
}

/**
 * Adds a number to the permitted list.
 * @param {object} req - Simulated request object, expecting req.body.number.
 * @param {object} res - Simulated response object.
 */
function addPermittedNumber(req, res) {
  const number = req && req.body ? req.body.number : null;
  console.log(`API: Add Permitted Number ${number} called.`);
  if (!number) {
    return res && res.status ? res.status(400).send({ message: 'Number is required.' }) : console.error('API Error: Number is required for addPermittedNumber');
  }
  if (screening.addPermittedNumberToList(number)) {
    res && res.status ? res.status(201).send({ message: `Number ${number} added to permitted list.` }) : console.log(`Number ${number} added to permitted list.`);
  } else {
    res && res.status ? res.status(409).send({ message: `Number ${number} might already be in the list or an error occurred.` }) : console.log(`Number ${number} might already be in permitted list.`);
  }
}

/**
 * Deletes a number from the permitted list.
 * @param {object} req - Simulated request object, expecting req.params.number.
 * @param {object} res - Simulated response object.
 */
function deletePermittedNumber(req, res) {
  const number = req && req.params ? req.params.number : null;
  console.log(`API: Delete Permitted Number ${number} called.`);
  if (!number) {
    return res && res.status ? res.status(400).send({ message: 'Number is required.' }) : console.error('API Error: Number is required for deletePermittedNumber');
  }
  if (screening.removePermittedNumberFromList(number)) {
    res && res.status ? res.status(200).send({ message: `Number ${number} removed from permitted list.` }) : console.log(`Number ${number} removed from permitted list.`);
  } else {
    res && res.status ? res.status(404).send({ message: `Number ${number} not found in permitted list.` }) : console.log(`Number ${number} not found in permitted list.`);
  }
}

module.exports = {
  getVoicemails,
  deleteVoicemail,
  getBlockedNumbers,
  addBlockedNumber,
  deleteBlockedNumber,
  getPermittedNumbers,
  addPermittedNumber,
  deletePermittedNumber,
};
