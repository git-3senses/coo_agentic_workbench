/**
 * Knowledge Base Document Files
 *
 * Stores and serves KB PDFs so:
 *  - Users can view PDFs inside the UI
 *  - Agents can be asked questions about the same docs (docs must also be uploaded to Dify datasets)
 *
 * Design:
 *  - kb_documents remains the registry table (metadata + optional file/link fields)
 *  - Files are stored under /uploads/kb (local FS; prod can later migrate to S3/R2)
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');

// ─── Storage ────────────────────────────────────────────────────────────────

let multer;
let upload;
try {
    multer = require('multer');

    const uploadRoot = path.join(__dirname, '..', '..', 'uploads', 'kb');
    if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

    const storage = multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadRoot),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname || '').toLowerCase() || '.pdf';
            const safeBase = path.basename(file.originalname || 'document', ext).replace(/[^a-zA-Z0-9_-]/g, '_');
            const docId = String(req.body.doc_id || '').trim() || `KB-${crypto.randomUUID()}`;
            // Keep a timestamp to avoid collisions if doc_id reused intentionally
            cb(null, `${docId}__${safeBase}__${Date.now()}${ext}`);
        }
    });

    const fileFilter = (_req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase();
        if (ext !== '.pdf') return cb(new Error('Only PDF uploads are supported for Knowledge Base.'));
        cb(null, true);
    };

    upload = multer({
        storage,
        fileFilter,
        limits: { fileSize: 50 * 1024 * 1024 } // 50MB
    });
} catch (e) {
    console.warn('[KB] multer not installed. KB upload endpoints will return 501.');
    upload = null;
}

function sha256File(filePath) {
    const hash = crypto.createHash('sha256');
    const data = fs.readFileSync(filePath);
    hash.update(data);
    return hash.digest('hex');
}

function resolveKbPath(relPath) {
    const baseDir = path.join(__dirname, '..', '..'); // repo root
    const abs = path.resolve(baseDir, relPath);
    const uploadsDir = path.resolve(baseDir, 'uploads');
    if (!abs.startsWith(uploadsDir + path.sep) && abs !== uploadsDir) {
        throw new Error('Invalid file path');
    }
    return abs;
}

// ─── Routes ────────────────────────────────────────────────────────────────

// GET /api/kb/:docId — metadata for a KB doc (includes file/link fields)
router.get('/:docId', requireAuth(), async (req, res) => {
    try {
        const docId = String(req.params.docId);
        const [rows] = await db.query('SELECT * FROM kb_documents WHERE doc_id = ?', [docId]);
        if (!rows.length) return res.status(404).json({ error: 'KB document not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('[KB] Fetch error:', err.message);
        res.status(500).json({ error: 'Failed to fetch KB document' });
    }
});

// GET /api/kb/:docId/file — stream PDF (or redirect to source_url if no local file)
router.get('/:docId/file', requireAuth(), async (req, res) => {
    try {
        const docId = String(req.params.docId);
        const [rows] = await db.query(
            'SELECT doc_id, filename, file_path, mime_type, source_url FROM kb_documents WHERE doc_id = ?',
            [docId]
        );
        if (!rows.length) return res.status(404).json({ error: 'KB document not found' });
        const doc = rows[0];

        if (doc.file_path) {
            const abs = resolveKbPath(String(doc.file_path));
            if (!fs.existsSync(abs)) return res.status(404).json({ error: 'File missing on server' });
            res.setHeader('Content-Type', doc.mime_type || 'application/pdf');
            // Inline so browser can view
            res.setHeader('Content-Disposition', `inline; filename="${doc.filename || `${doc.doc_id}.pdf`}"`);
            return res.sendFile(abs);
        }

        if (doc.source_url) {
            return res.redirect(302, String(doc.source_url));
        }

        return res.status(404).json({ error: 'No file or source URL for this KB document' });
    } catch (err) {
        console.error('[KB] File serve error:', err.message);
        res.status(500).json({ error: 'Failed to serve KB document file' });
    }
});

// POST /api/kb/upload — upload a PDF and register/update kb_documents
const uploadHandler = upload ? upload.single('file') : null;

router.post('/upload', requireAuth(), (req, res) => {
    if (!uploadHandler) {
        return res.status(501).json({ error: 'File upload not available. Install server dependency: multer' });
    }

    uploadHandler(req, res, async (err) => {
        if (err) {
            if (multer && err instanceof multer.MulterError) return res.status(400).json({ error: err.message });
            return res.status(400).json({ error: err.message || 'Upload failed' });
        }

        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        try {
            const now = new Date();
            const docId = String(req.body.doc_id || '').trim() || `KB-${crypto.randomUUID()}`;
            const title = String(req.body.title || '').trim() || path.basename(req.file.originalname, path.extname(req.file.originalname));
            const description = String(req.body.description || '').trim() || null;
            const docType = String(req.body.doc_type || 'REGULATORY').trim().toUpperCase();
            const uiCategory = req.body.ui_category ? String(req.body.ui_category).trim().toUpperCase() : null;
            const agentTarget = req.body.agent_target ? String(req.body.agent_target).trim() : null;
            const iconName = req.body.icon_name ? String(req.body.icon_name).trim() : 'file-text';
            const displayDate = req.body.display_date ? String(req.body.display_date).trim() : null;
            const visibility = req.body.visibility ? String(req.body.visibility).trim().toUpperCase() : 'INTERNAL';
            const sourceUrl = req.body.source_url ? String(req.body.source_url).trim() : null;

            const relPath = path.posix.join('uploads', 'kb', path.basename(req.file.path));
            const hash = sha256File(req.file.path);

            try {
                await db.query(
                `INSERT INTO kb_documents
                 (doc_id, filename, doc_type, embedding_id, last_synced,
                  title, description, ui_category, agent_target, icon_name, display_date,
                  source_url, file_path, mime_type, file_size, sha256, visibility)
                 VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   filename=VALUES(filename),
                   doc_type=VALUES(doc_type),
                   last_synced=VALUES(last_synced),
                   title=VALUES(title),
                   description=VALUES(description),
                   ui_category=COALESCE(VALUES(ui_category), ui_category),
                   agent_target=COALESCE(VALUES(agent_target), agent_target),
                   icon_name=COALESCE(VALUES(icon_name), icon_name),
                   display_date=COALESCE(VALUES(display_date), display_date),
                   source_url=COALESCE(VALUES(source_url), source_url),
                   file_path=VALUES(file_path),
                   mime_type=VALUES(mime_type),
                   file_size=VALUES(file_size),
                   sha256=VALUES(sha256),
                   visibility=VALUES(visibility)`,
                [
                    docId,
                    req.file.originalname,
                    docType,
                    now,
                    title,
                    description,
                    uiCategory,
                    agentTarget,
                    iconName,
                    displayDate,
                    sourceUrl,
                    relPath,
                    req.file.mimetype || 'application/pdf',
                    req.file.size,
                    hash,
                    visibility
                ]
                );
            } catch (schemaErr) {
                const msg = String(schemaErr?.message || '');
                if (msg.includes('Unknown column') || msg.includes('ER_BAD_FIELD_ERROR')) {
                    return res.status(400).json({
                        error: 'KB schema missing file/link columns. Apply DB migration database/migrations/011_add_kb_document_files.sql and retry.'
                    });
                }
                throw schemaErr;
            }

            res.json({
                status: 'UPLOADED',
                doc_id: docId,
                title,
                filename: req.file.originalname,
                file_path: relPath,
                sha256: hash,
                view_url: `/api/kb/${encodeURIComponent(docId)}/file`
            });
        } catch (dbErr) {
            console.error('[KB] DB upsert failed:', dbErr.message);
            res.status(500).json({ error: 'Failed to register KB document in DB' });
        }
    });
});

module.exports = router;
