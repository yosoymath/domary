import { randomUUID } from "node:crypto";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import sharp from "sharp";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_REQUEST_SIZE = MAX_FILE_SIZE + 256 * 1024;
const PRODUCT_IMAGE_SIZE = 1200;

type SupportedImage = {
  extension: "jpg" | "png" | "webp";
  mimeType: "image/jpeg" | "image/png" | "image/webp";
};

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function detectImageType(bytes: Uint8Array): SupportedImage | null {
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (isJpeg) return { extension: "jpg", mimeType: "image/jpeg" };

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const isPng = bytes.length >= 8 && pngSignature.every((byte, index) => bytes[index] === byte);
  if (isPng) return { extension: "png", mimeType: "image/png" };

  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  const isWebp = bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
  if (isWebp) return { extension: "webp", mimeType: "image/webp" };

  return null;
}

function jsonError(message: string, status: number) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

function hasCloudinaryCredentials() {
  const configuration = cloudinary.config();

  return Boolean(configuration.cloud_name && configuration.api_key && configuration.api_secret);
}

function uploadProductImage(image: Buffer, publicId: string) {
  return new Promise<UploadApiResponse>((resolve, reject) => {
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

        if (!result?.secure_url) {
          reject(new Error("O Cloudinary não retornou a URL segura da imagem."));
          return;
        }

        resolve(result);
      },
    );

    upload.end(image);
  });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Origem da requisição não autorizada.", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Faça login para enviar imagens.", 401);
  if (user.role !== "ADMIN") return jsonError("Apenas administradores podem enviar imagens.", 403);
  if (!hasCloudinaryCredentials()) {
    return jsonError("O armazenamento de imagens ainda não está configurado.", 503);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_SIZE) return jsonError("A imagem deve ter no máximo 5 MB.", 413);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Não foi possível ler o arquivo enviado.", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return jsonError("Selecione uma imagem válida.", 400);
  if (file.size === 0) return jsonError("O arquivo enviado está vazio.", 400);
  if (file.size > MAX_FILE_SIZE) return jsonError("A imagem deve ter no máximo 5 MB.", 413);

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!detectImageType(bytes)) return jsonError("Formato não permitido. Use JPG, PNG ou WebP.", 415);

  let normalizedImage: Buffer;
  try {
    normalizedImage = await sharp(bytes, {
      failOn: "error",
      limitInputPixels: 40_000_000,
    })
      .rotate()
      .resize(PRODUCT_IMAGE_SIZE, PRODUCT_IMAGE_SIZE, {
        fit: "cover",
        position: "attention",
      })
      .webp({ effort: 4, quality: 86 })
      .toBuffer();
  } catch (error) {
    console.error("Falha ao processar imagem de produto", error);
    return jsonError("A imagem está corrompida ou não pôde ser processada.", 422);
  }

  const publicId = randomUUID();
  let uploadedImage: UploadApiResponse;
  try {
    uploadedImage = await uploadProductImage(normalizedImage, publicId);
  } catch (error) {
    console.error(
      "Falha ao armazenar imagem de produto no Cloudinary",
      error instanceof Error ? error.message : "Erro desconhecido",
    );
    return jsonError("Não foi possível armazenar a imagem agora.", 500);
  }

  return Response.json(
    {
      url: uploadedImage.secure_url,
      publicId: uploadedImage.public_id,
      mimeType: "image/webp",
      width: uploadedImage.width ?? PRODUCT_IMAGE_SIZE,
      height: uploadedImage.height ?? PRODUCT_IMAGE_SIZE,
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
