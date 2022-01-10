/**
 * @fileoverview Defines a storage for rules.
 */

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/**
 * Normalizes a rule module to the new-style API
 * @param {(Function|{create: Function})} rule A rule object, which can either be a function
 * ("old-style") or an object with a `create` method ("new-style")
 * @returns {{create: Function}} A new-style rule.
 */
function normalizeRule(rule) {
    return typeof rule === "function" ? Object.assign({ create: rule }, rule) : rule;
}

//-----------------------------------------------------------------------------
// Public Interface
//-----------------------------------------------------------------------------

/**
 * A storage for rules.
 */
class Rules {

    #rules = Object.create(null)

    /**
     * Registers a rule module for rule id in storage.
     * @param {string} ruleId Rule id (file name).
     * @param {Function} ruleModule Rule handler.
     * @returns {void}
     */
    define(ruleId, ruleModule) {
        this.#rules[ruleId] = normalizeRule(ruleModule);
    }

    /**
     * Access rule handler by id (file name).
     * @param {string} ruleId Rule id (file name).
     * @returns {{create: Function, schema: JsonSchema[]}}
     * A rule. This is normalized to always have the new-style shape with a `create` method.
     */
    get(ruleId) {
        if (typeof this.#rules[ruleId] === "string") {
            this.define(ruleId, require(this.#rules[ruleId]));
        }
        if (this.#rules[ruleId]) {
            return this.#rules[ruleId];
        }
        return null;
    }

    *[Symbol.iterator]() {
        for (const ruleId of Object.keys(this.#rules)) {
            yield [ruleId, this.get(ruleId)];
        }
    }
}

module.exports = Rules;
