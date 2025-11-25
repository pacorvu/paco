import { createClient } from '@supabase/supabase-js';

// Lazy initialization - only create client when needed
let supabaseClient = null;

function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  // Use SUPABASE_SERVICE_ROLE_KEY if available, otherwise try to extract from DATABASE_URL
  let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // If DATABASE_URL is provided, try to extract service role key from it
  // Format: postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
  if (!supabaseServiceKey && process.env.DATABASE_URL) {
    // Extract password from DATABASE_URL if it's a Supabase connection string
    const dbUrlMatch = process.env.DATABASE_URL.match(/postgresql:\/\/postgres:([^@]+)@/);
    if (dbUrlMatch) {
      // Note: DATABASE_URL password is usually the database password, not the service role key
      // You should still set SUPABASE_SERVICE_ROLE_KEY separately
      console.warn('Using DATABASE_URL, but SUPABASE_SERVICE_ROLE_KEY is recommended for API access');
    }
  }

  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL environment variable. Please set it in your .env file');
  }

  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Please set it in your .env file. Get it from Supabase Dashboard > Settings > API > Service Role Key');
  }

  supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return supabaseClient;
}

// Export the getter function, and also export a default for backward compatibility
const supabase = new Proxy({}, {
  get(target, prop) {
    return getSupabaseClient()[prop];
  }
});

