export class BusinessStateNotFoundError extends Error {
  readonly code = 'BUSINESS_STATE_NOT_FOUND';

  constructor(message: string) {
    super(message);
    this.name = 'BusinessStateNotFoundError';
  }
}

export class InvalidBusinessStateInputError extends Error {
  readonly code = 'INVALID_BUSINESS_STATE_INPUT';

  constructor(message: string) {
    super(message);
    this.name = 'InvalidBusinessStateInputError';
  }
}

export class InvalidBusinessStateTransitionError extends Error {
  readonly code = 'INVALID_BUSINESS_STATE_TRANSITION';

  constructor(message: string) {
    super(message);
    this.name = 'InvalidBusinessStateTransitionError';
  }
}
