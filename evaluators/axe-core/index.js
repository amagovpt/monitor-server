"use strict";

const args = process.argv;

let url = args[2];

console.log({
  engine: "Axe-core",
  metadata: "ola",
  url: url,
  some: "blabla"
});