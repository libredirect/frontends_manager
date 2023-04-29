cd libreddit/
rm -fr libreddit/
git clone --depth 1 https://github.com/libreddit/libreddit
cd libreddit/
rustup target add x86_64-unknown-linux-gnu
rustup target add x86_64-pc-windows-gnu
cargo build --target x86_64-unknown-linux-gnu --release
cargo build --target x86_64-pc-windows-gnu --release
cd ../
mv libreddit/target/x86_64-unknown-linux-gnu/release/libreddit libreddit_linux_x86_64
mv libreddit/target/x86_64-pc-windows-gnu/release/libreddit.exe ./libreddit_x86_64-pc-windows-gnu.exe
rm -fr libreddit/


