// Import required modules and initialize router
const express = require('express');
const router = express.Router();
const pool = require('../../config/db');

// Function to match orders
async function matchOrders() {
    try {
        // Retrieve open buy and sell orders sorted by price and time
        const buyOrders = await pool.query("SELECT * FROM orders WHERE order_type = 'buy' AND status = 'open' ORDER BY value DESC, created_at ASC");
        const sellOrders = await pool.query("SELECT * FROM orders WHERE order_type = 'sell' AND status = 'open' ORDER BY value ASC, created_at ASC");

        for (let buy of buyOrders.rows) {
            for (let sell of sellOrders.rows) {
                if (sell.value <= buy.value && sell.status === 'open' && buy.status === 'open') {
                    const transactionValue = Math.min(buy.value, sell.value);

                    // Mark orders as completed
                    await pool.query("UPDATE orders SET status = 'completed' WHERE id = $1", [buy.id]);
                    await pool.query("UPDATE orders SET status = 'completed' WHERE id = $1", [sell.id]);

                    // Create a transaction record (if needed)
                    await pool.query("INSERT INTO transactions (buy_order_id, sell_order_id, property_id, value) VALUES ($1, $2, $3, $4)",
                        [buy.id, sell.id, buy.property_id, transactionValue]);

                    // Notify users (optional)
                    console.log(`Order matched: Buy Order ${buy.id} with Sell Order ${sell.id}`);
                    break; // Exit loop after matching
                }
            }
        }
    } catch (error) {
        console.error('Failed to match orders:', error);
    }
}

// POST endpoint to place a new order
router.post('/', async (req, res) => {
    const { user_id, property_id, order_type, value } = req.body;
    try {
        // Check available funds for buy orders
        if (order_type === 'buy') {
            const userFunds = await pool.query('SELECT balance FROM users WHERE id = $1', [user_id]);
            if (userFunds.rows[0].balance < value) {
                return res.status(400).json({ message: 'Insufficient funds' });
            }
        }

        // Place the order
        const result = await pool.query(
            'INSERT INTO orders (user_id, property_id, order_type, value) VALUES ($1, $2, $3, $4) RETURNING *',
            [user_id, property_id, order_type, value]
        );

        // Deduct funds for buy orders
        if (order_type === 'buy') {
            await pool.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [value, user_id]);
        }

        // Trigger order matching
        await matchOrders();

        res.status(201).json({ message: "Order placed successfully", order: result.rows[0] });
    } catch (error) {
        console.error('Failed to place order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
