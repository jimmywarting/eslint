/**
 * @fileoverview Traverser to traverse AST trees.
 */

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

const evk = require('eslint-visitor-keys')

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Do nothing.
 * @returns {void}
 */
function noop () {

  // do nothing.
}

/**
 * Check whether the given value is an ASTNode or not.
 * @param {any} x The value to check.
 * @returns {boolean} `true` if the value is an ASTNode.
 */
function isNode (x) {
  return x !== null && typeof x === 'object' && typeof x.type === 'string'
}

/**
 * Get the visitor keys of a given node.
 * @param {Object} visitorKeys The map of visitor keys.
 * @param {ASTNode} node The node to get their visitor keys.
 * @returns {string[]} The visitor keys of the node.
 */
function getVisitorKeys (visitorKeys, node) {
  let keys = visitorKeys[node.type]

  if (!keys) {
    keys = evk.getKeys(node)
  }

  return keys
}

/**
 * The traverser class to traverse AST trees.
 */
class Traverser {
  #current = null
  #parents = []
  #skipped = false
  #broken = false
  #visitorKeys = null
  #enter = null
  #leave = null

  /**
   * Gives current node.
   * @returns {ASTNode} The current node.
   */
  current () {
    return this.#current
  }

  /**
   * Gives a a copy of the ancestor nodes.
   * @returns {ASTNode[]} The ancestor nodes.
   */
  parents () {
    return this.#parents.slice(0)
  }

  /**
   * Break the current traversal.
   * @returns {void}
   */
  break () {
    this.#broken = true
  }

  /**
   * Skip child nodes for the current traversal.
   * @returns {void}
   */
  skip () {
    this.#skipped = true
  }

  /**
   * Traverse the given AST tree.
   * @param {ASTNode} node The root node to traverse.
   * @param {Object} options The option object.
   * @param {Object} [options.visitorKeys=DEFAULT_VISITOR_KEYS] The keys of each node types to traverse child nodes. Default is `./default-visitor-keys.json`.
   * @param {Function} [options.enter=noop] The callback function which is called on entering each node.
   * @param {Function} [options.leave=noop] The callback function which is called on leaving each node.
   * @returns {void}
   */
  traverse (node, options) {
    this.#current = null
    this.#parents = []
    this.#skipped = false
    this.#broken = false
    this.#visitorKeys = options.visitorKeys || evk.KEYS
    this.#enter = options.enter || noop
    this.#leave = options.leave || noop
    this.#traverse(node, null)
  }

  /**
   * Traverse the given AST tree recursively.
   * @param {ASTNode} node The current node.
   * @param {ASTNode|null} parent The parent node.
   * @returns {void}
   */
  #traverse (node, parent) {
    if (!isNode(node)) {
      return
    }

    this.#current = node
    this.#skipped = false
    this.#enter(node, parent)

    if (!this.#skipped && !this.#broken) {
      const keys = getVisitorKeys(this.#visitorKeys, node)

      if (keys.length >= 1) {
        this.#parents.push(node)
        for (let i = 0; i < keys.length && !this.#broken; ++i) {
          const child = node[keys[i]]

          if (Array.isArray(child)) {
            for (let j = 0; j < child.length && !this.#broken; ++j) {
              this.#traverse(child[j], node)
            }
          } else {
            this.#traverse(child, node)
          }
        }
        this.#parents.pop()
      }
    }

    if (!this.#broken) {
      this.#leave(node, parent)
    }

    this.#current = parent
  }

  /**
   * Calculates the keys to use for traversal.
   * @param {ASTNode} node The node to read keys from.
   * @returns {string[]} An array of keys to visit on the node.
   * @private
   */
  static getKeys (node) {
    return evk.getKeys(node)
  }

  /**
   * Traverse the given AST tree.
   * @param {ASTNode} node The root node to traverse.
   * @param {Object} options The option object.
   * @param {Object} [options.visitorKeys=DEFAULT_VISITOR_KEYS] The keys of each node types to traverse child nodes. Default is `./default-visitor-keys.json`.
   * @param {Function} [options.enter=noop] The callback function which is called on entering each node.
   * @param {Function} [options.leave=noop] The callback function which is called on leaving each node.
   */
  static traverse (node, options) {
    new Traverser().traverse(node, options)
  }

  /**
   * The default visitor keys.
   * @type {Object}
   */
  static get DEFAULT_VISITOR_KEYS () {
    return evk.KEYS
  }
}

module.exports = Traverser
