import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

import express from "express";
import fs from "fs";
import os from "os";
import session from "express-session";
import swaggerUi from "swagger-ui-express";
import yaml from "yaml";
import { getHermesClient } from "./src/hermes/HermesClient.js";
import { ChatService } from "./src/chat/ChatService.js";
import { SessionsService } from "./src/sessions/SessionsService.js";
import { ProfilesService } from "./src/profiles/ProfilesService.js";
import { audioFileManager } from "./src/audio/AudioFileManager.js";
import { htmlRenderer } from "./src/html/HTMLRenderer.js";
import { htmlRepository } from "./src/html/HTMLRepository.js";

const app = express();

// Load Swagger spec from YAML file
const swaggerFile = path.join(__dirname, "swagger.yaml");

function loadSwaggerSpec() {
  const content = fs.readFileSync(swaggerFile, "utf8");
  console.log("[SWAGGER] Loaded file:", swaggerFile, "length:", content.length);
  const spec = yaml.parse(content);
  console.log("[SWAGGER] Paths found:", Object.keys(spec.paths).length, Object.keys(spec.paths));
  return spec;
}

let swaggerSpec = loadSwaggerSpec();
app.get("/swagger.json", (req, res) => {
  console.log("[SWAGGER] /swagger.json hit");
  const spec = loadSwaggerSpec();
  res.setHeader("Content-Type", "application/json");
  res.send(spec);
});

app.get("/test-swagger", (req, res) => {
  console.log("[TEST] /test-swagger hit");
  res.json({ ok: true });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const IGNORED_DIRS = [".obsidian", ".trash", ".git", "node_modules"];
const VAULT = process.env.VAULT_PATH || "/vault";
const PUBLIC = path.join(__dirname, "../public");
const DATA_DIR = path.join(__dirname, "../data");
const PRESETS_FILE = path.join(DATA_DIR, "presets.json");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));
// Midleware de auth e session
function authPage(req, res, next) {
  if (req.session?.auth) return next();
  return res.redirect("/login");
}

function authApi(req, res, next) {
  if (req.session && req.session.auth) return next();
  res.status(401).json({ error: "unauthorized" });
}

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);
function CreateTask(content, task, line) {
  var newLine = "";

  if(task.recurringRule == false){
        newLine = `- [ ] ${task.displayText} ${task.tags} ${task.recurring? `🔁 ${task.recurringRule}` : ""} ${task.due? `📅 ${task.due}` : ""} ${task.scheduled? `⏳ ${task.scheduled}` : ""}`.trim();
  }else{
    if(task.recurringRule.includes("every day")){
      let nextDate = new Date(task.due || task.scheduled);
      nextDate.setDate(nextDate.getDate() + 1);
      task.scheduled = nextDate.toISOString().split("T")[0];

      newLine = `- [ ] ${task.displayText } ${task.tags} 🔁 ${task.recurringRule} ${task.scheduled? `⏳ ${task.scheduled}` : ""}`.trim();
  }
  if(task.recurringRule.includes("every week")){
      let nextDate = new Date(task.due || task.scheduled);
      nextDate.setDate(nextDate.getDate() + 7);
      task.scheduled = nextDate.toISOString().split("T")[0];
      newLine = `- [ ] ${task.displayText } ${task.tags} 🔁 ${task.recurringRule} ${task.scheduled? `⏳ ${task.scheduled}` : ""}`.trim();
  }
  if(task.recurringRule.includes("days")){
      let nextDate = new Date(task.due || task.scheduled);
      var daysMatch = task.recurringRule.match(/every (\d+) days/);
      var daysInterval = daysMatch ? parseInt(daysMatch[1], 10) : 1;
      nextDate.setDate(nextDate.getDate() + daysInterval);
      task.scheduled = nextDate.toISOString().split("T")[0];

      newLine = `- [ ] ${task.displayText } ${task.tags} 🔁 ${task.recurringRule} ${task.scheduled? `⏳ ${task.scheduled}` : ""}`.trim();
  }
 }

  content.splice(line, 0, newLine);
  }

