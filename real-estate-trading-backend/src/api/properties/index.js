const express = require('express');
const router = express.Router();
const pool = require('../../config/db'); // Ensure this path correctly points to where your Pool is configured

// GET endpoint to fetch all properties
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM properties');
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch properties:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET endpoint to fetch a single property by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM properties WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send('Property not found');
    }
  } catch (error) {
    console.error('Failed to fetch property:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/buy/:id', async (req, res) => {
  const { id } = req.params;
  const userId = 1;  // Temporarily set user ID as 1 for testing

  try {
    await pool.query('BEGIN');

    const propertyQuery = 'SELECT value, is_available FROM properties WHERE id = $1';
    const propertyRes = await pool.query(propertyQuery, [id]);
    if (propertyRes.rows.length === 0 || !propertyRes.rows[0].is_available) {
      throw new Error('Property not available for purchase');
    }

    const propertyPrice = parseFloat(propertyRes.rows[0].value);

    const fundsQuery = 'SELECT balance FROM users WHERE id = $1';
    const fundsRes = await pool.query(fundsQuery, [userId]);
    if (fundsRes.rows.length === 0) {
      throw new Error('User not found');
    }

    const userBalance = parseFloat(fundsRes.rows[0].balance);
    if (userBalance < propertyPrice) {
      throw new Error('Insufficient funds');
    }

    const updateFundsQuery = 'UPDATE users SET balance = balance - $1 WHERE id = $2 RETURNING balance;';
    const updatedFundsRes = await pool.query(updateFundsQuery, [propertyPrice, userId]);
    const newBalance = updatedFundsRes.rows[0].balance;

    const updatePropertyQuery = 'UPDATE properties SET is_available = false WHERE id = $1';
    await pool.query(updatePropertyQuery, [id]);

    const insertUserPropertyQuery = 'INSERT INTO user_properties (user_id, property_id, purchase_date) VALUES ($1, $2, NOW()) RETURNING *';
    const userPropertyRes = await pool.query(insertUserPropertyQuery, [userId, id]);

    const insertTransactionQuery = 'INSERT INTO transactions (user_id, property_id, transaction_type, amount, timestamp, balance_after) VALUES ($1, $2, \'Buy\', $3, NOW(), $4)';
    await pool.query(insertTransactionQuery, [userId, id, -propertyPrice, newBalance]);

    await pool.query('COMMIT');
    res.status(200).json({ message: "Property purchased successfully" });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Purchase transaction failed:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/sell/:id', async (req, res) => {
  const { id } = req.params;
  const userId = 1;  // Temporarily set user ID as 1 for testing

  try {
    await pool.query('BEGIN');

    const ownershipQuery = 'SELECT * FROM user_properties WHERE user_id = $1 AND property_id = $2';
    const ownershipRes = await pool.query(ownershipQuery, [userId, id]);
    if (ownershipRes.rows.length === 0) {
      throw new Error('Property not owned by the user');
    }

    const propertyQuery = 'SELECT value FROM properties WHERE id = $1';
    const propertyRes = await pool.query(propertyQuery, [id]);
    if (propertyRes.rows.length === 0) {
      throw new Error('Property does not exist');
    }
    const propertyValue = propertyRes.rows[0].value;

    const updateFundsQuery = 'UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance;';
    const updatedFundsRes = await pool.query(updateFundsQuery, [propertyValue, userId]);
    const newBalance = updatedFundsRes.rows[0].balance;

    const updatePropertyQuery = 'UPDATE properties SET is_available = true WHERE id = $1';
    await pool.query(updatePropertyQuery, [id]);

    const deleteOwnershipQuery = 'DELETE FROM user_properties WHERE user_id = $1 AND property_id = $2';
    await pool.query(deleteOwnershipQuery, [userId, id]);

    const insertTransactionQuery = 'INSERT INTO transactions (user_id, property_id, transaction_type, amount, timestamp, balance_after) VALUES ($1, $2, \'Sell\', $3, NOW(), $4)';
    await pool.query(insertTransactionQuery, [userId, id, propertyValue, newBalance]);

    await pool.query('COMMIT');
    res.status(200).json({ message: "Property sold successfully" });
  } catch ( error) {
    await pool.query('ROLLBACK');
    console.error('Sell transaction failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET endpoint to fetch properties owned by a user
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const query = `
      SELECT p.*, up.purchase_date 
      FROM properties p
      JOIN user_properties up ON p.id = up.property_id
      WHERE up.user_id = $1;
    `;
    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch user properties:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/transactions/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const transactionsQuery = `
      SELECT t.*, p.name as property_name
      FROM transactions t
      LEFT JOIN properties p ON t.property_id = p.id
      WHERE t.user_id = $1
      ORDER BY t.timestamp DESC;
    `;
    const transactionsResult = await pool.query(transactionsQuery, [userId]);
    res.json(transactionsResult.rows);
  } catch (error) {
    console.error('Failed to fetch transaction history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST endpoint to add new properties
router.post('/', async (req, res) => {
  try {
    const { name, description, location, value } = req.body;
    const result = await pool.query(
      'INSERT INTO properties (name, description, location, value) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, location, value]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to add property:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
