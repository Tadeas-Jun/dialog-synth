# 📻 dialog-synth
An abstract dialogue synthesizer for games or other audio-visual projects.

**dialog-synth** is a tool for generating 8-bit abstract voicelines from text. Use it by running `node generate.js` with the appropriate options as described below. The tool generates .wav files in the `/output/` folders.

## Examples
The `input.txt` file contains an example text:

> I found a charming little pond by the meadow. Would you like to come here with me to drown romantically? You must hurry, though, we don't have a lot of time!

This text demonstrates several features of **dialog-synth**. Output files are separated into individual sentences. Intonation drops when near a period and rises near a question mark. There are longer breaks after punctuation, including commas. Sentences ending in an exclamation mark are read faster.

Following are links to examples of the text as read by different character presets (more on those below).

- *I found a charming little pond by the meadow.*, as read by *John Doe*, the default preset [[^](https://github.com/Tadeas-Jun/dialog-synth/blob/main/output/John%20Doe/0_I_found%20a%20charming.wav)].
- *Would you like to come here with me to drown romantically?*, as read by *Rebecca*, a preset with a higher voice and slightly faster reading speed [[^](https://github.com/Tadeas-Jun/dialog-synth/blob/main/output/Rebecca/1_Would_you%20like%20to%20c.wav)].
- *You must hurry, though, we don't have a lot of time!*, as read by *Jordan*, a preset with a deeper voice and slower reading speed [[^](https://github.com/Tadeas-Jun/dialog-synth/blob/main/output/Jordan/2_You_must%20hurry%2C%20tho.wav)].

More examples are available in the `/output/` folder.

## Options
To control the output of **dialog-synth**, run it in the command line with some or all of the following options. You can also run it with the `--help` option to get a list and description of each option in the command line.

- `-?`, `--help`: displays the help message.
- `-n`, `--no-demo`: Turns off the demonstration of the synthesized text (i.e. only output is the .wav files). Without this option set, the code will also write out the input text and **play the generated audio**.

- `-c`, `--character` [string]: Character name. This option (or the `--characterPreset` option) is required, as the output files will be generated in `/output/<character.name>`.
- `-p`, `--characterPreset` [filePath]: A character preset file. This option (or the `--character` option) is required. Presets are `.json` files that contain option specifications for a given character. More on presets below.
- `-t`, `--text` [string]: Input text to be synthesized. This option (or the `--file` option) is required.
- `-f`, `--file` [filePath]: Input `.txt` file to be synthesized. This option (or the `--text` option) is required.

- `--characterLength` [ms]: Time length of each character. *Default 50*.
- `--spaceLength` [ms]: Time length of each space between words. *Default 20*.
- `--punctuationLength` [ms]: Time length of break after each punctuation mark. *Default 200*.
- `--punctuationFrequencyOffset` [Hz]: Frequency offset for syllables which end in a period or question mark. *Default -120*. Opposite for a question mark (i.e. *default 120*).

- `--speedMultiplier`: Multiplier for the speed of the text. *Default 1*.
- `--frequencyMultiplier`: Multiplier for the frequency of the voice. *Default 1*.
- `--volumeMultiplier`: Multiplier for the volume of the voice. *Default 0.75*.
- `--exclamationSpeedMultiplier`: Multiplier for the speed of the text in sentences ending in exclamation mark. *Default 1.75*.

## Presets
Character presets are a way to save sets of options. They are `.json` files with the same structure of the options. When creating a preset, always include a `name` key, but no other keys are mandatory. When synthetizing voice lines, *dialog-synth* first looks at specified options, then at the given character preset (if present), and then at default values. Priority is therefore `options > character preset > default`.

By default, the repo contains three example presents. *John Doe*, the default setting, *Rebecca*, a preset with a higher voice and slightly faster reading speed, and *Jordan*, a preset with a deeper voice and slower reading speed.

## Further reading
I am currently preparing a full case study for this project on my [blog](https://www.tadeasjun.com/blog/).

## Contact
If you have any questions about **dialog-synth**, if you need a JS developer, or if you just want to chat for a while, please feel free to reach out to Tadeas using his email contact@tadeasjun.com, or on Discord - **@tadeasjun**.
