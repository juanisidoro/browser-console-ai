/**
 * Licensing Domain - Errors
 */

export class LicenseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LicenseError';
  }
}

export class LicenseExpiredError extends LicenseError {
  constructor() {
    super('License has expired');
    this.name = 'LicenseExpiredError';
  }
}

export class InvalidTokenError extends LicenseError {
  constructor(reason?: string) {
    super(reason ? `Invalid token: ${reason}` : 'Invalid token');
    this.name = 'InvalidTokenError';
  }
}

export class TokenNotYetValidError extends LicenseError {
  constructor() {
    super('Token is not yet valid');
    this.name = 'TokenNotYetValidError';
  }
}
