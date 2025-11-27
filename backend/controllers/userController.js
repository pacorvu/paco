import { db } from '../database/supabase.js';
import bcrypt from 'bcryptjs';

// @desc    Get all registered users
// @route   GET /api/users
// @access  Admin only
export const getUsers = async (req, res) => {
  try {
    const users = await db.all(
      'SELECT id, name, email, role, created_at FROM register ORDER BY created_at DESC'
    );

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Admin only
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db.get(
      'SELECT id, name, email, role, created_at FROM register WHERE id = ?',
      [id]
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// @desc    Change user password (Admin only)
// @route   PUT /api/users/:id/password
// @access  Admin only
export const changeUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user exists
    const user = await db.get('SELECT id FROM register WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password
    await db.update(
      'UPDATE register SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: error.message
    });
  }
};