// Database helper functions
export const db = {
  // Get a single row
  get: async (query, params = []) => {
    try {
      // Convert SQL query to Supabase query
      // Example: "SELECT * FROM users WHERE email = ?" -> supabase.from('users').select('*').eq('email', params[0])
      const { table, select, where } = parseQuery(query, params);
      
      if (!table) {
        const error = new Error(`Failed to parse table name from query: ${query}`);
        console.error('Database get error - table parsing failed:', {
          query,
          params,
          parsed: { table, select, where }
        });
        throw error;
      }
      
      let queryBuilder = supabase.from(table).select(select || '*');
      
      // Apply where conditions
      if (where && where.length > 0) {
        where.forEach(condition => {
          queryBuilder = queryBuilder.eq(condition.column, condition.value);
        });
      }
      
      const { data, error } = await queryBuilder.single();
      
      if (error) {
        // PGRST116 is "not found" - this is expected for queries that don't find a match
        if (error.code === 'PGRST116') {
          return null;
        }
        
        // Enhanced error logging
        const errorDetails = {
          message: error.message || 'Unknown Supabase error',
          code: error.code || 'NO_CODE',
          details: error.details || null,
          hint: error.hint || null,
          query: query,
          params: params,
          table: table,
          select: select,
          where: where
        };
        
        console.error('='.repeat(80));
        console.error('[DATABASE ERROR] Supabase query failed');
        console.error(JSON.stringify(errorDetails, null, 2));
        console.error('='.repeat(80));
        
        // Create a more descriptive error
        const enhancedError = new Error(
          `Database query failed: ${error.message || 'Internal server error'} ` +
          `(Table: ${table}, Code: ${error.code || 'unknown'})`
        );
        enhancedError.originalError = error;
        enhancedError.code = error.code;
        enhancedError.details = errorDetails;
        throw enhancedError;
      }
      
      return data || null;
    } catch (error) {
      // If it's already our enhanced error, rethrow it
      if (error.originalError) {
        throw error;
      }
      
      // Otherwise, log and enhance it
      console.error('Database get error - unexpected exception:', {
        message: error.message,
        stack: error.stack,
        query,
        params
      });
      throw error;
    }
  },

  // Get multiple rows
  all: async (query, params = []) => {
    try {
      const { table, select, where, limit, offset } = parseQuery(query, params);
      
      if (!table) {
        const error = new Error(`Failed to parse table name from query: ${query}`);
        console.error('Database all error - table parsing failed:', {
          query,
          params,
          parsed: { table, select, where, limit, offset }
        });
        throw error;
      }
      
      let queryBuilder = supabase.from(table).select(select || '*');
      
      if (where && where.length > 0) {
        where.forEach(condition => {
          queryBuilder = queryBuilder.eq(condition.column, condition.value);
        });
      }
      
      if (limit) {
        queryBuilder = queryBuilder.limit(limit);
      }
      
      if (offset) {
        queryBuilder = queryBuilder.range(offset, offset + (limit || 10) - 1);
      }
      
      const { data, error } = await queryBuilder;
      
      if (error) {
        const errorDetails = {
          message: error.message || 'Unknown Supabase error',
          code: error.code || 'NO_CODE',
          details: error.details || null,
          hint: error.hint || null,
          query: query,
          params: params,
          table: table
        };
        
        console.error('='.repeat(80));
        console.error('[DATABASE ERROR] Supabase query failed (all)');
        console.error(JSON.stringify(errorDetails, null, 2));
        console.error('='.repeat(80));
        
        const enhancedError = new Error(
          `Database query failed: ${error.message || 'Internal server error'} ` +
          `(Table: ${table}, Code: ${error.code || 'unknown'})`
        );
        enhancedError.originalError = error;
        enhancedError.code = error.code;
        enhancedError.details = errorDetails;
        throw enhancedError;
      }
      
      return data || [];
    } catch (error) {
      if (error.originalError) {
        throw error;
      }
      console.error('Database all error - unexpected exception:', {
        message: error.message,
        stack: error.stack,
        query,
        params
      });
      throw error;
    }
  },

  // Insert a row
  run: async (query, params = []) => {
    try {
      const { table, insert } = parseInsertQuery(query, params);
      
      if (!table) {
        const error = new Error(`Failed to parse table name from INSERT query: ${query}`);
        console.error('Database run error - table parsing failed:', {
          query,
          params
        });
        throw error;
      }
      
      const { data, error } = await supabase
        .from(table)
        .insert(insert)
        .select()
        .single();
      
      if (error) {
        const errorDetails = {
          message: error.message || 'Unknown Supabase error',
          code: error.code || 'NO_CODE',
          details: error.details || null,
          hint: error.hint || null,
          query: query,
          params: params,
          table: table,
          insert: insert
        };
        
        console.error('='.repeat(80));
        console.error('[DATABASE ERROR] Supabase insert failed');
        console.error(JSON.stringify(errorDetails, null, 2));
        console.error('='.repeat(80));
        
        const enhancedError = new Error(
          `Database insert failed: ${error.message || 'Internal server error'} ` +
          `(Table: ${table}, Code: ${error.code || 'unknown'})`
        );
        enhancedError.originalError = error;
        enhancedError.code = error.code;
        enhancedError.details = errorDetails;
        throw enhancedError;
      }
      
      // Return format similar to SQLite's run() method
      return {
        lastID: data.id,
        changes: 1
      };
    } catch (error) {
      if (error.originalError) {
        throw error;
      }
      console.error('Database run error - unexpected exception:', {
        message: error.message,
        stack: error.stack,
        query,
        params
      });
      throw error;
    }
  },

  // Update a row
  update: async (query, params = []) => {
    try {
      const { table, update, where } = parseUpdateQuery(query, params);
      
      if (!table) {
        const error = new Error(`Failed to parse table name from UPDATE query: ${query}`);
        console.error('Database update error - table parsing failed:', {
          query,
          params
        });
        throw error;
      }
      
      let queryBuilder = supabase.from(table).update(update);
      
      if (where && where.length > 0) {
        where.forEach(condition => {
          queryBuilder = queryBuilder.eq(condition.column, condition.value);
        });
      }
      
      const { data, error } = await queryBuilder.select();
      
      if (error) {
        const errorDetails = {
          message: error.message || 'Unknown Supabase error',
          code: error.code || 'NO_CODE',
          details: error.details || null,
          hint: error.hint || null,
          query: query,
          params: params,
          table: table,
          update: update,
          where: where
        };
        
        console.error('='.repeat(80));
        console.error('[DATABASE ERROR] Supabase update failed');
        console.error(JSON.stringify(errorDetails, null, 2));
        console.error('='.repeat(80));
        
        const enhancedError = new Error(
          `Database update failed: ${error.message || 'Internal server error'} ` +
          `(Table: ${table}, Code: ${error.code || 'unknown'})`
        );
        enhancedError.originalError = error;
        enhancedError.code = error.code;
        enhancedError.details = errorDetails;
        throw enhancedError;
      }
      
      return {
        changes: data?.length || 0
      };
    } catch (error) {
      if (error.originalError) {
        throw error;
      }
      console.error('Database update error - unexpected exception:', {
        message: error.message,
        stack: error.stack,
        query,
        params
      });
      throw error;
    }
  }
};

