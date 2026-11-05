# Data Matrix Lab

Standalone public PWA for testing barcode and GS1 Data Matrix decoding on iPhone and iPad.

## Publish

GitHub Settings → Pages → Deploy from a branch → main → / (root).

The scanner uses ZXing loaded from jsDelivr or unpkg. Decoding runs in the browser. It does not authenticate codes or query QazMarka. Internet is required on first launch for the decoding library. Keep camera access HTTPS-only.
