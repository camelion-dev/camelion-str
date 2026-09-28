const bucket = process.env.SUPABASE_STORAGE_BUCKET || "product-images";

function storageUrl(path = "") {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  return `${baseUrl.replace(/\/$/, "")}/storage/v1/object/${bucket}/${path}`;
}

function serviceHeaders(contentType?: string) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  return {
    Authorization: `Bearer ${serviceRoleKey}`,
    apikey: serviceRoleKey,
    ...(contentType ? { "Content-Type": contentType } : {}),
  };
}

export async function uploadProductImage(file: File, productId: string) {
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(productId)) throw new Error("Invalid product identifier.");
  const content = new Uint8Array(await file.arrayBuffer());
  let contentType: string;
  let extension: string;
  if (content.length >= 8 && content[0] === 0x89 && content[1] === 0x50 && content[2] === 0x4e && content[3] === 0x47 && content[4] === 0x0d && content[5] === 0x0a && content[6] === 0x1a && content[7] === 0x0a) {
    contentType = "image/png";
    extension = "png";
  } else if (content.length >= 3 && content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff) {
    contentType = "image/jpeg";
    extension = "jpg";
  } else if (content.length >= 12 && String.fromCharCode(...content.slice(0, 4)) === "RIFF" && String.fromCharCode(...content.slice(8, 12)) === "WEBP") {
    contentType = "image/webp";
    extension = "webp";
  } else {
    throw new Error("Only valid JPEG, PNG, and WebP images are allowed.");
  }
  const path = `products/${productId}/${crypto.randomUUID()}.${extension}`;
  const response = await fetch(storageUrl(path), {
    method: "POST",
    headers: { ...serviceHeaders(contentType), "x-upsert": "false" },
    body: content,
  });
  if (!response.ok) throw new Error(`Supabase Storage upload failed: ${await response.text()}`);
  return {
    path,
    url: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${path}`,
  };
}

export async function deleteProductImage(path: string) {
  const response = await fetch(storageUrl(path), { method: "DELETE", headers: serviceHeaders() });
  if (!response.ok) throw new Error(`Supabase Storage delete failed: ${await response.text()}`);
}
