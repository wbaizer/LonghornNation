
# Sidebar


This repo is for generating spritehseets, updating the sidebar schedule and updating the stylesheet.


To install:
`npm install`
Copy the `env.sample` as `.env` edit the details

We are using PM2 to run the script every day at midnight. This is done via the `worker.js` file. Once you have PM2 installed globally. You can just run `pm2 start worker.js` and it will run everyday at midnight.

## LHN CLI
The CLI allows you to easily perform actions from the command line. The available actions right now are:

 - Update Sidebar
 - Update Stylesheet
 - Generate Spritesheet
 - Send Message (just sends a test message to discord channel)

To run the CLI:
`node index.js` select the action you would like to perform.

### Generating Spritesheets
You can easily generate new spritesheets using the CLI.

First thing is to upload a new image to the `/src/images` folder make sure you put it in the correct folder. Take note of the filename pattern we are using. The filename is used for the key of the object. So if the image is `F11.png` then the key for that object would be `F11`. Once you have generated your spritesheeet, you can get the image from `/src/images/sprite.png`. At this time you need to manually update the image.

#### Custom
This is used for all custom flair.

Image path `/src/images/custom`
JSON path `/static_data/custom-flair.json`

Example JSON
```
"F11": {
	"reddit": "/texas3",
	"flair": "texas3"
}
```

#### Networks
Image path `/src/images/networks`
JSON path `/static_data/custom-flair.json`
Example JSON
```
"N11": {
	"reddit": "/espn",
	"flair": "espn"
}
```

#### Teams
 Image Path
 - `/src/images/teams` this is for all the teams
	 - `/src/images/teams/20x20` this is for all logos 20x20 (this is the one we use)
	 - `/src/images/teams/500x500` we don't use this for spritesheets

JSON path `/static_data/teams.json`
Example JSON
```
"6": {
    "conference": "Sun Belt Conference",
    "name": "South Alabama Jaguars",
    "abbreviation": "SALA",
    "logo": "https://a.espncdn.com/i/teamlogos/ncaa/500/6.png",
    "reddit": "/r/SIYM",
    "flair": "southalabama"
}
```

### Updating Stylesheet
You can update and upload the stylesheet strait from the LHN CLI. 
The location of the stylesheet is `/src/style.scss`.

Once you have made your changes just select update stylesheet from the CLI menu and it will update the subreddit.

### Manually Updating the Sidebar
You can also update the sidebar manually, by select that action from the CLI menu.
