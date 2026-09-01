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

export class InvalidToolDefinitionError extends Error {
  readonly code = 'INVALID_TOOL_DEFINITION';

  constructor(message: string) {
    super(message);
    this.name = 'InvalidToolDefinitionError';
  }
}

export class DuplicateToolSlugError extends Error {
  readonly code = 'DUPLICATE_TOOL_SLUG';
  readonly slug: string;

  constructor(slug: string) {
    super(`Tool slug already registered: ${slug}`);
    this.name = 'DuplicateToolSlugError';
    this.slug = slug;
  }
}

export class ToolNotFoundError extends Error {
  readonly code = 'TOOL_NOT_FOUND';
  readonly slug: string;

  constructor(slug: string) {
    super(`Tool not found: ${slug}`);
    this.name = 'ToolNotFoundError';
    this.slug = slug;
  }
}
