export default {
    info: {
        name: "admin",
        alias: ["manage"]
    },
    execute: async (m, sock, args, text, ctx) => {
        const { jid } = ctx;
        const command = args[0]?.toLowerCase(); // e.g., .admin kick
        const target = m.mentionedJid?.[0] || m.message.extendedTextMessage?.contextInfo?.participant;

        // Ensure bot is Admin
        const groupMetadata = await sock.groupMetadata(jid);
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmin = groupMetadata.participants.find(p => p.id === botId)?.admin;

        if (!isBotAdmin) {
            return await sock.sendMessage(jid, { text: "❌ I need to be an Admin to perform this action!" });
        }

        switch (command) {
            case 'kick':
                if (!target) return await sock.sendMessage(jid, { text: "⚠️ Tag someone to kick." });
                await sock.groupParticipantsUpdate(jid, [target], "remove");
                await sock.sendMessage(jid, { text: `✅ Kicked @${target.split('@')[0]}`, mentions: [target] });
                break;

            case 'promote':
                if (!target) return await sock.sendMessage(jid, { text: "⚠️ Tag someone to promote." });
                await sock.groupParticipantsUpdate(jid, [target], "promote");
                await sock.sendMessage(jid, { text: `✅ Promoted @${target.split('@')[0]}`, mentions: [target] });
                break;

            case 'demote':
                if (!target) return await sock.sendMessage(jid, { text: "⚠️ Tag someone to demote." });
                await sock.groupParticipantsUpdate(jid, [target], "demote");
                await sock.sendMessage(jid, { text: `✅ Demoted @${target.split('@')[0]}`, mentions: [target] });
                break;

            case 'mute':
                await sock.groupSettingUpdate(jid, 'announcement');
                await sock.sendMessage(jid, { text: "🔒 Group is now muted (only admins can send messages)." });
                break;

            case 'unmute':
                await sock.groupSettingUpdate(jid, 'not_announcement');
                await sock.sendMessage(jid, { text: "🔓 Group is now unmuted." });
                break;

            default:
                await sock.sendMessage(jid, { text: "📋 *Admin Commands:*\n.admin kick @user\n.admin promote @user\n.admin demote @user\n.admin mute\n.admin unmute" });
        }
    }
};
