/**
 * We rely on starting a local validator and having anchor test deploy programs to it.
 * We cannot use a more efficient setup like bankrun because as of this writing it does
 * not support upgradable programs which are account closure depends upon:
 *   - https://github.com/kevinheavey/solana-bankrun/issues/33
 *
 *
 */

import {
  fetchVerifierRouter,
  getAddVerifierInstruction,
  Proof,
  getInitializeInstruction,
  VERIFIER_ROUTER_PROGRAM_ADDRESS,
  getEmergencyStopWithProofInstruction,
  getEmergencyStopInstruction,
  fetchVerifierEntry,
  getVerifyInstruction,
} from "../scripts/verify-router";
import {
  sendTransaction,
  loadDefaultKeypair,
  getVerifierEntryPda,
  PDA,
  getProgramDataAddress,
  getRouterPda,
  LAMPORTS_PER_SOL,
  changeAuthority,
} from "../scripts/utils/utils";

// Use the new web3.js, version >=2
import {
  airdropFactory,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  generateKeyPairSigner,
  Rpc,
  SolanaRpcApi,
  TransactionPartialSigner,
  some,
  none,
  Address,
  RpcSubscriptions,
  SolanaRpcSubscriptionsApi,
  KeyPairSigner,
  BaseTransactionMessage,
  lamports,
} from "@solana/kit";

import { use as chaiUse, expect } from "chai";
import deepEqualInAnyOrder from "deep-equal-in-any-order";
import { GROTH16_VERIFIER_PROGRAM_ADDRESS } from "../scripts/groth16";
import { TEST_BAD_VERIFIER_PROGRAM_ADDRESS } from "../scripts/bad-verifier";
import { SOLANA_LOADER_V3_PROGRAM_PROGRAM_ADDRESS } from "../scripts/loaderV3";

import chaiAsPromised from "chai-as-promised";

chaiUse(deepEqualInAnyOrder);
chaiUse(chaiAsPromised);

async function expectError(
  promise: Promise<any>,
  errorType: string,
  errorMessage?: string,
  log: boolean = false
): Promise<void> {
  try {
    await promise;
    expect.fail("should have thrown an exception, but did not");
  } catch (e) {
    if (log) {
      console.log(e);
    }
    expect(e.context.logs.toString()).to.include(errorType, errorMessage);
  }
}

