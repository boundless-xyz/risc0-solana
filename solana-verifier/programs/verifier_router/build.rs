use std::env;

fn main() {
    let initial_owner = env::var("INITIAL_OWNER").unwrap_or_else(|_| {
        println!("cargo:warn=INITIAL_OWNER env var not set. Using default of 11111111111111111111111111111111 which is only suitable for testing.");
        "11111111111111111111111111111111".to_string()
    });
    println!("cargo:rustc-env=INITIAL_OWNER={}", initial_owner);
}
