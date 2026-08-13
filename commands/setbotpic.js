import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { getSetting } from '../settings.js';

export default {
  info: { 
    name: "setbotpic", 
    alias: ["setppbot", "setbotpp"] 
  },

  execute: async (m, sock, args, text, ctx) => {
    const { jid, sender } = ctx;

    try {
      // 1. Owner Permission Check
      const ownerNumber = getSetting('owner.number').replace(/\D/g, '') + '@s.whatsapp.net';
      const isOwner = sender.includes(ownerNumber);

      if (!isOwner) {
        return await sock.sendMessage(jid, { 
          text: "❌ *Access Denied:* Only the bot owner can change the bot profile picture." 
        }, { quoted: m });
      }

      // 2. Locate Image Message (Direct Image or Quoted Image)
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const imageMessage = m.message?.imageMessage || quoted?.imageMessage;

      if (!imageMessage) {
        return await sock.sendMessage(jid, { 
          text: "⚠️ *Usage:* Reply to an image or send an image with caption *.setbotpic*." 
        }, { quoted: m });
      }

      // Send Processing Reaction/Message
      await sock.sendMessage(jid, { react: { text: '🔄', key: m.key } });

      // 3. Download the Image Buffer
      const stream = await downloadContentFromMessage(imageMessage, 'image');
      let buffer = Buffer.from([]);
      
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      // 4. Update the Bot's Profile Picture
      const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      await sock.updateProfilePicture(botJid, buffer);

      // Success Reaction and Message
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
      return await sock.sendMessage(jid, { 
        text: "🖼️ *Success:* Bot profile picture has been updated!" 
      }, { quoted: m });

    } catch (error) {
      console.error("SetBotPic Error:", error);
      await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
      return await sock.sendMessage(jid, { 
        text: "❌ *Failed:* Could not update profile picture. Ensure the image is valid." 
      }, { quoted: m });
    }
  }
};
