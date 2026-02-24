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
const axios = require('axios');

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

async function downloadToFile(url, destPath) {
    const resp = await axios.get(url, { responseType: 'stream', timeout: 60_000 });
    await new Promise((resolve, reject) => {
        const w = fs.createWriteStream(destPath);
        resp.data.pipe(w);
        w.on('finish', resolve);
        w.on('error', reject);
    });
    const stat = fs.statSync(destPath);
    return { size: stat.size, contentType: resp.headers?.['content-type'] };
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

// POST /api/kb/dify/sync — import PDFs from a Dify Dataset into kb_documents + local /uploads/kb
// Body: { dataset_id, ui_category, doc_type?, agent_target?, icon_name?, visibility? }
router.post('/dify/sync', requireAuth(), async (req, res) => {
    try {
        const apiKey = String(process.env.DIFY_DATASET_API_KEY || '').trim();
        const baseUrl = String(process.env.DIFY_API_BASE || 'https://api.dify.ai/v1').trim();
        if (!apiKey) return res.status(400).json({ error: 'Missing server env: DIFY_DATASET_API_KEY' });

        const datasetId = String(req.body?.dataset_id || '').trim();
        if (!datasetId) return res.status(400).json({ error: 'dataset_id is required' });

        const uiCategory = String(req.body?.ui_category || 'UNIVERSAL').trim().toUpperCase();
        const docType = String(req.body?.doc_type || 'REGULATORY').trim().toUpperCase();
        const agentTarget = req.body?.agent_target ? String(req.body.agent_target).trim() : null;
        const iconName = req.body?.icon_name ? String(req.body.icon_name).trim() : 'file-text';
        const visibility = String(req.body?.visibility || 'INTERNAL').trim().toUpperCase();

        const client = axios.create({
            baseURL: baseUrl,
            headers: { Authorization: `Bearer ${apiKey}` },
            timeout: 30_000
        });

        const collected = [];
        let page = 1;
        const limit = 50;
        for (;;) {
            const r = await client.get(`/datasets/${encodeURIComponent(datasetId)}/documents`, { params: { page, limit } });
            const items = r?.data?.data || r?.data?.documents || r?.data || [];
            if (!Array.isArray(items) || items.length === 0) break;
            collected.push(...items);
            if (items.length < limit) break;
            page += 1;
            if (page > 50) break; // safety cap
        }

        const results = { dataset_id: datasetId, imported: 0, skipped: 0, errors: 0, docs: [] };

        const uploadRoot = path.join(__dirname, '..', '..', 'uploads', 'kb');
        if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

        for (const doc of collected) {
            const difyDocId = String(doc?.id || doc?.document_id || doc?.documentId || '').trim();
            const name = String(doc?.name || doc?.title || doc?.file_name || difyDocId || 'document').trim();
            if (!difyDocId) {
                results.skipped += 1;
                continue;
            }

            try {
                // Fetch a fresh download URL for the document file
                const u = await client.get(`/datasets/${encodeURIComponent(datasetId)}/documents/${encodeURIComponent(difyDocId)}/upload-file`);
                const data = u?.data?.data || u?.data || {};
                const downloadUrl = String(data?.download_url || data?.downloadUrl || data?.url || '').trim();
                const fileName = String(data?.name || data?.file_name || `${name}.pdf`).trim();

                if (!downloadUrl) {
                    results.skipped += 1;
                    results.docs.push({ doc_id: `DIFY-${difyDocId}`, title: name, status: 'SKIPPED', reason: 'No download_url' });
                    continue;
                }

                const ext = path.extname(fileName).toLowerCase() || '.pdf';
                if (ext !== '.pdf') {
                    results.skipped += 1;
                    results.docs.push({ doc_id: `DIFY-${difyDocId}`, title: name, status: 'SKIPPED', reason: 'Not a PDF' });
                    continue;
                }

                const stableDocId = `DIFY-${difyDocId}`;
                const safeBase = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_') || 'document';
                const localName = `${stableDocId}__${safeBase}__${Date.now()}${ext}`;
                const absPath = path.join(uploadRoot, localName);
                const relPath = path.posix.join('uploads', 'kb', localName);

                const dl = await downloadToFile(downloadUrl, absPath);
                const sha256 = sha256File(absPath);
                const now = new Date();

                await db.query(
                    `INSERT INTO kb_documents
                     (doc_id, filename, doc_type, embedding_id, last_synced,
                      title, description, ui_category, agent_target, icon_name, display_date,
                      source_url, file_path, mime_type, file_size, sha256, visibility)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                       filename=VALUES(filename),
                       doc_type=VALUES(doc_type),
                       embedding_id=VALUES(embedding_id),
                       last_synced=VALUES(last_synced),
                       title=VALUES(title),
                       description=VALUES(description),
                       ui_category=COALESCE(VALUES(ui_category), ui_category),
                       agent_target=COALESCE(VALUES(agent_target), agent_target),
                       icon_name=COALESCE(VALUES(icon_name), icon_name),
                       source_url=COALESCE(VALUES(source_url), source_url),
                       file_path=VALUES(file_path),
                       mime_type=VALUES(mime_type),
                       file_size=VALUES(file_size),
                       sha256=VALUES(sha256),
                       visibility=VALUES(visibility)`,
                    [
                        stableDocId,
                        fileName,
                        docType,
                        `${datasetId}:${difyDocId}`,
                        now,
                        name.replace(/\.pdf$/i, ''),
                        `Synced from Dify dataset ${datasetId}`,
                        uiCategory,
                        agentTarget,
                        iconName,
                        null,
                        null,
                        relPath,
                        (dl.contentType || 'application/pdf').split(';')[0],
                        dl.size,
                        sha256,
                        visibility
                    ]
                );

                results.imported += 1;
                results.docs.push({ doc_id: stableDocId, title: name, status: 'IMPORTED' });
            } catch (e) {
                results.errors += 1;
                results.docs.push({ doc_id: `DIFY-${difyDocId}`, title: name, status: 'ERROR', reason: String(e?.message || e) });
            }
        }

        res.json(results);
    } catch (err) {
        const msg = String(err?.message || '');
        if (msg.includes('Unknown column') || msg.includes('ER_BAD_FIELD_ERROR')) {
            return res.status(400).json({
                error: 'KB schema missing file/link columns. Apply DB migration database/migrations/011_add_kb_document_files.sql and retry.'
            });
        }
        console.error('[KB] Dify sync error:', err.message);
        res.status(500).json({ error: 'Failed to sync from Dify dataset' });
    }
});

module.exports = router;
