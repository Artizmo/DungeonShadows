import fs from "fs";

export default function getLocalFile<T>(path: string, callback: (data: T) => void) {
fs.readFile(path, (err, data) => {
  if (err) console.log(`Could not read from path: ${path}. Error: ${err}`);

  try {
    const fileData: T = JSON.parse(data.toString());
    callback(fileData);
  } catch (error) {
    console.log(`Game failed to fetch config data: ${error}`);
  }
});
}