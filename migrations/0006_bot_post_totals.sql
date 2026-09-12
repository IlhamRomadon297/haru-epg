-- Migration 0006: akumulasi hasil posting untuk pesan rekap akhir.
ALTER TABLE bot_post ADD COLUMN posted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bot_post ADD COLUMN failed INTEGER NOT NULL DEFAULT 0;
