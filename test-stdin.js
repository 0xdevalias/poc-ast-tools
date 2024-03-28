#!/usr/bin/env node

const { once } = require('events');

async function main() {
  process.stdin.setEncoding('utf8');

  if (process.stdin.isTTY) {
    console.log('stdin is connected to the terminal');
  } else {
    console.log('stdin is being piped from another process or file');
  }

  let dataReceived = false;

  process.stdin.on('readable', () => {
    const chunk = process.stdin.read();
    if (chunk !== null) {
      dataReceived = true;
    }
  });

  process.stdin.on('end', () => {
    if (!dataReceived) {
      console.error('Error: No data received on stdin.');
      process.exit(1);
    }
  });

  // Set a timeout to handle cases where there's no input
  setTimeout(() => {
    if (!dataReceived) {
      console.error('Error: No data received on stdin.');
      process.exit(1);
    }
  }, 1000);  // wait for 1 second
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
