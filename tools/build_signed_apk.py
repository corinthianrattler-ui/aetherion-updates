#!/usr/bin/env python3
"""Patch an APK without disturbing aligned native entries, then v1/v2-sign it."""

from __future__ import annotations

import argparse
import base64
import datetime as dt
import hashlib
import os
from pathlib import Path
import struct
import subprocess
import tempfile
import zipfile

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives.serialization import pkcs7, pkcs12
from cryptography.x509.oid import NameOID


EOCD = b"PK\x05\x06"
CENTRAL = b"PK\x01\x02"
APK_SIG_MAGIC = b"APK Sig Block 42"
APK_V2_BLOCK_ID = 0x7109871A
RSA_PKCS1_SHA256_ID = 0x0103
CONTENT_CHUNK_SIZE = 1024 * 1024


def find_eocd(blob: bytes) -> int:
    position = blob.rfind(EOCD, max(0, len(blob) - 65557))
    if position < 0:
        raise ValueError("ZIP end-of-central-directory record was not found")
    return position


def eocd_fields(blob: bytes, position: int) -> tuple[int, int, int, bytes]:
    if len(blob) < position + 22:
        raise ValueError("ZIP end-of-central-directory record is truncated")
    disk, central_disk, disk_entries, entries, size, offset, comment_size = struct.unpack_from(
        "<4H2LH", blob, position + 4
    )
    if disk or central_disk or disk_entries != entries:
        raise ValueError("multi-disk ZIP files are not supported")
    if entries == 0xFFFF or size == 0xFFFFFFFF or offset == 0xFFFFFFFF:
        raise ValueError("ZIP64 input is not supported by this APK builder")
    comment = blob[position + 22 : position + 22 + comment_size]
    return entries, size, offset, comment


def central_records(blob: bytes, offset: int, size: int) -> list[tuple[str, bytes]]:
    records: list[tuple[str, bytes]] = []
    cursor, end = offset, offset + size
    while cursor < end:
        if blob[cursor : cursor + 4] != CENTRAL:
            raise ValueError(f"invalid central-directory record at {cursor}")
        flag = struct.unpack_from("<H", blob, cursor + 8)[0]
        name_size, extra_size, comment_size = struct.unpack_from("<3H", blob, cursor + 28)
        record_size = 46 + name_size + extra_size + comment_size
        record = blob[cursor : cursor + record_size]
        raw_name = blob[cursor + 46 : cursor + 46 + name_size]
        encoding = "utf-8" if flag & 0x800 else "cp437"
        records.append((raw_name.decode(encoding), record))
        cursor += record_size
    if cursor != end:
        raise ValueError("central-directory size does not match its records")
    return records


def make_eocd(entries: int, size: int, offset: int, comment: bytes) -> bytes:
    if entries >= 0xFFFF or size >= 0xFFFFFFFF or offset >= 0xFFFFFFFF:
        raise ValueError("result needs ZIP64, which this APK builder does not emit")
    return struct.pack("<4s4H2LH", EOCD, 0, 0, entries, entries, size, offset, len(comment)) + comment


def strip_apk_signatures(source: Path, destination: Path) -> None:
    blob = source.read_bytes()
    eocd = find_eocd(blob)
    _, central_size, central_offset, comment = eocd_fields(blob, eocd)
    records = central_records(blob, central_offset, central_size)
    block_start = central_offset
    if central_offset >= 24 and blob[central_offset - 16 : central_offset] == APK_SIG_MAGIC:
        block_size = struct.unpack_from("<Q", blob, central_offset - 24)[0]
        block_start = central_offset - block_size - 8
        if block_start < 0 or struct.unpack_from("<Q", blob, block_start)[0] != block_size:
            raise ValueError("APK signing block has inconsistent size markers")
    kept = [record for name, record in records if not name.upper().startswith("META-INF/")]
    central = b"".join(kept)
    with destination.open("wb") as handle:
        handle.write(blob[:block_start])
        handle.write(central)
        handle.write(make_eocd(len(kept), len(central), block_start, comment))


