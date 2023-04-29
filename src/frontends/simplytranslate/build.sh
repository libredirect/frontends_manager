cd simplytranslate/
rm -fr SimplyTranslate-Web/
git clone --depth 1 https://codeberg.org/SimpleWeb/SimplyTranslate-Web
cp config.conf SimplyTranslate-Web/
cp requirements.txt SimplyTranslate-Web/
cd SimplyTranslate-Web/
pip3 install -r requirements.txt
pyinstaller --name simplytranslate_linux_x86_64  -F main.py --distpath ../ --add-data "templates:templates" --add-data "static:static"
cd ../
rm -fr SimplyTranslate-Web/