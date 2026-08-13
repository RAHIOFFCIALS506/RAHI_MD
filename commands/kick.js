import { getSetting } from '../settings.js';

export default {
  info: { 
    name: "kick", 
    alias: ["remove"] 
  },

  execute: async (m, sock, args, text, ctx) => {
    const { jid, sender } = ctx;

    // 1. Ensure command is used in a group
    if (!jid.endsWith('@g.us')) {
      return await sock.sendMessage(jid, { 
        text: "❌ *Error:* This command can only be used in group chats." 
      }, { quoted: m });
    }

    try {
      const groupMetadata = await sock.groupMetadata(jid);
      const participants = groupMetadata.participants;

      // 2. Check if the bot is an admin
      const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const isBotAdmin = participants.find(p => p.id === botNumber)?.admin;

      if (!isBotAdmin) {
        return await sock.sendMessage(jid, { 
          text: "❌ *Error:* I need to be a group admin to kick members." 
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

      // 4. Identify target user (via mention, reply, or args)
      let target;
      
      // Check mentioned JID
      const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      // Check quoted message sender
      const quotedSender = m.message?.extendedTextMessage?.contextInfo?.participant;

      if (mentionedJid) {
        target = mentionedJid;
      } else if (quotedSender) {
        target = quotedSender;
      } else if (args[0]) {
        // Formulate target JID from argument number
        const cleanNumber = args[0].replace(/\D/g, '');
        if (cleanNumber.length >= 7) {
          target = `${cleanNumber}@s.whatsapp.net`;
        }
      }

      if (!target) {
        return await sock.sendMessage(jid, { 
          text: "⚠️ *Usage:* Reply to a message, tag a user, or type their number.\n\n*Examples:*\n• `.kick @user`\n• `.kick 8801700000000`" 
        }, { quoted: m });
      }

      // 5. Prevent kicking the bot itself or other admins
      if (target === botNumber) {
        return await sock.sendMessage(jid, { 
          text: "❌ You cannot kick the bot using this command!" 
        }, { quoted: m });
      }

      const isTargetAdmin = participants.find(p => p.id === target)?.admin;
      if (isTargetAdmin) {
        return await sock.sendMessage(jid, { 
          text: "❌ Cannot kick this user because they are a group admin." 
        }, { quoted: m });
      }

      // 6. Execute Kick
      await sock.groupParticipantsUpdate(jid, [target], "remove");
      
      return await sock.sendMessage(jid, { 
        text: `✅ Successfully removed @${target.split('@')[0]} from the group.`,
        mentions: [target]
      }, { quoted: m });

    } catch (error) {
      console.error("Kick Error:", error);
      await sock.sendMessage(jid, { 
        text: "❌ Failed to kick user. Please check if the user is still in the group." 
      }, { quoted: m });
    }
  }
};
