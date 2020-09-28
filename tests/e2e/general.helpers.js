/* Copyright (c) 2016-present - TagSpaces UG (Haftungsbeschraenkt). All rights reserved. */
import { delay } from './hook';
import { firstFile, openContextEntryMenu } from './test-utils.spec';

export const defaultLocationPath =
  './testdata/file-structure/supported-filestypes';
export const defaultLocationName = 'supported-filestypes';
export const perspectiveGridTable = '//*[@data-tid="perspectiveGridFileTable"]';
export const newLocationName = 'Location Name Changed';
export const tsFolder = '\\.ts';

export async function createLocation(
  locationPath,
  locationName,
  isDefault = false
) {
  // locationPerspective = locationPerspective || 'Grid';
  const locationManagerMenu = await global.client.$(
    '[data-tid=locationManagerPanel]'
  );
  await locationManagerMenu.click();
  const elem = await global.client.$('[data-tid=createNewLocation]');
  await elem.click();
  const lPath = await global.client.$('[data-tid=locationPath]');
  await lPath.click();
  const locationPathInput = await global.client.$(
    '[data-tid=locationPath] input'
  );
  await locationPathInput.keys(locationPath || defaultLocationPath);
  // keys is workarround for not working setValue await global.client.$('[data-tid=locationPath] input').setValue(locationPath || defaultLocationPath);
  const lName = await global.client.$('[data-tid=locationName]');
  await lName.click();
  const locationNameInput = await global.client.$(
    '[data-tid=locationName] input'
  );
  locationNameInput.keys(
    locationName || 'Test Location' + new Date().getTime()
  );
  if (isDefault) {
    await delay(1000);
    const locationIsDefault = await global.client.$(
      '[data-tid=locationIsDefault]'
    );
    await locationIsDefault.click();
  }
  const confirmLocationCreation = await global.client.$(
    '[data-tid=confirmLocationCreation]'
  );
  await confirmLocationCreation.waitForDisplayed();
  await confirmLocationCreation.click();
}

export async function openSettingsDialog() {
  await delay(500);
  const openSettings = await global.client.$('[data-tid=settings]');
  await openSettings.waitForDisplayed();
  await openSettings.click();
  await delay(500);
}

export async function closeSettingsDialog() {
  await delay(500);
  const closeSettings = await global.client.$('[data-tid=closeSettingsDialog]');
  await closeSettings.waitForDisplayed();
  await closeSettings.click();
  await delay(500);
}

export async function reloadDirectory() {
  await delay(500);
  const openDirMenu = await global.client.$(
    '[data-tid=folderContainerOpenDirMenu]'
  );
  await openDirMenu.waitForDisplayed();
  await openDirMenu.click();
  await delay(500);
  const reloadDirectory = await global.client.$('[data-tid=reloadDirectory]');
  await reloadDirectory.waitForDisplayed();
  await reloadDirectory.click();
  await delay(500);
}

export async function openEntry(entryName) {
  await delay(500);
  const eName = await global.client.$(
    '[data-tid=fsEntryName_' + entryName + ']'
  );
  await eName.waitForDisplayed();
  await eName.doubleClick();
  await delay(500);
}