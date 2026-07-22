/**
 * Sends a luxury Makima-themed bug report embed directly to a Discord Webhook.
 */
export async function sendDiscordBugReport({
  description,
  page,
  severity,
  fileName,
  webhookUrl
}) {
  const url = webhookUrl || import.meta.env.VITE_DISCORD_WEBHOOK_URL;

  // Extract automated environment metadata
  const userAgent = navigator.userAgent;
  const viewport = `${window.innerWidth}×${window.innerHeight} (Ratio: ${window.devicePixelRatio})`;
  const path = window.location.pathname + window.location.hash;
  const timestamp = new Date().toLocaleString();

  // Severity color mapping
  const severityColors = {
    Minor: 0x3b82f6,   // Blue
    Major: 0xf59e0b,   // Amber
    Critical: 0xa63d3d // Makima Red
  };

  const color = severityColors[severity] || 0xa63d3d;

  const embedPayload = {
    username: "Public Safety HQ — Bug Dispatch",
    avatar_url: "https://makima-tribute.vercel.app/images/coming-soon.jpg",
    embeds: [
      {
        title: `🚨 Bug Report — [${severity.toUpperCase()}]`,
        description: `**Description:**\n${description}`,
        color: color,
        fields: [
          {
            name: "📍 Target Section",
            value: page || "General",
            inline: true
          },
          {
            name: "🔥 Severity",
            value: severity,
            inline: true
          },
          {
            name: "🌐 URL Path",
            value: path || "/",
            inline: true
          },
          {
            name: "💻 Browser & OS",
            value: userAgent,
            inline: false
          },
          {
            name: "📐 Viewport & DPR",
            value: viewport,
            inline: true
          },
          {
            name: "🕒 Timestamp",
            value: timestamp,
            inline: true
          },
          {
            name: "📎 Attachment",
            value: fileName ? `\`${fileName}\`` : "None attached",
            inline: true
          }
        ],
        footer: {
          text: "Makima Tribute — Public Safety Division 4",
          icon_url: "https://makima-tribute.vercel.app/images/report-btn-icon.png"
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  if (!url) {
    console.warn("Discord Webhook URL not configured. Simulating dispatch:", embedPayload);
    return { success: true, simulated: true };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(embedPayload)
    });

    if (response.ok || response.status === 204) {
      return { success: true };
    } else {
      console.error("Discord Webhook error status:", response.status);
      return { success: false, status: response.status };
    }
  } catch (err) {
    console.error("Discord Webhook dispatch failed:", err);
    return { success: false, error: err };
  }
}
