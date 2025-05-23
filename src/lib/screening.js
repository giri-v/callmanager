/**
 * @file Manages call screening logic based on permitted/blocked numbers and names.
 * Lists are persisted to and loaded from the file system.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const PERMITTED_NUMBERS_PATH = path.join(DATA_DIR, 'permitted_numbers.json');
const BLOCKED_NUMBERS_PATH = path.join(DATA_DIR, 'blocked_numbers.json');
const PERMITTED_NAMES_REGEX_PATH = path.join(DATA_DIR, 'permitted_names_regex.json');
const BLOCKED_NAMES_REGEX_PATH = path.join(DATA_DIR, 'blocked_names_regex.json');
const PERMITTED_NUMBER_PATTERNS_PATH = path.join(DATA_DIR, 'permitted_number_patterns.json');
const BLOCKED_NUMBER_PATTERNS_PATH = path.join(DATA_DIR, 'blocked_number_patterns.json');

/** @type {Set<string>} */
let permittedNumbers = new Set();
/** @type {Set<string>} */
let blockedNumbers = new Set();
/** @type {Array<RegExp>} */
let permittedNamesRegex = [];
/** @type {Array<RegExp>} */
let blockedNamesRegex = [];
/** @type {Array<RegExp>} */
let permittedNumberPatterns = [];
/** @type {Array<RegExp>} */
let blockedNumberPatterns = [];

/**
 * Helper to load a JSON file into a Set.
 * @param {string} filePath - Path to the JSON file.
 * @param {Set<string>} defaultSet - Default set if file not found or invalid.
 * @returns {Set<string>} Loaded set or default.
 */
function loadSetFromFile(filePath, defaultSet = new Set()) {
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const dataArray = JSON.parse(fileContent);
      if (Array.isArray(dataArray)) {
        return new Set(dataArray);
      }
      console.warn(`Warning: Content of ${filePath} is not an array. Using default.`);
    }
  } catch (error) {
    console.warn(`Warning: Error reading or parsing ${filePath}. Using default. Error: ${error.message}`);
  }
  return defaultSet;
}

/**
 * Helper to load a JSON file containing regex strings into an array of RegExp objects.
 * @param {string} filePath - Path to the JSON file.
 * @param {Array<RegExp>} defaultRegexArray - Default array if file not found or invalid.
 * @returns {Array<RegExp>} Loaded array of RegExp objects or default.
 */
function loadRegexArrayFromFile(filePath, defaultRegexArray = []) {
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const dataArray = JSON.parse(fileContent); // Expects [{pattern: string, flags: string}]
      if (Array.isArray(dataArray)) {
        return dataArray.map(item => {
          if (item && typeof item.pattern === 'string') {
            return new RegExp(item.pattern, item.flags || '');
          }
          console.warn(`Warning: Invalid regex item in ${filePath}:`, item);
          return null;
        }).filter(Boolean); // Filter out nulls from invalid items
      }
      console.warn(`Warning: Content of ${filePath} is not an array of regex objects. Using default.`);
    }
  } catch (error) {
    console.warn(`Warning: Error reading or parsing ${filePath}. Using default. Error: ${error.message}`);
  }
  return defaultRegexArray;
}

/**
 * Loads all screening lists from their respective JSON files.
 * Initializes with empty lists if files are not found or are invalid.
 */
function loadLists() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log(`Created data directory: ${DATA_DIR}`);
    } catch (error) {
      console.error(`Error creating data directory ${DATA_DIR}:`, error);
      // Proceed with empty lists if directory creation fails
    }
  }

  permittedNumbers = loadSetFromFile(PERMITTED_NUMBERS_PATH, new Set(['15551234567', '15559876543'])); // Default examples
  blockedNumbers = loadSetFromFile(BLOCKED_NUMBERS_PATH, new Set(['18005550000'])); // Default examples
  permittedNamesRegex = loadRegexArrayFromFile(PERMITTED_NAMES_REGEX_PATH, [new RegExp('^Mom$'), new RegExp('^Dad$')]);
  blockedNamesRegex = loadRegexArrayFromFile(BLOCKED_NAMES_REGEX_PATH, [new RegExp('SCAM LIKELY', 'i'), new RegExp('^Unknown$', 'i')]);
  permittedNumberPatterns = loadRegexArrayFromFile(PERMITTED_NUMBER_PATTERNS_PATH, [new RegExp('^1555123....$')]);
  blockedNumberPatterns = loadRegexArrayFromFile(BLOCKED_NUMBER_PATTERNS_PATH, [new RegExp('^1800.......$')]);

  console.log('Screening lists loaded.');
}

/**
 * Helper to save a Set to a JSON file as an array.
 * @param {string} filePath - Path to the JSON file.
 * @param {Set<string>} dataSet - Set to save.
 */
function saveSetToFile(filePath, dataSet) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(Array.from(dataSet), null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
  }
}

