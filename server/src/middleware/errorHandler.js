export class ApiError extends Error {
  status;
  details;

  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Express recognizes an error-handling middleware by its 4-argument arity —
// the unused `next` parameter must stay for that dispatch to work.
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Not found' });
}
