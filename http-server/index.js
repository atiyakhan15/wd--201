//to run through terminal
//PS C:\Users\GHRCE\WD201\http-server> node index.js --port 5000
//in explorer http://localhost:5000/

const args = require("minimist")(process.argv.slice(2));
port1 = args.port
console.log(args.port); // prints the value of the --port option

const http = require("http");
const fs = require("fs");

let home1 = "";
let project1 = "";
let registration1 = "";

fs.readFile("home.html", (err, home) => {
  if (err) {
    throw err;
  }
  home1 = home;
});
fs.readFile("registration.html", (err, registration) => {
  if (err) {
    throw err;
  }
  registration1 = registration;
});
fs.readFile("project.html", (err, project) => {
  if (err) {
    throw err;
  }
  project1 = project;
});
http.createServer((request, response) => {
    let url = request.url;
    response.writeHeader(200, { "Content-Type": "text/html" });
    switch (url) {
      case "/project":
        response.write(project1);
        response.end();
        break;
        case "/registration":
        response.write(registration1);
        response.end();
        break;
      default:
        response.write(home1);
        response.end();
        break;
    }
  })
  .listen(port1);
