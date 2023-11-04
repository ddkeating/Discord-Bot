const { SlashCommandBuilder } = require('discord.js');
const { startTimer } = require('../../modules/functions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start-capturing')
        .setDescription('Takes a record of Gang funds and current time.'),
    async execute(interaction) {
        await startTimer(interaction)
    }
    
}