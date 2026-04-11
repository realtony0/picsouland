import { put } from "@vercel/blob";

const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "166ng75";

export async function POST(request) {
  if (request.headers.get("x-admin-pin") !== ADMIN_PIN) {
    return Response.json({ error: "Non autorise" }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      { error: "BLOB_READ_WRITE_TOKEN manquant dans les variables d'environnement Vercel." },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return Response.json(
        { error: "Fichier requis." },
        { status: 400 },
      );
    }

    const blob = await put(`products/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return Response.json({ url: blob.url });
  } catch (error) {
    return Response.json(
      { error: "Erreur upload : " + error.message },
      { status: 500 },
    );
  }
}
