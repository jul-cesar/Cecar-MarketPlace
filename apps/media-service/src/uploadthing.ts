import { createUploadthing, type FileRouter } from "uploadthing/server";

const f = createUploadthing();

export const uploadRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 10,
    },
  }).onUploadComplete(({ file }) => {
    console.log("[media-service] upload completed", {
      key: file.key,
      name: file.name,
      size: file.size,
      url: file.url,
    });
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
