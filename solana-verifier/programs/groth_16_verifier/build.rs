use risc0_circuit_recursion::control_id::{ALLOWED_CONTROL_ROOT, BN254_IDENTITY_CONTROL_ID};
use std::{fs, path::Path};

fn main() {
    // Write the control IDs to a file for inclusion in the program while avoiding dependency on the risc0_circuit_recursion crate
    let out_dir = std::env::var("OUT_DIR").unwrap();
    let dest = Path::new(&out_dir).join("control_ids.rs");
    fs::write(
        dest,
        format!(
            r#"
pub const ALLOWED_CONTROL_ROOT: [u8; 32] = {:?};
pub const BN254_IDENTITY_CONTROL_ID: [u8; 32] = {:?};
"#,
            ALLOWED_CONTROL_ROOT.as_bytes().to_vec(),
            BN254_IDENTITY_CONTROL_ID.as_bytes().to_vec()
        ),
    )
    .unwrap();
}
