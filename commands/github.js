export default {
  info: {
    name: 'github',
    alias: ['git', 'repo'],
    desc: 'Displays GitHub profile or repository link'
  },
  execute: async (m, sock, args, text, ctx) => {
    const githubLink = "https://github.com/RAHIOFFCIALS506/RAHI_MD"; // Replace with your link

    const msg = `🚀 *GitHub Profile*

Your GitHub profile or repository link:
${githubLink}

Thanks for staying connected! ✨`;

    await sock.sendMessage(ctx.jid, { text: msg }, { quoted: m });
  }
}
