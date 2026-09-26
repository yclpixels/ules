/**
 * Excel'den toplu ürün ekleme: yapıştırılan hücreler (sekmeyle ayrılmış) ya
 * da CSV dosyası (Türkçe Excel ";" kullanır) satır satır ürüne çevrilir.
 *
 * Sütunlar: Ad, Fiyat, Kategori, KDV, Açıklama, Alerjen, Fotoğraf linki.
 * İlk satır başlıksa sütunlar başlık adından eşlenir (sıra serbest);
 * başlık yoksa bu sırayla okunur. Yalnızca Ad ve Fiyat zorunlu.
 */
import { parseVatRate } from "@/lib/vat";

export const IMPORT_MAX_ROWS = 500;

export type ImportRow = {
  line: number; // kullanıcıya gösterilen satır numarası (1'den)
  name: string;
  priceCents: number;
  category: string | null;
  vatRate: number | null; // null: belirtilmedi (varsayılan kullanılır)
  description: string | null;
  allergens: string | null;
  imageUrl: string | null;
};

export type ImportError = { line: number; message: string };

type Field = "name" | "price" | "category" | "vat" | "description" | "allergens" | "image";
const FIELD_ORDER: Field[] = ["name", "price", "category", "vat", "description", "allergens", "image"];

const HEADER_ALIASES: Record<Field, string[]> = {
  name: ["ad", "adı", "ürün", "ürün adı", "urun", "urun adi", "isim", "name"],
  price: ["fiyat", "fiyat (tl)", "tutar", "price"],
  category: ["kategori", "category", "grup"],
  vat: ["kdv", "kdv oranı", "kdv %", "vergi", "vat"],
  description: ["açıklama", "aciklama", "içerik", "description"],
  allergens: ["alerjen", "alerjenler", "allergens"],
  image: ["fotoğraf", "fotograf", "görsel", "gorsel", "resim", "fotoğraf linki", "görsel linki", "image"],
};

function norm(s: string) {
  return s.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
}

/** "1.250,50" / "1250.5" / "₺45" / "45 TL" → kuruş. Geçersizse null. */
export function parsePriceToCents(raw: string): number | null {
  let s = raw.replace(/₺|tl|try/gi, "").replace(/\s/g, "");
  if (!s) return null;
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", "."); // Türkçe: nokta binlik, virgül ondalık
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, ""); // "1.250" → binlik ayraç
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const cents = Math.round(Number(s) * 100);
  return cents > 0 && cents <= 100_000_000 ? cents : null;
}

/** Tırnaklı alanları destekleyen tek satır/çok satır ayırıcı (RFC 4180 benzeri). */
function splitRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"' && cell === "") {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function detectDelimiter(firstLine: string): string {
  const counts = ["\t", ";", ","].map((d) => [d, firstLine.split(d).length - 1] as const);
  const best = counts.sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : "\t";
}

function safeImageUrl(raw: string): string | null | undefined {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function parseMenuImport(text: string): { rows: ImportRow[]; errors: ImportError[] } {
  const clean = text.replace(/^\uFEFF/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const table = splitRows(clean, detectDelimiter(firstLine));

  // Başlık satırı varsa sütunları adından eşle.
  let columns: (Field | null)[] = FIELD_ORDER;
  let start = 0;
  const header = (table[0] ?? []).map(norm);
  const mapped = header.map(
    (h) => (Object.keys(HEADER_ALIASES) as Field[]).find((f) => HEADER_ALIASES[f].includes(h)) ?? null
  );
  if (mapped.includes("name") && mapped.includes("price")) {
    columns = mapped;
    start = 1;
  }

  const rows: ImportRow[] = [];
  const errors: ImportError[] = [];
  const seen = new Set<string>();

  for (let r = start; r < table.length; r++) {
    const line = r + 1;
    const cells = table[r];
    if (cells.every((c) => !c.trim())) continue; // boş satır
    if (rows.length >= IMPORT_MAX_ROWS) {
      errors.push({ line, message: `En fazla ${IMPORT_MAX_ROWS} ürün; kalanlar alınmadı` });
      break;
    }
    const get = (f: Field) => {
      const idx = columns.indexOf(f);
      return idx >= 0 ? (cells[idx] ?? "").trim() : "";
    };

    const name = get("name").slice(0, 120);
    if (!name) {
      errors.push({ line, message: "Ürün adı boş" });
      continue;
    }
    const priceCents = parsePriceToCents(get("price"));
    if (priceCents === null) {
      errors.push({ line, message: `"${name}": fiyat okunamadı (${get("price") || "boş"})` });
      continue;
    }
    const vatRaw = get("vat").replace("%", "").trim();
    const vatRate = vatRaw ? parseVatRate(vatRaw) : null;
    if (vatRaw && vatRate === null) {
      errors.push({ line, message: `"${name}": KDV oranı 0, 1, 10 ya da 20 olmalı` });
      continue;
    }
    const imageUrl = safeImageUrl(get("image"));
    if (imageUrl === undefined) {
      errors.push({ line, message: `"${name}": fotoğraf linki http(s) ile başlamalı` });
      continue;
    }
    const key = norm(name);
    if (seen.has(key)) {
      errors.push({ line, message: `"${name}": listede iki kez var, ilki alındı` });
      continue;
    }
    seen.add(key);

    rows.push({
      line,
      name,
      priceCents,
      category: get("category").slice(0, 60) || null,
      vatRate,
      description: get("description").slice(0, 300) || null,
      allergens: get("allergens").slice(0, 120) || null,
      imageUrl,
    });
  }
  return { rows, errors };
}

export function sameName(a: string, b: string) {
  return norm(a) === norm(b);
}

/** Excel'de açılan örnek şablon (UTF-8 BOM + ";" — Türkçe Excel doğru böler). */
export const IMPORT_TEMPLATE =
  "\uFEFFAd;Fiyat;Kategori;KDV;Açıklama;Alerjen;Fotoğraf linki\r\n" +
  "Adana Kebap;320,00;Ana Yemekler;10;Acılı, lavaş ve közle;gluten;\r\n" +
  "Ayran;45;İçecekler;10;;süt;\r\n" +
  "Bira 50 cl;150;İçecekler;20;;gluten;\r\n";
