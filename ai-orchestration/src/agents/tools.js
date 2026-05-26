import axios from "axios";
import { tool } from "langchain";
import * as z from "zod";

const sandboxId = "019e4342-3335-7526-a44e-e317b7b9c639";

// const axiosConfig = {
//   headers: {
//     Host: `${sandboxId}.agent.localhost`,
//   },
// };

export const listFiles = tool(
  async ({}, config) => {
    console.log("================================");
    console.log("Using list-files tool");
    console.log("================================");

    const writer = config.writer;
    writer("Listing files in the project directory...");

    const response = await axios.get(
      `http://sandbox-service-${config.context.projectId}:3000/list-files`,
    );

    writer("Files listed successfully."+"Files: " + response.data.files.join(", ") + "\n");

    console.log("================================");
    console.log("Response from list-files tool:", response.data);
    console.log("================================");

    return JSON.stringify(response.data.files);
  },
  {
    name: "list-files",
    description: "List all the files in the project directory.",
    schema: z.object({}),
  },
);

export const readFiles = tool(
  async ({ files }, config) => {
    console.log("================================");
    console.log("Using read-files tool with files:", files);
    console.log("================================");

    const writer = config.writer;
    writer("Reading files..." + files.join(", ") + "\n");

    const response = await axios.get(
      `http://sandbox-service-${config.context.projectId}:3000/read-files?files=${files.join(",")}`,
    );

    writer("Files read successfully.");

    console.log("================================");
    console.log("Response from read-files tool:", response.data);
    console.log("================================");

    return JSON.stringify(response.data.results);
  },
  {
    name: "read-files",
    description: "Read the contents of one or more files.",
    schema: z.object({
      files: z.array(z.string()),
    }),
  },
);

export const updateFiles = tool(
  async ({ files = [] }, config) => {
    console.log("================================");
    console.log("Using update-files tool with input:", files);
    console.log("================================");

    const writer = config.writer;
    writer("Updating files..."+files.map(f => f.file).join(", ") + "\n");

    const response = await axios.patch(
      `http://sandbox-service-${config.context.projectId}:3000/update-files`,
      {
        updates: files,
      },
    );

    writer("Files updated successfully.");

    console.log("================================");
    console.log("Response from update-files tool:", response.data);
    console.log("================================");

    return JSON.stringify(response.data.results);
  },
  {
    name: "update-files",
    description: "Update the contents of specified files.",
    schema: z.object({
      files: z.array(
        z.object({
          file: z.string(),
          content: z.string(),
        }),
      ),
    }),
  },
);
