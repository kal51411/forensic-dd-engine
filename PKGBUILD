# Maintainer: Kalpesh <kal51411@github>
pkgname=forensic-dd-engine
pkgver=1.0.0
pkgrel=1
pkgdesc="Deterministic-first multi-agent forensic accounting and financial due diligence engine"
arch=('any')
url="https://github.com/kalpesh/forensic-dd-engine"
license=('MIT')
depends=('python' 'python-fastapi' 'python-uvicorn' 'python-pydantic' 'python-requests' 'python-jinja2' 'python-httpx' 'python-numpy')
makedepends=('git')
source=("$pkgname-$pkgver.tar.gz::$url/archive/refs/tags/v$pkgver.tar.gz")
sha256sums=('SKIP')

package() {
    cd "$pkgname-$pkgver"
    install -dm755 "$pkgdir/usr/share/$pkgname"
    cp -r api debate docs eval graph ingest monitoring quant report retrieval tests bin requirements.txt "$pkgdir/usr/share/$pkgname/"
    
    install -dm755 "$pkgdir/usr/bin"
    ln -s /usr/share/$pkgname/bin/forensic-dd "$pkgdir/usr/bin/forensic-dd"
}
