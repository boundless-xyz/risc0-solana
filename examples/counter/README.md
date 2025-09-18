# Solana Zero-Knowledge Proof Example Project

This project demonstrates how to use the RISC Zero zero-knowledge prover with Solana. 
It provides an example Solana program that implements a simple nonce increment system
 where users must provide valid ZK proofs to increment a nonce value on-chain.

## Project Structure

The project consists of several key components:

- **Solana Programs**: Smart contracts that handle on-chain verification and state management
  - `verifier_router`: Routes proof verification requests to appropriate verifiers
  - `groth16_verifier`: The RISC Zero Groth16 verifier that performs the proof verification
  - `solana-examples`: Example program that uses the data from a RISC Zero Proof

- **RISC Zero Guest Program**: Off-chain program that generates proofs
  - Located in `hello-world/methods/guest`
  - Implements nonce increment logic that will be proven

- **Host Program**: Rust program that acts as the Solana client and submits data for proving
  - Located in `hello-world/host`
  - Initializes the Solana example program account on first run
  - Handles proof generation and submission to Solana

## Prerequisites

- Rust and Cargo
- Solana Tools
- Anchor Framework
- Node.js and Yarn

## Setup and Installation

1. Configure Local Environment:
```bash
# Configure Solana for localhost
solana config set --url localhost

# Generate a new keypair if needed
solana-keygen new
```

2. Start Local Validator:
```bash
# Run this in a separate terminal
solana-test-validator -r
```

3. Build and Deploy the Verifier Router System:
```bash
# Go to the Solana Verifier programs to deploy them locally
cd solana-verifier

# Install the dependencies for the scripts
yarn install

# Sync keys for local deploy
anchor keys sync

# Build the programs so that IDLs are generated
anchor build

# Generate client code for scripts before first run
yarn run client

# Deploy the programs locally
yarn run deploy
```

4. Build and Deploy the Example Project:
```bash
# Go to the Solana Examples directory for everything else
cd examples/counter

# Sync keys for local deploy
anchor keys sync

# Build the program
anchor build

# Deploy the program locally
anchor deploy
```

## Running the Example

```bash
# Go to the Client program directory
cd zkvm

# Run the example program
RUST_LOG=info cargo run
```

This will:
- Generate a fresh keypair and request an airdrop (to demonstrate anyone can submit proofs)
- Initialize the Solana example program on the first run
- Generate a ZK proof for incrementing the nonce
- Submit the proof to the Solana program
- Verify the proof on-chain
- Update the nonce if verification succeeds

## Understanding the Flow

1. **Initialization**
   - The Solana program initializes with a starting nonce of 0
   - It stores the RISC Zero image ID to ensure proofs come from an unmodified program

2. **Proof Generation**
   - User requests to increment nonce
   - Host program loads current nonce from Solana
   - Generates proof using RISC Zero guest program
   - Proof demonstrates user of the signing account has run the guest program

3. **On-chain Verification**
   - Host submits proof to Solana program
   - Program validates:
     - Proof is for correct image ID
     - Nonce value is incremented correctly
     - Sender's public key matches proof
   - If valid, nonce is incremented

## Key Components

### Solana Program (`programs/solana-counter/src/lib.rs`)
Handles on-chain state and verification logic:
- Stores current nonce and program image ID
- Verifies proofs through Verifier Router
- Updates state when proofs are valid

### Guest Program (`zkvm/methods/guest/src/main.rs`)
Simple program that:
- Takes current nonce as input
- Increments nonce value
- Outputs incremented value and public key into the proofs journal

### Host Program (`zkvm/host/src/main.rs`)
Orchestrates the proof system:
- Initializes the Solana example program if not currently initialized
- Reads current state from Solana
- Generates proofs using guest program
- Submits proofs to Solana program

## Development Notes

- The Verifier Router system must be deployed before the example project
- Use `solana logs` to monitor program output during testing
- Program IDs are deterministic based on `Anchor.toml` configuration

## Troubleshooting

If you encounter issues:

1. Verify local validator is running:
```bash
solana cluster-version
```

2. Check account balance:
```bash
solana balance
```

3. Reset local validator if needed:
```bash
solana-test-validator -r
```

4. Verify program deployment:
```bash
solana program show --programs --all
```