// This controls the functions for all interactions, commands, and responses.
const {
	EmbedBuilder,
	ButtonBuilder,
	ActionRowBuilder,
	ButtonStyle,
} = require("discord.js");

const axios = require("axios");
const { cartelEmbeded, warzoneEmbedded } = require("./embedMessage.js");
const fs = require("fs");

var showVirtualItems = true;

async function updateCartels(message) {
	try {
		const response = await axios.get(
			"https://stats.olympus-entertainment.com/api/v3.0/cartels/",
			{
				headers: {
					accept: "application/json",
					Authorization: process.env.GANG_TOKEN,
				},
			}
		);
		const responseData = response.data;
		const tempArray = [];

		message.reply("Warzone Caps...");
		// Process and send data in custom embeds
		responseData.forEach((entry) => {
			const { server, name, full_name, gang_name, progress } = entry;
			const imagePath = {
				arms: "https://i.imgur.com/TwArxSw.jpg",
				moonshine: "https://i.imgur.com/Q4WWcg3.jpg",
				meth: "https://i.imgur.com/8akwyzN.jpg",
			};

			if (server === 1) {
				const imageURL = imagePath[name.toLowerCase()];
				const tempVal = cartelEmbeded({
					fullName: full_name,
					gangName: gang_name,
					capProgress: progress,
					imagePath: imageURL,
				});
				tempArray.push(tempVal);
				message.channel.send({ embeds: [tempVal] });
			}
		});
	} catch (error) {
		console.error(`An error occurred while fetching data: ${error}`);
		message.channel.send("An error occurred while fetching data.");
	}
}

async function switchInventory(interaction) {
	showVirtualItems = !showVirtualItems;
	await shedInventory(interaction, true);
}

async function getInventoryData() {
	try {
		const response = await axios.get(
			"https://stats.olympus-entertainment.com/api/v3.0/shed-inventory/1207/",
			{
				headers: {
					accept: "application/json",
					Authorization: process.env.GANG_TOKEN,
				},
			}
		);
		return response.data;
	} catch (error) {
		console.error(
			`Caught unexpected error while retrieving shed inventory: ${error}`
		);
		throw error; // Propagate the error for handling elsewhere if needed
	}
}

function buildInventoryEmbed(data, showVirtualItems) {
	const { virtual_inventory, physical_inventory } = data;
	const inventory = showVirtualItems ? virtual_inventory : physical_inventory;
	const inventoryType = showVirtualItems
		? "Virtual Inventory"
		: "Physical Inventory";

	const shedEmbed = new EmbedBuilder()
		.setColor("DarkOrange")
		.setTitle("Shed Inventory")
		.setDescription(inventoryType);

	inventory.forEach((item) => {
		shedEmbed.addFields({
			name: `${item.name}`,
			value: `Quantity: ${item.quantity}`,
			inline: true,
		});
	});

	return shedEmbed;
}

async function shedInventory(message, randomBool) {
	try {
		const data = await getInventoryData();
		const shedEmbed = buildInventoryEmbed(data, showVirtualItems); // Pass showVirtualItems here

		const buttonSwitchInventory = new ButtonBuilder()
			.setCustomId("toggleInventory")
			.setLabel("Switch")
			.setStyle(ButtonStyle.Primary);

		const row = new ActionRowBuilder().addComponents(buttonSwitchInventory);

		if (!randomBool) {
			await message.reply({ embeds: [shedEmbed], components: [row] });
		} else {
			await message.message.edit({ embeds: [shedEmbed], components: [row] });
			await message.deferUpdate();
		}
	} catch (error) {
		console.error(`Caught unexpected error while generating embed: ${error}`);
	}
}

async function startTimer(interaction) {
	try {
		const currentTime = Date.now();
		const response = await axios.get(
			"https://stats.olympus-entertainment.com/api/v3.0/gangs/47740/",
			{
				headers: {
					accept: "application/json",
					Authorization: process.env.GANG_TOKEN,
				},
			}
		);
		const formattedMoney = response.data.bank
			.toString()
			.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		const tempVal = warzoneEmbedded({
			time: Math.floor(currentTime),
			currentGangFunds: formattedMoney,
			user: interaction.member,
		});
		await interaction.reply(tempVal);

		storeData(interaction, formattedMoney, currentTime);
	} catch (error) {
		console.error(error);
		interaction.reply(`There was an unexpected error: ${error}`);
	}
}

async function storeData(interaction, money, time) {
	try {
		const player = interaction.member.id;

		// Load user data from the JSON file
		let userData = {};

		try {
			const data = fs.readFileSync("warzonelogs.json", "utf-8");
			userData = JSON.parse(data);
		} catch (err) {
			console.error("Error reading warzonelogs.json:", err);
		}

		// Define the data you want to store
		const currentGangFunds =
			money; /* Get the current gang funds for the user */

		// Store user-specific data in the JSON object
		userData[player] = {
			currentGangFunds,
			playerName: player,
			currentTime: new Date(time).toLocaleTimeString(),
		};

		// Save the updated user data to the JSON file
		fs.writeFileSync("warzonelogs.json", JSON.stringify(userData, null, 2));
	} catch (error) {
		console.log(error);
	}
}

async function readData(interaction) {
	const playerName = interaction.member.displayName;
	try {
		let foundList = null;
		const data = fs.readFileSync("warzonelogs.json", "utf-8");

		if (data.trim() !== "") {
			const parsedData = JSON.parse(data);

			// Check if the playerName exists in the parsed data
			if (parsedData[playerName]) {
				foundList = parsedData[playerName];
				delete parsedData[playerName];
				fs.writeFileSync(
					"warzonelogs.json",
					JSON.stringify(parsedData, null, 2)
				);
			}
		}

		return foundList;
	} catch (error) {
		console.log("Error reading or parsing warzonelogs.json:", error);
		return null; // Return null in case of errors
	}
}
async function handleCaptureDetails(interaction, data) {
	const dataObject = await data;
	const { currentGangFunds, playerName, currentTime } = dataObject;

	const response = await axios.get(
		"https://stats.olympus-entertainment.com/api/v3.0/gangs/47740/",
		{
			headers: {
				accept: "application/json",
				Authorization: process.env.GANG_TOKEN,
			},
		}
	);

	let newGangBank = response.data.bank;
	let reformattedMoney = currentGangFunds.replace(/,/g, "");
	const diff = newGangBank - reformattedMoney;

	if (isNaN(diff) || diff == 0) {
		interaction.reply(
			`Member @${playerName} made no profit from holding capture points.`
		);
	} else {
		interaction.reply(
			`Member @${playerName} made $${diff.toLocaleString()} from holding capture points.`
		);
	}
}

exports.updateCartels = updateCartels;
exports.shedInventory = shedInventory;
exports.startTimer = startTimer;
exports.storeData = storeData;
exports.readData = readData;
exports.handleCaptureDetails = handleCaptureDetails;
exports.switchInventory = switchInventory;
