/**
 * Discord Auction Webhook Notification Service
 *
 * Why this exists:
 * Integrates live auction arena events with the guild's Discord notification channel.
 * Sends rich embeds for:
 * 1. New public bid queue requests awaiting officer review
 * 2. Officer approval and queue slot assignments
 * 3. Officer rejection notices with transparent reasoning
 */

const DEFAULT_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1561922955951341628/x5A9kReYjogmlsKYtqxo9tY6w7gfWdtuuDWLtZQOCuHj_lz6KJFqeXqqIJivY9EsxQgM";

const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || "https://legend-army-hub.vercel.app").replace(/\/$/, "");

/**
 * Returns the effective Discord Auction Webhook URL from environment or hardcoded default.
 *
 * Why this exists:
 * Allows configuring separate channels across preview/staging/production without code changes,
 * while maintaining a robust fallback to the primary officer Discord channel.
 *
 * @returns {string} Target Discord Webhook URL
 */
function getWebhookUrl() {
  return process.env.DISCORD_AUCTION_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;
}

/**
 * Dispatches an embed payload to the Discord Webhook in a safe, non-blocking manner.
 *
 * Why this exists:
 * Prevents transient Discord network or rate-limiting errors from interrupting
 * the core auction database transactions or user-facing API responses.
 *
 * @param {Object} payload - Discord webhook JSON payload
 * @returns {Promise<boolean>} True if delivered successfully
 */
async function sendDiscordWebhook(payload) {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) return false;

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(`Discord auction webhook responded with HTTP ${res.status}:`, errText);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Failed to dispatch Discord auction webhook:", err);
    return false;
  }
}

/**
 * Notifies the guild Discord channel when a player submits a new auction queue registration.
 *
 * Why this exists:
 * Informs guild officers in real-time that a member has requested an auction slot,
 * providing direct links to review and approve the request in the Command Console.
 *
 * @param {Object} params
 * @param {string} params.signupId - Registration database ID
 * @param {string} params.nickname - Character in-game name (IGN)
 * @param {string} [params.discordTag] - Member Discord handle
 * @param {string} params.itemTitle - Title of the requested catalog item
 * @param {number} [params.level=100] - Character level
 * @param {number} [params.quantity=1] - Requested quantity
 * @returns {Promise<boolean>}
 */
export async function notifyAuctionSignupSubmitted({
  signupId: _signupId,
  nickname,
  discordTag,
  itemTitle,
  level = 100,
  quantity = 1,
}) {
  const adminUrl = `${SITE_URL}/admin/auction`;
  const auctionUrl = `${SITE_URL}/auction`;

  const payload = {
    username: "Legend Army Auction Bot",
    avatar_url: "https://legend-army-hub.vercel.app/favicon.ico",
    embeds: [
      {
        title: "🔔 New Bid Request (Awaiting Approval)",
        description: `**${nickname}** has requested to enter the queue for **${itemTitle}**. Review and approval required in the Officer Console.`,
        color: 0xf59e0b, // Amber / Pending
        fields: [
          {
            name: "👤 Player (IGN)",
            value: `**${nickname}**`,
            inline: true,
          },
          {
            name: "💬 Discord",
            value: discordTag ? `@${discordTag}` : "—",
            inline: true,
          },
          {
            name: "📦 Requested Item",
            value: `**${itemTitle}**`,
            inline: true,
          },
          {
            name: "⚔️ Level / Quantity",
            value: `Lv ${level} · ${quantity}x`,
            inline: true,
          },
          {
            name: "📊 Status",
            value: "⏳ Pending Officer Review",
            inline: true,
          },
          {
            name: "🔗 Actions",
            value: `[Open Admin Review](${adminUrl}) · [View Auction Arena](${auctionUrl})`,
            inline: false,
          },
        ],
        footer: {
          text: "Legend Army Auction Arena · Pending Approval",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  return sendDiscordWebhook(payload);
}

/**
 * Notifies the guild Discord channel when an officer approves an auction queue registration.
 *
 * Why this exists:
 * Celebrates player verification and informs the entire guild of their assigned queue slot number.
 *
 * @param {Object} params
 * @param {Object} params.signup - Original signup record { nickname, discord_tag, item_title, level, quantity }
 * @param {number} params.slotNumber - Assigned queue slot number
 * @param {string} [params.adminNotes] - Optional note provided during approval
 * @returns {Promise<boolean>}
 */
export async function notifyAuctionSignupApproved({ signup, slotNumber, adminNotes }) {
  const auctionUrl = `${SITE_URL}/auction`;

  const payload = {
    username: "Legend Army Auction Bot",
    avatar_url: "https://legend-army-hub.vercel.app/favicon.ico",
    embeds: [
      {
        title: "✅ Bid Request Approved",
        description: `Registration for **${signup.nickname}** has been approved and placed in the official auction queue!`,
        color: 0x10b981, // Emerald Green / Success
        fields: [
          {
            name: "👤 Player (IGN)",
            value: `**${signup.nickname}**`,
            inline: true,
          },
          {
            name: "💬 Discord",
            value: signup.discord_tag ? `@${signup.discord_tag}` : "—",
            inline: true,
          },
          {
            name: "📦 Item",
            value: `**${signup.item_title}**`,
            inline: true,
          },
          {
            name: "🎯 Assigned Slot",
            value: `👑 **Slot #${slotNumber}**`,
            inline: true,
          },
          {
            name: "⚔️ Level / Quantity",
            value: `Lv ${signup.level} · ${signup.quantity}x`,
            inline: true,
          },
          {
            name: "📝 Officer Note",
            value: adminNotes ? adminNotes.trim() : "Approved into queue",
            inline: true,
          },
          {
            name: "🔗 Live Board",
            value: `[View Live Queue Board](${auctionUrl})`,
            inline: false,
          },
        ],
        footer: {
          text: "Legend Army Auction Arena · Approved & Queued",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  return sendDiscordWebhook(payload);
}

/**
 * Notifies the guild Discord channel when an officer rejects an auction queue registration.
 *
 * Why this exists:
 * Provides transparent accountability for denied requests with the officer's rationale.
 *
 * @param {Object} params
 * @param {Object} params.signup - Original signup record { nickname, discord_tag, item_title, level, quantity }
 * @param {string} [params.adminNotes] - Reason for rejection
 * @returns {Promise<boolean>}
 */
export async function notifyAuctionSignupRejected({ signup, adminNotes }) {
  const auctionUrl = `${SITE_URL}/auction`;

  const payload = {
    username: "Legend Army Auction Bot",
    avatar_url: "https://legend-army-hub.vercel.app/favicon.ico",
    embeds: [
      {
        title: "❌ Bid Request Rejected",
        description: `Registration for **${signup.nickname}** on **${signup.item_title}** was declined.`,
        color: 0xef4444, // Crimson Red / Error
        fields: [
          {
            name: "👤 Player (IGN)",
            value: `**${signup.nickname}**`,
            inline: true,
          },
          {
            name: "💬 Discord",
            value: signup.discord_tag ? `@${signup.discord_tag}` : "—",
            inline: true,
          },
          {
            name: "📦 Requested Item",
            value: `**${signup.item_title}**`,
            inline: true,
          },
          {
            name: "🚫 Rejection Reason",
            value: adminNotes ? adminNotes.trim() : "Requirements not met or slot unavailable",
            inline: false,
          },
          {
            name: "🔗 Auction Arena",
            value: `[View Live Auction Board](${auctionUrl})`,
            inline: false,
          },
        ],
        footer: {
          text: "Legend Army Auction Arena · Rejected",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  return sendDiscordWebhook(payload);
}
