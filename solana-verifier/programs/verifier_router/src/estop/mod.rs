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
use groth_16_verifier::cpi::accounts::VerifyProof;
use groth_16_verifier::Proof;
pub mod events;
use crate::state::{VerifierEntry, VerifierRouter};
use crate::{RouterError, Selector};
use events::EmergencyStopEvent;

/// Account validation for emergency stop operations
///
/// Validates accounts needed for stopping a verifier and closing its accounts.
/// Can be triggered by owner or with a valid proof of exploit.
///
/// # Arguments
/// * `selector` - A 4-byte value that uniquely identifies the verifier to stop
#[derive(Accounts)]
#[instruction(selector: Selector)]
pub struct EmergencyStop<'info> {
    /// The router account PDA managing verifiers and required Upgrade Authority address of verifier
    #[account(
        seeds = [b"router"],
        bump
    )]
    pub router: Account<'info, VerifierRouter>,

    /// The verifier entry of the program to be stopped.
    #[account(
        mut,
        seeds = [
            b"verifier",
            selector.as_ref()
        ],
        bump,
        constraint = verifier_entry.selector == selector,
        constraint = verifier_entry.verifier == verifier_program.key(),
    )]
    pub verifier_entry: Account<'info, VerifierEntry>,

    /// The authority attempting the emergency stop (either the router owner OR the person presenting proof of exploit)
    /// The authority will get the rent refund of both the program account of the verifier and the verifierEntry account
    #[account()]
    pub authority: Signer<'info>,

    /// The program account of the verifier to be used Address is verified against VerifierEntry
    /// Must be Unchecked as there could be any program ID here.
    /// CHECK: This program is deployed and checked against our PDA entries
    #[account(
        executable,
        constraint = verifier_program.key() == verifier_entry.verifier @ RouterError::InvalidVerifier)
        ]
    pub verifier_program: UncheckedAccount<'info>,

    /// Required because we are closing accounts
    pub system_program: Program<'info, System>,
}

/// # WARNING: IRREVERSIBLE ACTION
/// Calling E-Stop on a Verifier marks it as being compromised and it can never be re-enabled.
///
/// Executes an emergency stop of a verifier by the owner
///
/// # Arguments
/// * `ctx` - The EmergencyStop context containing validated accounts
/// * `selector` - The selector of the verifier to stop
///
/// # Returns
/// * `Ok(())` if the emergency stop is successful
pub fn emergency_stop_by_owner(ctx: Context<EmergencyStop>, selector: Selector) -> Result<()> {
    // Verify the caller is Contract Owner
    ctx.accounts
        .router
        .ownership
        .assert_owner(&ctx.accounts.authority)?;

    let verifier = &mut ctx.accounts.verifier_entry;
    verifier.estopped = true;

    emit!(EmergencyStopEvent {
        router: ctx.accounts.router.key(),
        selector,
        verifier: ctx.accounts.verifier_entry.verifier,
        triggered_by: ctx.accounts.authority.key(),
        reason: "Owner has revoked the verifier.".to_string()
    });

    Ok(())
}

/// Executes an emergency stop of a verifier using a proof of exploit
///
/// Allows anyone to stop a verifier by providing a valid proof of exploitation.
///
/// # Notice:
///
/// If you have identified a vulnerability in any of our verifiers and are able to
/// craft a malicious proof *please* construct a proof that verifies with a null
/// image id and has a null journal digest and submit it to this function which will
/// immediately disable the verifier from future use.
///
/// If you believe you have identified a vulnerability and are unable to submit an
/// invalid proof please contact the RISC Zero team immediately if possible.
///
/// # Arguments
/// * `ctx` - The EmergencyStop context containing validated accounts
/// * `selector` - The selector of the verifier to stop
/// * `proof` - The proof demonstrating the exploit
/// * `image_id` - The image ID associated with the proof
/// * `journal_digest` - The journal digest for verification
///
/// # Returns
/// * `Ok(())` if the emergency stop is successful
/// * `Err(EstopError::InvalidProofOfExploit)` if the proof is invalid
pub fn emergency_stop_with_proof(
    ctx: Context<EmergencyStop>,
    selector: Selector,
    proof: Proof,
) -> Result<()> {
    let zero_array = [0u8; 32];

    // Attempt to verify the proof
    let verifier_program = ctx.accounts.verifier_program.to_account_info();
    let verifier_accounts = VerifyProof {
        system_program: ctx.accounts.system_program.to_account_info(),
    };

    let verify_ctx = CpiContext::new(verifier_program, verifier_accounts);

    // We ignore the result because in solana Invoke will fail the transaction for any non-success result.
    // See https://docs.rs/solana-cpi/latest/solana_cpi/fn.invoke.html specifically:
    //
    // > This function will not return if the called program returns anything other than success.
    // > If the callee returns an error or aborts then the entire transaction will immediately fail.
    let _ = groth_16_verifier::cpi::verify(verify_ctx, proof, zero_array, zero_array);

    let verifier = &mut ctx.accounts.verifier_entry;
    verifier.estopped = true;

    emit!(EmergencyStopEvent {
        router: ctx.accounts.router.key(),
        selector,
        verifier: ctx.accounts.verifier_entry.verifier,
        triggered_by: ctx.accounts.authority.key(),
        reason: "Invalid Proof was demonstrated, verifier compromised.".to_string()
    });

    Ok(())
}