//app.use(express.static(path.join(process.cwd(), "public"), requireAuth));
app.get("/", authPage, (req, res) => {
  res.sendFile(path.join(process.cwd(), "public/index.html"));
});
app.use("/download", authPage, express.static(path.join(VAULT, "Downloads")));
app.get("/files", authPage, (req, res) => {
  res.sendFile(path.join(process.cwd(), "public/files.html"));
});
app.get("/scheduled", authPage, (req, res) => {
  res.sendFile(path.join(process.cwd(),"public/scheduled.html"));
});
app.get("/tasks", authPage, (req, res) => {
  res.sendFile(path.join(process.cwd(),"public/tasks.html"));
});
/**
 * @swagger
 * /login:
 *   get:
 *     summary: Get login page
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Returns login HTML page
 *       302:
 *         description: Redirects to home if already authenticated
 */
app.get("/login", (req, res) => {
  if (req.session.auth) return res.redirect("/");
  res.sendFile(path.join(process.cwd(), "public/login.html"));
});
/**
 * @swagger
 * /vaults:
 *   get:
 *     summary: List configured vaults
 *     tags: [Vaults]
 *     responses:
 *       200:
 *         description: Array of vault objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vault'
 */
app.get("/vaults", (req, res) => {
  let vaults = process.env.VAULT_PATH
  let v = vaults.split(',').map((v,index)=>{
    return {
      id: index,
      name: v.split('\\').at(-1),
      fullPath: v
    }
  })
  res.send(v);
});


function parseTask(line) {
  if (!line || typeof line !== "string") return null;

  var task = {};

  task.done = line.indexOf("[x]") !== -1;

  // remove "- [ ] " ou "- [x] "
  var rawText = line.replace(/- \[[ x]\]\s*/, "");

  task.text = rawText;

  // ---------- TAGS ----------
  var tagMatches = rawText.match(/#([a-zA-Z0-9_-]+)/g);
  task.tags = tagMatches
    ? tagMatches.map(function (t) { return `#${t.substring(1)}` })
    : [];

  // ---------- METADADOS (USAR rawText!) ----------

  // 📅 due
  var dueMatch = rawText.match(/📅\s*(\d{4}-\d{2}-\d{2})/);
  task.due = dueMatch ? dueMatch[1] : null;

  // ⏳ scheduled
  var schedMatch = rawText.match(/⏳\s*(\d{4}-\d{2}-\d{2})/);
  task.scheduled = schedMatch ? schedMatch[1] : null;

  // ✅ done date
  var doneMatch = rawText.match(/✅\s*(\d{4}-\d{2}-\d{2})/);
  task.doneDate = doneMatch ? doneMatch[1] : null;

  // 🔁 recurring
  task.recurring = rawText.indexOf("🔁") !== -1;

  task.recurringRule = null;
  if (task.recurring) {
    var recurMatch = rawText.match(/🔁\s*(.*?)(?:\s*📅|\s*⏳|\s*✅|$)/);
    task.recurringRule = recurMatch ? recurMatch[1].trim() : null;
  }  
  // ---------- TEXTO HUMANO ----------
  var displayText = rawText
    .replace(/#[a-zA-Z0-9_-]+/g, "")
    .replace(/🔁.*|📅.*|⏳.*|✅.*/g, "")
    .trim();

  task.displayText = displayText;
  return task;
}

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Authenticate user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       302:
 *         description: Redirects to home on success, sets session cookie
 *       401:
 *         description: Invalid credentials, redirects to login with error
 */
app.post("/login", (req, res) => { 
  const { user, pass } = req.body;
  if (user === process.env.APP_USER && pass === process.env.APP_PASSWORD) {
    
    req.session.auth = true;
    return res.redirect("/");
  }
  res.redirect("/login?error=1");
});

/**
 * @swagger
 * /logout:
 *   get:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       302:
 *         description: Destroys session and redirects to login
 */
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
});

