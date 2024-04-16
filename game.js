import { createInterface } from "readline";
import { randomBytes, createHmac } from "crypto";

class Game {
  constructor(moves, generator, rules, table) {
    this.results = ["Draw!", "You Win!", "You Lose!"];
    this.moves = moves;
    this.generator = generator;
    this.rules = rules;
    this.table = table;
  }

  getRandomMove() {
    return Math.floor(Math.random() * this.moves.length);
  }

  generateComputerMove() {
    this.key = this.generator.generateKey();
    this.computerMove = this.moves[this.getRandomMove()];
    this.hmac = this.generator.generateHmac(this.key, this.computerMove);
  }

  async getUserInput() {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    return new Promise((resolve) => {
      rl.question("Enter your move: ", (input) => {
        rl.close();
        resolve(input);
      });
    });
  }

  play(userMoveIndex) {
    this.userMove = this.moves[userMoveIndex - 1];
    const winner = this.rules.determineWinner(this.userMove, this.computerMove);
    this.result = this.results[winner];
  }

  async playGame() {
    this.generateComputerMove();
    while (true) {
      this.displayMenu();
      const userInput = await this.getUserInput();
      if (userInput === "?") {
        this.displayHelp();
        continue;
      }
      const userMoveIndex = parseInt(userInput);
      if (userMoveIndex === 0) {
        console.log("Exiting the game.");
        return;
      }
      if (!this.rules.isValidMove(userMoveIndex)) {
        console.log("Invalid move!");
        continue;
      }
      this.play(userMoveIndex);
      this.displayResult();
      break;
    }
    await this.playGame();
  }

  displayMenu() {
    console.log(`HMAC: ${this.hmac}`);
    console.log("Available moves:");
    this.moves.forEach((move, index) => {
      console.log(`${index + 1} - ${move}`);
    });
    console.log("0 - exit");
    console.log("? - help");
  }

  displayResult() {
    console.log(`Your move: ${this.userMove}`);
    console.log(`Computer move: ${this.computerMove}`);
    console.log(this.result);
    console.log(`HMAC key: ${this.key}`);
    console.log();
  }

  displayHelp() {
    this.table.printTable();
  }
}

class Generator {
  generateKey() {
    return randomBytes(32).toString("hex");
  }

  generateHmac(key, data) {
    const hmac = createHmac("sha256", key);
    hmac.update(data);
    return hmac.digest("hex");
  }
}

class Rules {
  constructor(moves) {
    this.moves = moves;
    this.length = moves.length;
  }

  isValidMove(move) {
    return Number.isInteger(move) && move >= 1 && move <= this.length;
  }

  determineWinner(userMove, computerMove) {
    const userIndex = this.moves.indexOf(userMove);
    const computerIndex = this.moves.indexOf(computerMove);
    switch (computerIndex) {
      case userIndex:
        return 0;
      case (userIndex + 1) % this.length:
      case (userIndex + Math.floor(this.length / 2)) % this.length:
        return 2;
      default:
        return 1;
    }
  }
}

class Table {
  constructor(moves, rules) {
    this.results = ["Draw", "Win", "Lose"];
    this.moves = moves;
    this.rules = rules;
  }

  generateTable() {
    const table = [];
    table.push(["Moves", ...this.moves]);
    this.moves.forEach((userMove) => {
      const row = this.generateRow(userMove);
      table.push(row);
    });
    return table;
  }

  generateRow(userMove) {
    const row = [userMove];
    const cells = this.moves.map((computerMove) =>
      this.generateCell(userMove, computerMove)
    );
    row.push(...cells);
    return row;
  }

  generateCell(userMove, computerMove) {
    const winner = this.rules.determineWinner(userMove, computerMove);
    return this.results[winner];
  }

  printTable() {
    const table = this.generateTable();
    const maxLength = Math.max(...this.moves.map((move) => move.length)) + 2;
    table.forEach((row) => {
      console.log(row.map((cell) => cell.padEnd(maxLength)).join(""));
    });
  }
}

const args = process.argv.slice(2);

function validateArguments(args) {
  const { length } = args;
  const isError =
    length < 3 || length % 2 === 0 || new Set(args).size !== length;
  if (isError) {
    console.error(
      "Invalid arguments! Please provide an odd number of unique moves."
    );
    console.log("Example: node game.js rock paper scissors");
  }
  return !isError;
}

function main(args) {
  if (validateArguments(args)) {
    const moves = args;
    const generator = new Generator();
    const rules = new Rules(moves);
    const table = new Table(moves, rules);
    const game = new Game(moves, generator, rules, table);
    game.playGame();
  }
}

main(args);
