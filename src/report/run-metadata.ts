import { arch, platform, release } from 'node:os';

const operatingSystem = platform() === 'win32' ? 'Windows' : platform();

export const runMetadata = {
  browserName: 'Chromium',
  browserVersion: 'Unknown',
  platform: `${operatingSystem} ${release()} (${arch()})`
};