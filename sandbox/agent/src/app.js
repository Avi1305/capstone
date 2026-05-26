import express from "express";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import { Server } from "socket.io";
import http from "http";
import pty from "node-pty";
import os from "os";

const WORKING_DIR = "/workspace";

const app = express();
const httpServer = http.createServer(app);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"],
  },
});

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Sandbox Agent is healthy",
    status: "ok",
  });
});

const shell = process.env.SHELL || "bash";

const ptyProcess = pty.spawn(shell, [], {
  name: "xterm-color",
  cols: 80,
  rows: 30,
  cwd: "/workspace",
  env: process.env
});

// PTY output → WebSocket
ptyProcess.onData((data) => {
  io.emit("terminal-output", data);
});

// PTY exit → notify client
ptyProcess.onExit(({ exitCode, signal }) => {
  console.log(`PTY process exited with code ${exitCode} and signal ${signal}`);
});

io.on("connection", (socket) => {
  console.log("Client connected" + socket.id);

  socket.on("terminal-input", (data) => {
    ptyProcess.write(data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected" + socket.id);
  });
});

/*
* @route GET /list-files
* @description List all files in the working directory and its subdirectories. Returns a JSON response object with a 'files' property containing an array of file paths relative to the working directory. exclude directories like node_modules, .git, dist,etc.
-eg. {
    "message": "Elements in working directory",
    "files": [
        "file1.txt",
        "src/file2.js",
        "src/utils/file3.js"
    ]
}
*/

app.get("/list-files", async (req, res) => {
  const listfiles = async (dir, baseDir) => {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);
      if (
        entry.isDirectory() &&
        ["node_modules", ".git", "dist"].includes(entry.name)
      ) {
        continue; // Skip excluded directories
      }

      if (entry.isDirectory()) {
        const subFiles = await listfiles(fullPath, baseDir);
        files.push(...subFiles);
      } else {
        files.push(relativePath);
      }
    }
    return files;
  };

  try {
    const files = await listfiles(WORKING_DIR, WORKING_DIR);
    res.status(200).json({
      message: "Files listed successfully",
      files,
    });
  } catch (err) {
    res.status(500).json({
      message: `Error listing files: ${err.message}`,
      status: "error",
    });
  }
});

/*
 * @route GET /read-files
 * @description Read the content of all files requested in the query parameter 'files' and returns them as json response
 * -eg. /read-files?files=file1,file2
 */

app.get("/read-files", async (req, res) => {
  const files = req.query.files;

  if (!files) {
    return res.status(400).json({
      message: "No files specified in the query parameter 'files'",
      status: "error",
    });
  }

  const fileList = files.split(",");

  const results = await Promise.all(
    fileList.map(async (file) => {
      const filePath = path.join(WORKING_DIR, file);
      try {
        const content = await fs.promises.readFile(filePath, "utf-8");

        return {
          [filePath.replace(WORKING_DIR, "")]: content,
        };
      } catch (err) {
        return {
          [filePath.replace(WORKING_DIR, "")]:
            `Error reading file: ${err.message}`,
        };
      }
    }),
  );

  res.status(200).json({
    message: "Files read successfully",
    results,
  });
});

/*
 * @route PATCH /update-files
 * @description Update the content of files specified in the request body. The request body should conatain a property 'updates' with a JSON Array of object, each object should have a 'file' property specifying the file path (relative to the working directory) and a 'content' property specifying the new content for the file.
 * -eg. /update-files?files=file1,file2
 */

app.patch("/update-files", async (req, res) => {
  const updates = req.body.updates;

  if (!updates || !Array.isArray(updates)) {
    return res.status(400).json({
      message:
        "Invalid request body. Expected a JSON object with an 'updates' property containing an array of file updates",
      status: "error",
    });
  }

  const results = await Promise.all(
    updates.map(async (update) => {
      const { file, content } = update;
      const filePath = path.join(WORKING_DIR, file);
      try {
        console.log("WORKING_DIR:", WORKING_DIR);
        console.log("Resolved filePath:", filePath);
        console.log("Directory exists:", fs.existsSync(path.dirname(filePath)));
        console.log("Workspace exists:", fs.existsSync(WORKING_DIR));

        await fs.promises.mkdir(path.dirname(filePath), {
          recursive: true,
        });
        await fs.promises.writeFile(filePath, content, "utf-8");
        return {
          [filePath]: "File updated successfully",
        };
      } catch (err) {
        return {
          [filePath]: `Error updating file: ${err.message}`,
        };
      }
    }),
  );

  res.status(200).json({
    message: "Files updated successfully",
    results,
  });
});

/*
 * @route POST /create-files
 * @description Create new files located with the content specified in the request body. The request body should contain a property 'files' with a JSON array of objects, each object should have a 'file' property specifying the file path (relative to the working directory) and a 'content' property specifying the content for the new file.
 */

app.post("/create-files", async (req, res) => {
  const files = req.body.files;

  if (!files || !Array.isArray(files)) {
    return res.status(400).json({
      message:
        "Invalid request body. Expected a JSON object with a 'files' property containing an array of file objects",
      status: "error",
    });
  }

  const results = await Promise.all(
    files.map(async (fileObj) => {
      const { file, content } = fileObj;
      const filePath = path.join(WORKING_DIR, file);
      try {
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
        await fs.promises.writeFile(filePath, content, "utf-8");
        return {
          [filePath]: "File created successfully",
        };
      } catch (err) {
        return {
          [filePath]: `Error creating file: ${err.message}`,
        };
      }
    }),
  );

  res.status(201).json({
    message: "Files created successfully",
    results,
  });
});

export default httpServer;
