"use strict";

const args = process.argv;

let url = args[2];

console.log({
  engine: "Qualweb",
  metadata: "ola",
  url: url,
  some: "blabla"
});