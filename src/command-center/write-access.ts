export class CommandCenterWritesDisabledError extends Error {
  readonly code = 'COMMAND_CENTER_WRITES_DISABLED';

  constructor() {
    super('Command Center writes are disabled.');
    this.name = 'CommandCenterWritesDisabledError';
  }
}

type Env = {
  NODE_ENV?: string;
  JS_OS_COMMAND_CENTER_WRITES?: string;
};

/**
 * Temporary unauthenticated write safeguard. Auth will replace this.
 * Writes require NODE_ENV === "development" AND JS_OS_COMMAND_CENTER_WRITES === "true".
 */
export function isCommandCenterWriteEnabled(env: Env = process.env): boolean {
  return env.NODE_ENV === 'development' && env['JS_OS_COMMAND_CENTER_WRITES'] === 'true';
}

export function assertCommandCenterWriteEnabled(env: Env = process.env): void {
  if (!isCommandCenterWriteEnabled(env)) {
    throw new CommandCenterWritesDisabledError();
  }
}
