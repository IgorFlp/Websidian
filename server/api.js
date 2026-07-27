import express from "express";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import session from "express-session";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
app.get("/login", (req, res) => {
  if (req.session.auth) return res.redirect("/");
  res.sendFile(path.join(process.cwd(), "public/login.html"));
});
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

app.post("/login", (req, res) => { 
  const { user, pass } = req.body;
  if (user === process.env.APP_USER && pass === process.env.APP_PASSWORD) {
    
    req.session.auth = true;
    return res.redirect("/");
  }
  res.redirect("/login?error=1");
});

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
      } else if (entry.name.endsWith(".md")) {
        nodes.push({
          type: "file",
          name: entry.name,
          path: relPath,
          extension: "md",
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
app.get("/api/presets", authApi, (req, res) => {
  const data = loadPresets();
  res.json(data);
});

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

app.get("/download", authApi, (req, res) => {
  const relPath = req.params[0];
  const safePath = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const fullPath = path.join(VAULT.split(',').at(vaultIndex), safePath);

  if (!fullPath.startsWith(VAULT.split(',').at(vaultIndex) || !fs.existsSync(fullPath))) {
    return res.status(404).send("File not found");
  }

  res.setHeader("Content-Type", "application/octet-stream");

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

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

app.listen(9090, "0.0.0.0", () =>
  console.log("Dashboard rodando na porta 9090"),
);
