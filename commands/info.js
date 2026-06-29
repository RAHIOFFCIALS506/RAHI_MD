export default {
  info: {
    name: 'info',
    alias: ['botinfo', 'about'],
    desc: 'Get information about the bot'
  },
  execute: async (m, sock) => {
    try {
      const botName = "My WhatsApp Bot";
      const developer = "Mohammad Rahi";
      const version = "1.0.0";
      
      const imageUrl = "https://i.postimg.cc/05p6KqCc/1768548671157.jpg";
      
      const infoMessage = `
🤖 *Bot Information*

📌 *Bot Name:* ${botName}
💻 *Developer:* ${developer}
⚙️ *Version:* ${version}
🚀 *Status:* Online

This bot was developed by ${developer}. Thank you for using it!
      `;

      await sock.sendMessage(m.key.remoteJid, { 
        image: { url: imageUrl }, 
        caption: infoMessage 
      }, { quoted: m });

    } catch (error) {
      console.log("Error details:", error);
      await sock.sendMessage(m.key.remoteJid, { text: 'Sorry, I failed to load the image.' }, { quoted: m });
    }
  }
}
