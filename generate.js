const sleep = require('sleep-promise');
const tone = require('tonegenerator');
const header = require('waveheader');
const fs = require('fs-extra');
const player = require('play-sound')(opts = {});
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');

const optionDefinitions = [
	{
		name: 'help',
		alias: '?',
		type: Boolean,
		description: 'Prints this help message.',
	},
	{
		name: 'no-demo',
		alias: 'n',
		type: Boolean,
		description: 'Turns off the demonstration of the synthesized text (i.e. only output is the .wav files).',
	},
	{
		name: 'character',
		alias: 'c',
		type: String,
		description: '{bold The character voice name. Required for output folder name.}',
	},
	{
		name: 'characterPreset',
		alias: 'p',
		type: String,
		description: '{bold Character preset .json file.}',
		typeLabel: '<file>',
	},
	{
		name: 'text',
		alias: 't',
		type: String,
		description: '{bold The text to synthetize, overrides --file.}',
	},
	{
		name: 'file',
		alias: 'f',
		type: String,
		description: '{bold Input .txt file.}',
		typeLabel: '<file>'
	},
	{
		name: 'characterLength',
		type: Number,
		description: 'Time length of each character. Default 50.',
		typeLabel: '<ms>',
	},
	{
		name: 'spaceLength',
		type: Number,
		description: 'Time length of each space between words. Default 20.',
		typeLabel: '<ms>',
	},
	{
		name: 'punctuationLength',
		type: Number,
		description: 'Time length of break after each punctuation mark. Default 200.',
		typeLabel: '<ms>',
	},
	{
		name: 'punctuationFrequencyOffset',
		type: Number,
		description: 'Frequency offset for syllables which end in a period or question mark. Default -120. Opposite for a question mark (default 120).',
		typeLabel: '<Hz>',
	},
	{
		name: 'speedMultiplier',
		type: Number,
		description: 'Multiplier for the speed of the text. Default 1.',
	},
	{
		name: 'frequencyMultiplier',
		type: Number,
		description: 'Multiplier for the frequency of the voice. Default 1.',
	},
	{
		name: 'volumeMultiplier',
		type: Number,
		description: 'Multiplier for the volume of the voice. Default 0.75.',
	},
	{
		name: 'exclamationSpeedMultiplier',
		type: Number,
		description: 'Multiplier for the speed of the text in sentences ending in exclamation mark. Default 1.75.',
	},
];

const options = commandLineArgs(optionDefinitions);

const usageSections = [
	{
		header: ' 📻 {underline dialog-synth}',
		content: 'An abstract dialogue synthesizer for games or other audio-visual projects. \n\nOutput is demonstrated {bold with audio} unless the --no-demo option is set. Output files are split into individual sentences. \n\nCreated by Tadeas Jun. More at: https://www.tadeasjun.com/ or on GitHub (@Tadeas-Jun).',
	},
	{
		header: ' {underline Options}',
		optionList: optionDefinitions,
	}
];

if (options.help) {
	const usage = commandLineUsage(usageSections);
	console.log(usage);
	return;
}

/* Set-up constants */
let character;
if (options.character) {
	character = { name: options.character };
} else if (options.characterPreset) {
	const file = fs.readFileSync(options.characterPreset);
	character = JSON.parse(file);

	if (!character.name) {
		character = null;
	}
}

const frequencyRange = [250, 350];
const midFrequency = (frequencyRange[0] + frequencyRange[1]) / 2;

const characterLength = options.characterLength || character?.characterLength || 50;
const spaceLength = options.spaceLength || character?.spaceLength || 20;
const punctuationLength = options.punctuationLength || character?.punctuationLength || 200;

const punctuationFrequencyOffset = options.punctuationFrequencyOffset || character?.punctuationFrequencyOffset || -120;

const speedMultiplier = options.speedMultiplier || character?.speedMultiplier || 1;
const frequencyMultiplier = options.frequencyMultiplier || character?.frequencyMultiplier || 1;
const volumeMultiplier = options.volumeMultiplier || character?.volumeMultiplier || 0.75;

const exclamationSpeedMultiplier = options.exclamationSpeedMultiplier || character?.exclamationSpeedMultiplier || 1.75;

let text;
if (options.text) {
	text = options.text;
} else if (options.file) {
	const file = fs.readFileSync(options.file);
	text = file.toString();
}

if (!character) {
	console.log("The --character or --characterPreset option must be set. If the --characterPreset option is set, the .json file must contain a name key.");
	return;
}

if (!text) {
	console.log("The --text or --file option must be set.");
	return;
}

const filePath = './output/' + character.name + '/';

