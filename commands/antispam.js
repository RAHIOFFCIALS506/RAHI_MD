export default {
  info: { 
    name: "antispam", 
    alias: ["aspam"] 
  },

  execute: async (m, sock, args, text, ctx) => {
    const { jid } = ctx;
    const option = args[0]?.toLowerCase();

    if (!option) {
      return await sock.sendMessage(jid, { 
        text: "⚠️ *Anti-Spam Setup*\n\nUsage:\n*.antispam on* — Enable spam protection\n*.antispam off* — Disable spam protection" 
      }, { quoted: m });
    }

    if (option === 'on') {
      global.antispam = true;
      await sock.sendMessage(jid, { text: "✅ *Anti-Spam is now ON.* Spammers will be restricted." }, { quoted: m });
    } else if (option === 'off') {
      global.antispam = false;
      await sock.sendMessage(jid, { text: "🚫 *Anti-Spam is now OFF.*" }, { quoted: m });
    }
  }
};
