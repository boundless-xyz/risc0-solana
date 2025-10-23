# Solana Zero-Knowledge Proof Verifier Router

A flexible and secure system for managing zero-knowledge proof verifications on Solana. This project provides a router-based verification system with non-upgradeable verifiers that have emergency controls, and comprehensive administration tools.

## Overview

The Verifier Router system enables:
- Dynamic registration and routing of ZK proof verifiers
- Emergency stop mechanisms with both centralized and decentralized triggers
- Flexible ownership controls with two-step transfers

Comprehensive script support for program management:
- Supports both local key signers and Fireblocks HSM
- Supports adding additional verifiers beyond the currently supported Groth_16 program
- Ownership management and transfer 
- Emergency Stop by owner 

## Getting Started

### Prerequisites
- Rust and Cargo
- Solana Tool Suite
- Node.js and Yarn
- Anchor Framework

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd solana-verifier
```

2. Install dependencies:
```bash
yarn install
```

3. Configure environment:
```bash
cp example.env .env
# Edit .env with your configuration
```

4. Generate a new Solana keypair (if needed)
```bash
solana-keygen new
```

> [!IMPORTANT]
> A Solana keypair is required to build the router so do this step even if you are not planning to deploy

### Deployment

Note: Deployment accounts need at minimum a 6 SOL balance by default and
any non-deployment actions require an account with a 1 SOL minimum balance.

1. Deploy the router and initial verifier:
```bash
anchor keys sync
INITIAL_OWNER=$(solana address) anchor build
yarn run client
yarn run deploy
```

2. (Optional) Add additional verifiers programs:
```bash
yarn run add
```

## System Architecture

### Components

1. **Router Program**: Central registry and routing system
2. **Verifier Programs**: Individual verifier implementations (e.g., Groth16)
3. **Client Programs**: Programs that use the router for proof verification

## Administrative Functions

### Router Management

1. Transfer Ownership:
```bash
NEW_OWNER=<pubkey> yarn run transfer
yarn run accept  # Run on new owner's machine
```

2. Add Verifier:
```bash
VERIFIER_ADDRESS=<address> SELECTOR=<selector-hex> yarn run add
```

3. Emergency Stop:
```bash
yarn run estop  # Follow prompts
```

## Development Tools

### Scripts
All scripts have values set in the environment, see `example.env` for a full
list of options.

- `yarn run deploy`: Deploy programs
- `yarn run add`: Add new verifier
- `yarn run estop`: Emergency stop by owner
- `yarn run transfer`: Transfer ownership
- `yarn run accept`: Accept ownership
- `yarn run renounce`: Renounce ownership
- `yarn run client`: Generate TypeScript clients

### Environment Variables

See `example.env` for full configuration options including:
- Network endpoints
- Account addresses
- Deployment settings
- Fireblocks integration (optional)

## Testing

```bash
INITIAL_OWNER=$(solana address) anchor test
```
