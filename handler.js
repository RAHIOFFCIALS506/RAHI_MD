import { getSetting } from './settings.js';

const spamTracker = new Map();

/**
 * মেসেজ ও ফিচার হ্যান্ডলার
 */
export async function handleMessage(sock, m, commands) {
  if (!m.message) return;

  const jid = m.key.remoteJid;
  const sender = m.key.participant || jid;
  const now = Date.now();

  // ১. অ্যান্টি-স্প্যাম (Anti-Spam)
  if (global.antispam) {
    let history = spamTracker.get(sender) || [];
    history = history.filter(time => now - time < 5000);
    history.push(now);
    spamTracker.set(sender, history);

    if (history.length > 5) {
      await sock.sendMessage(jid, { 
        text: "⚠️ *Stop spamming!* You are being restricted for sending messages too fast." 
      }, { quoted: m });
      
      spamTracker.set(sender, []);
      return; 
    }
  }

  // ২. অ্যান্টি-স্টিকার (Anti-Sticker)
  if (global.antisticker) {
    const isSticker = m.message.stickerMessage || 
                      (m.message.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage);

    if (isSticker) {
      await sock.sendMessage(jid, { 
        delete: { 
          remoteJid: jid, 
          fromMe: false, 
          id: m.key.id, 
          participant: m.key.participant 
        } 
      }).catch(() => {});
      
      await sock.sendMessage(jid, { text: "❌ *Stickers are not allowed here!*" });
      return;
    }
  }

  // ৩. অ্যান্টি-লিংক (Anti-Link)
  const text = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || "";
  if (getSetting('features.antilink') && jid.endsWith('@g.us') && !m.key.fromMe) {
    const linkRegex = /(https?:\/\/)?(chat\.whatsapp\.com|wa\.me)\/([a-zA-Z0-9]+)/gi;
    if (linkRegex.test(text)) {
      await sock.sendMessage(jid, { delete: m.key }).catch(() => {});
      return;
    }
  }

  // ৪. কমান্ড হ্যান্ডলার (Command Executer)
  const prefix = getSetting('bot.prefix');
  if (!text.startsWith(prefix)) return;

  const args = text.slice(prefix.length).trim().split(/ +/);
  const cmdName = args.shift().toLowerCase();
  const command = commands.get(cmdName);

  if (command) {
    try {
      await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });
      await command.execute(m, sock, args, text.slice(prefix.length + cmdName.length).trim(), { jid, sender });
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
    } catch (e) {
      console.error(`Error executing command ${cmdName}:`, e);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
    }
  }
      }
