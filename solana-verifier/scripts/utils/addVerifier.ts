import {
  Address,
  Rpc,
  RpcSubscriptions,
  SolanaRpcApi,
  SolanaRpcSubscriptionsApi,
  TransactionSigner,
} from "@solana/kit";
import {
  sendTransaction,
  getRouterPda,
  getVerifierEntryPda,
  getProgramDataAddress,
  createLogger,
} from "./utils";
import {
  getAddVerifierInstruction,
} from "../verify-router";

const logger = createLogger();

/**
 * Adds a new verifier program to the router
 *
 * Registers a new verifier program by creating a verifier entry PDA and
 * associating it with the router. The verifier program must have the router
 * as its upgrade authority.
 *
 * @param rpc - Solana RPC client instance
 * @param rpcSubscriptions - Solana RPC subscriptions instance
 * @param verifierAddress - Address of the verifier program to add
 * @param routerAddress - Address of the router program
 * @param owner - Transaction signer with owner authority
 * @returns Promise that resolves when verifier is added
 *
 * # Security Considerations
 * * TransactionSigner (owner) Must be router owner
 * * Verifier program must have router as upgrade authority
 * * Selector is automatically assigned sequentially
 *
 * # Account Validation
 * * Verifies router PDA
 * * Creates verifier entry PDA with seeds = [b"verifier", selector_bytes]
 * * Validates program data account ownership
 */
export async function addVerifier(
  rpc: Rpc<SolanaRpcApi>,
  rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>,
  verifierAddress: Address<string>,
  routerAddress: Address<string>,
  owner: TransactionSigner,
  selector: Uint8Array,
): Promise<void> {
  logger.info(
    `RISC Zero Verifier being with address: ${verifierAddress} being added to the router at address: ${routerAddress}`
  );

  logger.debug(`Using the address: ${owner.address} as owner`);

  const routerPDA = await getRouterPda(routerAddress);

  logger.debug(
    `Router PDA address is: ${routerPDA.address} and the bump is: ${routerPDA.bump}`
  );

  logger.info(
    `Using [${selector}] as the selector for the verifier at address ${verifierAddress}`
  );

  const routerEntry = await getVerifierEntryPda(routerAddress, selector);

  const verifierProgramData = await getProgramDataAddress(verifierAddress);

  logger.info(`Attempting to send add verifier transaction`);

  const addVerifierInstruction = getAddVerifierInstruction(
    {
      authority: owner,
      router: routerPDA.address,
      selector,
      verifierEntry: routerEntry.address,
      verifierProgram: verifierAddress,
      verifierProgramData: verifierProgramData.address,
    },
    { programAddress: routerAddress }
  );

  await sendTransaction({
    rpc,
    rpcSubscriptions,
    feePayer: owner,
    instruction: addVerifierInstruction,
  });

  logger.info("Add verifier transaction confirmed on chain");
}
