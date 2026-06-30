export default {
  info: { 
    name: "antisticker", 
    alias: ["asticker"] 
  },

  execute: async (m, sock, args, text, ctx) => {
    const { jid } = ctx;
    const option = args[0]?.toLowerCase();

    if (!option) {
      return await sock.sendMessage(jid, { 
        text: "⚠️ *Anti-Sticker Setup*\n\nUsage:\n*.antisticker on* — Delete stickers automatically\n*.antisticker off* — Allow stickers" 
      }, { quoted: m });
    }

    if (option === 'on') {
      global.antisticker = true;
      await sock.sendMessage(jid, { text: "✅ *Anti-Sticker is now ON.* All stickers will be deleted." }, { quoted: m });
    } else if (option === 'off') {
      global.antisticker = false;
      await sock.sendMessage(jid, { text: "🚫 *Anti-Sticker is now OFF.* Stickers are allowed." }, { quoted: m });
    }
  }
};
