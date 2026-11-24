import type { IncomingMessage, ServerResponse } from 'node:http';

export function handleStateApiRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void>;
