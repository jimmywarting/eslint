/**
 * @fileoverview Expose out ESLint and CLI to require.
 */

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

import { ESLint } from './eslint/eslint.mjs'
import { Linter } from './linter/linter.js'
import SourceCode from './source-code/source-code.js'

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

export {
  Linter,
  ESLint,
  SourceCode
}
