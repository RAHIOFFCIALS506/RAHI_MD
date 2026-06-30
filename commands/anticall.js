export default {
  info: { 
    name: "anticall", 
    alias: ["acall"] 
  },

  execute: async (m, sock, args, text, ctx) => {
    const { jid } = ctx;
    const option = args[0]?.toLowerCase();

    // Check for provided option
    if (!option) {
      return await sock.sendMessage(jid, { 
        text: "⚠️ *Anti-Call Setup*\n\nUsage:\n*.anticall on* — Block incoming calls\n*.anticall off* — Allow incoming calls" 
      }, { quoted: m });
    }

    // Update status (using a global variable)
    if (option === 'on') {
      global.anticall = true;
      await sock.sendMessage(jid, { text: "✅ *Anti-Call is now ON.* Any incoming calls will be automatically rejected." }, { quoted: m });
    } else if (option === 'off') {
      global.anticall = false;
      await sock.sendMessage(jid, { text: "🚫 *Anti-Call is now OFF.* Incoming calls are allowed." }, { quoted: m });
    }
  }
};
