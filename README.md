> [!IMPORTANT]
> `main` is the development branch. Application developers should use the [latest release](https://github.com/risc0/risc0-solana/releases) instead.

# RISC Zero Solana

[RISC Zero] is a zero-knowledge verifiable general computing platform, with [Solana] integration.
This repository contains our Solana verifier infrastructure and supporting code.

## Components

### Verifier Router

Our core verifier infrastructure allows secure on-chain verification of RISC Zero zkVM proofs. The router provides:

- On-chain verification of Groth16 proofs from the RISC Zero zkVM
- Dynamic verifier routing and management
- Emergency stop functionality for security

> [!IMPORTANT]
> If you want to verify RISC Zero proofs in your Solana program the Verifier Router is what you want to integrate with. See the [list of verifier router deployments](https://dev.risczero.com/api/blockchain-integration/contracts/verifier#verifier-router) to find the existing deployment for your chain. Do not deploy your own copies of the Groth16 verifier or Verifier Router unless you know what you are doing.

### Supporting Components

We provide several supporting libraries to help developers integrate with the verifier:

- [Groth16 Verifier][verifier]: Groth16 proof verification using Solana `alt-bn254` system calls
- [Ownable Library][ownable]: Secure two-step ownership transfer for Solana programs
- [Example Code][examples]: Integration code demonstrating verifier usage

## Getting Started

Full documentation for using RISC Zero, including guides for [writing zkVM programs][risc0-quickstart], and more can be found at our [Developer Documentation].

## Quick Links

- [Groth16 Verifier Program][verifier]
- [Verifier Router][router]
- [Ownable Library][ownable]
- [Example Code][examples]

## Audits

An audit was completed by Veridise as of commit [3be7250](https://github.com/boundless-xyz/risc0-solana/tree/3be7250bbb16d27ab7c5256b19d2ee5d151bd0a1) with suggested fixes applied in [ee41593](https://github.com/boundless-xyz/risc0-solana/tree/ee415935d04a948f27a346b563391900bdad6486).

See the [full audit report](https://github.com/boundless-xyz/boundless-security/blob/879e3fb449f43636d52a07072c17f570eb2c6317/audits/2025_10_Veridise%20(Solana%20Verifier).pdf)


[RISC Zero]: https://github.com/risc0/risc0
[Solana]: https://solana.com
[examples]: ./examples
[router]: ./solana-verifier
[ownable]: ./solana-ownable
[verifier]: ./solana-verifier/programs/groth_16_verifier
[risc0-quickstart]: https://dev.risczero.com/api/zkvm/quickstart
[bonsai-quickstart]: https://dev.risczero.com/bonsai
[Developer Documentation]: https://dev.risczero.com
