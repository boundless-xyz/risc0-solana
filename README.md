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

An audit was completed by Veridise as of commit [84a1929](https://github.com/boundless-xyz/risc0-solana/tree/84a1929bec853cd90848d2fd0b0eda001fee522d) with suggested fixes applied in [5d7f7f9](https://github.com/boundless-xyz/risc0-solana/tree/5d7f7f9cab12cbcf21d84fffc15c1bd1c89df3de).

See the [full audit report](https://github.com/risc0/rz-security/blob/main/audits/contracts/veridise_solanaverifier_20240904.pdf)

[RISC Zero]: https://github.com/risc0/risc0
[Solana]: https://solana.com
[examples]: ./examples
[router]: ./solana-verifier
[ownable]: ./solana-ownable
[verifier]: ./solana-verifier/programs/groth_16_verifier
[risc0-quickstart]: https://dev.risczero.com/api/zkvm/quickstart
[bonsai-quickstart]: https://dev.risczero.com/bonsai
[Developer Documentation]: https://dev.risczero.com