// Helper function to parse SQL queries (simplified version)
function parseQuery(sql, params) {
  const result = {
    table: null,
    select: '*',
    where: [],
    limit: null,
    offset: null
  };

  // Normalize SQL - remove extra whitespace
  sql = sql.trim().replace(/\s+/g, ' ');

  // Extract table name from SELECT query
  // Match: SELECT ... FROM table_name [WHERE ...] [LIMIT ...] [OFFSET ...]
  const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s|$)/i);
  if (selectMatch) {
    result.select = selectMatch[1].trim();
    result.table = selectMatch[2].trim();
  } else {
    // Try alternative pattern if first one fails
    const altMatch = sql.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)\s+WHERE/i);
    if (altMatch) {
      result.select = altMatch[1].trim();
      result.table = altMatch[2].trim();
    }
  }

  // Extract WHERE conditions
  const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+LIMIT|\s+OFFSET|$)/i);
  if (whereMatch) {
    const whereClause = whereMatch[1].trim();
    // Simple parsing for "column = ?" pattern
    const eqMatch = whereClause.match(/(\w+)\s*=\s*\?/i);
    if (eqMatch && params.length > 0) {
      result.where.push({
        column: eqMatch[1],
        value: params[0]
      });
    }
  }

  // Extract LIMIT
  const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
  if (limitMatch) {
    result.limit = parseInt(limitMatch[1]);
  }

  // Extract OFFSET
  const offsetMatch = sql.match(/OFFSET\s+(\d+)/i);
  if (offsetMatch) {
    result.offset = parseInt(offsetMatch[1]);
  }

  // Debug logging if table is not found
  if (!result.table) {
    console.warn('[QUERY PARSER] Failed to extract table name from query:', {
      sql,
      params,
      result
    });
  }

  return result;
}

function parseInsertQuery(sql, params) {
  const match = sql.match(/INSERT\s+INTO\s+(\w+)\s*\((.+?)\)\s*VALUES\s*\((.+?)\)/i);
  if (!match) {
    throw new Error('Invalid INSERT query format');
  }

  const table = match[1];
  const columns = match[2].split(',').map(c => c.trim());
  const values = params;

  const insert = {};
  columns.forEach((col, index) => {
    insert[col] = values[index];
  });

  return { table, insert };
}

function parseUpdateQuery(sql, params) {
  const match = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+)/i);
  if (!match) {
    throw new Error('Invalid UPDATE query format');
  }

  const table = match[1];
  const setClause = match[2];
  const whereClause = match[3];

  // Parse SET clause - handle "column = ?" and "column = NULL" patterns
  const update = {};
  const setPairs = setClause.split(',').map(p => p.trim());
  let paramIndex = 0;
  
  setPairs.forEach((pair) => {
    // Check for "column = ?" pattern
    const eqMatch = pair.match(/(\w+)\s*=\s*\?/i);
    if (eqMatch) {
      if (params[paramIndex] !== undefined) {
        update[eqMatch[1]] = params[paramIndex];
      }
      paramIndex++;
    } else {
      // Check for "column = NULL" pattern
      const nullMatch = pair.match(/(\w+)\s*=\s*NULL/i);
      if (nullMatch) {
        update[nullMatch[1]] = null;
      }
    }
  });

  // Parse WHERE clause
  const where = [];
  const whereMatch = whereClause.match(/(\w+)\s*=\s*\?/i);
  if (whereMatch && params[paramIndex] !== undefined) {
    where.push({
      column: whereMatch[1],
      value: params[paramIndex]
    });
  }

  return { table, update, where };
}

// Export both the proxy (for direct use) and the getter function
export { getSupabaseClient };
export default supabase;

