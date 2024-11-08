const dotenv = require("dotenv").config();
const {
	Client,
	Collection,
	Events,
	GatewayIntentBits,
	User,
	ButtonInteraction,
	Collector,
	ButtonComponent,
} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const {
	readData,
	handleCaptureDetails,
	switchInventory,
} = require("./modules/functions");

const TOKEN = process.env.DISCORD_TOKEN; // Discord Bot Token
const REQUIRED_ROLE = "1169773205100171294"; // Crucio Member role
const STOP_BUTTON_ID = "Stop-Capturing";

// Defined bot intents as per bot access requirements.
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent,
	],
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

// Handles slash command execution.
for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs
		.readdirSync(commandsPath)
		.filter((file) => file.endsWith(".js"));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ("data" in command && "execute" in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(
				`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
			);
		}
	}
}

// Assigns bot in using bot auth token.
client.login(TOKEN);

client.on(Events.InteractionCreate, async (interaction) => {
	const isButtonInteraction = interaction.isButton();
	const isChatInputCommand = interaction.isCommand();

	// If interaction is button, will handle button based on button id.
	if (isButtonInteraction && interaction.customId === STOP_BUTTON_ID) {
		// Ensure that the interaction is of type ButtonInteraction
		if (interaction instanceof ButtonInteraction) {
			const originalInteraction = interaction.message.interaction;

			if (
				originalInteraction.user instanceof User &&
				interaction.user instanceof User
			) {
				// Compare the user who clicked the button with the user who originally created the interaction
				if (originalInteraction.user.id === interaction.user.id) {
					const warzoneLog = readData(interaction);
					handleCaptureDetails(interaction, warzoneLog);
				} else {
					// Prevents other users from using the embedded.
					interaction.reply({
						content:
							"You can't click this button because you didn't create the original interaction.",
						ephemeral: true,
					});
				}
			}
		}
		return;
	}

	if (isButtonInteraction) {
		if (interaction.customId === "toggleInventory") {
			await switchInventory(interaction);
		}
	}
	if (isChatInputCommand) {
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName}`);
			return;
		}

		// Check if the interaction is in a guild context
		if (interaction.guild) {
			const member = interaction.guild.members.cache.get(interaction.user.id);
			const requiredRole = interaction.guild.roles.cache.find(
				(role) => role.id === REQUIRED_ROLE
			);

			if (!member.roles.cache.has(requiredRole.id)) {
				interaction.reply(
					"You do not have the required permissions to use this command."
				);
				return;
			}
		}
		// Will attempt to execute code
		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({
					content: "There was an error while executing this command!",
					ephemeral: true,
				});
			} else {
				await interaction.reply({
					content: "There was an error while executing this command!",
					ephemeral: true,
				});
			}
		}
	}
});
