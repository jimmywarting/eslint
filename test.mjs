console.time('load');
console.time('construct');
console.time('lintFiles')
console.time('lintDone')

import {opendir} from 'fs/promises';
import {join, resolve} from 'path';
import {cwd} from 'process';
import x from 'eslint-plugin-node/lib/rules/file-extension-in-import.js'
import {fileFromSync} from 'fetch-blob/from.js'
const {default: {ESLint}} = await import('./dist/bundle.js')

console.timeEnd('load');
const pwd = cwd()

async function* listDir(path) {
  const dir = await opendir(path);
  for await (const dirent of dir) {
    if (dirent.name.startsWith('.')) continue;
    const name = join(path, dirent.name);
    if (dirent.isDirectory()) {
      yield * listDir(name);
    } else if (dirent.name.endsWith('js')) {
      yield resolve(pwd, name);
    }
  }
}

const files = [];
for await (let xx of listDir('./fixtures')) files.push({
  file: fileFromSync(xx),
  filePath: xx
})

console.log(files)

const eslint = new ESLint({
  baseConfig: {
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      ecmaFeatures: { jsx: true }
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      'file-extension-in-import': [
        'warn', 'always',
        { '.ts': 'never', '.tsx': 'never' }
      ]
    },
  },
  fix: true,
})

eslint.cliEngine.linter.defineRule("file-extension-in-import", x);

console.timeEnd('construct');

// 2. Lint files. This doesn't modify target files.
// eslint.lintFiles(files).then(res => {
eslint.lintFiles(files).then(res => {
  console.timeEnd('lintDone')
  console.log(res)
})

console.timeEnd('lintFiles')