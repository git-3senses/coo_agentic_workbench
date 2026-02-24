/**
 * Knowledge Studio
 *
 * Users can generate private draft docs from uploaded sources + context.
 * Drafts are NOT part of kb_documents until approved & published.
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const axios = require('axios');

let multer;
let upload;
try {
    multer = require('multer');

    const uploadRoot = path.join(__dirname, '..', '..', 'uploads', 'studio');
    if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

    const storage = multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadRoot),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname || '').toLowerCase() || '.bin';
            const safeBase = path.basename(file.originalname || 'source', ext).replace(/[^a-zA-Z0-9_-]/g, '_');
            const studioDocId = String(req.params?.id || req.body?.studio_doc_id || '').trim() || `STUDIO-${crypto.randomUUID()}`;
            cb(null, `${studioDocId}__${safeBase}__${Date.now()}${ext}`);
        }
    });

    const fileFilter = (_req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase();
        // Keep this permissive; the generator can still ignore unsupported files.
        const allowed = ['.pdf', '.md', '.mmd', '.txt', '.eml'];
        if (!allowed.includes(ext)) {
            return cb(new Error('Unsupported file type. Allowed: PDF, Markdown (.md/.mmd), TXT, EML.'));
        }
        cb(null, true);
    };

    upload = multer({
        storage,
        fileFilter,
        limits: { fileSize: 50 * 1024 * 1024 }
    });
} catch (_e) {
    console.warn('[STUDIO] multer not installed. Studio upload endpoints will return 501.');
    upload = null;
}

function sha256File(filePath) {
    const hash = crypto.createHash('sha256');
    hash.update(fs.readFileSync(filePath));
    return hash.digest('hex');
}

function canAccessDoc(user, doc) {
    if (!user) return false;
    if (doc.owner_user_id && user.userId === doc.owner_user_id) return true;
    if (['APPROVER', 'COO', 'ADMIN'].includes(user.role)) return true;
    return false;
}

async function getStudioDoc(id) {
    const [rows] = await db.query('SELECT * FROM studio_documents WHERE id = ?', [id]);
    return rows[0] || null;
}

async function listFiles(studioDocId) {
    const [rows] = await db.query(
        'SELECT id, filename, file_path, mime_type, file_size, sha256, created_at FROM studio_document_files WHERE studio_doc_id = ? ORDER BY id ASC',
        [studioDocId]
    );
    return rows;
}

function maybeSchemaMissing(err) {
    const msg = String(err?.message || '');
    return (
        err?.code === 'ER_NO_SUCH_TABLE' ||
        msg.includes('studio_documents') ||
        msg.includes('studio_document_files')
    );
}

// ─── List ────────────────────────────────────────────────────────────────────

// GET /api/studio/docs?scope=my|submitted|all
router.get('/docs', requireAuth(), async (req, res) => {
    const scope = String(req.query.scope || 'my').toLowerCase();
    const user = req.user;

    try {
        let rows = [];
        if (scope === 'submitted') {
            if (!['APPROVER', 'COO', 'ADMIN'].includes(user.role)) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }
            [rows] = await db.query(
                "SELECT * FROM studio_documents WHERE status = 'SUBMITTED' ORDER BY updated_at DESC LIMIT 200"
            );
        } else if (scope === 'all') {
            if (!['APPROVER', 'COO', 'ADMIN'].includes(user.role)) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }
            [rows] = await db.query('SELECT * FROM studio_documents ORDER BY updated_at DESC LIMIT 500');
        } else {
            [rows] = await db.query('SELECT * FROM studio_documents WHERE owner_user_id = ? ORDER BY updated_at DESC LIMIT 200', [
                user.userId
            ]);
        }

        res.json({ docs: rows });
    } catch (err) {
        console.error('[STUDIO] list docs error:', err.message);
        if (maybeSchemaMissing(err)) {
            return res.status(409).json({
                error:
                    'Knowledge Studio DB schema is missing. Apply DB migrations: ' +
                    'database/migrations/014_add_knowledge_studio.sql and 015_expand_studio_documents.sql, then retry.'
            });
        }
        res.status(500).json({ error: 'Failed to list studio docs' });
    }
});

// ─── Create / Read ───────────────────────────────────────────────────────────

// POST /api/studio/docs
router.post('/docs', requireAuth(), async (req, res) => {
    const user = req.user;
    const title = String(req.body.title || '').trim();
    if (!title) return res.status(400).json({ error: 'title is required' });

    const id = `STUDIO-${crypto.randomUUID()}`;
    const description = req.body.description ? String(req.body.description).trim() : null;
    const docType = req.body.doc_type ? String(req.body.doc_type).trim().toUpperCase() : null;
    const uiCategory = req.body.ui_category ? String(req.body.ui_category).trim().toUpperCase() : null;
    const agentTarget = req.body.agent_target ? String(req.body.agent_target).trim() : null;
    const targetDatasetId = req.body.target_dataset_id ? String(req.body.target_dataset_id).trim() : null;

    try {
        await db.query(
            `INSERT INTO studio_documents (id, owner_user_id, title, description, doc_type, ui_category, agent_target, target_dataset_id, status, visibility)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', 'PRIVATE')`,
            [id, user.userId, title, description, docType, uiCategory, agentTarget, targetDatasetId]
        );
        res.json({ id });
    } catch (err) {
        console.error('[STUDIO] create doc error:', err.message);
        if (maybeSchemaMissing(err)) {
            return res.status(409).json({
                error:
                    'Knowledge Studio DB schema is missing. Apply DB migrations: ' +
                    'database/migrations/014_add_knowledge_studio.sql and 015_expand_studio_documents.sql, then retry.'
            });
        }
        res.status(500).json({ error: 'Failed to create studio doc' });
    }
});

// PATCH /api/studio/docs/:id — update draft metadata/text (owner or approver+)
router.patch('/docs/:id', requireAuth(), async (req, res) => {
    try {
        const doc = await getStudioDoc(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Not found' });
        if (doc.owner_user_id !== req.user.userId && !['APPROVER', 'COO', 'ADMIN'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        if (doc.status !== 'DRAFT') return res.status(400).json({ error: 'Only DRAFT can be edited' });

        const patch = {
            title: req.body.title ? String(req.body.title).trim() : null,
            description: req.body.description !== undefined ? String(req.body.description || '').trim() || null : null,
            doc_type: req.body.doc_type ? String(req.body.doc_type).trim().toUpperCase() : null,
            ui_category: req.body.ui_category ? String(req.body.ui_category).trim().toUpperCase() : null,
            agent_target: req.body.agent_target !== undefined ? (String(req.body.agent_target || '').trim() || null) : null,
            target_dataset_id: req.body.target_dataset_id !== undefined ? (String(req.body.target_dataset_id || '').trim() || null) : null,
            generated_markdown: req.body.generated_markdown !== undefined ? String(req.body.generated_markdown || '') : null,
        };

        const sets = [];
        const vals = [];
        for (const [k, v] of Object.entries(patch)) {
            if (v === null) continue;
            sets.push(`${k} = ?`);
            vals.push(v);
        }
        if (!sets.length) return res.json({ ok: true });
        vals.push(doc.id);
        await db.query(`UPDATE studio_documents SET ${sets.join(', ')} WHERE id = ?`, vals);
        const updated = await getStudioDoc(doc.id);
        res.json({ doc: updated });
    } catch (err) {
        console.error('[STUDIO] patch error:', err.message);
        res.status(500).json({ error: 'Failed to update draft' });
    }
});

// GET /api/studio/docs/:id
router.get('/docs/:id', requireAuth(), async (req, res) => {
    try {
        const doc = await getStudioDoc(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Not found' });
        if (!canAccessDoc(req.user, doc)) return res.status(403).json({ error: 'Insufficient permissions' });
        const files = await listFiles(doc.id);
        res.json({ doc, files });
    } catch (err) {
        console.error('[STUDIO] get doc error:', err.message);
        if (maybeSchemaMissing(err)) {
            return res.status(409).json({
                error:
                    'Knowledge Studio DB schema is missing. Apply DB migrations: ' +
                    'database/migrations/014_add_knowledge_studio.sql and 015_expand_studio_documents.sql, then retry.'
            });
        }
        res.status(500).json({ error: 'Failed to load studio doc' });
    }
});

// ─── Upload Sources ──────────────────────────────────────────────────────────

const uploadMany = upload ? upload.array('files', 20) : null;

// POST /api/studio/docs/:id/upload
router.post('/docs/:id/upload', requireAuth(), async (req, res) => {
    if (!uploadMany) return res.status(501).json({ error: 'File upload not available. Install server dependency: multer' });

    uploadMany(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
        const files = req.files || [];
        if (!files.length) return res.status(400).json({ error: 'No files uploaded' });

        try {
            const doc = await getStudioDoc(req.params.id);
            if (!doc) return res.status(404).json({ error: 'Not found' });
            if (doc.owner_user_id !== req.user.userId && !['APPROVER', 'COO', 'ADMIN'].includes(req.user.role)) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }
            if (doc.status !== 'DRAFT') {
                return res.status(400).json({ error: 'Uploads are only allowed while status is DRAFT' });
            }

            for (const f of files) {
                const relPath = path.posix.join('uploads', 'studio', path.basename(f.path));
                const hash = sha256File(f.path);
                await db.query(
                    `INSERT INTO studio_document_files (studio_doc_id, filename, file_path, mime_type, file_size, sha256)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [doc.id, f.originalname, relPath, f.mimetype || null, f.size || null, hash]
                );
            }

            const out = await listFiles(doc.id);
            res.json({ files: out });
        } catch (e) {
            console.error('[STUDIO] upload error:', e.message);
            res.status(500).json({ error: 'Failed to store uploaded files' });
        }
    });
});

// GET /api/studio/docs/:id/files/:fileId
router.get('/docs/:id/files/:fileId', requireAuth(), async (req, res) => {
    try {
        const doc = await getStudioDoc(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Not found' });
        if (!canAccessDoc(req.user, doc)) return res.status(403).json({ error: 'Insufficient permissions' });

        const [rows] = await db.query(
            'SELECT id, filename, file_path, mime_type FROM studio_document_files WHERE id = ? AND studio_doc_id = ?',
            [req.params.fileId, doc.id]
        );
        const file = rows[0];
        if (!file) return res.status(404).json({ error: 'File not found' });

        const abs = path.join(__dirname, '..', '..', file.file_path);
        if (!fs.existsSync(abs)) return res.status(404).json({ error: 'File missing on disk' });
        res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.filename)}"`);
        fs.createReadStream(abs).pipe(res);
    } catch (err) {
        console.error('[STUDIO] file serve error:', err.message);
        res.status(500).json({ error: 'Failed to serve file' });
    }
});

// DELETE /api/studio/docs/:id/files/:fileId
router.delete('/docs/:id/files/:fileId', requireAuth(), async (req, res) => {
    try {
        const doc = await getStudioDoc(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Not found' });
        if (doc.owner_user_id !== req.user.userId && !['APPROVER', 'COO', 'ADMIN'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        if (doc.status !== 'DRAFT') {
            return res.status(400).json({ error: 'Sources can only be removed while status is DRAFT' });
        }

        const [rows] = await db.query(
            'SELECT id, filename, file_path FROM studio_document_files WHERE id = ? AND studio_doc_id = ?',
            [req.params.fileId, doc.id]
        );
        const file = rows[0];
        if (!file) return res.status(404).json({ error: 'File not found' });

        await db.query('DELETE FROM studio_document_files WHERE id = ? AND studio_doc_id = ?', [file.id, doc.id]);

        try {
            const rel = String(file.file_path || '').trim();
            const abs = rel ? path.join(__dirname, '..', '..', rel) : null;
            const uploadRoot = path.join(__dirname, '..', '..', 'uploads', 'studio');
            if (abs && abs.startsWith(uploadRoot) && fs.existsSync(abs)) fs.unlinkSync(abs);
        } catch {
            // Best-effort: file might already be missing; DB is the source of truth.
        }

        const out = await listFiles(doc.id);
        res.json({ ok: true, files: out });
    } catch (err) {
        console.error('[STUDIO] delete file error:', err.message);
        res.status(500).json({ error: 'Failed to remove source file' });
    }
});

// ─── Generate Draft via Dify ─────────────────────────────────────────────────

async function extractSourceText(files) {
    let pdfParse;
    try {
        pdfParse = require('pdf-parse');
    } catch {
        pdfParse = null;
    }

    const parts = [];
    for (const f of files) {
        const abs = path.join(__dirname, '..', '..', f.file_path);
        if (!fs.existsSync(abs)) continue;

        const ext = path.extname(f.filename || '').toLowerCase();
        try {
            if (['.md', '.mmd', '.txt', '.eml'].includes(ext)) {
                const txt = fs.readFileSync(abs, 'utf8');
                parts.push(`## Source: ${f.filename}\n\n${txt}`);
            } else if (ext === '.pdf' && pdfParse) {
                const buf = fs.readFileSync(abs);
                const parsed = await pdfParse(buf);
                parts.push(`## Source: ${f.filename}\n\n${parsed.text || ''}`);
            } else if (ext === '.pdf' && !pdfParse) {
                parts.push(`## Source: ${f.filename}\n\n(PDF attached; text extraction not available on server)`);
            }
        } catch {
            parts.push(`## Source: ${f.filename}\n\n(Unable to read this source file)`);
        }
    }

    // Keep payload bounded
    const joined = parts.join('\n\n---\n\n');
    return joined.length > 80_000 ? joined.slice(0, 80_000) + '\n\n...(truncated)...' : joined;
}

// POST /api/studio/docs/:id/generate
router.post('/docs/:id/generate', requireAuth(), async (req, res) => {
    const agentId = String(req.body.agent_id || 'KB_SEARCH').trim();
    const instruction = String(req.body.instruction || '').trim();
    const userContext = String(req.body.context || '').trim();

    try {
        const doc = await getStudioDoc(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Not found' });
        if (doc.owner_user_id !== req.user.userId && !['APPROVER', 'COO', 'ADMIN'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        if (doc.status !== 'DRAFT') {
            return res.status(400).json({ error: 'Generation is only allowed while status is DRAFT' });
        }

        const files = await listFiles(doc.id);
        const sourcesText = await extractSourceText(files);

        const prompt = [
            `You are drafting an internal Markdown document for a bank knowledge base user.`,
            `Return ONLY Markdown (no code fences around the whole answer).`,
            `Title: ${doc.title}`,
            doc.doc_type ? `Doc type: ${doc.doc_type}` : '',
            instruction ? `Instruction: ${instruction}` : '',
            userContext ? `User context:\n${userContext}` : '',
            sourcesText ? `Sources:\n${sourcesText}` : 'Sources: (none)',
            '',
            'If a flow/sequence is useful, include Mermaid blocks using ```mermaid fences.',
        ].filter(Boolean).join('\n\n');

        // Call our own Dify proxy (keeps keys on server)
        const resp = await axios.post(
            'http://127.0.0.1:' + (process.env.PORT || '3000') + '/api/dify/chat',
            {
                agent_id: agentId,
                query: prompt,
                inputs: { current_stage: 'knowledge_studio' },
                response_mode: 'blocking'
            },
            {
                headers: { Authorization: req.headers.authorization || '' },
                timeout: 180000
            }
        );

        const markdown = String(resp?.data?.answer || '').trim();
        const conversationId = resp?.data?.conversation_id || null;
        const meta = resp?.data?.metadata ? JSON.stringify(resp.data.metadata) : null;

        await db.query(
            `UPDATE studio_documents
             SET generated_markdown = ?, generation_agent_id = ?, generation_conversation_id = ?, generation_meta = ?
             WHERE id = ?`,
            [markdown, agentId, conversationId, meta, doc.id]
        );

        const updated = await getStudioDoc(doc.id);
        res.json({ doc: updated });
    } catch (err) {
        console.error('[STUDIO] generate error:', err.message);
        res.status(500).json({ error: 'Failed to generate draft' });
    }
});

// ─── Submit / Approve / Publish ──────────────────────────────────────────────

// POST /api/studio/docs/:id/submit
router.post('/docs/:id/submit', requireAuth(), async (req, res) => {
    try {
        const doc = await getStudioDoc(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Not found' });
        if (doc.owner_user_id !== req.user.userId) return res.status(403).json({ error: 'Only owner can submit' });
        if (doc.status !== 'DRAFT') return res.status(400).json({ error: 'Only DRAFT can be submitted' });
        await db.query("UPDATE studio_documents SET status='SUBMITTED', submitted_at=NOW() WHERE id=?", [doc.id]);
        res.json({ ok: true });
    } catch (err) {
        console.error('[STUDIO] submit error:', err.message);
        res.status(500).json({ error: 'Failed to submit' });
    }
});

// POST /api/studio/docs/:id/reject
router.post('/docs/:id/reject', requireAuth(), rbac('APPROVER', 'COO', 'ADMIN'), async (req, res) => {
    const reason = req.body.reason ? String(req.body.reason).trim() : null;
    try {
        const doc = await getStudioDoc(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Not found' });
        if (doc.status !== 'SUBMITTED') return res.status(400).json({ error: 'Only SUBMITTED can be rejected' });
        await db.query(
            "UPDATE studio_documents SET status='REJECTED', rejected_at=NOW(), rejected_by_user_id=?, rejection_reason=? WHERE id=?",
            [req.user.userId, reason, doc.id]
        );
        res.json({ ok: true });
    } catch (err) {
        console.error('[STUDIO] reject error:', err.message);
        res.status(500).json({ error: 'Failed to reject' });
    }
});

// POST /api/studio/docs/:id/approve-and-publish
router.post('/docs/:id/approve-and-publish', requireAuth(), rbac('APPROVER', 'COO', 'ADMIN'), async (req, res) => {
    try {
        const doc = await getStudioDoc(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Not found' });
        if (doc.status !== 'SUBMITTED') return res.status(400).json({ error: 'Only SUBMITTED can be approved' });

        const datasetId = String(req.body?.dataset_id || doc.target_dataset_id || '').trim();
        if (!datasetId) {
            return res.status(400).json({ error: 'dataset_id is required to publish (target Dify Knowledge Base UUID)' });
        }

        const agentTarget = req.body?.agent_target ? String(req.body.agent_target).trim() : (doc.agent_target ? String(doc.agent_target).trim() : null);

        const title = doc.title;
        const kbDocId = `KB-${crypto.randomUUID()}`;
        const uploadRoot = path.join(__dirname, '..', '..', 'uploads', 'kb');
        if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });
        const safeBase = title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80) || 'generated';
        const filename = `${kbDocId}__${safeBase}__${Date.now()}.md`;
        const abs = path.join(uploadRoot, filename);
        fs.writeFileSync(abs, doc.generated_markdown || '', 'utf8');
        const relPath = path.posix.join('uploads', 'kb', filename);
        const stat = fs.statSync(abs);
        const hash = sha256File(abs);

        const now = new Date();
        const docType = (doc.doc_type || 'WORKFLOW').toUpperCase();
        const uiCategory = doc.ui_category ? String(doc.ui_category).toUpperCase() : 'UNIVERSAL';

        // Push to Dify Knowledge Base (create_by_text) so agents can retrieve/ground on it.
        const apiKey = String(process.env.DIFY_DATASET_API_KEY || '').trim();
        const baseUrl = String(process.env.DIFY_API_BASE || 'https://api.dify.ai/v1').trim();
        let difyDocId = null;
        let difyError = null;
        if (apiKey) {
            try {
                const createResp = await axios.post(
                    `${baseUrl}/datasets/${encodeURIComponent(datasetId)}/document/create_by_text`,
                    {
                        name: title,
                        text: doc.generated_markdown || '',
                        indexing_technique: 'high_quality',
                        process_rule: { mode: 'automatic' }
                    },
                    { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 60_000 }
                );
                difyDocId = createResp?.data?.document?.id || createResp?.data?.id || createResp?.data?.document_id || null;
            } catch (e) {
                difyError = e?.response?.data ? JSON.stringify(e.response.data).slice(0, 800) : (e?.message || 'Dify upload failed');
            }
        } else {
            difyError = 'Missing server env: DIFY_DATASET_API_KEY';
        }

        await db.query(
            `INSERT INTO kb_documents
             (doc_id, filename, doc_type, embedding_id, last_synced,
              title, description, ui_category, agent_target, icon_name, display_date,
              source_url, file_path, mime_type, file_size, sha256, visibility)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'file-text', NULL, NULL, ?, 'text/markdown', ?, ?, 'INTERNAL')
             ON DUPLICATE KEY UPDATE
               filename=VALUES(filename),
               doc_type=VALUES(doc_type),
               last_synced=VALUES(last_synced),
               title=VALUES(title),
               description=VALUES(description),
               ui_category=COALESCE(VALUES(ui_category), ui_category),
               agent_target=COALESCE(VALUES(agent_target), agent_target),
               file_path=VALUES(file_path),
               mime_type=VALUES(mime_type),
               file_size=VALUES(file_size),
               sha256=VALUES(sha256),
               visibility=VALUES(visibility)`,
            [
                kbDocId,
                filename,
                docType,
                difyDocId ? `${datasetId}:${difyDocId}` : `${datasetId}:UNKNOWN`,
                now,
                title,
                doc.description || null,
                uiCategory,
                agentTarget,
                relPath,
                stat.size,
                hash
            ]
        );

        await db.query(
            "UPDATE studio_documents SET status='APPROVED', approved_at=NOW(), approved_by_user_id=?, kb_doc_id=?, target_dataset_id=?, agent_target=? WHERE id=?",
            [req.user.userId, kbDocId, datasetId, agentTarget, doc.id]
        );

        res.json({ ok: true, kb_doc_id: kbDocId, dify_document_id: difyDocId, dify_error: difyError });
    } catch (err) {
        console.error('[STUDIO] approve/publish error:', err.message);
        res.status(500).json({ error: 'Failed to publish to KB' });
    }
});

module.exports = router;
