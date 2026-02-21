import { Router } from 'express'
import { GetPlayersInRoom, GetPlayerCounts } from './route-types'
import { pool } from '../db'
import { z } from 'zod'
import { sessionManager } from '../session'

export default function routes(): Router {
    const router = Router()

    // --- Realm CRUD ---

    router.post('/api/realms', async (req, res) => {
        const { owner_id, name, map_data } = req.body
        if (!owner_id || !name) {
            return res.status(400).json({ message: 'owner_id and name are required' })
        }

        try {
            const result = map_data
                ? await pool.query(
                    'INSERT INTO realms (owner_id, name, map_data) VALUES ($1, $2, $3) RETURNING *',
                    [owner_id, name, JSON.stringify(map_data)]
                  )
                : await pool.query(
                    'INSERT INTO realms (owner_id, name) VALUES ($1, $2) RETURNING *',
                    [owner_id, name]
                  )

            return res.json(result.rows[0])
        } catch (err: any) {
            return res.status(500).json({ message: err.message })
        }
    })

    router.get('/api/realms', async (req, res) => {
        const { ownerId } = req.query
        if (!ownerId) {
            return res.status(400).json({ message: 'ownerId is required' })
        }

        try {
            const result = await pool.query(
                'SELECT id, name, share_id FROM realms WHERE owner_id = $1',
                [ownerId]
            )
            return res.json(result.rows)
        } catch (err: any) {
            return res.status(500).json({ message: err.message })
        }
    })

    router.get('/api/realms/by-share/:shareId', async (req, res) => {
        try {
            const result = await pool.query(
                'SELECT id, name, map_data, owner_id, only_owner FROM realms WHERE share_id = $1',
                [req.params.shareId]
            )
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Realm not found' })
            }
            return res.json(result.rows[0])
        } catch (err: any) {
            return res.status(500).json({ message: err.message })
        }
    })

    router.get('/api/realms/:id', async (req, res) => {
        try {
            const result = await pool.query(
                'SELECT id, name, owner_id, map_data, share_id, only_owner FROM realms WHERE id = $1',
                [req.params.id]
            )
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Realm not found' })
            }
            return res.json(result.rows[0])
        } catch (err: any) {
            return res.status(500).json({ message: err.message })
        }
    })

    router.put('/api/realms/:id', async (req, res) => {
        const { map_data, only_owner, name, share_id } = req.body
        const setClauses: string[] = []
        const values: any[] = []
        let paramIndex = 1

        if (map_data !== undefined) {
            setClauses.push(`map_data = $${paramIndex++}`)
            values.push(JSON.stringify(map_data))
        }
        if (only_owner !== undefined) {
            setClauses.push(`only_owner = $${paramIndex++}`)
            values.push(only_owner)
        }
        if (name !== undefined) {
            setClauses.push(`name = $${paramIndex++}`)
            values.push(name)
        }
        if (share_id !== undefined) {
            setClauses.push(`share_id = $${paramIndex++}`)
            values.push(share_id)
        }

        if (setClauses.length === 0) {
            return res.status(400).json({ message: 'No fields to update' })
        }

        values.push(req.params.id)

        try {
            const oldResult = await pool.query('SELECT map_data, share_id, only_owner FROM realms WHERE id = $1', [req.params.id])
            const result = await pool.query(
                `UPDATE realms SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
                values
            )
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Realm not found' })
            }

            // Terminate session if relevant fields changed (replaces Supabase Realtime)
            if (oldResult.rows.length > 0) {
                const old = oldResult.rows[0]
                const updated = result.rows[0]
                let shouldTerminate = false
                if (map_data !== undefined && JSON.stringify(old.map_data) !== JSON.stringify(updated.map_data)) {
                    shouldTerminate = true
                }
                if (share_id !== undefined && old.share_id !== updated.share_id) {
                    shouldTerminate = true
                }
                if (only_owner !== undefined && updated.only_owner) {
                    shouldTerminate = true
                }
                if (shouldTerminate) {
                    sessionManager.terminateSession(req.params.id, 'This realm has been changed by the owner.')
                }
            }

            return res.json(result.rows[0])
        } catch (err: any) {
            return res.status(500).json({ message: err.message })
        }
    })

    router.delete('/api/realms/:id', async (req, res) => {
        try {
            const result = await pool.query(
                'DELETE FROM realms WHERE id = $1 RETURNING id',
                [req.params.id]
            )
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Realm not found' })
            }

            // Terminate session (replaces Supabase Realtime)
            sessionManager.terminateSession(req.params.id, 'This realm is no longer available.')

            return res.json({ success: true })
        } catch (err: any) {
            return res.status(500).json({ message: err.message })
        }
    })

    // --- Profile endpoints ---

    router.get('/api/profiles/:id', async (req, res) => {
        try {
            // Upsert: create profile if it doesn't exist
            const result = await pool.query(
                `INSERT INTO profiles (id) VALUES ($1) ON CONFLICT (id) DO NOTHING RETURNING *`,
                [req.params.id]
            )
            if (result.rows.length > 0) {
                return res.json(result.rows[0])
            }
            // Already exists, fetch it
            const existing = await pool.query('SELECT * FROM profiles WHERE id = $1', [req.params.id])
            return res.json(existing.rows[0])
        } catch (err: any) {
            return res.status(500).json({ message: err.message })
        }
    })

    router.put('/api/profiles/:id/skin', async (req, res) => {
        const { skin } = req.body
        if (!skin) {
            return res.status(400).json({ message: 'skin is required' })
        }

        try {
            const result = await pool.query(
                'UPDATE profiles SET skin = $1 WHERE id = $2 RETURNING *',
                [skin, req.params.id]
            )
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Profile not found' })
            }
            return res.json(result.rows[0])
        } catch (err: any) {
            return res.status(500).json({ message: err.message })
        }
    })

    router.get('/api/profiles/:id/visited-realms', async (req, res) => {
        try {
            const profileResult = await pool.query(
                'SELECT visited_realms FROM profiles WHERE id = $1',
                [req.params.id]
            )
            if (profileResult.rows.length === 0) {
                return res.json([])
            }

            const visitedShareIds: string[] = profileResult.rows[0].visited_realms || []
            if (visitedShareIds.length === 0) {
                return res.json([])
            }

            // Fetch realm info for each visited share_id
            const realms = []
            const toRemove: string[] = []
            for (const shareId of visitedShareIds) {
                const realmResult = await pool.query(
                    'SELECT id, name, share_id FROM realms WHERE share_id = $1',
                    [shareId]
                )
                if (realmResult.rows.length > 0) {
                    realms.push(realmResult.rows[0])
                } else {
                    toRemove.push(shareId)
                }
            }

            // Clean up stale visited realms
            if (toRemove.length > 0) {
                const cleaned = visitedShareIds.filter(id => !toRemove.includes(id))
                await pool.query(
                    'UPDATE profiles SET visited_realms = $1 WHERE id = $2',
                    [cleaned, req.params.id]
                )
            }

            return res.json(realms)
        } catch (err: any) {
            return res.status(500).json({ message: err.message })
        }
    })

    router.put('/api/profiles/:id/visited-realms', async (req, res) => {
        const { shareId } = req.body
        if (!shareId) {
            return res.status(400).json({ message: 'shareId is required' })
        }

        try {
            const profileResult = await pool.query(
                'SELECT visited_realms FROM profiles WHERE id = $1',
                [req.params.id]
            )
            if (profileResult.rows.length === 0) {
                return res.status(404).json({ message: 'Profile not found' })
            }

            const visited: string[] = profileResult.rows[0].visited_realms || []
            if (visited.includes(shareId)) {
                return res.json({ success: true })
            }

            visited.push(shareId)
            await pool.query(
                'UPDATE profiles SET visited_realms = $1 WHERE id = $2',
                [visited, req.params.id]
            )

            return res.json({ success: true })
        } catch (err: any) {
            return res.status(500).json({ message: err.message })
        }
    })

    // --- Existing routes (auth removed) ---

    router.get('/getPlayersInRoom', async (req, res) => {
        const params = req.query as unknown as z.infer<typeof GetPlayersInRoom>
        if (!GetPlayersInRoom.safeParse(params).success) {
            return res.status(400).json({ message: 'Invalid parameters' })
        }

        const uid = req.query.uid as string
        if (!uid) {
            return res.status(400).json({ message: 'uid is required' })
        }

        const session = sessionManager.getPlayerSession(uid)
        if (!session) {
            return res.status(400).json({ message: 'User not in a realm.' })
        }

        const players = session.getPlayersInRoom(params.roomIndex)
        return res.json({ players })
    })

    router.get('/getPlayerCounts', async (req, res) => {
        let params = req.query as unknown as z.infer<typeof GetPlayerCounts>
        const parseResults = GetPlayerCounts.safeParse(params)
        if (!parseResults.success) {
            return res.status(400).json({ message: 'Invalid parameters' })
        }

        params = parseResults.data

        if (params.realmIds.length > 100) {
            return res.status(400).json({ message: 'Too many server IDs' })
        }

        const playerCounts: number[] = []
        for (const realmId of params.realmIds) {
            const session = sessionManager.getSession(realmId)
            if (session) {
                const playerCount = session.getPlayerCount()
                playerCounts.push(playerCount)
            } else {
                playerCounts.push(0)
            }
        }

        return res.json({ playerCounts })
    })

    return router
}
