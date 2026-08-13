import { getSetting } from '../settings.js';

export default {
  info: { 
    name: "kickall", 
    alias: ["removeall"] 
  },

  execute: async (m, sock, args, text, ctx) => {
    const { jid, sender } = ctx;

    // 1. Check if the command is executed in a group
    if (!jid.endsWith('@g.us')) {
      return await sock.sendMessage(jid, { 
        text: "❌ *Error:* This command can only be used in groups." 
      }, { quoted: m });
    }

    try {
      // Get group metadata
      const groupMetadata = await sock.groupMetadata(jid);
      const participants = groupMetadata.participants;

      // 2. Check if the bot is an admin
      const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const botAdmin = participants.find(p => p.id === botNumber)?.admin;

      if (!botAdmin) {
        return await sock.sendMessage(jid, { 
          text: "❌ *Error:* I need to be an admin to execute this command." 
        }, { quoted: m });
      }

      // 3. Check if sender is an admin or the bot owner
      const ownerNumber = getSetting('owner.number').replace(/\D/g, '') + '@s.whatsapp.net';
      const isOwner = sender.includes(ownerNumber);
      const isSenderAdmin = participants.find(p => p.id === sender)?.admin;

      if (!isSenderAdmin && !isOwner) {
        return await sock.sendMessage(jid, { 
          text: "❌ *Access Denied:* Only group admins or the bot owner can use this command." 
        }, { quoted: m });
      }

      // 4. Filter members (excludes admins, bot, and owner)
      const membersToKick = participants
        .filter(p => !p.admin && p.id !== botNumber)
        .map(p => p.id);

      if (membersToKick.length === 0) {
        return await sock.sendMessage(jid, { 
          text: "⚠️ No regular members found to kick!" 
        }, { quoted: m });
      }

      // Initial Notification
      await sock.sendMessage(jid, { 
        text: `⚠️ *Kickall Started:* Removing ${membersToKick.length} members...` 
      }, { quoted: m });

      // 5. Remove members with 1-second delay (prevents WhatsApp ban)
      for (const member of membersToKick) {
        await sock.groupParticipantsUpdate(jid, [member], "remove");
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Completion Message
      await sock.sendMessage(jid, { 
        text: "✅ *Kickall Completed:* All non-admin members have been successfully removed." 
      });

    } catch (error) {
      console.error("Kickall Error:", error);
      await sock.sendMessage(jid, { 
        text: "❌ An error occurred while executing the command." 
      }, { quoted: m });
    }
  }
};