/**
 * Helper to save an array of RegExp objects to a JSON file.
 * Stores regex as {pattern: string, flags: string}.
 * @param {string} filePath - Path to the JSON file.
 * @param {Array<RegExp>} regexArray - Array of RegExp objects to save.
 */
function saveRegexArrayToFile(filePath, regexArray) {
  try {
    const storableArray = regexArray.map(regex => ({ pattern: regex.source, flags: regex.flags }));
    fs.writeFileSync(filePath, JSON.stringify(storableArray, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
  }
}

/**
 * Saves all current in-memory screening lists to their respective JSON files.
 */
function saveLists() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (error) {
      console.error(`Error creating data directory ${DATA_DIR} during save. Lists may not be saved.`, error);
      return;
    }
  }
  saveSetToFile(PERMITTED_NUMBERS_PATH, permittedNumbers);
  saveSetToFile(BLOCKED_NUMBERS_PATH, blockedNumbers);
  saveRegexArrayToFile(PERMITTED_NAMES_REGEX_PATH, permittedNamesRegex);
  saveRegexArrayToFile(BLOCKED_NAMES_REGEX_PATH, blockedNamesRegex);
  saveRegexArrayToFile(PERMITTED_NUMBER_PATTERNS_PATH, permittedNumberPatterns);
  saveRegexArrayToFile(BLOCKED_NUMBER_PATTERNS_PATH, blockedNumberPatterns);
  console.log('Screening lists saved.');
}

// Initialize by loading lists
loadLists();

/**
 * Adds a number to the permitted list and saves all lists.
 * @param {string} number - The number to permit.
 */
function addPermittedNumberToList(number) {
  if (permittedNumbers.has(number)) {
    console.log(`Number ${number} is already in the permitted list.`);
    return false;
  }
  permittedNumbers.add(number);
  saveLists();
  console.log(`Number ${number} added to permitted list and lists saved.`);
  return true;
}

/**
 * Removes a number from the permitted list and saves all lists.
 * @param {string} number - The number to remove from the permitted list.
 */
function removePermittedNumberFromList(number) {
  if (!permittedNumbers.has(number)) {
    console.log(`Number ${number} not found in the permitted list.`);
    return false;
  }
  permittedNumbers.delete(number);
  saveLists();
  console.log(`Number ${number} removed from permitted list and lists saved.`);
  return true;
}

/**
 * Adds a number to the blocked list and saves all lists.
 * @param {string} number - The number to block.
 */
function addBlockedNumberToList(number) {
  if (blockedNumbers.has(number)) {
    console.log(`Number ${number} is already in the blocked list.`);
    return false;
  }
  blockedNumbers.add(number);
  saveLists();
  console.log(`Number ${number} added to blocked list and lists saved.`);
  return true;
}

/**
 * Removes a number from the blocked list and saves all lists.
 * @param {string} number - The number to remove from the blocked list.
 */
function removeBlockedNumberFromList(number) {
  if (!blockedNumbers.has(number)) {
    console.log(`Number ${number} not found in the blocked list.`);
    return false;
  }
  blockedNumbers.delete(number);
  saveLists();
  console.log(`Number ${number} removed from blocked list and lists saved.`);
  return true;
}

/**
 * Exports all current block/permit lists to JSON files in a specified directory.
 * @param {string} targetDirectoryPath - The path to the directory where lists will be exported.
 * @returns {boolean} True if export was successful, false otherwise.
 */
function exportBlockPermitLists(targetDirectoryPath) {
  try {
    if (!fs.existsSync(targetDirectoryPath)) {
      fs.mkdirSync(targetDirectoryPath, { recursive: true });
    }
    saveSetToFile(path.join(targetDirectoryPath, 'permitted_numbers_export.json'), permittedNumbers);
    saveSetToFile(path.join(targetDirectoryPath, 'blocked_numbers_export.json'), blockedNumbers);
    saveRegexArrayToFile(path.join(targetDirectoryPath, 'permitted_names_regex_export.json'), permittedNamesRegex);
    saveRegexArrayToFile(path.join(targetDirectoryPath, 'blocked_names_regex_export.json'), blockedNamesRegex);
    saveRegexArrayToFile(path.join(targetDirectoryPath, 'permitted_number_patterns_export.json'), permittedNumberPatterns);
    saveRegexArrayToFile(path.join(targetDirectoryPath, 'blocked_number_patterns_export.json'), blockedNumberPatterns);
    console.log(`Block/Permit lists exported to ${targetDirectoryPath}`);
    return true;
  } catch (error) {
    console.error(`Error exporting lists to ${targetDirectoryPath}:`, error);
    return false;
  }
}

/**
 * Imports block/permit lists from JSON files in a specified directory,
 * replacing current in-memory lists and persisting them.
 * @param {string} sourceDirectoryPath - The path to the directory from where lists will be imported.
 * @returns {boolean} True if import was successful and at least one list was loaded, false otherwise.
 */
