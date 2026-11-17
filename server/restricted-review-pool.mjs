// The hosted connection comes from Supabase. Run all catalog queries within
// a transaction using the existing restricted review role, including reads.
export function restrictedReviewPool(pool) {
  async function connect() {
    const client = await pool.connect();
    let active = false;
    return {
      async query(sql, values) {
        if (sql === 'begin') {
          await client.query('begin');
          active = true;
          await client.query('set local role kazu_catalog_review');
          await client.query("set local statement_timeout = '12s'");
          return;
        }
        if (!active) throw new Error('The review role requires an active transaction.');
        const result = await client.query(sql, values);
        if (sql === 'commit' || sql === 'rollback') active = false;
        return result;
      },
      release() {
        // Discard any connection whose transaction did not finish cleanly.
        client.release(active);
      },
    };
  }
  return {
    connect,
    async query(sql, values) {
      const client = await connect();
      try {
        await client.query('begin');
        const result = await client.query(sql, values);
        await client.query('commit');
        return result;
      } finally {
        client.release();
      }
    },
  };
}
