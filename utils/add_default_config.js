var fs = require('fs'),
    jsonfile = require('jsonfile');

var defaultConfig,
    baseConfigFileLocation

baseConfigFileLocation = '/plugins/config/default.json';

defaultConfig = {
  "logging": {
    "logFilePath": "/var/log/nextract.log"
  },

  "databases": {
    "nextract_sample": {
      "dialect": "mysql",
      "host": "127.0.0.1",
      "port": 3306,
      "name": "nextract",
      "user": "root",
      "password": ""
    }
  },

  "collections": {
    "sizeToBackground": 1000
  }
};

jsonfile.writeFile('src/' + baseConfigFileLocation, defaultConfig, {spaces:2}, function (err) {
  if (err) {
    console.error("Unable to write default src config file!");
  } else {
    //Copy over to the build area as well since non-devs won't run "grunt dev"
    fs.createReadStream('src/' + baseConfigFileLocation)
      .pipe(fs.createWriteStream('build/' + baseConfigFileLocation));
  }
});
