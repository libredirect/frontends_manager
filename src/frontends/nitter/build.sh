cd nitter/
rm -fr nitter/
rm -fr public/
git clone --depth 1 https://github.com/zedeus/nitter
cd nitter/
nimble build -d:release --cpu:amd64 --os:linux
nimble build -d:release --cpu:amd64 -d:mingw
nimble scss
nimble md
mv nitter ../nitter_linux_x86_64
mv nitter.exe ../nitter_windows_x86_64.exe
mv public/ ../
cd ../
rm -fr nitter/
