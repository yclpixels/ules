import { afterEach, describe, expect, it, vi } from "vitest";
import { clientIpFromHeaders } from "@/lib/rateLimit";
import { encryptField, decryptField } from "@/lib/fieldCrypto";
import { escapeHtml } from "@/lib/receipt";

afterEach(() => vi.unstubAllEnvs());

describe("clientIpFromHeaders", () => {
  const h = (xff?: string, realIp?: string) =>
    new Headers({
      ...(xff ? { "x-forwarded-for": xff } : {}),
      ...(realIp ? { "x-real-ip": realIp } : {}),
    });

  it("tek proxy arkasında istemcinin uydurduğu soldaki değeri değil, proxy'nin eklediğini alır", () => {
    expect(clientIpFromHeaders(h("6.6.6.6, 203.0.113.9"))).toBe("203.0.113.9");
  });

  it("iki proxy katmanında sağdan ikinciyi alır", () => {
    vi.stubEnv("TRUSTED_PROXY_HOPS", "2");
    expect(clientIpFromHeaders(h("6.6.6.6, 203.0.113.9, 10.0.0.1"))).toBe("203.0.113.9");
  });

  it("proxy yoksa (0) başlıklara hiç güvenmez", () => {
    vi.stubEnv("TRUSTED_PROXY_HOPS", "0");
    expect(clientIpFromHeaders(h("6.6.6.6", "7.7.7.7"))).toBe("unknown");
  });

  it("X-Forwarded-For yoksa x-real-ip'ye düşer", () => {
    expect(clientIpFromHeaders(h(undefined, "198.51.100.4"))).toBe("198.51.100.4");
  });
});

describe("fieldCrypto", () => {
  const KEY = Buffer.alloc(32, 7).toString("base64");

  it("şifreler ve geri çözer; düz metin veritabanında görünmez", () => {
    vi.stubEnv("FIELD_ENCRYPTION_KEY", KEY);
    const enc = encryptField("TR330006100519786457841326");
    expect(enc).toMatch(/^enc:v1:/);
    expect(enc).not.toContain("786457841326");
    expect(decryptField(enc)).toBe("TR330006100519786457841326");
  });

  it("aynı değeri her seferinde farklı şifreler (IV rastgele)", () => {
    vi.stubEnv("FIELD_ENCRYPTION_KEY", KEY);
    expect(encryptField("12345678901")).not.toBe(encryptField("12345678901"));
  });

  it("eski şifrelenmemiş kaydı olduğu gibi okur", () => {
    expect(decryptField("TR12 plain")).toBe("TR12 plain");
    expect(decryptField(null)).toBeNull();
  });

  it("anahtar yoksa şifrelemeyi reddeder (düz metne sessizce düşmez)", () => {
    vi.stubEnv("FIELD_ENCRYPTION_KEY", "");
    expect(() => encryptField("x")).toThrow(/FIELD_ENCRYPTION_KEY/);
  });

  it("yanlış anahtarla çözmeyi reddeder", () => {
    vi.stubEnv("FIELD_ENCRYPTION_KEY", KEY);
    const enc = encryptField("secret");
    vi.stubEnv("FIELD_ENCRYPTION_KEY", Buffer.alloc(32, 9).toString("base64"));
    expect(() => decryptField(enc)).toThrow();
  });
});

describe("escapeHtml", () => {
  it("HTML'i etkisizleştirir", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;"
    );
  });
});
