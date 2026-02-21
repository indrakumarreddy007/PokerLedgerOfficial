import type { Request, Response } from 'express';
import pool from '../db.js';

export const handler = async (req: Request, res: Response) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.params;
    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing group ID' });
    }

    try {
        const groupResult = await pool.query('SELECT * FROM groups WHERE id = $1', [id]);
        if (groupResult.rows.length === 0) {
            return res.status(404).json({ error: 'Group not found' });
        }
        const group = groupResult.rows[0];

        const sessionsResult = await pool.query(
            "SELECT * FROM sessions WHERE group_id = $1 AND status = 'active' ORDER BY created_at DESC",
            [id]
        );

        const leaderboardResult = await pool.query(
            `SELECT u.id as user_id, u.name, gm.role, COALESCE(SUM(sp.final_winnings), 0) as net_winnings
             FROM group_members gm
             JOIN users u ON gm.user_id = u.id
             LEFT JOIN sessions s ON s.group_id = gm.group_id AND s.status = 'closed'
             LEFT JOIN session_players sp ON sp.session_id = s.id AND sp.user_id = gm.user_id
             WHERE gm.group_id = $1
             GROUP BY u.id, u.name, gm.role
             ORDER BY net_winnings DESC`,
            [id]
        );

        return res.status(200).json({
            success: true,
            group,
            activeSessions: sessionsResult.rows,
            leaderboard: leaderboardResult.rows
        });
    } catch (error: any) {
        console.error('Group details error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
