import { getSetting } from '../settings.js'

export default {
    info: {
        name: 'kick',
        alias: ['remove'],
        desc: 'Kick a member from the group'
    },
    execute: async (m, sock) => {
        try {
            const jid = m.key.remoteJid
            if (!jid.endsWith('@g.us')) {
                return await sock.sendMessage(jid, { text: '❌ *This command can only be used in groups!*' }, { quoted: m })
            }

            const groupMetadata = await sock.groupMetadata(jid)
            const sender = m.key.participant || m.key.remoteJid
            const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net'

            // Check if Sender is Admin
            const senderAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin
            if (!senderAdmin && !m.key.fromMe) {
                return await sock.sendMessage(jid, { text: '❌ *Only Group Admins can use this command!*' }, { quoted: m })
            }

            // Check if Bot is Admin
            const botAdmin = groupMetadata.participants.find(p => p.id === botJid)?.admin
            if (!botAdmin) {
                return await sock.sendMessage(jid, { text: '❌ *I need to be an Admin to kick members!*' }, { quoted: m })
            }

            // Target user finding
            let target
            const quotedMsg = m.message?.extendedTextMessage?.contextInfo
            if (quotedMsg?.participant) {
                target = quotedMsg.participant
            } else if (quotedMsg?.mentionedJid?.length > 0) {
                target = quotedMsg.mentionedJid[0]
            }

            if (!target) {
                return await sock.sendMessage(jid, { text: '⚠️ *Please reply to a user\'s message or mention them to kick!*' }, { quoted: m })
            }

            // Perform Kick Action
            await sock.groupParticipantsUpdate(jid, [target], 'remove')
            await sock.sendMessage(jid, { 
                text: `✅ @${target.split('@')[0]} has been kicked out!`, 
                mentions: [target] 
            }, { quoted: m })

        } catch (error) {
            console.error("Kick Error:", error)
            await sock.sendMessage(m.key.remoteJid, { text: '❌ *Failed to kick user.*' }, { quoted: m })
        }
    }
}
