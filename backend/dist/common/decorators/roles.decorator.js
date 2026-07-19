"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permissions = void 0;
const common_1 = require("@nestjs/common");
const auth_constants_1 = require("../constants/auth.constants");
const Permissions = (...permissions) => (0, common_1.SetMetadata)(auth_constants_1.PERMISSIONS_KEY, permissions);
exports.Permissions = Permissions;
//# sourceMappingURL=roles.decorator.js.map