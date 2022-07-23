//[assignment] write your own unit test to show that your Mastermind variation circuit is working as expected
const { assert } = require("chai");

const wasm_tester = require("circom_tester").wasm;

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
const { buildPoseidon } = require("circomlibjs");

exports.p = Scalar.fromString(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);
const Fr = new F1Field(exports.p);

const poseidonHash = async (items) => {
  let poseidon = await buildPoseidon();
  return poseidon.F.toObject(poseidon(items));
};

describe("MastermindVariation test", function () {
  this.timeout(100000000);

  it("witness value should be true", async function () {
    const circuit = await wasm_tester(
      "contracts/circuits/MastermindVariation.circom"
    );
    await circuit.loadConstraints();

    const INPUT = {
      pubGuessA: "1",
      pubGuessB: "2",
      pubGuessC: "3",
      pubNumHit: "3",
      pubNumBlow: "0",
      //   pubSolnHash:
      //     "6691445294836704103979957934584814845610685572117300507759561479389322662567",

      privSolnA: "1",
      privSolnB: "2",
      privSolnC: "3",

      privSalt: "165422",
    };

    INPUT["pubSolnHash"] = await poseidonHash([
      parseInt(INPUT.privSalt),
      parseInt(INPUT.privSolnA),
      parseInt(INPUT.privSolnB),
      parseInt(INPUT.privSolnC),
    ]);

    const witness = await circuit.calculateWitness(INPUT, true);

    assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
    assert(Fr.eq(Fr.e(witness[1]), Fr.e(INPUT["pubSolnHash"])));
    assert(Fr.eq(Fr.e(witness[7]), Fr.e(INPUT["pubSolnHash"])));
  });

  it("should fail due to invalid salt", async function () {
    const circuit = await wasm_tester(
      "contracts/circuits/MastermindVariation.circom"
    );
    await circuit.loadConstraints();

    const INPUT = {
      pubGuessA: "1",
      pubGuessB: "2",
      pubGuessC: "3",
      pubNumHit: "3",
      pubNumBlow: "0",
      pubSolnHash:
        "6691445294836704103979957934584814845610685572117300507759561479389322662567",

      privSolnA: "1",
      privSolnB: "2",
      privSolnC: "3",

      privSalt: "1654229",
    };

    try {
      await circuit.calculateWitness(INPUT, true);
    } catch (err) {
      // console.log(err);
      assert(err.message.includes("Assert Failed"));
    }
  });
});