def compact_apk_without_signatures(
    source: Path,
    destination: Path,
    exclusions: tuple[str, ...],
) -> None:
    """Raw-copy live entries, omitting signatures/exclusions and retaining APK alignment."""
    blob = source.read_bytes()
    eocd = find_eocd(blob)
    _, central_size, central_offset, comment = eocd_fields(blob, eocd)
    records = central_records(blob, central_offset, central_size)
    rewritten: list[bytes] = []
    with destination.open("wb") as handle:
        for name, record_bytes in records:
            if name.upper().startswith("META-INF/") or any(
                name == excluded or name.startswith(excluded.rstrip("/") + "/")
                for excluded in exclusions
            ):
                continue
            record = bytearray(record_bytes)
            old_offset = struct.unpack_from("<I", record, 42)[0]
            if blob[old_offset : old_offset + 4] != b"PK\x03\x04":
                raise ValueError(f"invalid local ZIP header for {name}")
            local_name_size, local_extra_size = struct.unpack_from("<2H", blob, old_offset + 26)
            old_data = old_offset + 30 + local_name_size + local_extra_size
            compressed_size = struct.unpack_from("<I", record, 20)[0]
            if compressed_size == 0xFFFFFFFF:
                raise ValueError("ZIP64 entries are not supported")
            raw_name_size = struct.unpack_from("<H", record, 28)[0]
            raw_name = bytes(record[46 : 46 + raw_name_size])
            version_needed = struct.unpack_from("<H", record, 6)[0]
            flags = struct.unpack_from("<H", record, 8)[0] & ~0x0008
            method, modified_time, modified_date = struct.unpack_from("<3H", record, 10)
            crc, uncompressed_size = struct.unpack_from("<I4xI", record, 16)
            alignment = 1
            if method == zipfile.ZIP_STORED and name == "resources.arsc":
                alignment = 4
            elif method == zipfile.ZIP_STORED and name.startswith("lib/") and name.endswith(".so"):
                alignment = 4096
            header_offset = handle.tell()
            base_data_offset = header_offset + 30 + len(raw_name)
            padding_size = (-base_data_offset) % alignment if alignment > 1 else 0
            if 0 < padding_size < 4:
                padding_size += alignment
            extra = (
                struct.pack("<HH", 0xD935, padding_size - 4) + bytes(padding_size - 4)
                if padding_size
                else b""
            )
            local_header = struct.pack(
                "<4s5H3L2H",
                b"PK\x03\x04",
                version_needed,
                flags,
                method,
                modified_time,
                modified_date,
                crc,
                compressed_size,
                uncompressed_size,
                len(raw_name),
                len(extra),
            )
            handle.write(local_header)
            handle.write(raw_name)
            handle.write(extra)
            handle.write(blob[old_data : old_data + compressed_size])
            struct.pack_into("<H", record, 8, flags)
            struct.pack_into("<I", record, 42, header_offset)
            rewritten.append(bytes(record))
        central_offset_new = handle.tell()
        central = b"".join(rewritten)
        handle.write(central)
        handle.write(make_eocd(len(rewritten), len(central), central_offset_new, comment))


def dedupe_central_directory(path: Path) -> None:
    blob = path.read_bytes()
    eocd = find_eocd(blob)
    _, central_size, central_offset, comment = eocd_fields(blob, eocd)
    records = central_records(blob, central_offset, central_size)
    last = {name: index for index, (name, _) in enumerate(records)}
    kept = [record for index, (name, record) in enumerate(records) if last[name] == index]
    central = b"".join(kept)
    with path.open("r+b") as handle:
        handle.seek(central_offset)
        handle.write(central)
        handle.write(make_eocd(len(kept), len(central), central_offset, comment))
        handle.truncate()


