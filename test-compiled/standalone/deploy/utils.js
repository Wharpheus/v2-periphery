"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SmartPayloadBuilder = /** @class */ (function () {
    function SmartPayloadBuilder() {
    }
    SmartPayloadBuilder.success = function (message, data) {
        if (data === void 0) { data = null; }
        return {
            success: true,
            message: message,
            data: data
        };
    };
    SmartPayloadBuilder.error = function (message, error) {
        if (error === void 0) { error = null; }
        return {
            success: false,
            message: message,
            error: error
        };
    };
    return SmartPayloadBuilder;
}());
exports.default = SmartPayloadBuilder;