/**
 * @typedef {import('../shared-types/file-types').FileNode} FileNode
 * @typedef {import('../shared-types/file-types').FileTree} FileTree
 * @typedef {import('../shared-types/file-types').ApiFilesResponse} ApiFilesResponse
 */

/**
 * @swagger
 * /api/files:
 *   get:
 *     summary: Get file tree or flat file list
 *     tags: [Files]
 *     security:
 *       - sessionAuth: []
 *     parameters:
*       - in: query
*         name: flat
*         schema:
*           type: boolean
*         description: "Return flat file list instead of tree"
*       - in: query
*         name: vault
*         schema:
*           type: integer
*         description: "Vault index (default 0)"
 *     responses:
 *       200:
 *         description: File tree or flat list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiFilesResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
app.get("/api/files", authApi, (req, res) => {
  const flat = req.query.flat === "true";
  const vaultIndex = req.query.vault != 'undefined'? req.query.vault : 0
  const ignoredDirs = new Set([
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    ".obsidian",
    ".trash",
  ]);

  function buildTree(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const nodes = [];

    for (const entry of entries) {
      if (ignoredDirs.has(entry.name) || entry.name.startsWith(".")) {
        continue;
      }

      const full = path.join(dir, entry.name);
      const relPath = path.relative(VAULT.split(',').at(vaultIndex), full);

      if (entry.isDirectory()) {
        const children = buildTree(full);
        if (children.length > 0) {
          nodes.push({
            type: "folder",
            name: entry.name,
            path: relPath,
            children,
          });
        }
      } else if (entry.name.endsWith(".md") || entry.name.endsWith(".pdf")) {
        nodes.push({
          type: "file",
          name: entry.name,
          path: relPath,
          extension: path.extname(entry.name).slice(1),
        });
      }
    }

    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return nodes;
  }

  const tree = buildTree(VAULT.split(',').at(vaultIndex));

  if (flat) {
    const files = [];
    function flatten(nodes) {
      for (const node of nodes) {
        if (node.type === "file") {
          files.push(node.path);
        } else if (node.children) {
          flatten(node.children);
        }
      }
    }
    flatten(tree);
    res.json({ files });
  } else {
    res.json({ tree });
  }
});
/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Scan and return all tasks from markdown files
 *     tags: [Tasks]
 *     security:
 *       - sessionAuth: []
*     parameters:
*       - in: query
*         name: vault
*         schema:
*           type: integer
*         description: "Vault index (default 0)"
 *     responses:
 *       200:
 *         description: Array of task objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Error scanning tasks
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get("/api/tasks", authApi, (req, res) => {
  try {
    const tasks = [];
    const vaultIndex = req.query.vault != 'undefined'? req.query.vault : 0

    function scan(dir) {
      fs.readdirSync(dir).forEach((file) => {
        const full = path.join(dir, file);

        if (
          fs.statSync(full).isDirectory() &&
          (file.startsWith(".") || IGNORED_DIRS.includes(file))
        ) {
          return;
        }

        if (fs.statSync(full).isDirectory()) {
          return scan(full);
        }

        if (!file.endsWith(".md")) return;

        const lines = fs.readFileSync(full, "utf8").split("\n");

        lines.forEach((line, index) => {
          if (!line.match(/- \[[ x]\]/)) return;

          // 🔹 parseTask já extrai tudo
          const parsed = parseTask(line);

          tasks.push({
            text: parsed.text,
            done: parsed.done,
            

            // datas (ISO ou null)
            due: parsed.due || null,
            scheduled: parsed.scheduled || null,
            doneDate: parsed.doneDate || null,

            // metadata
            tags: parsed.tags || [],
            recurring: parsed.recurring || false,
            recurringRule: parsed.recurringRule || null,

            // info do arquivo
            file: path.relative(VAULT.split(',').at(vaultIndex), full),
            line: index,
            vaultIndex: parseInt(vaultIndex),
          });
          // console.log(tasks);
        });
      });
    }    
    scan(VAULT.split(',').at(vaultIndex));
    res.json(tasks);
  } catch (e) {
    console.error("Error scanning tasks:", e);
    res.status(500).json({ error: e.message });
  }
});
/**
 * @swagger
 * /api/file-content:
 *   get:
 *     summary: Get file content by path
 *     tags: [Files]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Relative path to file
 *     responses:
 *       200:
 *         description: File content
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileContentResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: File not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get("/api/file-content", authApi, (req, res) => {
  const relPath = req.query.path;
  const safePath = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const fullPath = path.join(VAULT.split(',').at(vaultIndex), safePath);

  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: "File not found" });
  }
  const content = fs.readFileSync(fullPath, "utf8");


  res.json({ content });
});
/**
 * @swagger
 * /api/tasks/toggle:
 *   post:
 *     summary: Toggle task completion status
 *     tags: [Tasks]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskToggleRequest'
 *     responses:
 *       200:
 *         description: Task toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskToggleResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
app.post("/api/tasks/toggle", authApi, (req, res) => {
  const { file, line, vaultIndex } = req.body;
  const fullPath = path.join(VAULT.split(',').at(vaultIndex), file);
  const content = fs.readFileSync(fullPath, "utf8").split("\n");
  content[line] = content[line].includes("[x]")
    ? content[line].replace("[x]", "[ ]")
    : content[line].replace("[ ]", "[x]") + ` ✅ ${new Date().toISOString().split("T")[0]}`;

  if (content[line].includes("🔁")) {
    const task = parseTask(content[line]);

    CreateTask(content, task, content.length);

  }
  fs.writeFileSync(fullPath, content.join("\n"));
  res.json({ ok: true });
});

// Helper functions for presets
function loadPresets() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(PRESETS_FILE)) {
      fs.writeFileSync(PRESETS_FILE, JSON.stringify({ presets: [] }, null, 2));
      return { presets: [] };
    }
    const data = fs.readFileSync(PRESETS_FILE, "utf8");
    return JSON.parse(data);
  } catch (e) {
    console.error("Error loading presets:", e);
    return { presets: [] };
  }
}

function savePresets(presets) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PRESETS_FILE, JSON.stringify({ presets }, null, 2));
  } catch (e) {
    console.error("Error saving presets:", e);
  }
}

// Presets API endpoints
/**
 * @swagger
 * /api/presets:
 *   get:
 *     summary: Get all presets
 *     tags: [Presets]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Presets object with array
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PresetsResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
app.get("/api/presets", authApi, (req, res) => {
  const data = loadPresets();
  res.json(data);
});

/**
 * @swagger
 * /api/presets:
 *   post:
 *     summary: Create a new preset
 *     tags: [Presets]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePresetRequest'
 *     responses:
 *       201:
 *         description: Preset created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 preset:
 *                   $ref: '#/components/schemas/Preset'
 *       400:
 *         description: Name is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
app.post("/api/presets", authApi, (req, res) => {
  const { name, files, vaultIndex, order } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }
  const data = loadPresets();
  const maxOrder = data.presets.length > 0 ? Math.max(...data.presets.map(p => p.order || 0)) : 0;
  const newPreset = {
    id: Date.now().toString(),
    name: name.trim(),
    files: files || [],
    vaultIndex: vaultIndex !== undefined ? vaultIndex : 0,
    order: order !== undefined ? order : maxOrder + 1,
    createdAt: new Date().toISOString(),
  };
  data.presets.push(newPreset);
  savePresets(data.presets);
  res.status(201).json({ preset: newPreset });
});

/**
 * @swagger
 * /api/presets/{id}:
 *   delete:
 *     summary: Delete a preset
 *     tags: [Presets]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Preset deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Preset not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.delete("/api/presets/:id", authApi, (req, res) => {
  const { id } = req.params;
  const data = loadPresets();
  const index = data.presets.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Preset not found" });
  }
  data.presets.splice(index, 1);
  savePresets(data.presets);
  res.json({ ok: true });
});

/**
 * @swagger
 * /api/presets/{id}:
 *   put:
 *     summary: Update a preset
 *     tags: [Presets]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePresetRequest'
 *     responses:
 *       200:
 *         description: Preset updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 preset:
 *                   $ref: '#/components/schemas/Preset'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Preset not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.put("/api/presets/:id", authApi, (req, res) => {
  const { id } = req.params;
  const { name, vaultIndex, order } = req.body;
  const data = loadPresets();
  const index = data.presets.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Preset not found" });
  }
  if (name !== undefined) data.presets[index].name = name.trim();
  if (vaultIndex !== undefined) data.presets[index].vaultIndex = vaultIndex;
  if (order !== undefined) data.presets[index].order = order;
  savePresets(data.presets);
  res.json({ preset: data.presets[index] });
});

/**
 * @swagger
 * /api/presets/reorder:
 *   put:
 *     summary: Reorder presets
 *     tags: [Presets]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReorderPresetsRequest'
 *     responses:
 *       200:
 *         description: Presets reordered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       400:
 *         description: presetIds array required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
app.put("/api/presets/reorder", authApi, (req, res) => {
  const { presetIds } = req.body;
  if (!Array.isArray(presetIds)) {
    return res.status(400).json({ error: "presetIds array required" });
  }
  const data = loadPresets();
  presetIds.forEach((id, index) => {
    const preset = data.presets.find((p) => p.id === id);
    if (preset) preset.order = index;
  });
  savePresets(data.presets);
  res.json({ ok: true });
});

/**
 * @swagger
 * /api/presets/{id}/files:
 *   put:
 *     summary: Update preset files
 *     tags: [Presets]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PresetFilesRequest'
 *     responses:
 *       200:
 *         description: Preset files updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 preset:
 *                   $ref: '#/components/schemas/Preset'
 *       400:
 *         description: files array required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Preset not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.put("/api/presets/:id/files", authApi, (req, res) => {
  const { id } = req.params;
  const { files } = req.body;
  if (!Array.isArray(files)) {
    return res.status(400).json({ error: "files array required" });
  }
  const data = loadPresets();
  const index = data.presets.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Preset not found" });
  }
  data.presets[index].files = files.map((f, i) => typeof f === 'string' ? { path: f, order: i } : { path: f.path, order: i !== undefined ? i : f.order });
  savePresets(data.presets);
  res.json({ preset: data.presets[index] });
});

/**
 * @swagger
 * /download:
 *   get:
 *     summary: Download a file from vault
 *     tags: [Files]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Relative path to file
*       - in: query
*         name: vault
*         schema:
*           type: integer
*         description: "Vault index (default 0)"
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Missing path
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: File not found
 *       500:
 *         description: Error processing download
 */
