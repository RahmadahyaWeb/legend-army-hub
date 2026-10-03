const DISCORD_WORKER_URL = "https://legend-army-discord.legendarmy.workers.dev/strategy";

export async function sendStrategyToDiscord({ title, category, mapName, content }) {
  if (!title || !title.trim()) {
    throw new Error("Judul strategi tidak boleh kosong.");
  }
  if (!content || !content.trim()) {
    throw new Error("Konten strategi tidak boleh kosong.");
  }

  const payload = {
    title: title.trim(),
    category: category || "General",
    mapName: mapName?.trim() || "",
    content: content.trim(),
  };

  const response = await fetch(DISCORD_WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") || "";
  let data;

  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => null);
  } else {
    const responseText = await response.text().catch(() => "");
    data = responseText ? { message: responseText } : null;
  }

  if (!response.ok) {
    console.error("Discord Strategy Worker Error:", {
      status: response.status,
      statusText: response.statusText,
      data,
      payload,
    });

    throw new Error(
      data?.message ||
        data?.error ||
        `Worker returned HTTP ${response.status} ${response.statusText}`
    );
  }

  return {
    data,
    payload,
  };
}
