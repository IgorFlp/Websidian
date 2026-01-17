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

app.get("/api/tasks", (req, res) => {
  const tasks = [];

  function scan(dir) {
    fs.readdirSync(dir).forEach((file) => {
      const full = path.join(dir, file);
      if (fs.statSync(full).isDirectory()) return scan(full);
      if (!file.endsWith(".md")) return;

      const lines = fs.readFileSync(full, "utf8").split("\n");
      lines.forEach((l, i) => {
        if (l.match(/- \[[ x]\]/)) {
          tasks.push({
            text: l.replace(/- \[[ x]\] /, ""),
            done: l.includes("[x]"),
            file: full,
            line: i,
          });
        }
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