app.get("/download", authApi, (req, res) => {
  const relPath = req.query.path;
  if (!relPath) {
    return res.status(400).send("Missing path");
  }
  const vaultIndex = req.query.vault != "undefined" ? req.query.vault : 0;
  const vaultPath = path.resolve(VAULT.split(",").at(vaultIndex));
  const safePath = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const fullPath = path.join(vaultPath, safePath);

  if (!fullPath.startsWith(vaultPath) || !fs.existsSync(fullPath)) {
    return res.status(404).send("File not found");
  }

  const fileName = path.basename(fullPath);

  res.download(fullPath, fileName, (err) => {
    if (err) {
      console.error("Erro no download:", err);
      if (!res.headersSent) {
        res.status(500).send("Erro ao processar download");
      }
    }
  });
});
/**
 * @swagger
 * /api/newNote:
 *   post:
 *     summary: Create or append to daily note
 *     tags: [Notes]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewNoteRequest'
 *     responses:
 *       200:
 *         description: Note created or appended
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NewNoteResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Error creating note
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post("/api/newNote", authApi, (req, res) => {
  try{
  const { noteName, timestamp, text } = req.body;  
  const safeNoteName = noteName.replace(/[^a-zA-Z0-9-_ ]/g, "");
  const fullPath = path.join(VAULT.split(',').at(vaultIndex),'Dailynotes', `${safeNoteName}.md`);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, "utf8").split("\n");   
    
    fs.appendFileSync(fullPath, `\n ## ${timestamp}`);
    fs.appendFileSync(fullPath, `\n ${text}\n`);
    
    return res.status(200).json({ ok: `Adicionado a nota existente no arquivo ${noteName}.md` });
  }else{
  fs.writeFileSync(fullPath, `## ${timestamp}\n${text}`);
  res.status(200).json({ ok: `Arquivo criado com nova nota em ${noteName}.md` });
  }
}catch(error){
  res.status(500).json({ error: "Erro ao criar a nota" });
}
});

// ===== HERMES API ENDPOINTS =====

// Request logging middleware for Hermes routes
function logHermesRequest(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[HERMES-API] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
}

/**
 * @swagger
 * /chat:
 *   post:
 *     summary: Send chat message to Hermes (streaming)
 *     description: Starts a streaming chat session. Returns sessionId immediately. Frontend should poll GET /messages/{sessionId} for HTML updates.
 *     tags: [Chat]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [input]
 *             properties:
 *               input:
 *                 type: string
 *                 description: User message
 *               sessionId:
 *                 type: string
 *                 description: Optional session ID
 *     responses:
 *       200:
 *         description: Chat started. Use sessionId to poll for HTML updates.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                 html:
 *                   type: string
 *                   description: Current HTML snapshot
 *                 audio:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       url:
 *                         type: string
 *                       text:
 *                         type: string
 *                       duration:
 *                         type: integer
 *                 streaming:
 *                   type: boolean
 *                   description: Whether streaming is still in progress
 *       400:
 *         description: Invalid payload
 *       404:
 *         description: Session not found
 *       500:
 *         description: Hermes API error
 */
