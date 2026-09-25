import { afterEach, describe, expect, it, vi } from "vitest";
import { sendEmail, supportInbox } from "@/lib/email";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("sendEmail", () => {
  it("RESEND_API_KEY varsa Resend API'sine gönderir (yanıtla adresiyle)", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "Üleş <bildirim@example.com>");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendEmail({
      to: "destek@example.com",
      subject: "Demo talebi",
      html: "<p>x</p>",
      replyTo: "musteri@example.com",
    });

    expect(result).toEqual({ sent: true, mocked: false });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test");
    expect(JSON.parse(init.body)).toMatchObject({
      from: "Üleş <bildirim@example.com>",
      to: ["destek@example.com"],
      subject: "Demo talebi",
      reply_to: "musteri@example.com",
    });
  });

  it("Resend hata dönerse sessizce 'gönderildi' demez, hata fırlatır", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response('{"message":"domain not verified"}', { status: 403 }))
    );
    await expect(sendEmail({ to: "a@b.co", subject: "s", html: "h" })).rejects.toThrow(
      /Resend 403.*domain not verified/
    );
  });

  it("hiçbir sağlayıcı yoksa demo modunda kalır, dışarı istek atmaz", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("SMTP_HOST", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "log").mockImplementation(() => {});

    expect(await sendEmail({ to: "a@b.co", subject: "s", html: "h" })).toEqual({
      sent: false,
      mocked: true,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("supportInbox", () => {
  it("SUPPORT_EMAIL'i, yoksa eski CONTACT_EMAIL'i kullanır", () => {
    vi.stubEnv("SUPPORT_EMAIL", "");
    vi.stubEnv("CONTACT_EMAIL", "eski@example.com");
    expect(supportInbox()).toBe("eski@example.com");
    vi.stubEnv("SUPPORT_EMAIL", "destek@example.com");
    expect(supportInbox()).toBe("destek@example.com");
  });
});
