-- Migration 0007: simpan message id pesan pembuka (untuk unpin saat ganti hari).
ALTER TABLE bot_post ADD COLUMN pin_msg_id INTEGER NOT NULL DEFAULT 0;