def add_payload(apk: Path, payload_root: Path) -> None:
    paths = sorted(path for path in payload_root.rglob("*") if path.is_file())
    if not paths:
        raise ValueError("payload directory is empty")
    with zipfile.ZipFile(apk, "a", allowZip64=True) as archive:
        for path in paths:
            name = path.relative_to(payload_root).as_posix()
            archive.write(path, name, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    dedupe_central_directory(apk)


def wrap_header(name: str, value: str) -> bytes:
    raw = f"{name}: {value}".encode("utf-8")
    output = []
    first = True
    while raw:
        room = 72 if first else 71
        output.append((b"" if first else b" ") + raw[:room])
        raw = raw[room:]
        first = False
    return b"\r\n".join(output) + b"\r\n"


def digest_entry(archive: zipfile.ZipFile, info: zipfile.ZipInfo) -> bytes:
    digest = hashlib.sha256()
    with archive.open(info) as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.digest()


def build_signature_documents(apk: Path) -> tuple[bytes, bytes]:
    sections: list[tuple[str, bytes]] = []
    manifest = b"Manifest-Version: 1.0\r\nCreated-By: Aetherion APK Builder\r\n\r\n"
    with zipfile.ZipFile(apk) as archive:
        for info in archive.infolist():
            if info.is_dir() or info.filename.upper().startswith("META-INF/"):
                continue
            encoded = base64.b64encode(digest_entry(archive, info)).decode("ascii")
            section = wrap_header("Name", info.filename) + wrap_header("SHA-256-Digest", encoded) + b"\r\n"
            sections.append((info.filename, section))
            manifest += section
    signature = (
        b"Signature-Version: 1.0\r\n"
        b"Created-By: Aetherion APK Builder\r\n"
        b"X-Android-APK-Signed: 2\r\n"
        + wrap_header("SHA-256-Digest-Manifest", base64.b64encode(hashlib.sha256(manifest).digest()).decode("ascii"))
        + b"\r\n"
    )
    for name, section in sections:
        signature += (
            wrap_header("Name", name)
            + wrap_header("SHA-256-Digest", base64.b64encode(hashlib.sha256(section).digest()).decode("ascii"))
            + b"\r\n"
        )
    return manifest, signature


def make_signer() -> tuple[rsa.RSAPrivateKey, x509.Certificate]:
    key = rsa.generate_private_key(public_exponent=65537, key_size=3072)
    subject = issuer = x509.Name(
        [x509.NameAttribute(NameOID.COMMON_NAME, "Aetherion Reforged Local Release")]
    )
    now = dt.datetime.now(dt.timezone.utc)
    certificate = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - dt.timedelta(days=1))
        .not_valid_after(now + dt.timedelta(days=3650))
        .add_extension(x509.BasicConstraints(ca=False, path_length=None), critical=True)
        .sign(key, hashes.SHA256())
    )
    return key, certificate


def load_signer(
    archive: Path,
    password_environment: str,
) -> tuple[rsa.RSAPrivateKey, x509.Certificate]:
    password = os.environ.get(password_environment)
    if password is None:
        raise ValueError(
            f"signing password environment variable {password_environment!r} is not set"
        )
    key, certificate, _ = pkcs12.load_key_and_certificates(
        archive.read_bytes(), password.encode("utf-8")
    )
    if not isinstance(key, rsa.RSAPrivateKey) or certificate is None:
        raise ValueError("PKCS#12 archive does not contain an RSA signing key and certificate")
    return key, certificate


def load_pem_der_signer(
    private_key_path: Path,
    certificate_path: Path,
) -> tuple[rsa.RSAPrivateKey, x509.Certificate]:
    key = serialization.load_pem_private_key(private_key_path.read_bytes(), password=None)
    certificate = x509.load_der_x509_certificate(certificate_path.read_bytes())
    if not isinstance(key, rsa.RSAPrivateKey):
        raise ValueError("PEM file does not contain an RSA private key")
    if key.public_key().public_numbers() != certificate.public_key().public_numbers():
        raise ValueError("private key and signing certificate do not match")
    return key, certificate


