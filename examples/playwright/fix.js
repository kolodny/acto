import path from 'node:path';
import { exec } from 'child_process';
import { rm, rename, mkdir } from 'node:fs/promises';

const fix = async () => {
  const root = path.resolve(import.meta.dirname, '../..');
  const lib = `node_modules/acto`;
  const libTemp = `node_modules/acto-temp`;

  try {
    await rename(lib, libTemp);
    await mkdir(`${lib}/lib`, { recursive: true });
    await new Promise((res) => exec(`cp ${root}/* ${lib}/`, res));
    await new Promise((res) => exec(`cp ${root}/lib/* ${lib}/lib/`, res));
  } catch {}
};

const unfix = async () => {
  const lib = `node_modules/acto`;
  const libTemp = `node_modules/acto-temp`;
  await rm(lib, { recursive: true });
  await rename(libTemp, lib);
};

const fn = process.argv.at(-1);
if (fn === 'fix') {
  fix();
} else if (fn === 'unfix') {
  unfix();
}
