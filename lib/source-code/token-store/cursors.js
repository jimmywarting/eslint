/**
 * @fileoverview Define 2 token factories; forward and backward.
 */

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

const BackwardTokenCommentCursor = require('./backward-token-comment-cursor.js')
const BackwardTokenCursor = require('./backward-token-cursor.js')
const FilterCursor = require('./filter-cursor.js')
const ForwardTokenCommentCursor = require('./forward-token-comment-cursor.js')
const ForwardTokenCursor = require('./forward-token-cursor.js')
const LimitCursor = require('./limit-cursor.js')
const SkipCursor = require('./skip-cursor.js')

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * The cursor factory.
 * @private
 */
class CursorFactory {
  /**
     * Initializes this cursor.
     * @param {Function} TokenCursor The class of the cursor which iterates tokens only.
     * @param {Function} TokenCommentCursor The class of the cursor which iterates the mix of tokens and comments.
     */
  constructor (TokenCursor, TokenCommentCursor) {
    this.TokenCursor = TokenCursor
    this.TokenCommentCursor = TokenCommentCursor
  }

  /**
     * Creates a base cursor instance that can be decorated by createCursor.
     * @param {Token[]} tokens The array of tokens.
     * @param {Comment[]} comments The array of comments.
     * @param {Object} indexMap The map from locations to indices in `tokens`.
     * @param {number} startLoc The start location of the iteration range.
     * @param {number} endLoc The end location of the iteration range.
     * @param {boolean} includeComments The flag to iterate comments as well.
     * @returns {Cursor} The created base cursor.
     */
  createBaseCursor (tokens, comments, indexMap, startLoc, endLoc, includeComments) {
    const Cursor = includeComments ? this.TokenCommentCursor : this.TokenCursor

    return new Cursor(tokens, comments, indexMap, startLoc, endLoc)
  }

  /**
     * Creates a cursor that iterates tokens with normalized options.
     * @param {Token[]} tokens The array of tokens.
     * @param {Comment[]} comments The array of comments.
     * @param {Object} indexMap The map from locations to indices in `tokens`.
     * @param {number} startLoc The start location of the iteration range.
     * @param {number} endLoc The end location of the iteration range.
     * @param {boolean} includeComments The flag to iterate comments as well.
     * @param {Function|null} filter The predicate function to choose tokens.
     * @param {number} skip The count of tokens the cursor skips.
     * @param {number} count The maximum count of tokens the cursor iterates. Zero is no iteration for backward compatibility.
     * @returns {Cursor} The created cursor.
     */
  createCursor (tokens, comments, indexMap, startLoc, endLoc, includeComments, filter, skip, count) {
    let cursor = this.createBaseCursor(tokens, comments, indexMap, startLoc, endLoc, includeComments)

    if (filter) {
      cursor = new FilterCursor(cursor, filter)
    }
    if (skip >= 1) {
      cursor = new SkipCursor(cursor, skip)
    }
    if (count >= 0) {
      cursor = new LimitCursor(cursor, count)
    }

    return cursor
  }
}

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

exports.forward = new CursorFactory(ForwardTokenCursor, ForwardTokenCommentCursor)
exports.backward = new CursorFactory(BackwardTokenCursor, BackwardTokenCommentCursor)
