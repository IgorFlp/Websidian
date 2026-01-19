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
const VAULT = process.env.VAULT_PATH;
const PUBLIC = path.join(__dirname, "../public");

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

//app.use(express.static(path.join(process.cwd(), "public"), requireAuth));
app.get("/", authPage, (req, res) => {
  res.sendFile(path.join(process.cwd(), "public/index.html"));
});
app.use("/download", authPage, express.static(path.join(VAULT, "Downloads")));
app.get("/files", authPage, (req, res) => {
  res.sendFile(path.join(process.cwd(), "public/files.html"));
});
app.get("/login", (req, res) => {
  if (req.session.auth) return res.redirect("/");
  res.sendFile(path.join(process.cwd(), "public/login.html"));
});

function parseTask(line) {
  if (!line || typeof line !== "string") return null;

  const task = {};

  task.done = line.includes("[x]");
  task.text = line.replace(/- \[[ x]\]\s*/, "");

  // 📅 due date
  const dueMatch = task.text.match(/📅\s*(\d{4}-\d{2}-\d{2})/);
  task.due = dueMatch ? dueMatch[1] : null;

  // ⏳ scheduled
  const schedMatch = task.text.match(/⏳\s*(\d{4}-\d{2}-\d{2})/);
  task.scheduled = schedMatch ? schedMatch[1] : null;

  // ✅ done date
  const doneMatch = task.text.match(/✅\s*(\d{4}-\d{2}-\d{2})/);
  task.doneDate = doneMatch ? doneMatch[1] : null;

  // 🔁 recurring
  task.recurring = task.text.includes("🔁");

  // #tags
  const tagMatches = task.text.match(/#(\w+)/g);
  task.tags = tagMatches ? tagMatches.map((t) => t.replace("#", "")) : [];

  return task;
}

app.post("/login", (req, res) => {
  const { user, pass } = req.body;
  if (user === process.env.APP_USER && pass === process.env.APP_PASSWORD) {
    console.log("Login feito com sucesso");
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

app.get("/api/files", authApi, (req, res) => {
  function scan(dir) {
    fs.readdirSync(dir).forEach((file) => {
      const full = path.join(dir, file);

      if (fs.statSync(full).isDirectory()) {
        return scan(full);
      }
    });
  }
  let files = fs.readdirSync(VAULT, { recursive: true });
  files = files.filter((file) => !file.startsWith("."));
  res.json({ files });
});
app.get("/api/tasks", authApi, (req, res) => {
  const tasks = [];

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

          // info do arquivo
          file: full,
          line: index,
        });
      });
    });
  }

  scan(VAULT);
  res.json(tasks);
});

app.post("/api/tasks/toggle", authApi, (req, res) => {
  const { file, line } = req.body;
  const content = fs.readFileSync(file, "utf8").split("\n");
  content[line] = content[line].includes("[x]")
    ? content[line].replace("[x]", "[ ]")
    : content[line].replace("[ ]", "[x]");

  fs.writeFileSync(file, content.join("\n"));
  res.json({ ok: true });
});

app.get("/download", authApi, (req, res) => {
  const relPath = req.params[0];
  const safePath = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, "");

  const fullPath = path.join(VAULT, safePath);

  if (!fullPath.startsWith(VAULT)) {
    return res.status(403).send("Forbidden");
  }

  if (!fs.existsSync(fullPath)) {
    return res.status(404).send("File not found");
  }

  res.download(fullPath);
});

app.listen(3000, () => console.log("Dashboard rodando na porta 3000"));
