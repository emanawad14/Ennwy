export interface SeoData {
    title: string;
    description: string;
    keywords: string[];
    slug: string;
}


export function generateSeoFromDescription(raw: string): SeoData {
    const brandEn = "ennwy";
    const brandAr = "انوي";

    let clean = raw
        .replace(/&amp;/g, "&")
        .replace(/\p{Extended_Pictographic}/gu, "")
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();

    // ===== Title =====
    let title = clean.split("\n")[0] || clean;
    if (title.length > 60) title = title.substring(0, 57).trim() + "…";

    // نضيف البراند الاتنين مع بعض في الآخر
    if (!title.includes(brandEn) && !title.includes(brandAr)) {
        title += ` | ${brandEn}, ${brandAr}`;
    }

    // ===== Description =====
    let description = clean;
    if (description.length > 160) description = description.substring(0, 157).trim() + "…";

    if (!description.includes(brandEn) && !description.includes(brandAr)) {
        description += ` — ${brandEn}, ${brandAr}`;
    }

    // ===== Keywords =====
    const keywords = Array.from(
        new Set(
            clean.split(/[\s,;:()]+/).filter((w) => w.length > 2 && isNaN(Number(w)))
        )
    );

    // نضيف البراند كـ كلمتين منفصلتين
    if (!keywords.includes(brandEn)) keywords.unshift(brandEn);
    if (!keywords.includes(brandAr)) keywords.unshift(brandAr);

    // ===== Slug =====
    const slug = (title || clean)
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    return {
        title,
        description,
        keywords: keywords.slice(0, 15),
        slug
    };
}
