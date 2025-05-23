const fs = require('fs');
const path = require('path');
const assert = require('assert'); // Using Node.js built-in assert for basic checks
const {
  startVoiceMessage,
  stopVoiceMessage,
  listVoicemails,
  deleteVoicemail,
  _clearAllVoicemails_TEST_ONLY,
} = require('./lib/voicemail');

const voicemailDir = path.join('data', 'voicemails');

async function runTests() {
  console.log('--- Starting Voicemail System Tests ---');

  // Clean up before tests
  _clearAllVoicemails_TEST_ONLY();
  let currentVoicemails = await listVoicemails();
  assert.strictEqual(currentVoicemails.length, 0, 'Initial state: Voicemails array should be empty after clear.');
  console.log('Initial state: Voicemails cleared.');

  // Test 1: Start a new voicemail
  console.log('\n--- Test 1: Start Voicemail ---');
  const callerInfo1 = { number: '15551112222', name: 'Caller One' };
  const vmId1 = startVoiceMessage(callerInfo1);
  currentVoicemails = await listVoicemails();
  assert.ok(vmId1, 'Test 1.1 FAILED: startVoiceMessage should return a voicemail ID.');
  assert.strictEqual(currentVoicemails.length, 1, 'Test 1.2 FAILED: Voicemails array should have 1 entry.');
  assert.strictEqual(currentVoicemails[0].id, vmId1, 'Test 1.3 FAILED: Voicemail ID mismatch.');
  assert.strictEqual(currentVoicemails[0].callerNumber, callerInfo1.number, 'Test 1.4 FAILED: Caller number mismatch.');
  assert.strictEqual(currentVoicemails[0].callerName, callerInfo1.name, 'Test 1.5 FAILED: Caller name mismatch.');
  assert.strictEqual(currentVoicemails[0].durationSeconds, null, 'Test 1.6 FAILED: Duration should be null initially.');
  assert.strictEqual(currentVoicemails[0].filePath, null, 'Test 1.7 FAILED: FilePath should be null initially.');
  console.log(`Test 1 PASSED: Voicemail started with ID: ${vmId1}`);

  // Test 2: Stop the voicemail (and create placeholder file)
  console.log('\n--- Test 2: Stop Voicemail ---');
  const duration1 = 30;
  const stopResult1 = stopVoiceMessage(vmId1, duration1);
  currentVoicemails = await listVoicemails();
  const expectedFilePath1 = path.join(voicemailDir, `vm_${vmId1}.wav`);
  assert.strictEqual(stopResult1, true, 'Test 2.1 FAILED: stopVoiceMessage should return true.');
  assert.strictEqual(currentVoicemails[0].durationSeconds, duration1, 'Test 2.2 FAILED: Duration not updated.');
  assert.strictEqual(currentVoicemails[0].filePath, expectedFilePath1, 'Test 2.3 FAILED: FilePath not updated.');
  assert.ok(fs.existsSync(expectedFilePath1), `Test 2.4 FAILED: Placeholder file ${expectedFilePath1} not created.`);
  console.log(`Test 2 PASSED: Voicemail ${vmId1} stopped. Placeholder file: ${expectedFilePath1}`);

  // Test 3: Start another voicemail
  console.log('\n--- Test 3: Start Another Voicemail ---');
  const callerInfo2 = { number: '15553334444', name: 'Caller Two' };
  const vmId2 = startVoiceMessage(callerInfo2);
  currentVoicemails = await listVoicemails();
  assert.ok(vmId2, 'Test 3.1 FAILED: startVoiceMessage should return a voicemail ID for second call.');
  assert.strictEqual(currentVoicemails.length, 2, 'Test 3.2 FAILED: Voicemails array should have 2 entries.');
  console.log(`Test 3 PASSED: Second voicemail started with ID: ${vmId2}`);

  // Test 4: Stop the second voicemail
  console.log('\n--- Test 4: Stop Second Voicemail ---');
  const duration2 = 45;
  const stopResult2 = stopVoiceMessage(vmId2, duration2);
  currentVoicemails = await listVoicemails();
  const expectedFilePath2 = path.join(voicemailDir, `vm_${vmId2}.wav`);
  assert.strictEqual(stopResult2, true, 'Test 4.1 FAILED: stopVoiceMessage should return true for second call.');
  assert.strictEqual(currentVoicemails[1].durationSeconds, duration2, 'Test 4.2 FAILED: Duration not updated for second call.');
  assert.strictEqual(currentVoicemails[1].filePath, expectedFilePath2, 'Test 4.3 FAILED: FilePath not updated for second call.');
  assert.ok(fs.existsSync(expectedFilePath2), `Test 4.4 FAILED: Placeholder file ${expectedFilePath2} not created.`);
  console.log(`Test 4 PASSED: Voicemail ${vmId2} stopped. Placeholder file: ${expectedFilePath2}`);

  // Test 5: List voicemails
  console.log('\n--- Test 5: List Voicemails ---');
  const listedVms = await listVoicemails(); // This is the primary check for listVoicemails itself
  assert.strictEqual(listedVms.length, 2, 'Test 5.1 FAILED: listVoicemails should return 2 entries.');
  // To ensure it returns a copy, we can try to modify listedVms and see if original changes
  // However, a deepStrictEqual with currentVoicemails (which is also from listVoicemails) is fine
  assert.deepStrictEqual(listedVms, currentVoicemails, 'Test 5.2 FAILED: Listed voicemails do not match current state.');
  console.log('Test 5 PASSED: listVoicemails returned correct entries.');
  console.log('Current Voicemails:', listedVms);

  // Test 6: Delete the first voicemail
  console.log('\n--- Test 6: Delete First Voicemail ---');
  const deleteResult1 = deleteVoicemail(vmId1);
  currentVoicemails = await listVoicemails();
  assert.strictEqual(deleteResult1, true, 'Test 6.1 FAILED: deleteVoicemail should return true.');
  assert.strictEqual(currentVoicemails.length, 1, 'Test 6.2 FAILED: Voicemails array should have 1 entry after deletion.');
  assert.ok(!fs.existsSync(expectedFilePath1), `Test 6.3 FAILED: Placeholder file ${expectedFilePath1} not deleted.`);
  assert.strictEqual(currentVoicemails[0].id, vmId2, 'Test 6.4 FAILED: Remaining voicemail ID is incorrect.');
  console.log(`Test 6 PASSED: Voicemail ${vmId1} deleted. File ${expectedFilePath1} also deleted.`);

  // Test 7: Try to delete a non-existent voicemail
  console.log('\n--- Test 7: Delete Non-Existent Voicemail ---');
  const deleteResultNonExistent = deleteVoicemail('non-existent-id');
  currentVoicemails = await listVoicemails();
  assert.strictEqual(deleteResultNonExistent, false, 'Test 7.1 FAILED: deleteVoicemail for non-existent ID should return false.');
  assert.strictEqual(currentVoicemails.length, 1, 'Test 7.2 FAILED: Voicemails array should still have 1 entry.');
  console.log('Test 7 PASSED: Attempt to delete non-existent voicemail handled correctly.');

  // Test 8: Delete the second voicemail
  console.log('\n--- Test 8: Delete Second Voicemail ---');
  const deleteResult2 = deleteVoicemail(vmId2);
  currentVoicemails = await listVoicemails();
  assert.strictEqual(deleteResult2, true, 'Test 8.1 FAILED: deleteVoicemail should return true for second call.');
  assert.strictEqual(currentVoicemails.length, 0, 'Test 8.2 FAILED: Voicemails array should be empty after deleting second call.');
  assert.ok(!fs.existsSync(expectedFilePath2), `Test 8.3 FAILED: Placeholder file ${expectedFilePath2} not deleted.`);
  console.log(`Test 8 PASSED: Voicemail ${vmId2} deleted. File ${expectedFilePath2} also deleted.`);

  // Test 9: List voicemails again (should be empty)
  console.log('\n--- Test 9: List Voicemails (Empty) ---');
  const finalList = await listVoicemails();
  assert.strictEqual(finalList.length, 0, 'Test 9.1 FAILED: listVoicemails should return an empty array.');
  console.log('Test 9 PASSED: listVoicemails correctly shows no voicemails.');

  console.log('\n--- All Voicemail System Tests Passed Successfully! ---');
}

runTests().catch(error => {
  console.error('!!! A TEST ASSERTION FAILED !!!');
  console.error(error);
  process.exit(1); // Exit with error code so CI/automation can detect failure
});
