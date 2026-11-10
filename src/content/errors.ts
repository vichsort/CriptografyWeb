import type { AppError, Operation } from '@/domain';
import { operationCopy } from './operations';

export interface ErrorCopy {
  title: string;
  body: string | null;
  /** Whether the API's own message is shown verbatim under the title. */
  showApiMessage: boolean;
}

const SOMETHING_WENT_WRONG: ErrorCopy = {
  title: 'Something went wrong',
  body: 'Try again. If it keeps happening, the API may have changed.',
  showApiMessage: false,
};

export function errorCopy(error: AppError, op?: Operation): ErrorCopy {
  switch (error.kind) {
    case 'validation':
    case 'operation':
      return {
        title: `Couldn't ${op ? operationCopy[op].verb : 'run it'}`,
        body: null,
        showApiMessage: true,
      };
    case 'binaryResult':
      return {
        title: 'The result is binary data',
        body: "The decoded bytes aren't valid UTF-8 text, so they can't be shown here. Your input is valid; only the result isn't text.",
        showApiMessage: true,
      };
    case 'rateLimited':
      return {
        title: 'Wait a moment',
        body: 'Too many operations in a row. The button comes back on its own.',
        showApiMessage: false,
      };
    case 'network':
      return {
        title: "Can't reach the server",
        body: 'Check your connection and try again.',
        showApiMessage: false,
      };
    case 'timeout':
      return {
        title: 'The server took too long',
        body: 'Try again in a moment.',
        showApiMessage: false,
      };
    case 'server':
    case 'contract':
      return SOMETHING_WENT_WRONG;
    case 'notFound':
      return {
        title: 'Algorithm not found',
        body: 'It may have been renamed or removed.',
        showApiMessage: false,
      };
    case 'aborted':
      // A cancelled run is replaced by the next one; it is never shown.
      return { title: '', body: null, showApiMessage: false };
  }
}
