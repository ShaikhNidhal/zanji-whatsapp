/* ====================================================================
   Zanji Mock Database Pool
   
   Simulates a PostgreSQL connection pool (pg.Pool) using in-memory
   data. This allows the multi-tenant webhook router to work locally
   before a real Supabase/PostgreSQL instance is provisioned.
   
   In production, replace this entire file with:
     const { Pool } = require('pg');
     const pool = new Pool({ connectionString: process.env.DATABASE_URL });
     module.exports = pool;
   ==================================================================== */

const crypto = require('crypto');

// ── Simulated Tables ──────────────────────────────────────────────────

const merchant_whatsapp_settings = [
  {
    id: 'aaaa-1111-bbbb-2222',
    organization_id: 'org-pk-karachi-001',
    waba_id: 'WABA_PK_001',
    phone_number_id: '100200300400',
    display_phone_number: '+923001234567',
    webhook_verify_token: 'merchant_secret_token',
    created_at: new Date().toISOString()
  },
  {
    id: 'cccc-3333-dddd-4444',
    organization_id: 'org-ae-dubai-001',
    waba_id: 'WABA_AE_001',
    phone_number_id: '500600700800',
    display_phone_number: '+971501234567',
    webhook_verify_token: 'dubai_merchant_token',
    created_at: new Date().toISOString()
  },
  {
    id: 'eeee-5555-ffff-6666',
    organization_id: 'org-id-jakarta-001',
    waba_id: 'WABA_ID_001',
    phone_number_id: '900100200300',
    display_phone_number: '+628123456789',
    webhook_verify_token: 'jakarta_merchant_token',
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-tenant-id-xyz',
    organization_id: 'org-pk-karachi-001',
    waba_id: '1855564725361287',
    phone_number_id: '1128207817041218',
    display_phone_number: '+15556680064',
    webhook_verify_token: 'GO',
    created_at: new Date().toISOString()
  }
];

// In-memory orders table
const orders = [];

// Mock users table for operator round-robin tests
const users = [
  {
    id: 'user-op-pk-1',
    organization_id: 'org-pk-karachi-001',
    is_online: true,
    role: 'operator',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString() // 2 days ago
  },
  {
    id: 'user-op-pk-2',
    organization_id: 'org-pk-karachi-001',
    is_online: true,
    role: 'operator',
    created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString() // 1 day ago
  },
  {
    id: 'user-op-pk-3',
    organization_id: 'org-pk-karachi-001',
    is_online: false, // offline
    role: 'operator',
    created_at: new Date().toISOString()
  },
  {
    id: 'user-admin-pk',
    organization_id: 'org-pk-karachi-001',
    is_online: true,
    role: 'admin',
    created_at: new Date().toISOString()
  },
  {
    id: 'user-op-ae-1',
    organization_id: 'org-ae-dubai-001',
    is_online: true,
    role: 'operator',
    created_at: new Date().toISOString()
  },
  {
    id: 'user-op-id-1',
    organization_id: 'org-id-jakarta-001',
    is_online: true,
    role: 'operator',
    created_at: new Date().toISOString()
  }
];

// ── Table Registry ────────────────────────────────────────────────────

const waitlist = [];

const tables = {
  merchant_whatsapp_settings,
  orders,
  users,
  waitlist
};

// ── Query Engine ──────────────────────────────────────────────────────
// Parses a minimal subset of SQL for in-memory simulation.
// Supports: SELECT ... WHERE, INSERT ... RETURNING, BEGIN/COMMIT/ROLLBACK

function resolveTable(sql) {
  // Check FROM (SELECT) or INTO (INSERT)
  const fromMatch = sql.match(/FROM\s+(\w+)/i);
  const intoMatch = sql.match(/INTO\s+(\w+)/i);
  const tableName = (fromMatch || intoMatch)?.[1]?.toLowerCase();
  
  if (tableName && tables[tableName]) return { name: tableName, data: tables[tableName] };
  return { name: tableName || 'unknown', data: [] };
}

function parseWhereConditions(sql) {
  const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|\s*$)/i);
  if (!whereMatch) return [];
  
  const conditionStr = whereMatch[1];
  const conditions = [];
  
  const parts = conditionStr.split(/\s+AND\s+/i);
  for (const part of parts) {
    const m = part.trim().match(/(\w+)\s*=\s*\$(\d+)/);
    if (m) {
      conditions.push({ column: m[1], paramIndex: parseInt(m[2]) - 1 });
    }
  }
  
  return conditions;
}

