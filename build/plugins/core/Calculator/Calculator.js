"use strict";
/**
 * Mixes in a series of common mathematical calculations
 *
 * @class Nextract.Plugins.Core.Calculator
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// This uses the larger import because method usage is dynamic
const lodash_1 = __importDefault(require("lodash"));
const pluginBase_1 = __importDefault(require("../../pluginBase"));
//Instantiate the plugin
let calculatorPlugin = new pluginBase_1.default('Calculator', 'Core');
//Many of the common calc operations can flow through lodash so this is a shared wrapper
function doLodashPassthrough(lodashMethod, firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd = '') {
    let streamFunction = function (element, index) {
        if (lodash_1.default.isUndefined(element))
            return;
        let v1 = lodash_1.default.isString(firstPropOrVal) && lodash_1.default.has(element, firstPropOrVal) ? element[firstPropOrVal] : Number(firstPropOrVal);
        let v2 = lodash_1.default.isString(secondPropOrVal) && lodash_1.default.has(element, secondPropOrVal) ? element[secondPropOrVal] : Number(secondPropOrVal);
        if (lodash_1.default.isUndefined(v1) || lodash_1.default.isUndefined(v2)) {
            throw new Error('Invalid calculator ' + lodashMethod + ' request, please check your input params!');
        }
        else {
            //Set or update with new value
            element[propertyToUpdateOrAdd] = lodash_1.default[lodashMethod](v1, v2);
            return element;
        }
    };
    return calculatorPlugin.buildStreamTransform(streamFunction, null, 'map');
}
module.exports = {
    /**
     * Operates on a stream adding two numbers and/or object properties
     *
     * @method add
     * @example
     *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Calculator.add('salary', 1000, 'new_salary'))
     *
     * @param {String|Number} firstPropOrVal The 1st value or property to use in this operation
     * @param {String|Number} secondPropOrVal The 2nd value or property to use in this operation
     * @param {String} propertyToUpdateOrAdd The object property to update or create with the value
     * of this operation
     *
     * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
     */
    add: function (firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd) {
        return doLodashPassthrough('add', firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd);
    },
    /**
     * Operates on a stream subtracting two numbers and/or object properties
     *
     * @method subtract
     * @example
     *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Calculator.subtract('salary', 1000, 'new_salary'))
     *
     * @param {Object} collection The collection to iterate over
     * @param {String|Number} firstPropOrVal The 1st value or property to use in this operation
     * @param {String|Number} secondPropOrVal The 2nd value or property to use in this operation
     * @param {String} propertyToUpdateOrAdd The object property to update or create with the value
     * of this operation
     *
     * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
     */
    subtract: function (firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd) {
        return doLodashPassthrough('subtract', firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd);
    },
    /**
     * Operates on a stream multiplying two numbers and/or object properties
     *
     * @method multiply
     * @example
     *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Calculator.multiply('salary', 1000, 'new_salary'))
     *
     * @param {String|Number} firstPropOrVal The 1st value or property to use in this operation
     * @param {String|Number} secondPropOrVal The 2nd value or property to use in this operation
     * @param {String} propertyToUpdateOrAdd The object property to update or create with the value
     * of this operation
     *
     * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
     */
    multiply: function (firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd) {
        return doLodashPassthrough('multiply', firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd);
    },
    /**
     * Operates on a stream dividing two numbers and/or object properties
     *
     * @method divide
     * @example
     *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Calculator.divide('salary', 1000, 'new_salary'))
     *
     * @param {String|Number} firstPropOrVal The 1st value or property to use in this operation
     * @param {String|Number} secondPropOrVal The 2nd value or property to use in this operation
     * @param {String} propertyToUpdateOrAdd The object property to update or create with the value
     * of this operation
     *
     * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
     */
    divide: function (firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd) {
        return doLodashPassthrough('divide', firstPropOrVal, secondPropOrVal, propertyToUpdateOrAdd);
    },
    /**
     * Operates on a stream concatenating strings and/or object properties
     *
     * @method concat
     * @example
     *     someReadableStream.pipe(yourTransformInstance.Plugins.Core.Calculator.concat(['Mr/Mrs:', 'first_name', 'last_name'], ' ', 'full_name'))
     *
     * @param {Array} propsOrValsToConcat An array of strings and/or object properties to concat
     * @param {String} delimiter The delimiter to use in between each propsOrValsToConcat
     * @param {String} propertyToUpdateOrAdd The object property to update or create with the value
     *
     * @return {stream.Transform} Read/write stream transform to use in conjuction with pipe()
     */
    concat: function (propsOrValsToConcat, delimiter = '', propertyToUpdateOrAdd) {
        let streamFunction = function (element, index) {
            if (lodash_1.default.isUndefined(element))
                return;
            //First assume each string is a key in the object, if not treat as a normal string
            let valuesToConcat = [];
            propsOrValsToConcat.forEach(function (p) {
                let v = lodash_1.default.has(element, p) === true ? element[p].toString() : p.toString();
                valuesToConcat[valuesToConcat.length] = v;
            });
            //Set or update with new value
            element[propertyToUpdateOrAdd] = valuesToConcat.join(delimiter);
            return element;
        };
        return calculatorPlugin.buildStreamTransform(streamFunction, null, 'map');
    }
    //TODO: Implement...
    /*
      round
      floor
      ceil
      sqrt
      split field
      uppercase
      lowercase
      replace
      null/empty default
    */
};
