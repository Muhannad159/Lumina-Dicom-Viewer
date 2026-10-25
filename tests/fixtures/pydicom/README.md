# Codec regression fixtures

These public test fixtures are copied unchanged from [pydicom v3.0.1](https://github.com/pydicom/pydicom/tree/v3.0.1/src/pydicom/data/test_files):

- `MR_small_jpeg_ls_lossless.dcm`: JPEG-LS lossless, 64 × 64, one frame.
- `JPEG2000.dcm`: JPEG 2000, 1024 × 256, one frame.

The upstream license is included in `LICENSE`. These files are used only by local automated tests; Vite does not package them into the deployed application. No clinical patient files are required for these checks. Passing these samples does not establish coverage of all vendor implementations or enhanced multiframe geometry.
