export class InvalidToolInputError extends Error {
  readonly code = 'INVALID_TOOL_INPUT';

  constructor(message: string) {
    super(message);
    this.name = 'InvalidToolInputError';
  }
}

export class InvalidToolTransitionError extends Error {
  readonly code = 'INVALID_TOOL_TRANSITION';

  constructor(message: string) {
    super(message);
    this.name = 'InvalidToolTransitionError';
  }
}