def sign_v1(apk: Path, key: rsa.RSAPrivateKey, certificate: x509.Certificate) -> None:
    manifest, signature = build_signature_documents(apk)
    block = (
        pkcs7.PKCS7SignatureBuilder()
        .set_data(signature)
        .add_signer(certificate, key, hashes.SHA256())
        .sign(
            serialization.Encoding.DER,
            [pkcs7.PKCS7Options.DetachedSignature, pkcs7.PKCS7Options.Binary],
        )
    )
    timestamp = (2026, 9, 8, 0, 0, 0)
    with zipfile.ZipFile(apk, "a", allowZip64=True) as archive:
        for name, body in (
            ("META-INF/MANIFEST.MF", manifest),
            ("META-INF/AETHERIO.SF", signature),
            ("META-INF/AETHERIO.RSA", block),
        ):
            info = zipfile.ZipInfo(name, timestamp)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, body, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)


def length_prefix(value: bytes) -> bytes:
    return struct.pack("<I", len(value)) + value


def chunked_content_digest(sections: list[bytes | memoryview]) -> bytes:
    digests: list[bytes] = []
    for section in sections:
        view = memoryview(section)
        for offset in range(0, len(view), CONTENT_CHUNK_SIZE):
            chunk = view[offset : offset + CONTENT_CHUNK_SIZE]
            digest = hashlib.sha256()
            digest.update(b"\xa5")
            digest.update(struct.pack("<I", len(chunk)))
            digest.update(chunk)
            digests.append(digest.digest())
    top = hashlib.sha256()
    top.update(b"\x5a")
    top.update(struct.pack("<I", len(digests)))
    for digest in digests:
        top.update(digest)
    return top.digest()


