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

use anchor_lang::prelude::*;

#[error_code]
pub enum RouterError {
    #[msg("Attempted to add a verifier contract that the router contract does not own and thus cannot delete")]
    VerifierInvalidAuthority,
    #[msg("Selector has been deactivated")]
    SelectorDeactivated,
    #[msg("Invalid verifier program")]
    InvalidVerifier,
    #[msg("Authority used for initialization does not match the value expected by the program")]
    InvalidInitializationAuthority,
}
