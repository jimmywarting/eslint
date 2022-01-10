/**
 * @fileoverview Main CLI object.
 */

/*
 * The CLI object should *not* call process.exit() directly. It should only return
 * exit codes. This allows other programs to use the CLI object and still control
 * when the program exits.
 */

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

const defaultOptions = require('../../conf/default-cli-options.js')

const { Linter } = require('../linter/linter.js')

// -----------------------------------------------------------------------------
// Typedefs
// -----------------------------------------------------------------------------

// For VSCode IntelliSense
/** @typedef {import("../shared/types").ConfigData} ConfigData */
/** @typedef {import("../shared/types").DeprecatedRuleInfo} DeprecatedRuleInfo */
/** @typedef {import("../shared/types").LintMessage} LintMessage */
/** @typedef {import("../shared/types").ParserOptions} ParserOptions */
/** @typedef {import("../shared/types").Plugin} Plugin */
/** @typedef {import("../shared/types").RuleConf} RuleConf */
/** @typedef {import("../shared/types").Rule} Rule */
/** @typedef {ReturnType<ConfigArray.extractConfig>} ExtractedConfig */

/**
 * The options to configure a CLI engine with.
 * @typedef {Object} CLIEngineOptions
 * @property {boolean} [allowInlineConfig] Enable or disable inline configuration comments.
 * @property {ConfigData} [baseConfig] Base config object, extended by all configs used with this CLIEngine instance
 * @property {string[]|null} [extensions] An array of file extensions to check.
 * @property {boolean|Function} [fix] Execute in autofix mode. If a function, should return a boolean.
 * @property {string[]} [fixTypes] Array of rule types to apply fixes for.
 * @property {string[]} [globals] An array of global variables to declare.
 * @property {boolean} [ignore] False disables use of .eslintignore.
 * @property {string|string[]} [ignorePattern] One or more glob patterns to ignore.
 * @property {string} [parser] The name of the parser to use.
 * @property {ParserOptions} [parserOptions] An object of parserOption settings to use.
 * @property {string[]} [plugins] An array of plugins to load.
 * @property {Record<string,RuleConf>} [rules] An object of rules to use.
 * @property {string[]} [rulePaths] An array of directories to load custom rules from.
 * @property {boolean} [reportUnusedDisableDirectives] `true` adds reports for unused eslint-disable directives
 * @property {string} [resolvePluginsRelativeTo] The folder where plugins should be resolved from, defaulting to the CWD
 */

/**
 * A linting result.
 * @typedef {Object} LintResult
 * @property {string} filePath The path to the file that was linted.
 * @property {LintMessage[]} messages All of the messages for the result.
 * @property {number} errorCount Number of errors for the result.
 * @property {number} warningCount Number of warnings for the result.
 * @property {number} fixableErrorCount Number of fixable errors for the result.
 * @property {number} fixableWarningCount Number of fixable warnings for the result.
 * @property {string} [source] The source code of the file that was linted.
 * @property {string} [output] The source code of the file that was linted, with as many fixes applied as possible.
 */

/**
 * Linting results.
 * @typedef {Object} LintReport
 * @property {LintResult[]} results All of the result.
 * @property {number} errorCount Number of errors for the result.
 * @property {number} warningCount Number of warnings for the result.
 * @property {number} fixableErrorCount Number of fixable errors for the result.
 * @property {number} fixableWarningCount Number of fixable warnings for the result.
 * @property {DeprecatedRuleInfo[]} usedDeprecatedRules The list of used deprecated rules.
 */

/**
 * Private data for CLIEngine.
 * @typedef {Object} CLIEngineInternalSlots
 * @property {ConfigArray[]} lastConfigArrays The list of config arrays that the last `executeOnFiles` used.
 * @property {Linter} linter The linter instance which has loaded rules.
 * @property {CLIEngineOptions} options The normalized options of this instance.
 */

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * It will calculate the error and warning count for collection of messages per file
 * @param {LintMessage[]} messages Collection of messages
 * @returns {Object} Contains the stats
 * @private
 */
function calculateStatsPerFile (messages) {
  return messages.reduce((stat, message) => {
    if (message.fatal || message.severity === 2) {
      stat.errorCount++
      if (message.fatal) {
        stat.fatalErrorCount++
      }
      if (message.fix) {
        stat.fixableErrorCount++
      }
    } else {
      stat.warningCount++
      if (message.fix) {
        stat.fixableWarningCount++
      }
    }
    return stat
  }, {
    errorCount: 0,
    fatalErrorCount: 0,
    warningCount: 0,
    fixableErrorCount: 0,
    fixableWarningCount: 0
  })
}