describe("verifier-router", () => {
  let rpc: Rpc<SolanaRpcApi>;
  let rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
  let deployerKeyPair: KeyPairSigner<string>;

  // Test Accounts
  let grothPda: PDA;
  let grothPDAAddress: Address<string>;
  let grothProgramDataAddress: Address<string>;
  let badVerifierPda: PDA;
  let badVerifierPDAAddress: Address<string>;
  let badVerifierProgramDataAddress: Address<string>;
  let routerAddress: Address<string>;
  let owner: TransactionPartialSigner;
  let notOwner: TransactionPartialSigner;
  let sendTx: <TTransaction extends BaseTransactionMessage>(
    instruction: TTransaction["instructions"][number],
    authority?: TransactionPartialSigner
  ) => Promise<void>;

  // Test Proof for the Test Bad Verifier
  const emptyProof: Proof = {
    piA: new Uint8Array(64).fill(0xca), // Empty 64 Byte array
    piB: new Array(128).fill(0xfe), // Empty 128 byte array
    piC: new Uint8Array(64).fill(0xca), // Empty 64 byte array
  };

  const emptyJournalDigest = new Uint8Array(32); // Empty Journal Digest
  const emptyImageId = new Uint8Array(32); // Empty Image ID
  const badImageId = new Uint8Array(32).fill(1); // Non-empty Image ID

  // Test selectors
  const GROTH16_SELECTOR = new Uint8Array([1, 1, 1, 1]);
  const TEST_BAD_SELECTOR = new Uint8Array([2, 2, 2, 2]);

  before(async () => {
    rpc = createSolanaRpc("http://localhost:8899");
    rpcSubscriptions = createSolanaRpcSubscriptions("ws://localhost:8900");

    // Get information about Deployment
    deployerKeyPair = await loadDefaultKeypair();

    // Generate fresh signers for each test
    const signers = await Promise.all([
      generateKeyPairSigner(),
      generateKeyPairSigner(),
    ]);
    owner = signers[0];
    notOwner = signers[1];

    // Calculate the PDA for the Router Program
    const routerAddressPDA = await getRouterPda(
      VERIFIER_ROUTER_PROGRAM_ADDRESS
    );
    routerAddress = routerAddressPDA.address;

    // Calculate the PDA for the Groth16 Verifier Program
    grothPda = await getVerifierEntryPda(
      VERIFIER_ROUTER_PROGRAM_ADDRESS,
      GROTH16_SELECTOR
    );
    grothPDAAddress = grothPda.address;

    console.log(`Groth Verifier (Verifier Entry) Address: ${grothPDAAddress}`);

    const grothProgramData = await getProgramDataAddress(
      GROTH16_VERIFIER_PROGRAM_ADDRESS
    );

    grothProgramDataAddress = grothProgramData.address;
    console.log(`Groth Program Data Address: ${grothProgramDataAddress}`);

    // Calculate the PDA for the TestBadVerifier Program
    badVerifierPda = await getVerifierEntryPda(
      VERIFIER_ROUTER_PROGRAM_ADDRESS,
      TEST_BAD_SELECTOR
    );
    badVerifierPDAAddress = badVerifierPda.address;

    console.log(
      `Bad Verifier (Verifier Entry) Address: ${badVerifierPDAAddress}`
    );

    const badVerifierProgramData = await getProgramDataAddress(
      TEST_BAD_VERIFIER_PROGRAM_ADDRESS
    );

    badVerifierProgramDataAddress = badVerifierProgramData.address;

    console.log(
      `Bad Verifier Program Data Address: ${badVerifierProgramDataAddress}`
    );
  });

  beforeEach(async () => {
    const requestAirdrop = airdropFactory({ rpc, rpcSubscriptions });
    // Create a closure to reduce the ammount of duplicate code needed to send a transaction
    sendTx = async (instruction, authority = owner) =>
      sendTransaction({
        rpc,
        rpcSubscriptions,
        feePayer: authority,
        instruction,
        commitment: "confirmed",
      });

    // Airdrop SOL to owner for transactions
    await requestAirdrop({
      lamports: lamports(2n * LAMPORTS_PER_SOL),
      recipientAddress: owner.address,
      commitment: "confirmed",
    });

    // Airdrop SOL to owner for transactions
    await requestAirdrop({
      lamports: lamports(2n * LAMPORTS_PER_SOL),
      recipientAddress: notOwner.address,
      commitment: "confirmed",
    });
  });

  it("Initializes the router with correct owner", async () => {
    const transactionInstruction = getInitializeInstruction({
      router: routerAddress,
      authority: owner,
    });

    await sendTx(transactionInstruction);

    const account = await fetchVerifierRouter(rpc, routerAddress);
    expect(account.data.ownership.owner).to.deep.equal(some(owner.address));
    expect(account.data.ownership.pendingOwner).to.deep.equal(none());
  });

  it("Should not allow a verifier to be added to the router, that the router does not have upgrade authority over", async () => {
    const transactionInstruction = getAddVerifierInstruction({
      authority: owner,
      router: routerAddress,
      selector: GROTH16_SELECTOR,
      verifierEntry: grothPDAAddress,
      verifierProgramData: grothProgramDataAddress,
      verifierProgram: GROTH16_VERIFIER_PROGRAM_ADDRESS,
    });

    await expectError(
      sendTx(transactionInstruction),
      "VerifierInvalidAuthority"
    );
  });

  it("Set Router as upgrade authority of testBadVerifier", async () => {
    await changeAuthority(
      rpc,
      rpcSubscriptions,
      TEST_BAD_VERIFIER_PROGRAM_ADDRESS,
      deployerKeyPair,
      routerAddress
    );
  });

  it("Should not allow a user to pass in a different ProgramData account then the one for the verifier being added", async () => {
    const addBadVerifierInstruction = getAddVerifierInstruction({
      authority: owner,
      router: routerAddress,
      selector: GROTH16_SELECTOR,
      verifierEntry: grothPDAAddress,
      verifierProgram: GROTH16_VERIFIER_PROGRAM_ADDRESS,
      verifierProgramData: badVerifierProgramDataAddress, // Wrong PDA (which has the router has authority over),
    });

    await expectError(
      sendTx(addBadVerifierInstruction),
      "ConstraintSeeds",
      "Expected to get a Constraint Seeds error, but did not"
    );
  });

  it("Set Router as upgrade authority of groth16verifier", async () => {
    await changeAuthority(
      rpc,
      rpcSubscriptions,
      GROTH16_VERIFIER_PROGRAM_ADDRESS,
      deployerKeyPair,
      routerAddress
    );
  });

  it("Should not allow a non-owner to add a verifier to the router", async () => {
    const addGrothInstruction = getAddVerifierInstruction({
      authority: notOwner,
      router: routerAddress,
      selector: GROTH16_SELECTOR,
      verifierEntry: grothPDAAddress,
      verifierProgram: GROTH16_VERIFIER_PROGRAM_ADDRESS,
      verifierProgramData: grothProgramDataAddress,
    });

    await expectError(
      sendTx(addGrothInstruction),
      "NotOwner",
      "A non-owner was able to add a verifier to the router"
    );
  });

  it("Should allow a verifier to be added to the router after the upgrade authority is correctly set", async () => {
    const addGrothInstruction = getAddVerifierInstruction({
      authority: owner,
      router: routerAddress,
      selector: GROTH16_SELECTOR,
      verifierEntry: grothPDAAddress,
      verifierProgram: GROTH16_VERIFIER_PROGRAM_ADDRESS,
      verifierProgramData: grothProgramDataAddress,
    });

    const addBadVerifierInstruction = getAddVerifierInstruction({
      authority: owner,
      router: routerAddress,
      selector: TEST_BAD_SELECTOR,
      verifierEntry: badVerifierPDAAddress,
      verifierProgram: TEST_BAD_VERIFIER_PROGRAM_ADDRESS,
      verifierProgramData: badVerifierProgramDataAddress,
    });


    // We must do these sequentially so that we don't hit a race condition on selector numbers
    await sendTx(addGrothInstruction);

    const grothAccount = await fetchVerifierEntry(rpc, grothPDAAddress);
    expect(grothAccount.data.selector).to.deep.equal(GROTH16_SELECTOR);
    expect(grothAccount.data.verifier).to.equal(
      GROTH16_VERIFIER_PROGRAM_ADDRESS
    );

    await sendTx(addBadVerifierInstruction);

    const badAccount = await fetchVerifierEntry(rpc, badVerifierPDAAddress);
    expect(badAccount.data.selector).to.deep.equal(TEST_BAD_SELECTOR);
    expect(badAccount.data.verifier).to.equal(
      TEST_BAD_VERIFIER_PROGRAM_ADDRESS
    );
  });

  it("should allow a user to submit a valid proof to the verifier", async () => {
    // The Bad verifier will only accept proofs for null inputs

    const verifyInstruction = getVerifyInstruction({
      router: routerAddress,
      selector: TEST_BAD_SELECTOR,
      proof: emptyProof,
      verifierEntry: badVerifierPDAAddress,
      verifierProgram: TEST_BAD_VERIFIER_PROGRAM_ADDRESS,
      imageId: emptyImageId,
      journalDigest: emptyJournalDigest,
    });

    await sendTx(verifyInstruction);
  });

  it("should allow a user to submit an invalid proof to the verifier that returns an error", async () => {
    // The Bad verifier will only accept proofs for null inputs

    const verifyInstruction = getVerifyInstruction({
      imageId: badImageId,
      router: routerAddress,
      selector: TEST_BAD_SELECTOR,
      proof: emptyProof,
      verifierEntry: badVerifierPDAAddress,
      verifierProgram: TEST_BAD_VERIFIER_PROGRAM_ADDRESS,
      journalDigest: emptyJournalDigest,
    });

    await expectError(
      sendTx(verifyInstruction),
      "VerificationError",
      "Expected to hit a Verification Error but the transaction did not error out."
    );
  });

  it("should not allow any user to call e-stop if they do not have a valid proof the verifier is broken", async () => {
    const piA = new Uint8Array(64);
    piA[0] = 42;

    // Test Proof for the Test Bad Verifier
    const badProof: Proof = {
      piA, // Non-Empty 64 Byte array
      piB: new Array(128), // Empty 128 byte array
      piC: new Uint8Array(64), // Empty 64 byte array
    };

    const estopProofInstruction = getEmergencyStopWithProofInstruction({
      authority: notOwner,
      proof: badProof,
      router: routerAddress,
      selector: TEST_BAD_SELECTOR,
      verifierEntry: badVerifierPDAAddress,
      verifierProgram: TEST_BAD_VERIFIER_PROGRAM_ADDRESS,
    });

    await expectError(
      sendTx(estopProofInstruction),
      "VerificationError",
      "Was expecting the estop call to fail but it did not"
    );
  });

  it("should not allow someone other then owner to call estop by owner", async () => {
    const estopProofInstruction = getEmergencyStopInstruction({
      authority: notOwner,
      router: routerAddress,
      selector: TEST_BAD_SELECTOR,
      verifierEntry: badVerifierPDAAddress,
      verifierProgram: TEST_BAD_VERIFIER_PROGRAM_ADDRESS,
    });

    await expectError(sendTx(estopProofInstruction), "NotOwner");
  });

  it("should allow any user to call e-stop if they have proof the verifier is broken", async () => {
    const estopProofInstruction = getEmergencyStopWithProofInstruction({
      authority: notOwner,
      proof: emptyProof,
      router: routerAddress,
      selector: TEST_BAD_SELECTOR,
      verifierEntry: badVerifierPDAAddress,
      verifierProgram: TEST_BAD_VERIFIER_PROGRAM_ADDRESS,
    });

    await sendTx(estopProofInstruction);

    const verifierEntry = await fetchVerifierEntry(
      rpc,
      badVerifierPDAAddress
    );
    expect(verifierEntry.data.estopped).to.equal(true);
  });

  it("Should allow an owner to call estop", async () => {
    const estopProofInstruction = getEmergencyStopInstruction({
      authority: owner,
      router: routerAddress,
      selector: GROTH16_SELECTOR,
      verifierEntry: grothPDAAddress,
      verifierProgram: GROTH16_VERIFIER_PROGRAM_ADDRESS,
    });

    await sendTx(estopProofInstruction);

    const verifierEntry = await fetchVerifierEntry(rpc, grothPDAAddress);
    expect(verifierEntry.data.estopped).to.equal(true);
  });

  it("should not allow a user to submit a valid proof to the verifier after e-stop was called on it", async () => {
    // The Bad verifier will only accept proofs for null inputs

    const verifyInstruction = getVerifyInstruction({
      router: routerAddress,
      selector: TEST_BAD_SELECTOR,
      proof: emptyProof,
      verifierEntry: badVerifierPDAAddress,
      verifierProgram: TEST_BAD_VERIFIER_PROGRAM_ADDRESS,
      imageId: emptyImageId,
      journalDigest: emptyJournalDigest,
    });

    await expectError(sendTx(verifyInstruction), "SelectorDeactivated");
  });
});