function parseInsert(sql, params) {
  // Parse: INSERT INTO tablename (col1, col2, ...) VALUES ($1, $2, ...) RETURNING col1, col2
  const tableMatch = sql.match(/INTO\s+(\w+)/i);
  const colsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
  const returningMatch = sql.match(/RETURNING\s+(.+?)(?:\s*;|\s*$)/i);
  
  if (!tableMatch || !colsMatch) return null;
  
  const tableName = tableMatch[1].toLowerCase();
  const columns = colsMatch[1].split(',').map(c => c.trim());
  
  // Build the row
  const row = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString()
  };
  
  columns.forEach((col, i) => {
    // Map $1, $2 params or literal values
    const valMatch = sql.match(new RegExp(`\\$${i + 1}`));
    if (valMatch && params[i] !== undefined) {
      row[col] = params[i];
    } else {
      // Check for literal string values like 'COD', 'pending'
      // These are already handled by the VALUES clause parsing
    }
  });
  
  // Parse literal values from the VALUES clause
  const valuesMatch = sql.match(/VALUES\s*\(([^)]+)\)/i);
  if (valuesMatch) {
    const valueTokens = valuesMatch[1].split(',').map(v => v.trim());
    columns.forEach((col, i) => {
      const token = valueTokens[i];
      if (!token) return;
      // If it's a literal string (quoted)
      const literalMatch = token.match(/^'([^']*)'$/);
      if (literalMatch) {
        row[col] = literalMatch[1];
      }
    });
  }
  
  // Insert into the table
  if (tables[tableName]) {
    tables[tableName].push(row);
  }
  
  // Build RETURNING projection
  let returningCols = null;
  if (returningMatch) {
    returningCols = returningMatch[1].split(',').map(c => c.trim());
  }
  
  if (returningCols) {
    const projected = {};
    returningCols.forEach(col => { projected[col] = row[col]; });
    return { rows: [projected] };
  }
  
  return { rows: [row] };
}

/**
 * Simulated pool.query() compatible with pg.Pool interface.
 * @param {string} sql - SQL query string with $1, $2 params
 * @param {Array} params - Array of parameter values
 * @returns {Promise<{rows: Array}>}
 */
async function query(sql, params = []) {
  const trimmed = sql.trim().toUpperCase();
  
  // Intercept the round-robin operator query
  if (trimmed.includes('FROM USERS') && (trimmed.includes('LEFT JOIN ORDERS') || trimmed.includes('JOIN ORDERS'))) {
    const orgId = params[0];
    
    // Filter online operators for the organization
    const onlineOps = tables.users.filter(u => 
      u.organization_id === orgId && 
      u.is_online === true && 
      u.role === 'operator'
    );
    
    if (onlineOps.length === 0) {
      return { rows: [] };
    }
    
    // Count active assignments in the last 24 hours for each operator
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const withCounts = onlineOps.map(op => {
      const activeAssignments = tables.orders.filter(ord => 
        ord.created_by_user_id === op.id && 
        new Date(ord.created_at).getTime() > oneDayAgo
      ).length;
      return {
        id: op.id,
        active_assignments: activeAssignments,
        created_at: op.created_at
      };
    });
    
    // Sort: active_assignments ASC, created_at ASC
    withCounts.sort((a, b) => {
      if (a.active_assignments !== b.active_assignments) {
        return a.active_assignments - b.active_assignments;
      }
      return new Date(a.created_at) - new Date(b.created_at);
    });
    
    return { rows: [withCounts[0]] };
  }
  
  // Transaction control (no-ops for in-memory mock)
  if (trimmed === 'BEGIN' || trimmed === 'COMMIT' || trimmed === 'ROLLBACK') {
    return { rows: [] };
  }
  
  // INSERT handling
  if (trimmed.startsWith('INSERT')) {
    return parseInsert(sql, params);
  }

  // UPDATE handling
  if (trimmed.startsWith('UPDATE')) {
    const tableMatch = sql.match(/UPDATE\s+(\w+)/i);
    const setMatch = sql.match(/SET\s+(\w+)\s*=\s*\$(\d+)/i);
    const whereMatch = sql.match(/WHERE\s+(\w+)\s*=\s*\$(\d+)/i);
    
    if (tableMatch && setMatch && whereMatch) {
      const tableName = tableMatch[1].toLowerCase();
      const setCol = setMatch[1].toLowerCase();
      const setValParamIndex = parseInt(setMatch[2]) - 1;
      const setVal = params[setValParamIndex];
      
      const whereCol = whereMatch[1].toLowerCase();
      const whereValParamIndex = parseInt(whereMatch[2]) - 1;
      const whereVal = params[whereValParamIndex];
      
      if (tables[tableName]) {
        let updatedCount = 0;
        tables[tableName].forEach(row => {
          if (row[whereCol] === whereVal) {
            row[setCol] = setVal;
            updatedCount++;
          }
        });
        console.log(`[Mock DB] Updated ${updatedCount} rows in table: ${tableName}`);
      }
    }
    return { rows: [] };
  }
  
  // SELECT handling
  const { data: table } = resolveTable(sql);
  const conditions = parseWhereConditions(sql);
  
  if (conditions.length === 0) {
    return { rows: [...table] };
  }
  
  const filtered = table.filter(row => {
    return conditions.every(cond => {
      const value = params[cond.paramIndex];
      return row[cond.column] === value;
    });
  });
  
  // Handle SELECT specific columns
  const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
  if (selectMatch && selectMatch[1].trim() !== '*') {
    const cols = selectMatch[1].split(',').map(c => c.trim());
    const projected = filtered.map(row => {
      const obj = {};
      cols.forEach(col => { obj[col] = row[col]; });
      return obj;
    });
    return { rows: projected };
  }
  
  return { rows: filtered };
}

/**
 * Simulated pool.connect() — returns a client with query(), release(),
 * and transaction support (BEGIN/COMMIT/ROLLBACK are no-ops in mock).
 * @returns {Promise<Object>} Mock database client
 */
async function connect() {
  return {
    query: query,
    release: () => {} // no-op for mock
  };
}

// ── Export pg.Pool-compatible interface ────────────────────────────────

module.exports = {
  query,
  connect,
  
  // Expose the mock data for admin/debug inspection
  _tables: tables
};

