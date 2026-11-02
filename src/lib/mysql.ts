/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * SPIKE STUB: the Strategy Hub's raw-SQL pool. This platform uses Prisma, so nothing may call this.
 * The files that did (strategyFrameworks, strategyFillins, strategyHubConnections, seedStrategyFrameworks)
 * are to be rewritten on Prisma; until then any call fails loudly instead of touching a database.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const unavailable = async (..._args: any[]): Promise<any> => {
  throw new Error("The Strategy Hub SQL pool is not available in this app. Use the Prisma store.");
};

const pool: any = {
  query: unavailable,
  execute: unavailable,
  getConnection: unavailable,
};

export default pool;
