export default {
  info: {
    name: 'uptime',
    alias: ['runtime', 'rt'],
    desc: 'Check how long the bot has been running',
    category: 'other' // মেনুতে দেখানোর জন্য
  },
  execute: async (m, sock) => {
    const seconds = process.uptime();
    const h = Math.floor(seconds / 3600);
    const min = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    // একটি সুন্দর মেসেজ ফরম্যাট
    const uptimeText = `╭━━━〔 UPTIME 〕━━━⬣
┃ ✦ Bot Status : Online 🟢
┃ ✦ Runtime : ${h}h ${min}m ${s}s
╰━━━━━━━━━━━━━━⬣

> The bot has been running smoothly without any interruptions.`;
    
    await sock.sendMessage(m.key.remoteJid, { 
      text: uptimeText 
    }, { quoted: m });
  }
}