function importBlockPermitLists(sourceDirectoryPath) {
  let loadedSomething = false;
  try {
    const importedPermittedNumbers = loadSetFromFile(path.join(sourceDirectoryPath, 'permitted_numbers_export.json'), permittedNumbers);
    if (importedPermittedNumbers !== permittedNumbers) { permittedNumbers = importedPermittedNumbers; loadedSomething = true; }

    const importedBlockedNumbers = loadSetFromFile(path.join(sourceDirectoryPath, 'blocked_numbers_export.json'), blockedNumbers);
    if (importedBlockedNumbers !== blockedNumbers) { blockedNumbers = importedBlockedNumbers; loadedSomething = true; }
    
    const importedPermittedNamesRegex = loadRegexArrayFromFile(path.join(sourceDirectoryPath, 'permitted_names_regex_export.json'), permittedNamesRegex);
    if (importedPermittedNamesRegex !== permittedNamesRegex) { permittedNamesRegex = importedPermittedNamesRegex; loadedSomething = true; }

    const importedBlockedNamesRegex = loadRegexArrayFromFile(path.join(sourceDirectoryPath, 'blocked_names_regex_export.json'), blockedNamesRegex);
    if (importedBlockedNamesRegex !== blockedNamesRegex) { blockedNamesRegex = importedBlockedNamesRegex; loadedSomething = true; }

    const importedPermittedNumberPatterns = loadRegexArrayFromFile(path.join(sourceDirectoryPath, 'permitted_number_patterns_export.json'), permittedNumberPatterns);
    if (importedPermittedNumberPatterns !== permittedNumberPatterns) { permittedNumberPatterns = importedPermittedNumberPatterns; loadedSomething = true; }

    const importedBlockedNumberPatterns = loadRegexArrayFromFile(path.join(sourceDirectoryPath, 'blocked_number_patterns_export.json'), blockedNumberPatterns);
    if (importedBlockedNumberPatterns !== blockedNumberPatterns) { blockedNumberPatterns = importedBlockedNumberPatterns; loadedSomething = true; }

    if (loadedSomething) {
      saveLists();
      console.log(`Block/Permit lists imported from ${sourceDirectoryPath} and saved.`);
    } else {
      console.log(`No new list data found in ${sourceDirectoryPath} or lists are identical to current ones.`);
    }
    return loadedSomething;
  } catch (error) {
    console.error(`Error importing lists from ${sourceDirectoryPath}:`, error);
    return false;
  }
}


// --- Existing screening functions (unchanged for brevity, but would use the above lists) ---
function isNumberPermitted(callerNumber) {
  if (!callerNumber) return false;
  if (permittedNumbers.has(callerNumber)) return true;
  for (const pattern of permittedNumberPatterns) if (pattern.test(callerNumber)) return true;
  return false;
}
function isNumberBlocked(callerNumber) {
  if (!callerNumber) return false;
  if (blockedNumbers.has(callerNumber)) return true;
  for (const pattern of blockedNumberPatterns) if (pattern.test(callerNumber)) return true;
  return false;
}
function isNamePermitted(callerName) {
  if (!callerName) return false;
  for (const regex of permittedNamesRegex) if (regex.test(callerName)) return true;
  return false;
}
function isNameBlocked(callerName) {
  if (!callerName) return false;
  for (const regex of blockedNamesRegex) if (regex.test(callerName)) return true;
  return false;
}
function screenCall(callerIdInfo) {
  const { number, name } = callerIdInfo;
  if (isNamePermitted(name) || isNumberPermitted(number)) return 'ALLOW';
  if (isNameBlocked(name) || isNumberBlocked(number)) return 'BLOCK';
  return 'SCREEN';
}

module.exports = {
  // Original exports
  isNumberPermitted,
  isNumberBlocked,
  isNamePermitted,
  isNameBlocked,
  screenCall,
  // New exports for list management
  loadLists,
  saveLists,
  addPermittedNumberToList,
  removePermittedNumberFromList,
  addBlockedNumberToList,
  removeBlockedNumberFromList,
  exportBlockPermitLists,
  importBlockPermitLists,
  // Expose lists for testing (use with caution)
  _internal_permittedNumbers_TEST_ONLY: permittedNumbers,
  _internal_blockedNumbers_TEST_ONLY: blockedNumbers,
  _internal_permittedNamesRegex_TEST_ONLY: permittedNamesRegex,
  _internal_blockedNamesRegex_TEST_ONLY: blockedNamesRegex,
  _internal_permittedNumberPatterns_TEST_ONLY: permittedNumberPatterns,
  _internal_blockedNumberPatterns_TEST_ONLY: blockedNumberPatterns,
};

console.log('screening.js loaded with persistence and list management functions.');