/* Execution */
const syllableRegex = /[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi;
function getSyllables(words) {
	return words.match(syllableRegex);
}

const punctuationRegex = /[,.!?]$/gi;

function getEmptyTone(lenght) {

	return [
		getTaperTone(lenght / 4 / 1000),
		tone({freq: 50, lengthInSecs: (lenght / 2 / 1000), volume: -tone.MAX_8 * volumeMultiplier}),
		getTaperTone(lenght / 4 / 1000),
	];
}

function getTaperTone(lenght) {
	return tone({freq: midFrequency * frequencyMultiplier, lengthInSecs: (lenght / 1000), volume: (tone.MAX_8 * volumeMultiplier)});
}

function randomInt(previous, range, min, max) {

	min = Math.max(previous - range, min);
	max = Math.min(previous + range, max);

	return Math.floor(Math.random() * (max - min + 1) + min);
}

function waveFormShape(i, cycle, volume) {

	let level = (((2 * volume) / Math.PI) * Math.asin(Math.sin((2 * Math.PI * i) / cycle)));

    return Math.min(level, (tone.MAX_8 * volumeMultiplier) - 16);

}

const sentenceRegex = /([^\.!\?]+[\.!\?]+)|([^\.!\?]+$)/gi;
const sentences = text.match(sentenceRegex).map(s => s.trimStart());

let previousFrequency = midFrequency;

let files = [];

(async () => {

	await fs.ensureDir(filePath);

	for (const sentence of sentences) {

		if (!sentence) {
			continue;
		}

		let tones = [];

		let sentenceSpeed = speedMultiplier;
		if (sentence.endsWith('!')) {
			sentenceSpeed *= exclamationSpeedMultiplier;
		}

		const syllables = sentence.split(' ').map(getSyllables);

		sentenceSpeed = (1 / sentenceSpeed);

		for (const word of syllables) {

			if (!word) continue;

			for (const syllable of word) {

				if (!syllable) continue;

				const syllableLength = syllable.split('').length;

				const startFrequency = randomInt(previousFrequency, midFrequency / 2, frequencyRange[0], frequencyRange[1]);
				previousFrequency = startFrequency;
				let frequency = startFrequency * frequencyMultiplier;

				if (syllable.endsWith('.')) {
					frequency += punctuationFrequencyOffset;
				} else if (syllable.endsWith('?')) {
					frequency += -punctuationFrequencyOffset;
				}

				// Add the syllable
				tones.push(
					tone(
						{
							freq: frequency,
							lengthInSecs: ((characterLength * syllableLength * sentenceSpeed) / 1000),
							volume: tone.MAX_8 * volumeMultiplier,
							shape: waveFormShape,
						}
					)
				);

				// Add a punctuation break
				if (syllable.match(punctuationRegex)) {
					tones.push(getEmptyTone(punctuationLength * sentenceSpeed));
				}

			}

			// Add a space break
			tones.push(getTaperTone(spaceLength * sentenceSpeed));
		}

		const fileName =  sentences.indexOf(sentence) + '_' + sentence.substring(0, 19).trimStart().trimEnd().replace(' ', '_');
		const fullPath = filePath + fileName + '.wav';
		let file = fs.createWriteStream(fullPath);

		let samples = tones[0].concat(...tones);

		file.write(header(samples.length, {
			bitDepth: 8
		}));

		// Convert -128 -> 127 range into 0 -> 255
		let data = Uint8Array.from(samples, function (val) {
			return val + 128;
		})

		buffer = Buffer.from(data);
		file.write(buffer);
		file.end();

		files.push(fullPath);

	}

	// Print text and play sound
	if (!options['no-demo']) {

		console.log('\n');

		process.stdout.write("*" + character.name.toUpperCase() + ": ");
		for (const sentence of sentences) {

			if (!sentence) {
				continue;
			}

			const sentenceIndex = sentences.indexOf(sentence);
			player.play(files[sentenceIndex]);

			let sentenceSpeed = speedMultiplier;
			if (sentence.endsWith('!')) {
				sentenceSpeed *= exclamationSpeedMultiplier;
			}

			const syllables = sentence.split(' ').map(getSyllables);

			sentenceSpeed = (1 / sentenceSpeed);

			for (const word of syllables) {

				if (!word) continue;

				for (const syllable of word) {

					if (!syllable) continue;

					// Write the syllable
					for (const character of syllable.split('')) {
						process.stdout.write(character);
						await sleep(characterLength * sentenceSpeed);
					}

					// Add a punctuation break
					if (syllable.match(punctuationRegex)) {
						await sleep(punctuationLength * sentenceSpeed);
					}

				}

				// Add a space break
				await sleep(spaceLength * sentenceSpeed);
				process.stdout.write(' ');

			}

			await sleep(punctuationLength * sentenceSpeed);

		}

		console.log('\n');

	}

})();
