// server/socket/socketHandler.js
import jwt  from 'jsonwebtoken';
import pool from '../db/connection.js';

export default function socketHandler(io) {

  // ── Auth middleware ────────────────────────────────────────────────────────
  // Runs before every connection is accepted.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication error: no token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // shape: { id, username, iat, exp }
      next();
    } catch {
      return next(new Error('Authentication error: invalid or expired token'));
    }
  });

  // ── Connection handler ─────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`🟢 ${socket.user.username} connected  (socket: ${socket.id})`);

    // Tell everyone the new count (including the arriving user).
    io.emit('online_count', io.sockets.sockets.size);

    // ── new_message ────────────────────────────────────────────────────────
    socket.on('new_message', async ({ content } = {}) => {
      if (!content || typeof content !== 'string' || !content.trim()) return;

      try {
        const { rows } = await pool.query(
          `INSERT INTO messages (user_id, username, content)
           VALUES ($1, $2, $3)
           RETURNING id, user_id, username, content, created_at`,
          [socket.user.id, socket.user.username, content.trim()]
        );

        const row = rows[0];

        // Broadcast to ALL connected clients (including the sender so their
        // message appears in the same pipeline as everyone else's).
        io.emit('message', {
          id:        row.id,
          userId:    row.user_id,
          username:  row.username,
          content:   row.content,
          createdAt: row.created_at,
        });
      } catch (err) {
        console.error('DB error saving message:', err.message);
        // Only tell the sender — don't crash the whole server.
        socket.emit('error', { message: 'Failed to save message.' });
      }
    });

    // ── Disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`🔴 ${socket.user.username} disconnected (${reason})`);
      // Emit the *updated* size after this socket is removed.
      io.emit('online_count', io.sockets.sockets.size);
    });
  });
}