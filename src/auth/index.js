// src/auth/index.js
export { loginUser } from "./loginUser";
export { registerUser } from "./registerUser";
export { registerInstitution, loginInstitution } from "./institutionAuth";
export { registerTeam, loginTeam } from "./teamAuth";
export { 
  normalizeRole, 
  validateUserLoginPath, 
  getProperLoginPage, 
  getLoginError 
} from "./loginValidators";