/**
 * It will calculate the error and warning count for collection of results from all files
 * @param {LintResult[]} results Collection of messages from all the files
 * @returns {Object} Contains the stats
 * @private
 */
function calculateStatsPerRun (results) {
  return results.reduce((stat, result) => {
    stat.errorCount += result.errorCount
    stat.fatalErrorCount += result.fatalErrorCount
    stat.warningCount += result.warningCount
    stat.fixableErrorCount += result.fixableErrorCount
    stat.fixableWarningCount += result.fixableWarningCount
    return stat
  }, {
    errorCount: 0,
    fatalErrorCount: 0,
    warningCount: 0,
    fixableErrorCount: 0,
    fixableWarningCount: 0
  })
}

/**
 * Processes an source code using ESLint.
 * @param {Object} options The config object.
 * @param {string} options.text The source code to verify.
 * @param {string|undefined} options.filePath The path to the file of `text`. If this is undefined, it uses `<text>`.
 * @param {ConfigArray} options.config The config.
 * @param {boolean} options.fix If `true` then it does fix.
 * @param {boolean} options.allowInlineConfig If `true` then it uses directive comments.
 * @param {boolean} options.reportUnusedDisableDirectives If `true` then it reports unused `eslint-disable` comments.
 * @param {Linter} options.linter The linter instance to verify.
 * @returns {LintResult} The result of linting.
 */
function verifyText ({text, ...options}) {
  const filePath = options.filePath || '<text>'
  const filePathToVerify = filePath
  const { fixed, messages, output } = options.linter.verifyAndFix(
    text,
    options.config,
    {
      allowInlineConfig: options.allowInlineConfig,
      filename: filePathToVerify,
      fix: options.fix,
      reportUnusedDisableDirectives: options.reportUnusedDisableDirectives
    }
  )

  // Tweak and return.
  const result = {
    filePath,
    messages,
    ...calculateStatsPerFile(messages)
  }

  if (fixed) result.output = output

  if (
    result.errorCount + result.warningCount > 0 &&
        typeof result.output === 'undefined'
  ) {
    result.source = text
  }

  return result
}

/**
 * Checks if the given message is an error message.
 * @param {LintMessage} message The message to check.
 * @returns {boolean} Whether or not the message is an error message.
 * @private
 */
function isErrorMessage (message) {
  return message.severity === 2
}

// -----------------------------------------------------------------------------
// Public Interface
// -----------------------------------------------------------------------------

/**
 * Core CLI.
 */
class CLIEngine {
  #options

  /**
   * Creates a new instance of the core CLI engine.
   * @param {CLIEngineOptions} providedOptions The options for this instance.
   * @param {Object} [additionalData] Additional settings that are not CLIEngineOptions.
   */
  constructor (providedOptions) {
    const options = Object.assign(
      Object.create(null),
      defaultOptions,
      providedOptions
    )

    if (options.fix === undefined) {
      options.fix = false
    }

    // Store private data.
    this.linter = new Linter()
    this.#options = options
  }

  /**
   * Returns results that only contains errors.
   * @param {LintResult[]} results The results to filter.
   * @returns {LintResult[]} The filtered results.
   */
  static getErrorResults (results) {
    const filtered = []

    results.forEach(result => {
      const filteredMessages = result.messages.filter(isErrorMessage)

      if (filteredMessages.length > 0) {
        filtered.push({
          ...result,
          messages: filteredMessages,
          errorCount: filteredMessages.length,
          warningCount: 0,
          fixableErrorCount: result.fixableErrorCount,
          fixableWarningCount: 0
        })
      }
    })

    return filtered
  }

  /**
   * Executes the current configuration on an array of file and directory names.
   * @param {string[]} patterns An array of file and directory names.
   * @throws {Error} As may be thrown by `fs.unlinkSync`.
   * @returns {Promise<LintReport>} The results for all files that were linted.
   */
  async executeOnFiles (patterns) {
    const linter = this.linter
    const {
      allowInlineConfig,
      fix,
      reportUnusedDisableDirectives
    } = this.#options

    const results = []

    for (let {file, filePath} of patterns) {
      // Do lint.
      const result = verifyText({
        text: await file.text(),
        filePath,
        config: this.#options,
        fix,
        allowInlineConfig,
        reportUnusedDisableDirectives,
        linter
      })

      results.push(result)
    }

    return {
      results,
      ...calculateStatsPerRun(results),

      // Initialize it lazily because CLI and `ESLint` API don't use it.
      usedDeprecatedRules: undefined
    }
  }
}

module.exports = {
  CLIEngine
}
