import { getTables, getTableSchema, getTableData, executeQuery } from '../database/db.js';

// @desc    Get all tables
// @route   GET /api/db/tables
// @access  Private (Admin only)
export const getDatabaseTables = async (req, res) => {
  try {
    const tables = await getTables();
    res.status(200).json({
      success: true,
      tables
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tables',
      error: error.message
    });
  }
};

// @desc    Get table schema
// @route   GET /api/db/tables/:tableName/schema
// @access  Private (Admin only)
export const getTableSchemaInfo = async (req, res) => {
  try {
    const { tableName } = req.params;
    const schema = await getTableSchema(tableName);
    res.status(200).json({
      success: true,
      tableName,
      schema
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching table schema',
      error: error.message
    });
  }
};

// @desc    Get table data
// @route   GET /api/db/tables/:tableName/data
// @access  Private (Admin only)
export const getTableDataInfo = async (req, res) => {
  try {
    const { tableName } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const result = await getTableData(tableName, limit, offset);
    res.status(200).json({
      success: true,
      tableName,
      data: result.data,
      count: result.count,
      limit,
      offset
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching table data',
      error: error.message
    });
  }
};

// @desc    Execute custom query (SELECT only)
// @route   POST /api/db/query
// @access  Private (Admin only)
export const executeCustomQuery = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a query'
      });
    }

    const result = await executeQuery(query);
    res.status(200).json({
      success: true,
      result,
      count: result.length
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error executing query',
      error: error.message
    });
  }
};

