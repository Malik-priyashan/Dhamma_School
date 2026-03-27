export function getErrorMessage(err: unknown): string {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null) {
    const maybe = (err as Record<string, unknown>)['message'];
    if (typeof maybe === 'string') return maybe;
    try {
      return JSON.stringify(err);
    } catch {
        return 'Unknown error';
    }
  }
  return String(err);
}
