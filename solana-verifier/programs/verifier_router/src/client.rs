// Copyright 2025 RISC Zero, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// SPDX-License-Identifier: Apache-2.0

use groth_16_verifier::{negate_g1, Proof};
use risc0_zkvm::sha::Digestible;
use risc0_zkvm::Groth16ReceiptVerifierParameters;

use crate::{Seal, Selector};

/// Encoding of a Groth16 seal by prefixing it with the verifier selector.
///
/// The verifier selector is determined from the first 4 bytes of the hash of the verifier
/// parameters including the Groth16 verification key and the control IDs that commit to the RISC
/// Zero circuits.
///
/// NOTE: Selector value of the current zkVM version is used. If you need to use a selector from a
/// different version of the zkVM, use the [encode_seal_with_selector](crate::encode_seal_with_selector) method instead.
pub fn encode_seal(seal: &[u8; 256]) -> Seal {
    let verifier_parameters_digest = Groth16ReceiptVerifierParameters::default().digest();
    let selector = &verifier_parameters_digest.as_bytes()[..4];

    encode_seal_with_selector(seal, selector.try_into().unwrap()) // safe to unwrap as selector is exactly 4 bytes
}

/// Encoding of a Groth16 seal by prefixing it with the given selector.
///
/// The verifier selector is determined from the first 4 bytes of the hash of the verifier
/// parameters including the Groth16 verification key and the control IDs that commit to the RISC
/// Zero circuits.
pub fn encode_seal_with_selector(seal: &[u8; 256], selector: Selector) -> Seal {
    let seal = seal.as_ref();

    // safe to unwrap as we know the seal length is 256 and can be split into these components
    let mut proof = Proof {
        pi_a: seal[0..64].try_into().unwrap(),
        pi_b: seal[64..192].try_into().unwrap(),
        pi_c: seal[192..256].try_into().unwrap(),
    };
    proof.pi_a = negate_g1(&proof.pi_a);

    Seal { selector, proof }
}
