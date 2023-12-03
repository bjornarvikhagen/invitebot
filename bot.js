const { Client, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages, // For handling direct messages
        GatewayIntentBits.GuildInvites // For creating invites
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User]
});

const targetEmoji = 'notover'; // The emoji name to listen for
const usedInvitesFile = './usedInvites.json'; // Path to the JSON file

// Read the used invites from the file or initialize it if not present
let usedInvites = {};
if (fs.existsSync(usedInvitesFile)) {
    usedInvites = JSON.parse(fs.readFileSync(usedInvitesFile, 'utf8'));
} else {
    fs.writeFileSync(usedInvitesFile, JSON.stringify(usedInvites));
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the reaction:', error);
            return;
        }
    }

    if (user.partial) {
        try {
            await user.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the user:', error);
            return;
        }
    }

    // Check if the reaction is the specific emoji and if the user has not already used the invite
    if (reaction.emoji.name === targetEmoji && !usedInvites[user.id]) {
        try {
            // Create a one-use, non-expiring invite link
            const invite = await reaction.message.guild.invites.create(reaction.message.channelId, {
                maxUses: 1, // One use only
                maxAge: 0, // Never expires
                unique: true,
                reason: `Invite for user ${user.tag} who reacted with ${targetEmoji}`
            });

            // Send the invite link via DM
            await user.send(`You reacted with '${targetEmoji}' to a message in ${reaction.message.channel.name}. Here is your one-time, non-expiring invite link: ${invite.url}`);

            // Mark the user as having used their invite
            usedInvites[user.id] = true;
            fs.writeFileSync(usedInvitesFile, JSON.stringify(usedInvites));

            console.log(`DM sent to ${user.tag} with invite link. User marked as having used their invite.`);
        } catch (error) {
            console.error('An error occurred:', error);
        }
    }
});

client.login(myToken);
