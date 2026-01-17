import express from "express";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ vault (por enquanto local)
const VAULT = process.env.VAULT_PATH; //path.join(__dirname, "../vault");
console.log("Usando vault em:", VAULT);
// ✅ public (frontend)
const PUBLIC = path.join(__dirname, "../public");

app.use(express.static(path.join(process.cwd(), "public")));
app.use(express.json());

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

app.get("/api/tasks", (req, res) => {
  const tasks = [];

  function scan(dir) {
    fs.readdirSync(dir).forEach((file) => {
      const full = path.join(dir, file);

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

app.post("/api/tasks/toggle", (req, res) => {
  const { file, line } = req.body;
  const content = fs.readFileSync(file, "utf8").split("\n");
  content[line] = content[line].includes("[x]")
    ? content[line].replace("[x]", "[ ]")
    : content[line].replace("[ ]", "[x]");

  fs.writeFileSync(file, content.join("\n"));
  res.json({ ok: true });
});

app.listen(3000, () => console.log("Dashboard rodando na porta 3000"));
