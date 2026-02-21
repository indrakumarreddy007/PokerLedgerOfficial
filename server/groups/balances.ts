import type { Request, Response } from 'express';
import pool from '../db.js';

/**
 * GET /api/groups/:id/balances
 * 
 * Computes the simplified debt graph for all members of a group:
 * 1. Sums net poker P&L per member (winnings - buy-ins across all closed group sessions)
 * 2. Subtracts real-money settlements already made
 * 3. Runs the min-transaction debt simplification algorithm
 * 
 * Returns:
 *  - members: [{ userId, name, balance }]   (positive = is owed money, negative = owes money)
 *  - debts:   [{ from, fromName, to, toName, amount }]  (simplified)
 *  - history: recent settlements in the group
 */
export const handler = async (req: Request, res: Response) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const groupId = req.params.id;
    if (!groupId) {
        return res.status(400).json({ error: 'Missing group ID' });
    }

    try {
        // 1. Get all group members
        const membersResult = await pool.query(
            `SELECT u.id, u.name, u.username
             FROM group_members gm
             JOIN users u ON gm.user_id = u.id
             WHERE gm.group_id = $1`,
            [groupId]
        );
        const members = membersResult.rows;

        // 2. Compute net poker P&L per member from closed sessions in this group
        //    Net P&L = SUM(final_winnings) - SUM(approved buy-ins)
        const plResult = await pool.query(
            `SELECT 
                sp.user_id,
                COALESCE(SUM(sp.final_winnings), 0) as total_winnings,
                COALESCE(SUM(b.buyin_total), 0) as total_buyins
             FROM session_players sp
             JOIN sessions s ON sp.session_id = s.id
             LEFT JOIN (
                 SELECT session_id, user_id, SUM(amount) as buyin_total
                 FROM buy_ins
                 WHERE status = 'approved'
                 GROUP BY session_id, user_id
             ) b ON b.session_id = sp.session_id AND b.user_id = sp.user_id
             WHERE s.group_id = $1 AND s.status = 'closed'
             GROUP BY sp.user_id`,
            [groupId]
        );

        // 3. Get all settlements in this group
        const settlementsResult = await pool.query(
            `SELECT gs.*, 
                    p.name as payer_name, p.username as payer_username,
                    r.name as receiver_name, r.username as receiver_username
             FROM group_settlements gs
             JOIN users p ON gs.payer_id = p.id
             JOIN users r ON gs.receiver_id = r.id
             WHERE gs.group_id = $1
             ORDER BY gs.settled_at DESC`,
            [groupId]
        );

        // 4. Build balance map: userId → net balance
        //    Positive balance = others owe this person money
        //    Negative balance = this person owes others money
        const balanceMap: Record<string, number> = {};
        members.forEach(m => { balanceMap[m.id] = 0; });

        // Add poker P&L
        plResult.rows.forEach(row => {
            const net = parseFloat(row.total_winnings) - parseFloat(row.total_buyins);
            if (balanceMap[row.user_id] !== undefined) {
                balanceMap[row.user_id] += net;
            }
        });

        // Subtract settlements: payer's balance goes UP (they paid, reducing their debt)
        //                        receiver's balance goes DOWN (they received cash)
        settlementsResult.rows.forEach(s => {
            const amount = parseFloat(s.amount);
            if (balanceMap[s.payer_id] !== undefined) {
                balanceMap[s.payer_id] += amount;  // payer has paid, so they owe less
            }
            if (balanceMap[s.receiver_id] !== undefined) {
                balanceMap[s.receiver_id] -= amount; // receiver got cash, so less is owed to them
            }
        });

        // 5. Debt simplification (minimum transactions algorithm)
        //    Split members into creditors (balance > 0) and debtors (balance < 0)
        const creditors: Array<{ id: string; name: string; amount: number }> = [];
        const debtors: Array<{ id: string; name: string; amount: number }> = [];

        members.forEach(m => {
            const balance = Math.round(balanceMap[m.id] * 100) / 100; // round to cents
            if (balance > 0.01) {
                creditors.push({ id: m.id, name: m.name, amount: balance });
            } else if (balance < -0.01) {
                debtors.push({ id: m.id, name: m.name, amount: -balance }); // store as positive
            }
        });

        const debts: Array<{
            from: string; fromName: string;
            to: string; toName: string;
            amount: number;
        }> = [];

        // Greedy min-transaction algorithm
        let i = 0, j = 0;
        const credList = [...creditors].sort((a, b) => b.amount - a.amount);
        const debtList = [...debtors].sort((a, b) => b.amount - a.amount);

        while (i < credList.length && j < debtList.length) {
            const transferAmount = Math.min(credList[i].amount, debtList[j].amount);
            if (transferAmount > 0.01) {
                debts.push({
                    from: debtList[j].id,
                    fromName: debtList[j].name,
                    to: credList[i].id,
                    toName: credList[i].name,
                    amount: Math.round(transferAmount * 100) / 100
                });
            }
            credList[i].amount -= transferAmount;
            debtList[j].amount -= transferAmount;
            if (credList[i].amount < 0.01) i++;
            if (debtList[j].amount < 0.01) j++;
        }

        // 6. Build member summary with balances
        const memberBalances = members.map(m => ({
            userId: m.id,
            name: m.name,
            username: m.username,
            balance: Math.round((balanceMap[m.id] || 0) * 100) / 100
        }));

        return res.status(200).json({
            success: true,
            members: memberBalances,
            debts,
            history: settlementsResult.rows.map(s => ({
                id: s.id,
                payerId: s.payer_id,
                payerName: s.payer_name,
                receiverId: s.receiver_id,
                receiverName: s.receiver_name,
                amount: parseFloat(s.amount),
                note: s.note,
                settledAt: s.settled_at
            }))
        });
    } catch (error: any) {
        console.error('Group balances error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