app.post("/chat", authApi, logHermesRequest, express.json(), async (req, res) => {
  try {
    const { input, sessionId, audio } = req.body;
    
    if (audio) {
      const audioBuffer = Buffer.from(audio, "base64");
      const tempDir = path.join(os.tmpdir(), "hermes-audio-uploads");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      const tempPath = path.join(tempDir, `audio_${Date.now()}.webm`);
      fs.writeFileSync(tempPath, audioBuffer);
      const result = await chatService.processChat(tempPath, sessionId || null);
      return res.json(result);
    }
    
    if (!input || typeof input !== "string") {
      return res.status(400).json({ error: "Input is required and must be a string" });
    }
    
    const result = await chatService.processChat(input, sessionId || null);
    return res.json(result);
  } catch (err) {
    console.error("Chat error:", err);
    if (err.status === 404) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

/**
 * @swagger
 * /messages/{sessionId}:
 *   get:
 *     summary: Poll for current chat HTML (streaming updates)
 *     description: Frontend polls this endpoint every 500ms while streaming is active. Returns HTML content and X-Streaming header.
 *     tags: [Chat]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID returned from POST /chat
 *     responses:
 *       200:
 *         description: Current HTML content for the session
 *         headers:
 *           X-Streaming:
 *             description: Whether streaming is still in progress (true/false)
 *             schema:
 *               type: string
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       500:
 *         description: Error loading messages
 */
app.get("/messages/:sessionId", authApi, logHermesRequest, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const html = await htmlRepository.fetchAndBuildHtml(sessionId, htmlRenderer);
    const streaming = htmlRepository.isStreaming(sessionId);
    res.setHeader("Content-Type", "text/html");
    res.setHeader("X-Streaming", streaming ? "true" : "false");
    res.send(html || "<div class='message-block'><div class='message-body'>Sem mensagens ainda.</div></div>");
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).send("<div class='error'>Erro ao carregar mensagens</div>");
  }
});

