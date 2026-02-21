import type { Request, Response } from 'express';
import pool from '../db.js';

/**
 * POST /api/groups/:id/settle
 * Body: { payerId, receiverId, amount, note? }
 * 
 * Records a real cash payment from payerId to receiverId within the group.
 * This does NOT change game P&L — it only tracks real money movement.
 */
export const handler = async (req: Request, res: Response) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const groupId = req.params.id;
    const { payerId, receiverId, amount, note } = req.body;

    if (!groupId || !payerId || !receiverId || !amount) {
        return res.status(400).json({ error: 'Missing required fields: payerId, receiverId, amount' });
    }

    if (payerId === receiverId) {
        return res.status(400).json({ error: 'Cannot settle with yourself' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    try {
        // Verify both users are members of the group
        const memberCheck = await pool.query(
            `SELECT user_id FROM group_members WHERE group_id = $1 AND user_id = ANY($2::uuid[])`,
            [groupId, [payerId, receiverId]]
        );
        if (memberCheck.rows.length < 2) {
            return res.status(400).json({ error: 'Both users must be members of this group' });
        }

        const result = await pool.query(
            `INSERT INTO group_settlements (group_id, payer_id, receiver_id, amount, note)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [groupId, payerId, receiverId, parsedAmount, note || '']
        );

        return res.status(201).json({ success: true, settlement: result.rows[0] });
    } catch (error: any) {
        console.error('Settle group debt error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
