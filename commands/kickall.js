import { getSetting } from '../settings.js'

export default {
    info: {
        name: 'kickall',
        alias: ['removeall'],
        desc: 'Kick all non-admin members from the group'
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

            // Check Sender Admin
            const senderAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin
            if (!senderAdmin && !m.key.fromMe) {
                return await sock.sendMessage(jid, { text: '❌ *Only Group Admins can use this command!*' }, { quoted: m })
            }

            // Check Bot Admin
            const botAdmin = groupMetadata.participants.find(p => p.id === botJid)?.admin
            if (!botAdmin) {
                return await sock.sendMessage(jid, { text: '❌ *I need to be an Admin to kick members!*' }, { quoted: m })
            }

            // Filter Non-Admin Users
            const targets = groupMetadata.participants
                .filter(p => !p.admin && p.id !== botJid)
                .map(p => p.id)

            if (targets.length === 0) {
                return await sock.sendMessage(jid, { text: '⚠️ *No non-admin members found to kick!*' }, { quoted: m })
            }

            await sock.sendMessage(jid, { text: `⚠️ *Kicking ${targets.length} non-admin members...*` }, { quoted: m })

            // Batch Kick
            await sock.groupParticipantsUpdate(jid, targets, 'remove')
            await sock.sendMessage(jid, { text: '✅ *All non-admin members have been kicked!*' }, { quoted: m })

        } catch (error) {
            console.error("KickAll Error:", error)
            await sock.sendMessage(m.key.remoteJid, { text: '❌ *Failed to execute KickAll.*' }, { quoted: m })
        }
    }
                                              }
