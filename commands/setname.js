import { getSetting } from '../settings.js';

export default {
  info: { 
    name: "setname", 
    alias: ["setbotname", "setgroupname"] 
  },

  execute: async (m, sock, args, text, ctx) => {
    const { jid, sender } = ctx;

    // Check if new name text was provided
    if (!text) {
      return await sock.sendMessage(jid, { 
        text: "⚠️ *Usage:* Provide the new name.\n\n*Examples:*\n• `.setname My Bot Name` (In Private Chat - Changes Bot Name)\n• `.setname New Group Title` (In Group Chat - Changes Group Name)" 
      }, { quoted: m });
    }

    try {
      const isGroup = jid.endsWith('@g.us');

      // --- 1. GROUP NAME CHANGE ---
      if (isGroup) {
        const groupMetadata = await sock.groupMetadata(jid);
        const participants = groupMetadata.participants;

        // Check if bot is admin
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmin = participants.find(p => p.id === botNumber)?.admin;

        if (!isBotAdmin) {
          return await sock.sendMessage(jid, { 
            text: "❌ *Error:* I need to be a group admin to change the group name." 
          }, { quoted: m });
        }

        // Check if sender is admin or bot owner
        const ownerNumber = getSetting('owner.number').replace(/\D/g, '') + '@s.whatsapp.net';
        const isOwner = sender.includes(ownerNumber);
        const isSenderAdmin = participants.find(p => p.id === sender)?.admin;

        if (!isSenderAdmin && !isOwner) {
          return await sock.sendMessage(jid, { 
            text: "❌ *Access Denied:* Only group admins or the bot owner can change the group name." 
          }, { quoted: m });
        }

        // Update Group Subject
        await sock.groupUpdateSubject(jid, text);
        return await sock.sendMessage(jid, { 
          text: `✅ *Success:* Group name updated to:\n*"${text}"*` 
        }, { quoted: m });
      } 
      
      // --- 2. BOT NAME CHANGE (In Private Chat / DM) ---
      else {
        const ownerNumber = getSetting('owner.number').replace(/\D/g, '') + '@s.whatsapp.net';
        const isOwner = sender.includes(ownerNumber);

        if (!isOwner) {
          return await sock.sendMessage(jid, { 
            text: "❌ *Access Denied:* Only the bot owner can change the bot's name." 
          }, { quoted: m });
        }

        // Update Profile Name
        await sock.updateProfileName(text);
        return await sock.sendMessage(jid, { 
          text: `✅ *Success:* Bot profile name changed to:\n*"${text}"*` 
        }, { quoted: m });
      }

    } catch (error) {
      console.error("SetName Error:", error);
      await sock.sendMessage(jid, { 
        text: "❌ *Failed:* Could not update the name. Make sure the text isn't too long." 
      }, { quoted: m });
    }
  }
};
