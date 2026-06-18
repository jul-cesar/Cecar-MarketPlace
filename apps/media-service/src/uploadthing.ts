import { createUploadthing, type FileRouter } from "uploadthing/server";
import { buildUploadLogPayload } from "./lib/upload-log.js";

const f = createUploadthing();

export const uploadRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 10,
    },
  }).onUploadComplete(({ file }) => {
    console.log("[media-service] upload completed", buildUploadLogPayload(file));
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
