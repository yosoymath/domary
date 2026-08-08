import { readFile } from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const uploadDirectory = path.join(process.cwd(), "public", "uploads", "products");

function assertConfiguration() {
  const configuration = cloudinary.config();

  if (!configuration.cloud_name || !configuration.api_key || !configuration.api_secret) {
    throw new Error("Defina CLOUDINARY_URL no arquivo .env antes de executar a migração.");
  }
}

function localFileName(url) {
  const prefix = "/uploads/products/";
  if (!url.startsWith(prefix)) return null;

  const fileName = url.slice(prefix.length);
  if (!fileName || path.basename(fileName) !== fileName) return null;

  return fileName;
}

function uploadImage(filePath, publicId) {
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: "domary/products",
        public_id: publicId,
        resource_type: "image",
        format: "webp",
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result?.secure_url || !result.public_id) {
          reject(new Error("O Cloudinary não retornou os dados esperados."));
          return;
        }

        resolve(result);
      },
    );

    readFile(filePath).then(
      (image) => upload.end(image),
      (error) => reject(error),
    );
  });
}

async function migrateImage(image) {
  const fileName = localFileName(image.url);
  if (!fileName) return false;

  const filePath = path.join(uploadDirectory, fileName);
  const publicId = `legacy-${path.parse(fileName).name}`;
  const uploaded = await uploadImage(filePath, publicId);

  try {
    await prisma.productImage.update({
      where: { id: image.id },
      data: { url: uploaded.secure_url },
    });
  } catch (error) {
    await cloudinary.uploader.destroy(uploaded.public_id).catch(() => undefined);
    throw error;
  }

  console.log(`Imagem ${image.id} migrada para ${uploaded.public_id}.`);
  return true;
}

async function main() {
  assertConfiguration();

  const images = await prisma.productImage.findMany({
    where: { url: { startsWith: "/uploads/products/" } },
    select: { id: true, url: true },
  });

  if (images.length === 0) {
    console.log("Nenhuma imagem local cadastrada no banco precisa ser migrada.");
    return;
  }

  let migrated = 0;
  for (const image of images) {
    if (await migrateImage(image)) migrated += 1;
  }

  console.log(`${migrated} imagem(ns) migrada(s) com sucesso.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Falha inesperada na migração.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
