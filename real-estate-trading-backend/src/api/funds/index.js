const express = require('express');
const router = express.Router();
const pool = require('../../config/db');

router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const userBalanceQuery = 'SELECT balance FROM users WHERE id = $1';
        const userBalanceResult = await pool.query(userBalanceQuery, [userId]);

        const propertiesQuery = `
            SELECT value FROM properties
            JOIN user_properties ON properties.id = user_properties.property_id
            WHERE user_properties.user_id = $1`;
        const propertiesResult = await pool.query(propertiesQuery, [userId]);

        const totalInvestment = propertiesResult.rows.reduce((acc, cur) => acc + parseFloat(cur.value), 0);

        res.json({
            balance: userBalanceResult.rows[0].balance,
            totalInvestment: totalInvestment
        });
    } catch (error) {
        console.error('Error fetching funds information:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
