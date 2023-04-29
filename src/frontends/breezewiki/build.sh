cd breezewiki/
rm -fr breezewiki-dist breezewiki-dist.tar.gz
curl -L https://docs.breezewiki.com/files/breezewiki-dist.tar.gz > breezewiki-dist.tar.gz
tar -xf breezewiki-dist.tar.gz
cp config.ini breezewiki-dist/lib/plt/dist/exts/ert/r0/breezewiki/
rm breezewiki-dist.tar.gz