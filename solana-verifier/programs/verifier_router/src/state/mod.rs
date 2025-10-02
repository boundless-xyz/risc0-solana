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
use ownable::{Ownable, Ownership};

use crate::Selector;

/// Main router account storing ownership and verifier count
///
/// This account maintains the registry of verifiers and implements ownership controls
/// for administrative operations.
///
///
/// # Fields
/// * `ownership` - Stores the current and pending owner information using the Ownable trait
#[account]
#[derive(Ownable)]
pub struct VerifierRouter {
    pub ownership: Ownership,
}

/// Account storing information about a registered verifier
///
/// Each verifier entry represents a deployed verifier program that can be used
/// for zero-knowledge proof verification.
///
/// # Fields
/// * `selector` - Unique identifier for this verifier entry
/// * `verifier` - Public key of the verifier program
/// * `estopped` - Boolean flag indicating if the verifier has been emergency stopped
#[account]
pub struct VerifierEntry {
    pub selector: Selector,
    pub verifier: Pubkey,
    pub estopped: bool,
}