def build_v2_block(
    content_digest: bytes,
    key: rsa.RSAPrivateKey,
    certificate: x509.Certificate,
) -> bytes:
    algorithm = struct.pack("<I", RSA_PKCS1_SHA256_ID)
    digest_record = algorithm + length_prefix(content_digest)
    digests = length_prefix(digest_record)
    certificate_der = certificate.public_bytes(serialization.Encoding.DER)
    certificates = length_prefix(certificate_der)
    additional_attributes = b""
    signed_data = (
        length_prefix(digests)
        + length_prefix(certificates)
        + length_prefix(additional_attributes)
    )
    signature_bytes = key.sign(signed_data, padding.PKCS1v15(), hashes.SHA256())
    signature_record = algorithm + length_prefix(signature_bytes)
    signatures = length_prefix(signature_record)
    public_key = key.public_key().public_bytes(
        serialization.Encoding.DER,
        serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    signer = length_prefix(signed_data) + length_prefix(signatures) + length_prefix(public_key)
    signers = length_prefix(signer)
    v2_value = length_prefix(signers)
    pair_value = struct.pack("<I", APK_V2_BLOCK_ID) + v2_value
    pair = struct.pack("<Q", len(pair_value)) + pair_value
    block_size = len(pair) + 24
    return struct.pack("<Q", block_size) + pair + struct.pack("<Q", block_size) + APK_SIG_MAGIC


def sign_v2(apk: Path, key: rsa.RSAPrivateKey, certificate: x509.Certificate) -> None:
    blob = apk.read_bytes()
    eocd = find_eocd(blob)
    _, central_size, central_offset, _ = eocd_fields(blob, eocd)
    if central_offset + central_size != eocd:
        raise ValueError("ZIP Central Directory is not immediately followed by EOCD")
    digest_eocd = bytearray(blob[eocd:])
    struct.pack_into("<I", digest_eocd, 16, central_offset)
    content_digest = chunked_content_digest(
        [memoryview(blob)[:central_offset], memoryview(blob)[central_offset:eocd], digest_eocd]
    )
    signing_block = build_v2_block(content_digest, key, certificate)
    final_eocd = bytearray(blob[eocd:])
    struct.pack_into("<I", final_eocd, 16, central_offset + len(signing_block))
    with apk.open("wb") as handle:
        handle.write(blob[:central_offset])
        handle.write(signing_block)
        handle.write(blob[central_offset:eocd])
        handle.write(final_eocd)


def read_length_prefixed(view: memoryview, offset: int) -> tuple[memoryview, int]:
    if offset + 4 > len(view):
        raise ValueError("truncated v2 length prefix")
    size = struct.unpack_from("<I", view, offset)[0]
    start, end = offset + 4, offset + 4 + size
    if end > len(view):
        raise ValueError("truncated v2 value")
    return view[start:end], end


def verify_v2(apk: Path) -> None:
    blob = apk.read_bytes()
    eocd = find_eocd(blob)
    _, central_size, central_offset, _ = eocd_fields(blob, eocd)
    if central_offset + central_size != eocd:
        raise ValueError("signed ZIP Central Directory is not immediately followed by EOCD")
    if blob[central_offset - 16 : central_offset] != APK_SIG_MAGIC:
        raise ValueError("APK Signature Scheme v2 block is missing")
    size = struct.unpack_from("<Q", blob, central_offset - 24)[0]
    block_start = central_offset - size - 8
    if block_start < 0 or struct.unpack_from("<Q", blob, block_start)[0] != size:
        raise ValueError("APK signing block size markers do not match")
    pairs = memoryview(blob)[block_start + 8 : central_offset - 24]
    cursor, v2 = 0, None
    while cursor < len(pairs):
        if cursor + 8 > len(pairs):
            raise ValueError("truncated APK signing pair")
        pair_size = struct.unpack_from("<Q", pairs, cursor)[0]
        pair_start, pair_end = cursor + 8, cursor + 8 + pair_size
        if pair_size < 4 or pair_end > len(pairs):
            raise ValueError("invalid APK signing pair size")
        identifier = struct.unpack_from("<I", pairs, pair_start)[0]
        if identifier == APK_V2_BLOCK_ID:
            v2 = pairs[pair_start + 4 : pair_end]
        cursor = pair_end
    if v2 is None:
        raise ValueError("APK Signature Scheme v2 ID was not found")
    signers, end = read_length_prefixed(v2, 0)
    if end != len(v2):
        raise ValueError("unexpected data after v2 signer sequence")
    signer, end = read_length_prefixed(signers, 0)
    if end != len(signers):
        raise ValueError("only one v2 signer block is expected")
    signed_data, cursor = read_length_prefixed(signer, 0)
    signatures, cursor = read_length_prefixed(signer, cursor)
    public_key, cursor = read_length_prefixed(signer, cursor)
    if cursor != len(signer):
        raise ValueError("unexpected data after v2 signer")
    signature_record, end = read_length_prefixed(signatures, 0)
    if end != len(signatures):
        raise ValueError("only one v2 signature is expected")
    signature_algorithm = struct.unpack_from("<I", signature_record, 0)[0]
    signature_bytes, end = read_length_prefixed(signature_record, 4)
    if signature_algorithm != RSA_PKCS1_SHA256_ID or end != len(signature_record):
        raise ValueError("unexpected v2 signature algorithm")
    digests, signed_cursor = read_length_prefixed(signed_data, 0)
    certificates, signed_cursor = read_length_prefixed(signed_data, signed_cursor)
    _, signed_cursor = read_length_prefixed(signed_data, signed_cursor)
    if signed_cursor != len(signed_data):
        raise ValueError("unexpected data after v2 signed data")
    digest_record, end = read_length_prefixed(digests, 0)
    if end != len(digests):
        raise ValueError("only one v2 content digest is expected")
    digest_algorithm = struct.unpack_from("<I", digest_record, 0)[0]
    expected_digest, end = read_length_prefixed(digest_record, 4)
    if digest_algorithm != signature_algorithm or end != len(digest_record):
        raise ValueError("v2 digest and signature algorithms do not match")
    certificate_der, end = read_length_prefixed(certificates, 0)
    if end != len(certificates):
        raise ValueError("only one v2 certificate is expected")
    certificate = x509.load_der_x509_certificate(bytes(certificate_der))
    encoded_key = certificate.public_key().public_bytes(
        serialization.Encoding.DER,
        serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    if encoded_key != bytes(public_key):
        raise ValueError("v2 certificate and public key do not match")
    certificate.public_key().verify(
        bytes(signature_bytes), bytes(signed_data), padding.PKCS1v15(), hashes.SHA256()
    )
    digest_eocd = bytearray(blob[eocd:])
    struct.pack_into("<I", digest_eocd, 16, block_start)
    actual_digest = chunked_content_digest(
        [memoryview(blob)[:block_start], memoryview(blob)[central_offset:eocd], digest_eocd]
    )
    if actual_digest != bytes(expected_digest):
        raise ValueError("APK v2 whole-file content digest does not match")


def verify_manifest(apk: Path) -> None:
    with zipfile.ZipFile(apk) as archive:
        bad = archive.testzip()
        if bad:
            raise ValueError(f"ZIP CRC failed for {bad}")
        manifest = archive.read("META-INF/MANIFEST.MF")
        signature = archive.read("META-INF/AETHERIO.SF")
        certificate = archive.read("META-INF/AETHERIO.RSA")
        if b"X-Android-APK-Signed: 2" not in signature:
            raise ValueError("v1 signature does not advertise its v2 APK signing block")
        digest_line = next(
            line for line in signature.split(b"\r\n") if line.startswith(b"SHA-256-Digest-Manifest: ")
        )
        expected = base64.b64decode(digest_line.split(b": ", 1)[1])
        if hashlib.sha256(manifest).digest() != expected:
            raise ValueError("signature file does not match MANIFEST.MF")
        entries = {info.filename: info for info in archive.infolist()}
        sections = manifest.split(b"\r\n\r\n")[1:]
        for raw in sections:
            if not raw:
                continue
            section = raw + b"\r\n\r\n"
            unfolded = section.replace(b"\r\n ", b"")
            headers = dict(line.split(b": ", 1) for line in unfolded.split(b"\r\n") if b": " in line)
            name = headers[b"Name"].decode("utf-8")
            expected = base64.b64decode(headers[b"SHA-256-Digest"])
            actual = digest_entry(archive, entries[name])
            if actual != expected:
                raise ValueError(f"content digest failed for {name}")
    with tempfile.TemporaryDirectory(prefix="aetherion-signature-") as directory:
        root = Path(directory)
        (root / "CERT.RSA").write_bytes(certificate)
        (root / "CERT.SF").write_bytes(signature)
        subprocess.run(
            [
                "openssl",
                "smime",
                "-verify",
                "-inform",
                "DER",
                "-in",
                str(root / "CERT.RSA"),
                "-content",
                str(root / "CERT.SF"),
                "-noverify",
                "-out",
                os.devnull,
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("base", type=Path)
    parser.add_argument("payload", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument(
        "--exclude",
        action="append",
        default=[],
        help="Exact archive path or directory prefix to omit from the rebuilt APK",
    )
    parser.add_argument(
        "--pkcs12",
        type=Path,
        help="Existing PKCS#12 signing archive for update-compatible APKs",
    )
    parser.add_argument(
        "--pkcs12-password-env",
        default="AETHERION_SIGNING_PASSWORD",
        help="Environment variable containing the PKCS#12 password",
    )
    parser.add_argument("--private-key", type=Path, help="Unencrypted PEM RSA private key")
    parser.add_argument("--certificate", type=Path, help="DER X.509 signing certificate")
    args = parser.parse_args()
    if bool(args.private_key) != bool(args.certificate):
        parser.error("--private-key and --certificate must be supplied together")
    if args.pkcs12 and args.private_key:
        parser.error("choose either --pkcs12 or the PEM/DER signer, not both")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    compact_apk_without_signatures(args.base, args.output, tuple(args.exclude))
    add_payload(args.output, args.payload)
    if args.pkcs12:
        key, certificate = load_signer(args.pkcs12, args.pkcs12_password_env)
    elif args.private_key:
        key, certificate = load_pem_der_signer(args.private_key, args.certificate)
    else:
        key, certificate = make_signer()
    sign_v1(args.output, key, certificate)
    verify_manifest(args.output)
    sign_v2(args.output, key, certificate)
    verify_v2(args.output)
    print(f"built={args.output}")
    print(f"bytes={args.output.stat().st_size}")
    print(f"sha256={hashlib.sha256(args.output.read_bytes()).hexdigest()}")


if __name__ == "__main__":
    main()
