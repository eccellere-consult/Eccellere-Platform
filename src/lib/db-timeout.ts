/**
 * Bound a database operation by a wall-clock timeout. Used by route
 * handlers to prevent stuck Prisma queries from holding a connection
 * (and a Node worker) longer than the user is willing to wait.
 *
 * The Prisma adapter's own socket_timeout/pool_timeout settings should
 * also fire, but those rely on the MariaDB driver detecting a stalled
 * connection. This wrapper is a hard upper bound at the application
 * layer.
 */
export function withDbTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label = "DB"
): Promise<T> {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
    ),
  ]);
}