/**
 * @swagger
 * /sessions:
 *   get:
 *     summary: Get sessions list as HTML
 *     tags: [Sessions]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: HTML session list
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
app.get("/sessions", authApi, logHermesRequest, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;
    const html = await sessionsService.getSessionsHTML(limit, offset);
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    console.error("Sessions list error:", err);
    res.status(500).send("<div class='error'>Erro ao carregar sessões</div>");
  }
});

/**
 * @swagger
 * /sessions:
 *   post:
 *     summary: Create new session
 *     tags: [Sessions]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *     responses:
 *       201:
 *         description: Session created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                 title:
 *                   type: string
 *                 createdAt:
 *                   type: integer
 */
app.post("/sessions", authApi, logHermesRequest, express.json(), async (req, res) => {
  try {
    const { title } = req.body;
    const session = await sessionsService.createSession(title);
    res.status(201).json(session);
  } catch (err) {
    console.error("Create session error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /profiles:
 *   get:
 *     summary: Get available Hermes profiles
 *     tags: [Profiles]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Array of profiles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   modelName:
 *                     type: string
 *                   endpoint:
 *                     type: string
 *                   isDefault:
 *                     type: boolean
 */
app.get("/profiles", authApi, logHermesRequest, async (req, res) => {
  try {
    const profiles = await profilesService.getProfiles();
    res.json(profiles);
  } catch (err) {
    console.error("Profiles error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===== EXISTING AUDIO ENDPOINT (updated) =====

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize Hermes API services
let chatService;
let sessionsService;
let profilesService;

async function initializeHermesServices() {
  try {
    const hermesClient = getHermesClient();
    await hermesClient.initialize();
    
    chatService = new ChatService(audioFileManager, htmlRenderer);
    sessionsService = new SessionsService(htmlRenderer);
    profilesService = new ProfilesService();
    
    console.log("Hermes API services initialized");
  } catch (err) {
    console.error("Failed to initialize Hermes services:", err);
  }
}

// Request logging middleware for terminal routes
function logTerminalRequest(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[TERMINAL] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
}

/**
 * @swagger
 * /terminal/input:
 *   post:
 *     summary: Send text input to terminal
 *     tags: [Terminal]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TerminalInputRequest'
 *     responses:
 *       202:
 *         description: Input accepted and forwarded to terminal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TerminalInputResponse'
 *       400:
 *         description: Invalid payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: Terminal error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /terminal/input - Send input to terminal
app.post("/terminal/input", authApi, logTerminalRequest, express.json(), async (req, res) => {
  try {
    const { type, content } = req.body;
    
    if (!type || type !== "text") {
      return res.status(400).json({ error: "Invalid payload: type must be 'text'" });
    }
    
    if (typeof content !== "string") {
      return res.status(400).json({ error: "Invalid payload: content must be a string" });
    }
    
    terminalManager.write(content + "\n");
    return res.status(202).json({ accepted: true });
  } catch (err) {
    console.error("Terminal input error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /terminal/poll:
 *   get:
 *     summary: Long-poll for terminal output since timestamp
 *     tags: [Terminal]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: since
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         description: Unix timestamp in milliseconds to get output since
 *     responses:
 *       200:
 *         description: Terminal output with HTML and audio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TerminalPollResponse'
 *       400:
 *         description: Missing or invalid since parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// GET /terminal/poll?since=<timestamp> - Long-poll for terminal output
app.get("/terminal/poll", authApi, logTerminalRequest, async (req, res) => {
  const sinceParam = req.query.since;
  
  if (!sinceParam) {
    return res.status(400).json({ error: "Missing 'since' query parameter" });
  }
  
  const since = parseInt(sinceParam, 10);
  
  if (isNaN(since)) {
    return res.status(400).json({ error: "Invalid 'since' parameter: must be a Unix timestamp in milliseconds" });
  }
  
  const timeoutMs = 30000;
  const startTime = Date.now();
  
  const checkForNewOutput = async () => {
    const newEntries = terminalManager.getBufferSince(since);
    
    if (newEntries.length > 0) {
      // Parse blocks to identify AI messages
      const blocks = htmlRenderer.parseBlocks(newEntries);
      const audioMap = new Map();
      const audioItems = [];
      
      // Generate TTS for new AI messages
      for (const block of blocks) {
        if (block.isAI) {
          let audioInfo = audioFileManager.get(`block-${block.id}`);
          
          // Check if this AI block already has audio (by text content match)
          const existingAudio = audioFileManager.getAll().find(a => a.text === block.text);
          
          if (!existingAudio) {
            try {
              console.log(`Generating TTS for AI response: ${block.text.substring(0, 50)}...`);
              const audioFile = await ttsService.generateForText(block.text);
              audioFileManager.add(audioFile);
              audioInfo = audioFile;
            } catch (err) {
              console.error("TTS generation failed:", err.message);
            }
          } else {
            audioInfo = existingAudio;
          }
          
          if (audioInfo) {
            audioMap.set(block.id, audioInfo);
            audioItems.push({
              id: audioInfo.id,
              url: `/audio/${audioInfo.id}`,
              text: audioInfo.text,
            });
          }
        }
      }
      
      // Render HTML with audio players
      const renderedBlocks = htmlRenderer.renderMessageBlocks(newEntries, audioMap);
      const html = renderedBlocks.join("\n");
      
      const newSince = newEntries[newEntries.length - 1].timestamp;
      
      return res.json({
        since: newSince,
        html,
        audio: audioItems,
      });
    }
    
    if (Date.now() - startTime >= timeoutMs) {
      return res.json({
        since: Date.now(),
        html: "",
        audio: [],
      });
    }
    
    setTimeout(checkForNewOutput, 100);
  };
  
  checkForNewOutput();
});

/**
 * @swagger
 * /audio/{id}:
 *   get:
 *     summary: Get audio file by ID with Range support
 *     tags: [Audio]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Audio file ID
 *       - in: header
 *         name: Range
 *         schema:
 *           type: string
 *         description: Byte range for seeking (e.g., bytes=0-1023)
 *     responses:
 *       200:
 *         description: Audio file (full)
 *         content:
 *           audio/mpeg:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Accept-Ranges:
 *             schema:
 *               type: string
 *             description: bytes
 *           Content-Length:
 *             schema:
 *               type: integer
 *             description: File size in bytes
 *           Content-Type:
 *             schema:
 *               type: string
 *             description: audio/mpeg
 *       206:
 *         description: Partial content (Range request)
 *         content:
 *           audio/mpeg:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Range:
 *             schema:
 *               type: string
 *             description: bytes start-end/total
 *           Accept-Ranges:
 *             schema:
 *               type: string
 *             description: bytes
 *           Content-Length:
 *             schema:
 *               type: integer
 *             description: Chunk size in bytes
 *           Content-Type:
 *             schema:
 *               type: string
 *             description: audio/mpeg
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Audio not found or evicted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /audio/:id - Serve audio file with Range support
app.get("/audio/:id", authApi, logHermesRequest, (req, res) => {
  const { id } = req.params;
  const audioFile = audioFileManager.get(id);
  
  if (!audioFile) {
    return res.status(404).json({ error: "Audio not found" });
  }
  
  const filePath = audioFile.path;
  
  if (!fs.existsSync(filePath)) {
    audioFileManager.remove(id);
    return res.status(404).json({ error: "Audio file not found" });
  }
  
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;
  
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "audio/mpeg",
    };
    
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "audio/mpeg",
      "Accept-Ranges": "bytes",
    };
    
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  audioFileManager.clear();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully...");
  audioFileManager.clear();
  process.exit(0);
});

// Start Hermes API services
initializeHermesServices();

app.listen(9090, "0.0.0.0", () =>
  console.log("Dashboard rodando na porta 9090"),
);
