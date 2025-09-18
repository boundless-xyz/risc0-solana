use std::{fs, path::Path};

fn main() {
    // Write the control IDs to a file for inclusion in the program

    let control_root = std::env::var("ALLOWED_CONTROL_ROOT").expect("ALLOWED_CONTROL_ROOT not set");
    let control_root_bytes: Vec<u8> =
        hex::decode(control_root).expect("Invalid hex in ALLOWED_CONTROL_ROOT");
    assert_eq!(
        control_root_bytes.len(),
        32,
        "ALLOWED_CONTROL_ROOT must be 32 bytes"
    );

    let bn254_control_id =
        std::env::var("BN254_IDENTITY_CONTROL_ID").expect("BN254_IDENTITY_CONTROL_ID not set");
    let bn254_control_id_bytes: Vec<u8> =
        hex::decode(bn254_control_id).expect("Invalid hex in BN254_IDENTITY");
    assert_eq!(
        bn254_control_id_bytes.len(),
        32,
        "BN254_IDENTITY_CONTROL_ID must be 32 bytes"
    );

    let out_dir = std::env::var("OUT_DIR").unwrap();
    let dest = Path::new(&out_dir).join("control_ids.rs");
    fs::write(
        dest,
        format!(
            r#"
pub const ALLOWED_CONTROL_ROOT: [u8; 32] = {:?};
pub const BN254_IDENTITY_CONTROL_ID: [u8; 32] = {:?};
"#,
            control_root_bytes, bn254_control_id_bytes
        ),
    )
    .unwrap();
}
