"use strict";
/**
 * Mixes in methods used to filter sets of data
 *
 * @class Nextract.Plugins.Core.Filter
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fp_1 = require("lodash/fp");
const pluginBase_1 = __importDefault(require("../../pluginBase"));
//Instantiate the plugin
let filterPlugin = new pluginBase_1.default('Filter', 'Core');
module.exports = {
    /**
     * Filters a stream, passing along all elements that equal the given testValue
     *
     * @method equals
     * @for Nextract.Plugins.Core.Filter
     *
     * @example
     *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Filter.equals('age', 30))
     *
     * @param {String} propertyToTest The object property name being tested against
     * @param {String|Number} valueToTest The value being against
     * @param {Boolean} useStrictEquality (optional, defaults to false) Uses the === comparison operator.
     *
     * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
     */
    equals: function (propertyToTest, valueToTest, useStrictEquality = false) {
        let streamFunction = function (element, index) {
            if (!fp_1.isUndefined(element) && fp_1.has(element, propertyToTest)) {
                if (useStrictEquality === true) {
                    return element[propertyToTest] === valueToTest;
                }
                else {
                    return element[propertyToTest] == valueToTest;
                }
            }
            else {
                return false;
            }
        };
        return filterPlugin.buildStreamTransform(streamFunction, null, 'filter');
    },
    /**
     * Filters a stream, passing along all elements that do not equal the given testValue
     *
     * @method notEquals
     * @for Nextract.Plugins.Core.Filter
     *
     * @example
     *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Filter.notEquals('age', 30))
     *
     * @param {String} propertyToTest The object property name being tested against
     * @param {String|Number} valueToTest The value being against
     * @param {Boolean} useStrictEquality (optional, defaults to false) Uses the !== comparison operator.
     *
     * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
     */
    notEquals: function (propertyToTest, valueToTest, useStrictEquality = false) {
        let streamFunction = function (element, index) {
            if (!fp_1.isUndefined(element) && fp_1.has(element, propertyToTest)) {
                if (useStrictEquality === true) {
                    return element[propertyToTest] !== valueToTest;
                }
                else {
                    return element[propertyToTest] != valueToTest;
                }
            }
            else {
                return false;
            }
        };
        return filterPlugin.buildStreamTransform(streamFunction, null, 'filter');
    },
    /**
     * Filters a stream, passing along all elements that are great than the given testValue
     *
     * @method greaterThan
     * @for Nextract.Plugins.Core.Filter
     *
     * @example
     *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Filter.greaterThan('age', 30))
     *
     * @param {String} propertyToTest The object property name being tested against
     * @param {Number} valueToTest The value being against
     *
     * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
     */
    greaterThan: function (propertyToTest, valueToTest) {
        let streamFunction = function (element) {
            if (!fp_1.isUndefined(element) && fp_1.has(element, propertyToTest)) {
                return element[propertyToTest] > valueToTest;
            }
            else {
                return false;
            }
        };
        return filterPlugin.buildStreamTransform(streamFunction, null, 'filter');
    },
    /**
     * Filters a stream, passing along all elements that are great than or equal to the given testValue
     *
     * @method greaterThanOrEqualTo
     * @for Nextract.Plugins.Core.Filter
     *
     * @example
     *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Filter.greaterThanOrEqualTo('age', 30))
     *
     * @param {String} propertyToTest The object property name being tested against
     * @param {Number} valueToTest The value being against
     *
     * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
     */
    greaterThanOrEqualTo: function (propertyToTest, valueToTest) {
        let streamFunction = function (element, index) {
            if (!fp_1.isUndefined(element) && fp_1.has(element, propertyToTest)) {
                return element[propertyToTest] >= valueToTest;
            }
            else {
                return false;
            }
        };
        return filterPlugin.buildStreamTransform(streamFunction, null, 'filter');
    },
    /**
     * Filters a stream, passing along all elements that are less than the given testValue
     *
     * @method lessThan
     * @for Nextract.Plugins.Core.Filter
     *
     * @example
     *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Filter.lessThan('age', 30))
     *
     * @param {String} propertyToTest The object property name being tested against
     * @param {Number} valueToTest The value being against
     *
     * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
     */
    lessThan: function (propertyToTest, valueToTest) {
        let streamFunction = function (element, index) {
            if (!fp_1.isUndefined(element) && fp_1.has(element, propertyToTest)) {
                return element[propertyToTest] < valueToTest;
            }
            else {
                return false;
            }
        };
        return filterPlugin.buildStreamTransform(streamFunction, null, 'filter');
    },
    /**
     * Filters a stream, passing along all elements that are less or equal to than the given testValue
     *
     * @method lessThanOrEqualTo
     * @for Nextract.Plugins.Core.Filter
     *
     * @example
     *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Filter.lessThanOrEqualTo('age', 30))
     *
     * @param {String} propertyToTest The object property name being tested against
     * @param {Number} valueToTest The value being against
     *
     * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
     */
    lessThanOrEqualTo: function (propertyToTest, valueToTest) {
        let streamFunction = function (element, index) {
            if (!fp_1.isUndefined(element) && fp_1.has(element, propertyToTest)) {
                return element[propertyToTest] <= valueToTest;
            }
            else {
                return false;
            }
        };
        return filterPlugin.buildStreamTransform(streamFunction, null, 'filter');
    }
};
